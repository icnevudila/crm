/**
 * Send SMS Button Component
 * Ortak SMS gönderme butonu - tüm sayfalarda kullanılabilir
 */

'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useSession } from '@/hooks/useSession'

interface SendSmsButtonProps {
  to: string // Telefon numarası (E.164 formatında: +905551234567)
  message: string // SMS mesajı
  from?: string // Gönderen telefon numarası (opsiyonel)
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function SendSmsButton({
  to,
  message,
  from,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: SendSmsButtonProps) {
  const { session } = useSession()
  const [sendingSms, setSendingSms] = useState(false)
  const [hasIntegration, setHasIntegration] = useState<boolean | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // SMS entegrasyonu kontrolü
  useEffect(() => {
    const checkIntegration = async () => {
      if (!session?.user?.companyId) {
        setHasIntegration(false)
        setCheckingIntegration(false)
        return
      }

      try {
        const res = await fetch('/api/integrations/sms/check')
        if (!res.ok) {
          setHasIntegration(false)
          return
        }
        const data = await res.json()
        setHasIntegration(data.hasIntegration && data.isActive)
      } catch (error) {
        console.error('SMS integration check error:', error)
        setHasIntegration(false)
      } finally {
        setCheckingIntegration(false)
      }
    }

    checkIntegration()
  }, [session])

  const handleSendSms = async () => {
    // Entegrasyon kontrolü
    if (hasIntegration === false) {
      toast.error(
        'SMS Entegrasyonu Yok',
        'SMS göndermek için önce Kullanıcı Entegrasyonları sayfasından SMS entegrasyonunu yapılandırın.\n\nKurulum:\n1. Twilio hesabı oluşturun: https://www.twilio.com/try-twilio\n2. Account SID, Auth Token ve Telefon Numarası alın\n3. Kullanıcı Entegrasyonları > SMS (Twilio) bölümüne gidin\n4. Bilgileri girin ve "Kaydet" butonuna tıklayın\n5. Entegrasyonu aktifleştirin'
      )
      return
    }

    if (hasIntegration === null || checkingIntegration) {
      toast.error('Kontrol Ediliyor', { description: 'SMS entegrasyonu kontrol ediliyor, lütfen bekleyin...' })
      return
    }

    // Telefon numarası kontrolü
    if (!to || to.trim() === '') {
      toast.error('Hata', { description: 'Alıcı telefon numarası bulunamadı' })
      return
    }

    // Telefon numarası formatı kontrolü
    if (!to.startsWith('+')) {
      toast.error('Hata', { description: 'Telefon numarası E.164 formatında olmalıdır (örn: +905551234567)' })
      return
    }

    // Mesaj kontrolü
    if (!message || message.trim() === '') {
      toast.error('Hata', { description: 'SMS mesajı boş olamaz' })
      return
    }

    setSendingSms(true)
    try {
      const res = await fetch('/api/integrations/sms/send', {
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
        throw new Error(error.error || 'SMS gönderilemedi')
      }

      const result = await res.json()
      toast.success('Başarılı', { description: 'SMS başarıyla gönderildi' })
      setLastError(null)
      setRetryCount(0)
    } catch (error: any) {
      console.error('SMS send error:', error)
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu'
      setLastError(errorMessage)
      
      // Hata mesajına göre daha açıklayıcı toast - retry butonu ile
      if (error.message?.includes('credentials') || error.message?.includes('TWILIO')) {
        toast.error(
          'SMS Entegrasyonu Hatası',
          'SMS gönderilemedi. Lütfen Twilio credentials\'larını kontrol edin.',
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendSms()
              },
            },
          } : undefined
        )
      } else {
        toast.error(
          'SMS Gönderilemedi',
          errorMessage,
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleSendSms()
              },
            },
          } : undefined
        )
      }
    } finally {
      setSendingSms(false)
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
      onClick={handleSendSms}
      disabled={disabled || sendingSms || hasIntegration === false}
      className={className}
      title={
        hasIntegration === false
          ? 'SMS entegrasyonu yapılandırılmamış'
          : sendingSms
          ? 'SMS gönderiliyor...'
          : 'SMS gönder'
      }
    >
      {hasIntegration === false ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Entegrasyon Yok
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          {sendingSms ? 'Gönderiliyor...' : 'SMS Gönder'}
        </>
      )}
    </Button>
  )
}

