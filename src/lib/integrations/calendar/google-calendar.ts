/**
 * Google Calendar Integration Helper
 * Google Calendar API ile etkinlik oluşturma ve yönetimi
 */

export interface CreateCalendarEventOptions {
  summary: string // Etkinlik başlığı
  description?: string // Etkinlik açıklaması
  start: {
    dateTime: string // ISO 8601 formatında (örn: 2024-01-15T10:00:00+03:00)
    timeZone?: string // Zaman dilimi (örn: Europe/Istanbul)
  }
  end: {
    dateTime: string // ISO 8601 formatında
    timeZone?: string
  }
  location?: string // Konum
  attendees?: Array<{ email: string; displayName?: string }> // Katılımcılar
  reminders?: {
    useDefault?: boolean
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>
  }
}

export interface CreateCalendarEventResult {
  success: boolean
  eventId?: string
  htmlLink?: string
  error?: string
}

/**
 * Google Calendar'a etkinlik oluştur
 */
export async function createCalendarEvent(
  accessToken: string,
  options: CreateCalendarEventOptions
): Promise<CreateCalendarEventResult> {
  try {
    // Google Calendar API endpoint
    const calendarId = 'primary' // Kullanıcının birincil takvimi
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`

    // Etkinlik verisi
    const eventData: any = {
      summary: options.summary,
      description: options.description || '',
      start: {
        dateTime: options.start.dateTime,
        timeZone: options.start.timeZone || 'Europe/Istanbul',
      },
      end: {
        dateTime: options.end.dateTime,
        timeZone: options.end.timeZone || 'Europe/Istanbul',
      },
    }

    // Konum ekle
    if (options.location) {
      eventData.location = options.location
    }

    // Katılımcılar ekle
    if (options.attendees && options.attendees.length > 0) {
      eventData.attendees = options.attendees.map((attendee) => ({
        email: attendee.email,
        displayName: attendee.displayName,
      }))
    }

    // Hatırlatıcılar ekle
    if (options.reminders) {
      eventData.reminders = {
        useDefault: options.reminders.useDefault || false,
        overrides: options.reminders.overrides || [],
      }
    } else {
      // Varsayılan hatırlatıcılar (10 dakika önce popup, 1 gün önce email)
      eventData.reminders = {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 1440 }, // 1 gün = 1440 dakika
        ],
      }
    }

    // Google Calendar API'ye istek gönder
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      
      // Token expire kontrolü
      if (response.status === 401) {
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
        }
      }

      return {
        success: false,
        error: errorData.error?.message || `Google Calendar API hatası: ${response.status}`,
      }
    }

    const event = await response.json()

    return {
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
    }
  } catch (error: any) {
    console.error('Google Calendar create event error:', error)
    return {
      success: false,
      error: error?.message || 'Etkinlik oluşturulamadı',
    }
  }
}

/**
 * Google Calendar'dan etkinlik getir
 */
export async function getCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<CreateCalendarEventResult & { event?: any }> {
  try {
    const calendarId = 'primary'
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
        }
      }

      return {
        success: false,
        error: `Etkinlik getirilemedi: ${response.status}`,
      }
    }

    const event = await response.json()

    return {
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
      event,
    }
  } catch (error: any) {
    console.error('Google Calendar get event error:', error)
    return {
      success: false,
      error: error?.message || 'Etkinlik getirilemedi',
    }
  }
}

/**
 * Google Calendar'dan etkinlik sil
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const calendarId = 'primary'
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'TOKEN_EXPIRED',
        }
      }

      return {
        success: false,
        error: `Etkinlik silinemedi: ${response.status}`,
      }
    }

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Google Calendar delete event error:', error)
    return {
      success: false,
      error: error?.message || 'Etkinlik silinemedi',
    }
  }
}

/**
 * Google Calendar OAuth token'ı yenile
 */
export async function refreshGoogleCalendarToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const url = 'https://oauth2.googleapis.com/token'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('Google Calendar token refresh failed:', await response.text())
      return null
    }

    const data = await response.json()
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000))

    return {
      accessToken: data.access_token,
      expiresAt,
    }
  } catch (error) {
    console.error('Google Calendar token refresh error:', error)
    return null
  }
}



