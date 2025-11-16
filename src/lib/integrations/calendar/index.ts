/**
 * Calendar Integration Helper
 * Kullanıcı bazlı Google Calendar entegrasyonu
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'
import {
  createCalendarEvent,
  CreateCalendarEventOptions,
  CreateCalendarEventResult,
  refreshGoogleCalendarToken,
} from './google-calendar'

/**
 * Kullanıcı bazlı Google Calendar'a etkinlik oluştur
 */
export async function addToUserCalendar(
  userId: string,
  companyId: string,
  options: CreateCalendarEventOptions
): Promise<CreateCalendarEventResult> {
  try {
    // Kullanıcının Google Calendar entegrasyonunu getir
    const supabase = getSupabaseWithServiceRole()
    
    // UserIntegration tablosundan kullanıcının Google Calendar token'ını getir
    const { data: userIntegration } = await supabase
      .from('UserIntegration')
      .select('*')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .eq('integrationType', 'GOOGLE_CALENDAR')
      .maybeSingle()

    if (!userIntegration || !userIntegration.accessToken) {
      return {
        success: false,
        error: 'Google Calendar entegrasyonu bulunamadı. Lütfen Ayarlar > Entegrasyonlar bölümünden Google Calendar entegrasyonunu yapılandırın.',
      }
    }

    // Token expire kontrolü
    let accessToken = userIntegration.accessToken

    if (userIntegration.tokenExpiresAt) {
      const expiresAt = new Date(userIntegration.tokenExpiresAt)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // 5 dakika kala veya expire olmuşsa refresh et
      if (timeUntilExpiry < 5 * 60 * 1000 || timeUntilExpiry < 0) {
        if (userIntegration.refreshToken) {
          const refreshed = await refreshGoogleCalendarToken(
            userIntegration.refreshToken,
            process.env.GOOGLE_CLIENT_ID || '',
            process.env.GOOGLE_CLIENT_SECRET || ''
          )

          if (refreshed) {
            accessToken = refreshed.accessToken

            // Veritabanını güncelle
            await supabase
              .from('UserIntegration')
              .update({
                accessToken: refreshed.accessToken,
                tokenExpiresAt: refreshed.expiresAt.toISOString(),
              })
              .eq('id', userIntegration.id)
          } else {
            return {
              success: false,
              error: 'Google Calendar token yenilenemedi. Lütfen entegrasyonu yeniden yapılandırın.',
            }
          }
        }
      }
    }

    // Google Calendar'a etkinlik oluştur
    const result = await createCalendarEvent(accessToken, options)

    // Hata durumunu kaydet
    if (!result.success) {
      await supabase
        .from('UserIntegration')
        .update({
          status: result.error === 'TOKEN_EXPIRED' ? 'ERROR' : 'ERROR',
          lastError: result.error,
        })
        .eq('id', userIntegration.id)
    } else {
      // Başarılı - status'u ACTIVE yap
      await supabase
        .from('UserIntegration')
        .update({
          status: 'ACTIVE',
          lastError: null,
        })
        .eq('id', userIntegration.id)
    }

    return result
  } catch (error: any) {
    console.error('Add to user calendar error:', error)
    return {
      success: false,
      error: error?.message || 'Etkinlik oluşturulamadı',
    }
  }
}

/**
 * CRM kaydından Google Calendar etkinliği oluştur
 */
export function createCalendarEventFromRecord(
  recordType: 'deal' | 'quote' | 'invoice' | 'meeting' | 'task',
  record: any,
  options?: {
    startTime?: string // ISO 8601 formatında
    endTime?: string // ISO 8601 formatında
    location?: string
    attendees?: Array<{ email: string; displayName?: string }>
  }
): CreateCalendarEventOptions {
  // Varsayılan başlangıç ve bitiş zamanları
  const now = new Date()
  const startTime = options?.startTime 
    ? new Date(options.startTime)
    : new Date(now.getTime() + 24 * 60 * 60 * 1000) // 1 gün sonra
  const endTime = options?.endTime
    ? new Date(options.endTime)
    : new Date(startTime.getTime() + 60 * 60 * 1000) // 1 saat sonra

  // Zaman dilimi (Türkiye)
  const timeZone = 'Europe/Istanbul'

  // Record type'a göre başlık ve açıklama
  let summary = ''
  let description = ''

  switch (recordType) {
    case 'deal':
      summary = `Fırsat: ${record.title || record.name || 'Fırsat'}`
      description = `Fırsat Detayları:\n${record.description || ''}\n\nDeğer: ${record.value || 0} TL`
      break
    case 'quote':
      summary = `Teklif: ${record.title || record.quoteNumber || 'Teklif'}`
      description = `Teklif Detayları:\n${record.description || ''}\n\nTeklif No: ${record.quoteNumber || ''}\nToplam: ${record.totalAmount || 0} TL`
      break
    case 'invoice':
      summary = `Fatura: ${record.invoiceNumber || 'Fatura'}`
      description = `Fatura Detayları:\n${record.description || ''}\n\nFatura No: ${record.invoiceNumber || ''}\nToplam: ${record.totalAmount || 0} TL`
      break
    case 'meeting':
      summary = record.title || 'Toplantı'
      description = record.description || record.notes || ''
      break
    case 'task':
      summary = `Görev: ${record.title || 'Görev'}`
      description = record.description || record.notes || ''
      break
  }

  return {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone,
    },
    location: options?.location || '',
    attendees: options?.attendees || [],
  }
}



