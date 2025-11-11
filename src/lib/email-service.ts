/**
 * Email Service - E-posta gönderme servisi
 * 
 * Şu an mock modda çalışıyor. Gerçek entegrasyon için:
 * - Resend: npm install resend
 * - SendGrid: npm install @sendgrid/mail
 * - AWS SES: npm install @aws-sdk/client-ses
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
 * Şu an mock modda çalışıyor. Gerçek entegrasyon için environment variable'ları ayarlayın:
 * - RESEND_API_KEY (Resend için)
 * - SENDGRID_API_KEY (SendGrid için)
 * - AWS_SES_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (AWS SES için)
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailOptions): Promise<EmailServiceResult> {
  try {
    // Mock mod - gerçek email gönderilmiyor
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK] Email gönderiliyor:')
      console.log('  To:', Array.isArray(to) ? to.join(', ') : to)
      console.log('  Subject:', subject)
      console.log('  From:', from || process.env.SMTP_FROM || 'noreply@crm.com')
      console.log('  HTML length:', html.length, 'characters')
    }

    // TODO: Gerçek email service entegrasyonu
    // Seçenek 1: Resend (Önerilen - Modern, Kolay)
    /*
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const { data, error } = await resend.emails.send({
        from: from || process.env.SMTP_FROM || 'noreply@yourcompany.com',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo,
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      return {
        success: true,
        messageId: data?.id,
      }
    }
    */

    // Seçenek 2: SendGrid
    /*
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = await import('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: from || process.env.SMTP_FROM || 'noreply@yourcompany.com',
        subject,
        html,
        replyTo,
      }

      const [response] = await sgMail.send(msg)
      return {
        success: true,
        messageId: response.headers['x-message-id'],
      }
    }
    */

    // Seçenek 3: AWS SES
    /*
    if (process.env.AWS_SES_REGION) {
      const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses')
      
      const sesClient = new SESClient({
        region: process.env.AWS_SES_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      })

      const command = new SendEmailCommand({
        Source: from || process.env.SMTP_FROM || 'noreply@yourcompany.com',
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to],
        },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
        ReplyToAddresses: replyTo ? [replyTo] : undefined,
      })

      const response = await sesClient.send(command)
      return {
        success: true,
        messageId: response.MessageId,
      }
    }
    */

    // Mock başarılı dönüş
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


