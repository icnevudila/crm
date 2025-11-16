/**
 * Add to Calendar Button Component
 * Google Calendar'a etkinlik ekleme butonu
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useSession } from '@/hooks/useSession'

interface AddToCalendarButtonProps {
  recordType: 'deal' | 'quote' | 'invoice' | 'meeting' | 'task'
  record: any
  startTime?: string // ISO 8601 formatında
  endTime?: string // ISO 8601 formatında
  location?: string
  attendees?: Array<{ email: string; displayName?: string }>
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export default function AddToCalendarButton({
  recordType,
  record,
  startTime,
  endTime,
  location,
  attendees,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className = '',
}: AddToCalendarButtonProps) {
  const { session } = useSession()
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [hasIntegration, setHasIntegration] = useState<boolean | null>(null)
  const [checkingIntegration, setCheckingIntegration] = useState(true)
  const [lastError, setLastError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Google Calendar entegrasyonu kontrolü
  useEffect(() => {
    const checkIntegration = async () => {
      if (!session?.user?.id || !session?.user?.companyId) {
        setHasIntegration(false)
        setCheckingIntegration(false)
        return
      }

      try {
        const res = await fetch('/api/integrations/calendar/check')
        if (!res.ok) {
          setHasIntegration(false)
          return
        }
        const data = await res.json()
        setHasIntegration(data.hasIntegration && data.isActive)
      } catch (error) {
        console.error('Google Calendar integration check error:', error)
        setHasIntegration(false)
      } finally {
        setCheckingIntegration(false)
      }
    }

    checkIntegration()
  }, [session])

  const handleAddToCalendar = async () => {
    // Entegrasyon kontrolü
    if (hasIntegration === false) {
      toast.error(
        'Google Calendar Entegrasyonu Yok',
        'Etkinlik eklemek için önce Kullanıcı Entegrasyonları sayfasından Google Calendar entegrasyonunu yapılandırın.\n\nKurulum:\n1. Google Cloud Console\'dan Client ID ve Secret alın: https://console.cloud.google.com/\n2. Kullanıcı Entegrasyonları > Google Calendar bölümüne gidin\n3. Client ID ve Secret\'ı girin ve "Bilgileri Kaydet" butonuna tıklayın\n4. "Google Calendar Bağla" butonuna tıklayarak OAuth bağlantısı yapın'
      )
      return
    }

    if (hasIntegration === null || checkingIntegration) {
      toast.error('Kontrol Ediliyor', 'Google Calendar entegrasyonu kontrol ediliyor, lütfen bekleyin...')
      return
    }
    setAddingToCalendar(true)
    try {
      const res = await fetch('/api/integrations/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordType,
          record,
          startTime,
          endTime,
          location,
          attendees,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Etkinlik oluşturulamadı')
      }

      const result = await res.json()
      
      if (result.htmlLink) {
        toast.success(
          'Başarılı',
          'Etkinlik Google Calendar\'a eklendi. Takvimde görüntülemek için tıklayın.',
          {
            action: {
              label: 'Takvimde Aç',
              onClick: () => window.open(result.htmlLink, '_blank'),
            },
          }
        )
      } else {
        toast.success('Başarılı', 'Etkinlik Google Calendar\'a eklendi')
      }
      setLastError(null)
      setRetryCount(0)
    } catch (error: any) {
      console.error('Add to calendar error:', error)
      const errorMessage = error?.message || 'Bilinmeyen bir hata oluştu'
      setLastError(errorMessage)
      
      // Hata mesajına göre daha açıklayıcı toast - retry butonu ile
      if (error.message?.includes('entegrasyon') || error.message?.includes('integration')) {
        toast.error(
          'Google Calendar Entegrasyonu Hatası',
          'Etkinlik eklenemedi. Lütfen Ayarlar > Entegrasyonlar bölümünden Google Calendar entegrasyonunu yapılandırın.',
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleAddToCalendar()
              },
            },
          } : undefined
        )
      } else {
        toast.error(
          'Etkinlik Eklenemedi',
          errorMessage,
          retryCount < 3 ? {
            action: {
              label: 'Tekrar Dene',
              onClick: () => {
                setRetryCount(prev => prev + 1)
                handleAddToCalendar()
              },
            },
          } : undefined
        )
      }
    } finally {
      setAddingToCalendar(false)
    }
  }

  // Entegrasyon kontrolü yapılırken buton gösterilmez veya disabled olur
  if (checkingIntegration) {
    return null // veya loading spinner gösterilebilir
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      disabled={disabled || addingToCalendar || hasIntegration === false}
      className={className}
      title={
        hasIntegration === false
          ? 'Google Calendar entegrasyonu yapılandırılmamış'
          : addingToCalendar
          ? 'Takvime ekleniyor...'
          : 'Google Calendar\'a ekle'
      }
    >
      {hasIntegration === false ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Entegrasyon Yok
        </>
      ) : (
        <>
          <Calendar className="mr-2 h-4 w-4" />
          {addingToCalendar ? 'Ekleniyor...' : 'Takvime Ekle'}
        </>
      )}
    </Button>
  )
}

