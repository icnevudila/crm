/**
 * Gmail SMTP Helper
 * OAuth olmadan direkt SMTP ile Gmail e-posta gönderimi
 * 
 * NOT: Gmail App Password gerekli (gmail.com > Hesap > Güvenlik > 2 Adımlı Doğrulama > Uygulama şifreleri)
 */

export interface SmtpConfig {
  host: string
  port: number
  user: string
  password: string
  fromEmail: string
  fromName?: string
  secure?: boolean // true = SSL (port 465), false = STARTTLS (port 587)
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  fromName?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Gmail SMTP ile e-posta gönder
 * NOT: Edge Runtime'da nodemailer çalışmayabilir, fetch API kullanıyoruz
 */
export async function sendEmailViaSmtp(
  config: SmtpConfig,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // Edge Runtime uyumlu - API endpoint üzerinden gönder
    // SMTP sunucusuna direkt bağlanmak yerine, backend API endpoint'i kullan
    // Bu endpoint nodemailer veya benzer bir SMTP client kullanabilir
    
    const toArray = Array.isArray(options.to) ? options.to : [options.to]
    
    const response = await fetch('/api/integrations/email/send-smtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          host: config.host,
          port: config.port,
          user: config.user,
          password: config.password,
          secure: config.secure ?? (config.port === 465),
        },
        email: {
          to: toArray,
          subject: options.subject,
          html: options.html,
          text: options.text,
          from: options.from || config.fromEmail,
          fromName: options.fromName || config.fromName || config.fromEmail,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        success: false,
        error: error.error || 'SMTP e-posta gönderilemedi',
      }
    }

    const result = await response.json()
    
    return {
      success: true,
      messageId: result.messageId,
    }
  } catch (error: any) {
    console.error('SMTP email send error:', error)
    return {
      success: false,
      error: error?.message || 'SMTP e-posta gönderilemedi',
    }
  }
}

/**
 * Gmail SMTP Config oluştur (varsayılan değerlerle)
 */
export function createGmailSmtpConfig(
  email: string,
  appPassword: string,
  fromName?: string
): SmtpConfig {
  return {
    host: 'smtp.gmail.com',
    port: 587,
    user: email,
    password: appPassword,
    fromEmail: email,
    fromName: fromName || email,
    secure: false, // STARTTLS
  }
}

/**
 * Outlook SMTP Config oluştur
 */
export function createOutlookSmtpConfig(
  email: string,
  password: string,
  fromName?: string
): SmtpConfig {
  return {
    host: 'smtp-mail.outlook.com',
    port: 587,
    user: email,
    password: password,
    fromEmail: email,
    fromName: fromName || email,
    secure: false, // STARTTLS
  }
}



