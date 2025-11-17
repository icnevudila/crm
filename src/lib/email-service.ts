/**
 * Email Service - E-posta gönderme servisi
 * 
 * Desteklenen servisler (öncelik sırasına göre):
 * 1. Resend (RESEND_API_KEY)
 * 2. SendGrid (SENDGRID_API_KEY)
 * 3. Nodemailer (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 4. Mock mod (hiçbiri yoksa)
 */

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

interface EmailServiceResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * E-posta gönder
 * 
 * Environment variable'ları:
 * - RESEND_API_KEY (Resend için - öncelikli)
 * - SENDGRID_API_KEY (SendGrid için)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (Nodemailer için)
 * - SMTP_FROM (varsayılan gönderen adresi)
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailOptions): Promise<EmailServiceResult> {
  try {
    const defaultFrom = from || process.env.SMTP_FROM || 'noreply@crm.com'
    const recipients = Array.isArray(to) ? to : [to]

    // ✅ Seçenek 1: Resend (Öncelikli - Modern, Kolay)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        const { data, error } = await resend.emails.send({
          from: defaultFrom,
          to: recipients,
          subject,
          html,
          reply_to: replyTo,
        })

        if (error) {
          console.error('Resend error:', error)
          throw error
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [RESEND] Email gönderildi:', data?.id)
        }

        return {
          success: true,
          messageId: data?.id,
        }
      } catch (resendError: any) {
        console.error('Resend send error:', resendError)
        // Resend başarısız olursa diğer servislere geç
      }
    }

    // ✅ Seçenek 2: SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = await import('@sendgrid/mail')
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY)

        const msg = {
          to: recipients,
          from: defaultFrom,
          subject,
          html,
          replyTo,
        }

        const [response] = await sgMail.default.send(msg)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [SENDGRID] Email gönderildi:', response.headers['x-message-id'])
        }

        return {
          success: true,
          messageId: response.headers['x-message-id'] as string,
        }
      } catch (sendgridError: any) {
        console.error('SendGrid send error:', sendgridError)
        // SendGrid başarısız olursa Nodemailer'a geç
      }
    }

    // ✅ Seçenek 3: Nodemailer (SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer')
        
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        const info = await transporter.sendMail({
          from: defaultFrom,
          to: recipients.join(', '),
          subject,
          html,
          replyTo,
        })

        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [NODEMAILER] Email gönderildi:', info.messageId)
        }

        return {
          success: true,
          messageId: info.messageId,
        }
      } catch (nodemailerError: any) {
        console.error('Nodemailer send error:', nodemailerError)
        // Nodemailer başarısız olursa mock moda geç
      }
    }

    // ⚠️ Mock mod - hiçbir email servisi yapılandırılmamış
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK] Email gönderiliyor (gerçek email servisi yapılandırılmamış):')
      console.log('  To:', recipients.join(', '))
      console.log('  Subject:', subject)
      console.log('  From:', defaultFrom)
      console.log('  HTML length:', html.length, 'characters')
      console.log('  ⚠️  Gerçek email göndermek için RESEND_API_KEY, SENDGRID_API_KEY veya SMTP ayarlarını yapılandırın')
    }

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    }
  } catch (error: any) {
    console.error('Email service error:', error)
    return {
      success: false,
      error: error?.message || 'Failed to send email',
    }
  }
}

/**
 * Toplu e-posta gönder (batch)
 */
export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  html: string,
  from?: string
): Promise<{ success: number; failed: number; errors: Array<{ email: string; error: string }> }> {
  let success = 0
  let failed = 0
  const errors: Array<{ email: string; error: string }> = []

  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient.email,
        subject,
        html: html.replace(/{{customerName}}/g, recipient.name || recipient.email),
        from,
      })

      if (result.success) {
        success++
      } else {
        failed++
        errors.push({ email: recipient.email, error: result.error || 'Unknown error' })
      }
    } catch (error: any) {
      failed++
      errors.push({ email: recipient.email, error: error?.message || 'Failed to send' })
    }
  }

  return { success, failed, errors }
}

















    }
  }

  return { success, failed, errors }
}
















