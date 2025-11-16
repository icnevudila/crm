import { getSupabaseWithServiceRole } from '@/lib/supabase'

/**
 * Email gönderme helper fonksiyonu
 * Resend, SendGrid veya Brevo entegrasyonu destekler
 * 
 * Environment Variables:
 * - RESEND_API_KEY (Resend için)
 * - SENDGRID_API_KEY (SendGrid için)
 * - BREVO_API_KEY (Brevo için)
 * - EMAIL_FROM (Gönderen email adresi)
 */
export async function sendEmail({
  to,
  subject,
  body,
  html,
  from,
}: {
  to: string | string[]
  subject: string
  body?: string
  html?: string
  from?: string
}) {
  try {
    const recipients = Array.isArray(to) ? to : [to]
    const emailFrom = from || process.env.EMAIL_FROM || 'onboarding@resend.dev'
    const emailHtml = html || body || ''

    // 1. Resend (Önerilen - En Kolay)
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        const { data, error } = await resend.emails.send({
          from: emailFrom,
          to: recipients,
          subject,
          html: emailHtml,
        })

        if (error) {
          console.error('Resend error:', error)
          throw new Error(`Resend: ${error.message}`)
        }

        console.log('✅ Email gönderildi (Resend):', data?.id)
        return {
          success: true,
          messageId: data?.id,
          recipients,
          service: 'resend',
        }
      } catch (resendError: any) {
        console.error('Resend error:', resendError)
        // Diğer servislere fallback yap
      }
    }

    // 2. SendGrid (Alternatif)
    if (process.env.SENDGRID_API_KEY) {
      try {
        // @ts-expect-error - Paket yoksa hata vermemesi için
        const sgMail = await import('@sendgrid/mail').catch(() => null)
        if (!sgMail) {
          throw new Error('SendGrid paketi yüklü değil')
        }
        sgMail.default.setApiKey(process.env.SENDGRID_API_KEY)

        const [response] = await sgMail.default.send({
          to: recipients,
          from: emailFrom,
          subject,
          html: emailHtml,
        })

        console.log('✅ Email gönderildi (SendGrid):', response.headers['x-message-id'])
        return {
          success: true,
          messageId: response.headers['x-message-id'],
          recipients,
          service: 'sendgrid',
        }
      } catch (sendgridError: any) {
        console.error('SendGrid error:', sendgridError)
        // Diğer servislere fallback yap
      }
    }

    // 3. Brevo (Alternatif - En Yüksek Limit)
    if (process.env.BREVO_API_KEY) {
      try {
        // @ts-expect-error - Paket yoksa hata vermemesi için
        const brevo = await import('@getbrevo/brevo').catch(() => null)
        if (!brevo) {
          throw new Error('Brevo paketi yüklü değil')
        }
        const apiInstance = new brevo.TransactionalEmailsApi()
        apiInstance.setApiKey(
          brevo.TransactionalEmailsApiApiKeys.apiKey,
          process.env.BREVO_API_KEY!
        )

        const sendSmtpEmail = new brevo.SendSmtpEmail()
        sendSmtpEmail.subject = subject
        sendSmtpEmail.htmlContent = emailHtml
        sendSmtpEmail.sender = { email: emailFrom }
        sendSmtpEmail.to = recipients.map((email) => ({ email }))

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

        console.log('✅ Email gönderildi (Brevo):', data.messageId)
        return {
          success: true,
          messageId: data.messageId,
          recipients,
          service: 'brevo',
        }
      } catch (brevoError: any) {
        console.error('Brevo error:', brevoError)
        // Mock'a fallback yap
      }
    }

    // Mock mod (hiçbir servis yapılandırılmamışsa)
    console.log('📧 Email gönderiliyor (mock - servis yapılandırılmamış):', {
      to: recipients,
      subject,
      from: emailFrom,
    })

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      recipients,
      service: 'mock',
      warning: 'Email servisi yapılandırılmamış. Gerçek email gönderilmedi.',
    }
  } catch (error: any) {
    console.error('Email gönderme hatası:', error)
    throw new Error(`Email gönderilemedi: ${error.message}`)
  }
}

/**
 * Approval request için email bildirimi gönder
 */
export async function sendApprovalRequestEmail({
  approverEmail,
  approverName,
  requesterName,
  approvalTitle,
  approvalId,
  relatedTo,
  relatedId,
  priority,
}: {
  approverEmail: string
  approverName: string
  requesterName: string
  approvalTitle: string
  approvalId: string
  relatedTo: string
  relatedId: string
  priority: string
}) {
  const subject = `⏰ Yeni Onay Talebi: ${approvalTitle}`
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">Yeni Onay Talebi</h2>
          <p>Merhaba <strong>${approverName}</strong>,</p>
          <p><strong>${requesterName}</strong> size yeni bir onay talebi gönderdi:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${approvalTitle}</h3>
            <p><strong>İlgili Modül:</strong> ${relatedTo}</p>
            <p><strong>Öncelik:</strong> ${priority}</p>
          </div>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tr/approvals/${approvalId}" 
               style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Onay Talebini Görüntüle
            </a>
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Bu email otomatik olarak CRM sisteminden gönderilmiştir.
          </p>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: approverEmail,
    subject,
    html,
  })
}

/**
 * Approval decision için email bildirimi gönder
 */
export async function sendApprovalDecisionEmail({
  requesterEmail,
  requesterName,
  approverName,
  approvalTitle,
  decision,
  reason,
  relatedTo,
  relatedId,
}: {
  requesterEmail: string
  requesterName: string
  approverName: string
  approvalTitle: string
  decision: 'APPROVED' | 'REJECTED'
  reason?: string
  relatedTo: string
  relatedId: string
}) {
  const isApproved = decision === 'APPROVED'
  const subject = isApproved 
    ? `✅ Onay Talebi Onaylandı: ${approvalTitle}`
    : `❌ Onay Talebi Reddedildi: ${approvalTitle}`
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
            ${isApproved ? '✅ Onay Talebi Onaylandı' : '❌ Onay Talebi Reddedildi'}
          </h2>
          <p>Merhaba <strong>${requesterName}</strong>,</p>
          <p><strong>${approverName}</strong> onay talebinizi ${isApproved ? 'onayladı' : 'reddetti'}:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${approvalTitle}</h3>
            <p><strong>İlgili Modül:</strong> ${relatedTo}</p>
            ${reason ? `<p><strong>${isApproved ? 'Not' : 'Red Nedeni'}:</strong> ${reason}</p>` : ''}
          </div>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tr/${relatedTo.toLowerCase()}s/${relatedId}" 
               style="background: ${isApproved ? '#10b981' : '#ef4444'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${relatedTo} Kaydını Görüntüle
            </a>
          </p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Bu email otomatik olarak CRM sisteminden gönderilmiştir.
          </p>
        </div>
      </body>
    </html>
  `

  return await sendEmail({
    to: requesterEmail,
    subject,
    html,
  })
}

