/**
 * Send WhatsApp Button Component
 * Ortak WhatsApp gönderme butonu - tüm sayfalarda kullanılabilir
 */

'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useSession } from '@/hooks/useSession'

interface SendWhatsAppButtonProps {
  to: string // Telefon numarası (E.164 formatında: +905551234567)
  message: string // WhatsApp mesajı
  from?: string // Gönderen WhatsApp numarası (opsiyonel)
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  onSuccess?: () => void
}

export default function SendWhatsAppButton({
  to,
  message,
  from,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
  onSuccess,
}: SendWhatsAppButtonProps) {
  const { session } = useSession()
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false)
  const [hasIntegration, setHasIntegration] = useState<boolean | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // WhatsApp entegrasyonu kontrolü
  useEffect(() => {
    const checkIntegration = async () => {
      if (!session?.user?.companyId) {
        setHasIntegration(false)
        setCheckingIntegration(false)
        return
      }

      try {
        const res = await fetch('/api/integrations/whatsapp/check')
        if (!res.ok) {
          setHasIntegration(false)
          return
        }
        const data = await res.json()
        setHasIntegration(data.hasIntegration && data.isActive)
      } catch (error) {
        console.error('WhatsApp integration check error:', error)
        setHasIntegration(false)
      } finally {
        setCheckingIntegration(false)
      }
    }

    checkIntegration()
  }, [session])

  const handleSendWhatsApp = async () => {
    // Entegrasyon kontrolü
    if (hasIntegration === false) {
      toast.error(
        'WhatsApp Entegrasyonu Yok',
        'WhatsApp mesajı göndermek için önce Kullanıcı Entegrasyonları sayfasından WhatsApp entegrasyonunu yapılandırın.\n\nKurulum:\n1. Twilio hesabı oluşturun: https://www.twilio.com/try-twilio\n2. WhatsApp API\'yi aktifleştirin ve WhatsApp numarası alın\n3. Kullanıcı Entegrasyonları > WhatsApp (Twilio) bölümüne gidin\n4. Account SID, Auth Token ve WhatsApp numarasını girin\n5. "Kaydet" butonuna tıklayın ve entegrasyonu aktifleştirin'
      )
      return
    }

    if (hasIntegration === null || checkingIntegration) {
      toast.error('Kontrol Ediliyor', 'WhatsApp entegrasyonu kontrol ediliyor, lütfen bekleyin...')
      return
    }

    // Telefon numarası kontrolü
    if (!to || to.trim() === '') {
      toast.error('Hata', 'Alıcı telefon numarası bulunamadı')
      return
    }

    // Telefon numarası formatı kontrolü
    if (!to.startsWith('+')) {
      toast.error('Hata', 'Telefon numarası E.164 formatında olmalıdır (örn: +905551234567)')
      return
    }

    // Mesaj kontrolü
    if (!message || message.trim() === '') {
      toast.error('Hata', 'WhatsApp mesajı boş olamaz')
      return
    }

    setSendingWhatsApp(true)
    try {
      const res = await fetch('/api/integrations/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          message,
          from,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'WhatsApp mesajı gönderilemedi')
      }

      const result = await res.json()
      toast.success('Başarılı', 'WhatsApp mesajı başarıyla gönderildi')
      onSuccess?.()
      setLastError(null)
      setRetryCount(0)
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu'
      setLastError(errorMessage)
      
      // Hata mesajına göre daha açıklayıcı toast - retry butonu ile
      if (error.message?.includes('entegrasyon') || error.message?.includes('integration')) {
        toast.error(
          'WhatsApp Entegrasyonu Hatası',
          'WhatsApp mesajı gönderilemedi. Lütfen Ayarlar > Entegrasyonlar bölümünden entegrasyonunuzu kontrol edin.',
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendWhatsApp()
              },
            },
          } : undefined
        )
      } else {
        toast.error(
          'WhatsApp Mesajı Gönderilemedi',
          errorMessage,
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendWhatsApp()
              },
            },
          } : undefined
        )
      }
    } finally {
      setSendingWhatsApp(false)
    }
  }

  // Entegrasyon kontrolü yapılırken buton gösterilmez veya disabled olur
  if (checkingIntegration) {
    return null // veya loading spinner gösterilebilir
  }

  // Telefon numarası yoksa buton gösterilmez
  if (!to || to.trim() === '') {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendWhatsApp}
      disabled={disabled || sendingWhatsApp || hasIntegration === false}
      className={className}
      title={
        hasIntegration === false
          ? 'WhatsApp entegrasyonu yapılandırılmamış'
          : sendingWhatsApp
          ? 'WhatsApp mesajı gönderiliyor...'
          : 'WhatsApp mesajı gönder'
      }
    >
      {hasIntegration === false ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Entegrasyon Yok
        </>
      ) : (
        <>
          <MessageCircle className="mr-2 h-4 w-4" />
          {sendingWhatsApp ? 'Gönderiliyor...' : 'WhatsApp Gönder'}
        </>
      )}
    </Button>
  )
}

