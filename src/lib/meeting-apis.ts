/**
 * Meeting API Entegrasyonları
 * Zoom, Google Meet, Microsoft Teams API helper fonksiyonları
 */

export interface MeetingApiResponse {
  success: boolean
  meetingUrl?: string
  meetingId?: string
  password?: string
  joinUrl?: string
  error?: string
}

/**
 * Zoom API - Meeting oluşturma
 * Dokümantasyon: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingCreate
 */
export async function createZoomMeeting(params: {
  title: string
  startTime: string // ISO 8601 format: 2024-01-01T10:00:00Z
  duration: number // Dakika cinsinden
  timezone?: string // Örn: "Europe/Istanbul"
  password?: string
  settings?: {
    hostVideo?: boolean
    participantVideo?: boolean
    joinBeforeHost?: boolean
    muteUponEntry?: boolean
  }
  accountId?: string // Zoom Account ID
  clientId?: string // Zoom OAuth Client ID
  clientSecret?: string // Zoom OAuth Client Secret
}): Promise<MeetingApiResponse> {
  try {
    // Zoom API için OAuth token alınması gerekir
    // Bu örnekte basit bir implementasyon gösteriyoruz
    // Production'da OAuth flow kullanılmalı
    
    const { accountId, clientId, clientSecret } = params
    
    if (!accountId || !clientId || !clientSecret) {
      return {
        success: false,
        error: 'Zoom API credentials are required. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in environment variables.',
      }
    }

    // 1. OAuth Token al (Server-to-Server OAuth)
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'account_credentials',
        account_id: accountId,
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}))
      return {
        success: false,
        error: `Zoom OAuth failed: ${error.error || tokenResponse.statusText}`,
      }
    }

    const { access_token } = await tokenResponse.json()

    // 2. Meeting oluştur
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        topic: params.title,
        type: 2, // Scheduled meeting
        start_time: params.startTime,
        duration: params.duration,
        timezone: params.timezone || 'Europe/Istanbul',
        password: params.password || undefined,
        settings: {
          host_video: params.settings?.hostVideo ?? true,
          participant_video: params.settings?.participantVideo ?? true,
          join_before_host: params.settings?.joinBeforeHost ?? false,
          mute_upon_entry: params.settings?.muteUponEntry ?? false,
          waiting_room: false,
          meeting_authentication: false,
        },
      }),
    })

    if (!meetingResponse.ok) {
      const error = await meetingResponse.json().catch(() => ({}))
      return {
        success: false,
        error: `Zoom meeting creation failed: ${error.message || meetingResponse.statusText}`,
      }
    }

    const meetingData = await meetingResponse.json()

    return {
      success: true,
      meetingUrl: meetingData.join_url,
      meetingId: meetingData.id?.toString(),
      password: meetingData.password || params.password,
      joinUrl: meetingData.join_url,
    }
  } catch (error: any) {
    console.error('Zoom API error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to create Zoom meeting',
    }
  }
}

/**
 * Google Meet API - Meeting oluşturma
 * Dokümantasyon: https://developers.google.com/calendar/api/v3/reference/events/insert
 * NOT: Google Meet meeting'leri genellikle Google Calendar event'i oluşturularak yapılır
 */
export async function createGoogleMeetMeeting(params: {
  title: string
  startTime: string // ISO 8601 format
  endTime: string // ISO 8601 format (startTime + duration)
  description?: string
  attendees?: string[] // E-posta adresleri
  accessToken?: string // Google OAuth access token
}): Promise<MeetingApiResponse> {
  try {
    const { accessToken, title, startTime, endTime, description, attendees } = params

    if (!accessToken) {
      return {
        success: false,
        error: 'Google OAuth access token is required. Please authenticate with Google Calendar first.',
      }
    }

    // Google Calendar event oluştur (Google Meet link'i otomatik eklenir)
    const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        summary: title,
        description: description || '',
        start: {
          dateTime: startTime,
          timeZone: 'Europe/Istanbul',
        },
        end: {
          dateTime: endTime,
          timeZone: 'Europe/Istanbul',
        },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
        attendees: attendees?.map((email) => ({ email })) || [],
      }),
    })

    if (!eventResponse.ok) {
      const error = await eventResponse.json().catch(() => ({}))
      return {
        success: false,
        error: `Google Calendar event creation failed: ${error.error?.message || eventResponse.statusText}`,
      }
    }

    const eventData = await eventResponse.json()
    const meetLink = eventData.conferenceData?.entryPoints?.[0]?.uri || eventData.hangoutLink

    return {
      success: true,
      meetingUrl: meetLink,
      meetingId: eventData.id,
      joinUrl: meetLink,
    }
  } catch (error: any) {
    console.error('Google Meet API error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to create Google Meet meeting',
    }
  }
}

