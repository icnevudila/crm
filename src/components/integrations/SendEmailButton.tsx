/**
 * Send Email Button Component
 * Ortak e-posta gönderme butonu - tüm sayfalarda kullanılabilir
 */

'use client'

import { useState, useEffect } from 'react'
import { Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

interface SendEmailButtonProps {
  to: string | string[]
  subject: string
  html: string
  text?: string
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function SendEmailButton({
  to,
  subject,
  html,
  text,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: SendEmailButtonProps) {
  const [sendingEmail, setSendingEmail] = useState(false)
  const [hasEmailIntegration, setHasEmailIntegration] = useState<boolean | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)

  // E-posta entegrasyonu kontrolü
  useEffect(() => {
    const checkIntegration = async () => {
      try {
        const res = await fetch('/api/integrations/email/check')
        if (!res.ok) {
          setHasEmailIntegration(false)
          return
        }
        const data = await res.json()
        setHasEmailIntegration(data.hasEmailIntegration && data.isActive)
      } catch (error) {
        console.error('Email integration check error:', error)
        setHasEmailIntegration(false)
      } finally {
        setCheckingIntegration(false)
      }
    }

    checkIntegration()
  }, [])

  const handleSendEmail = async () => {
    // Alıcı kontrolü
    const toArray = Array.isArray(to) ? to : [to]
    const validEmails = toArray.filter((email) => email && email.trim() !== '')

    if (validEmails.length === 0) {
      toast.error('Hata', 'Alıcı e-posta adresi bulunamadı')
      return
    }

    // E-posta entegrasyonu kontrolü
    if (hasEmailIntegration === false) {
      toast.error(
        'E-posta Entegrasyonu Yok',
        'E-posta göndermek için önce Ayarlar > E-posta Entegrasyonları bölümünden e-posta entegrasyonunu yapılandırın.'
      )
      return
    }

    if (hasEmailIntegration === null || checkingIntegration) {
      toast.error('Kontrol Ediliyor', 'E-posta entegrasyonu kontrol ediliyor, lütfen bekleyin...')
      return
    }

    setSendingEmail(true)
    try {
      const res = await fetch('/api/integrations/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: validEmails,
          subject,
          html,
          text,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'E-posta gönderilemedi')
      }

      const result = await res.json()
      toast.success('Başarılı', `E-posta başarıyla gönderildi${validEmails.length > 1 ? ` (${validEmails.length} alıcı)` : ''}`)
    } catch (error: any) {
      console.error('Email send error:', error)
      
      // Hata mesajına göre daha açıklayıcı toast
      if (error.message?.includes('entegrasyon') || error.message?.includes('integration')) {
        toast.error(
          'E-posta Entegrasyonu Hatası',
          'E-posta gönderilemedi. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden entegrasyonunuzu kontrol edin.'
        )
      } else {
        toast.error('E-posta Gönderilemedi', error?.message || 'Bilinmeyen bir hata oluştu')
      }
    } finally {
      setSendingEmail(false)
    }
  }

  // Entegrasyon kontrolü yapılırken buton gösterilmez veya disabled olur
  if (checkingIntegration) {
    return null // veya loading spinner gösterilebilir
  }

  // E-posta adresi yoksa buton gösterilmez
  const toArray = Array.isArray(to) ? to : [to]
  const hasValidEmail = toArray.some((email) => email && email.trim() !== '')

  if (!hasValidEmail) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSendEmail}
      disabled={disabled || sendingEmail || hasEmailIntegration === false}
      className={className}
      title={
        hasEmailIntegration === false
          ? 'E-posta entegrasyonu yapılandırılmamış'
          : sendingEmail
          ? 'E-posta gönderiliyor...'
          : 'E-posta gönder'
      }
    >
      {hasEmailIntegration === false ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Entegrasyon Yok
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          {sendingEmail ? 'Gönderiliyor...' : 'Mail Gönder'}
        </>
      )}
    </Button>
  )
}



