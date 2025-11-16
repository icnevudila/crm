/**
 * Gmail OAuth Helper
 * Gmail API ile OAuth 2.0 üzerinden e-posta gönderimi
 */

export interface GmailOAuthTokens {
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
 * Gmail OAuth ile e-posta gönder (Gmail API)
 */
export async function sendEmailViaGmail(
  accessToken: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    const from = options.from || (await getGmailProfile(accessToken))?.emailAddress

    if (!from) {
      return {
        success: false,
        error: 'Gönderen e-posta adresi bulunamadı',
      }
    }

    // Gmail API - MIME message oluştur
    const rawMessage = createMimeMessage({
      from,
      to: toArray,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })

    // Gmail API - E-posta gönder
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        raw: rawMessage,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      
      // Token expired hatası
      if (error.error?.code === 401 || error.error?.message?.includes('invalid_grant')) {
        return {
          success: false,
          error: 'TOKEN_EXPIRED', // Özel hata kodu - refresh gerekli
        }
      }

      return {
        success: false,
        error: error.error?.message || 'Gmail API e-posta gönderilemedi',
      }
    }

    const result = await response.json()
    
    return {
      success: true,
      messageId: result.id,
    }
  } catch (error: any) {
    console.error('Gmail OAuth email send error:', error)
    return {
      success: false,
      error: error?.message || 'Gmail API e-posta gönderilemedi',
    }
  }
}

/**
 * Gmail Profile bilgilerini al (e-posta adresini öğrenmek için)
 */
async function getGmailProfile(accessToken: string): Promise<{ emailAddress: string } | null> {
  try {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Gmail profile fetch error:', error)
    return null
  }
}

/**
 * MIME message oluştur (Gmail API için)
 */
function createMimeMessage(params: {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
}): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const message = [
    `MIME-Version: 1.0`,
    `To: ${params.to.join(', ')}`,
    `From: ${params.from}`,
    `Subject: ${params.subject}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    params.text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    params.html,
    ``,
    `--${boundary}--`,
  ].join('\r\n')

  // Base64 encode (URL-safe)
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Gmail OAuth token'ı yenile
 */
export async function refreshGmailToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GmailOAuthTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
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
      const error = await response.json().catch(() => ({}))
      console.error('Gmail token refresh error:', error)
      return null
    }

    const data = await response.json()
    const expiresAt = data.expires_in 
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Refresh token değişmez
      expiresAt,
    }
  } catch (error) {
    console.error('Gmail token refresh exception:', error)
    return null
  }
}







