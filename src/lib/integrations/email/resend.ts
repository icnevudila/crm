/**
 * Resend Email Integration
 * Resend API kullanarak e-posta gönderimi
 */

// Interface'leri burada tanımlıyoruz (circular import'u önlemek için)
interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Resend API ile e-posta gönder
 */
export async function sendEmailViaResend(
  options: SendEmailOptions,
  apiKey: string
): Promise<SendEmailResult> {
  try {
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    
    // Resend için from adresi: Test için onboarding@resend.dev kullan (domain doğrulaması yoksa)
    // Domain doğrulaması için: Resend Dashboard > Domains > Add Domain
    // Test modunda: Sadece kendi email adresinize gönderebilirsiniz
    // ÖNEMLİ: Resend test modunda sadece onboarding@resend.dev kullanılabilir
    const fromAddress = options.from || 'onboarding@resend.dev'
    
    // Resend test kısıtlaması: Eğer to adresi kullanıcının kendi email adresi değilse hata verir
    // Bu kontrolü burada yapmıyoruz çünkü test endpoint'i zaten kendi email adresine gönderiyor
    
    // Debug: Resend API isteğini logla
    console.log('Resend API Request:', {
      from: fromAddress,
      to: toArray,
      subject: options.subject,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
    })
    
    // Resend API'ye istek gönder
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: toArray,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Resend API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        from: fromAddress,
        to: toArray,
      })
      
      // Resend'in test kısıtlaması hatası için özel mesaj
      if (errorData.message && errorData.message.includes('You can only send testing emails')) {
        // Resend API'den gelen hata mesajında hangi email adresine gönderebileceğiniz belirtilir
        const allowedEmailMatch = errorData.message.match(/\(([^)]+@[^)]+)\)/)
        const allowedEmail = allowedEmailMatch ? allowedEmailMatch[1] : 'API key sahibi email adresi'
        
        return {
          success: false,
          error: `Resend test kısıtlaması: Test modunda sadece ${allowedEmail} adresine gönderebilirsiniz. Bu, Resend API key'inizin sahibi olan email adresidir. Production için domain doğrulaması gereklidir. Lütfen resend.com/domains adresinden domain doğrulaması yapın.`,
        }
      }
      
      return {
        success: false,
        error: errorData.message || errorData.error?.message || 'Resend API hatası',
      }
    }

    const result = await response.json()

    return {
      success: true,
      messageId: result.id || result.messageId,
    }
  } catch (error: any) {
    console.error('Resend email send error:', error)
    return {
      success: false,
      error: error?.message || 'Resend e-posta gönderilemedi',
    }
  }
}
