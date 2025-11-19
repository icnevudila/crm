/**
 * Outlook OAuth Helper
 * Microsoft Graph API ile OAuth 2.0 üzerinden e-posta gönderimi
 */

export interface OutlookOAuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt?: Date
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Outlook OAuth ile e-posta gönder (Microsoft Graph API)
 */
export async function sendEmailViaOutlook(
  accessToken: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    const from = options.from || (await getOutlookProfile(accessToken))?.mail

    if (!from) {
      return {
        success: false,
        error: 'Gönderen e-posta adresi bulunamadı',
      }
    }

    // Microsoft Graph API - E-posta gönder
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          from: {
            emailAddress: {
              address: from,
            },
          },
          toRecipients: toArray.map((email) => ({
            emailAddress: {
              address: email,
            },
          })),
          subject: options.subject,
          body: {
            contentType: 'HTML',
            content: options.html,
          },
        },
        saveToSentItems: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      
      // Token expired hatası
      if (response.status === 401 || error.error?.code === 'InvalidAuthenticationToken') {
        return {
          success: false,
          error: 'TOKEN_EXPIRED', // Özel hata kodu - refresh gerekli
        }
      }

      return {
        success: false,
        error: error.error?.message || 'Microsoft Graph API e-posta gönderilemedi',
      }
    }

    // Microsoft Graph API başarılı yanıt döndürmez (204 No Content)
    return {
      success: true,
      messageId: `outlook-${Date.now()}`, // Microsoft Graph message ID döndürmez
    }
  } catch (error: any) {
    console.error('Outlook OAuth email send error:', error)
    return {
      success: false,
      error: error?.message || 'Microsoft Graph API e-posta gönderilemedi',
    }
  }
}

/**
 * Outlook Profile bilgilerini al (e-posta adresini öğrenmek için)
 */
async function getOutlookProfile(accessToken: string): Promise<{ mail: string } | null> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Outlook profile fetch error:', error)
    return null
  }
}

/**
 * Outlook OAuth token'ı yenile
 */
export async function refreshOutlookToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<OutlookOAuthTokens | null> {
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Send',
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Outlook token refresh error:', error)
      return null
    }

    const data = await response.json()
    const expiresAt = data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Yeni refresh token dönebilir
      expiresAt,
    }
  } catch (error) {
    console.error('Outlook token refresh exception:', error)
    return null
  }
}