/**
 * Microsoft Teams API - Meeting oluşturma
 * Dokümantasyon: https://learn.microsoft.com/en-us/graph/api/application-post-onlinemeetings
 */
export async function createTeamsMeeting(params: {
  title: string
  startTime: string // ISO 8601 format
  endTime: string // ISO 8601 format
  description?: string
  attendees?: string[] // E-posta adresleri
  accessToken?: string // Microsoft Graph OAuth access token
}): Promise<MeetingApiResponse> {
  try {
    const { accessToken, title, startTime, endTime, description, attendees } = params

    if (!accessToken) {
      return {
        success: false,
        error: 'Microsoft OAuth access token is required. Please authenticate with Microsoft Graph first.',
      }
    }

    // Microsoft Teams online meeting oluştur
    const meetingResponse = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subject: title,
        startDateTime: startTime,
        endDateTime: endTime,
        participants: {
          attendees: attendees?.map((email) => ({
            upn: email,
            role: 'attendee',
          })) || [],
        },
      }),
    })

    if (!meetingResponse.ok) {
      const error = await meetingResponse.json().catch(() => ({}))
      return {
        success: false,
        error: `Microsoft Teams meeting creation failed: ${error.error?.message || meetingResponse.statusText}`,
      }
    }

    const meetingData = await meetingResponse.json()

    return {
      success: true,
      meetingUrl: meetingData.joinUrl,
      meetingId: meetingData.id,
      joinUrl: meetingData.joinUrl,
    }
  } catch (error: any) {
    console.error('Microsoft Teams API error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to create Microsoft Teams meeting',
    }
  }
}

/**
 * Meeting Type'a göre otomatik meeting oluştur
 * Company credentials kullanır (veritabanından)
 */
export async function createMeetingByType(
  meetingType: 'ZOOM' | 'GOOGLE_MEET' | 'TEAMS',
  params: {
    title: string
    startTime: string
    duration: number
    description?: string
    attendees?: string[]
    password?: string
  },
  companyIntegration?: any // CompanyIntegration kaydı (veritabanından)
): Promise<MeetingApiResponse> {
  const endTime = new Date(new Date(params.startTime).getTime() + params.duration * 60000).toISOString()

  switch (meetingType) {
    case 'ZOOM':
      // Company integration kontrolü
      if (!companyIntegration?.zoomEnabled) {
        return {
          success: false,
          error: 'Zoom entegrasyonu aktif değil. Lütfen Ayarlar > API Entegrasyonları bölümünden Zoom credentials\'larınızı girin.',
        }
      }

      if (!companyIntegration.zoomAccountId || !companyIntegration.zoomClientId || !companyIntegration.zoomClientSecret) {
        return {
          success: false,
          error: 'Zoom credentials eksik. Lütfen Ayarlar > API Entegrasyonları bölümünden Zoom Account ID, Client ID ve Client Secret girin.',
        }
      }

      return createZoomMeeting({
        title: params.title,
        startTime: params.startTime,
        duration: params.duration,
        password: params.password,
        accountId: companyIntegration.zoomAccountId,
        clientId: companyIntegration.zoomClientId,
        clientSecret: companyIntegration.zoomClientSecret,
      })

    case 'GOOGLE_MEET':
      // Company integration kontrolü
      if (!companyIntegration?.googleEnabled) {
        return {
          success: false,
          error: 'Google Meet entegrasyonu aktif değil. Lütfen Ayarlar > API Entegrasyonları bölümünden Google credentials\'larınızı girin.',
        }
      }

      if (!companyIntegration.googleAccessToken) {
        return {
          success: false,
          error: 'Google access token eksik. Lütfen Ayarlar > API Entegrasyonları bölümünden Google Access Token girin.',
        }
      }

      return createGoogleMeetMeeting({
        title: params.title,
        startTime: params.startTime,
        endTime,
        description: params.description,
        attendees: params.attendees,
        accessToken: companyIntegration.googleAccessToken,
      })

    case 'TEAMS':
      // Company integration kontrolü
      if (!companyIntegration?.microsoftEnabled) {
        return {
          success: false,
          error: 'Microsoft Teams entegrasyonu aktif değil. Lütfen Ayarlar > API Entegrasyonları bölümünden Microsoft credentials\'larınızı girin.',
        }
      }

      if (!companyIntegration.microsoftAccessToken) {
        return {
          success: false,
          error: 'Microsoft access token eksik. Lütfen Ayarlar > API Entegrasyonları bölümünden Microsoft Access Token girin.',
        }
      }

      return createTeamsMeeting({
        title: params.title,
        startTime: params.startTime,
        endTime,
        description: params.description,
        attendees: params.attendees,
        accessToken: companyIntegration.microsoftAccessToken,
      })

    default:
      return {
        success: false,
        error: `Unsupported meeting type: ${meetingType}`,
      }
  }
}

