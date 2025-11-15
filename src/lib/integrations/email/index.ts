/**
 * Email Integration Helper
 * Company credentials kullanarak e-posta gönderimi
 */

import { sendEmailViaSmtp, createGmailSmtpConfig, createOutlookSmtpConfig, SmtpConfig } from './gmail-smtp'
import { sendEmailViaGmail, refreshGmailToken } from './gmail-oauth'
import { sendEmailViaOutlook, refreshOutlookToken } from './outlook-oauth'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { sendEmailViaResend } from './resend'

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
 * Company credentials kullanarak e-posta gönder
 * Otomatik olarak aktif entegrasyonu seçer (Gmail OAuth > Outlook OAuth > SMTP)
 */
export async function sendEmail(
  companyId: string,
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    // CompanyIntegration kaydını getir
    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('*')
      .eq('companyId', companyId)
      .maybeSingle()

    if (!integration) {
      return {
        success: false,
        error: 'E-posta entegrasyonu bulunamadı. Lütfen Ayarlar > API Entegrasyonları bölümünden e-posta entegrasyonunu yapılandırın.',
      }
    }

    // Öncelik sırası: Resend (CompanyIntegration) > Resend (env) > Gmail OAuth > Outlook OAuth > SMTP
    // Resend kontrolü - önce CompanyIntegration'dan, sonra environment variable'dan
    const resendApiKey = integration?.resendApiKey || process.env.RESEND_API_KEY
    
    // Resend kontrolü: resendApiKey varsa kullan (resendEnabled flag'i opsiyonel)
    if (resendApiKey) {
      // Eğer resendFromEmail ayarlanmışsa kullan, yoksa options.from veya varsayılan değeri kullan
      const resendOptions = {
        ...options,
        from: options.from || integration?.resendFromEmail || undefined,
      }
      
      const result = await sendEmailViaResend(resendOptions, resendApiKey)
      
      // Başarılı ise status'u güncelle
      if (result.success) {
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ACTIVE',
            emailLastError: null,
            emailProvider: 'RESEND',
          })
          .eq('companyId', companyId)
      } else {
        // Hata durumunu kaydet
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ERROR',
            emailLastError: result.error,
          })
          .eq('companyId', companyId)
      }
      
      return result
    }

    if (integration.gmailEnabled && integration.gmailOAuthToken) {
      // Gmail OAuth ile gönder
      let accessToken = integration.gmailOAuthToken

      // Token expire kontrolü
      if (integration.gmailOAuthTokenExpiresAt) {
        const expiresAt = new Date(integration.gmailOAuthTokenExpiresAt)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()

        // 5 dakika kala veya expire olmuşsa refresh et
        if (timeUntilExpiry < 5 * 60 * 1000 || timeUntilExpiry < 0) {
          if (integration.gmailOAuthRefreshToken) {
            const refreshed = await refreshGmailToken(
              integration.gmailOAuthRefreshToken,
              process.env.GOOGLE_CLIENT_ID || '',
              process.env.GOOGLE_CLIENT_SECRET || ''
            )

            if (refreshed) {
              accessToken = refreshed.accessToken
              
              // Veritabanını güncelle
              await supabase
                .from('CompanyIntegration')
                .update({
                  gmailOAuthToken: refreshed.accessToken,
                  gmailOAuthTokenExpiresAt: refreshed.expiresAt?.toISOString(),
                })
                .eq('companyId', companyId)
            }
          }
        }
      }

      const result = await sendEmailViaGmail(accessToken, options)
      
      // Hata durumunu kaydet
      if (!result.success) {
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: result.error === 'TOKEN_EXPIRED' ? 'ERROR' : 'ERROR',
            emailLastError: result.error,
          })
          .eq('companyId', companyId)
      } else {
        // Başarılı - status'u ACTIVE yap
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ACTIVE',
            emailLastError: null,
          })
          .eq('companyId', companyId)
      }

      return result
    }

    if (integration.outlookEnabled && integration.outlookOAuthToken) {
      // Outlook OAuth ile gönder
      let accessToken = integration.outlookOAuthToken

      // Token expire kontrolü
      if (integration.outlookOAuthTokenExpiresAt) {
        const expiresAt = new Date(integration.outlookOAuthTokenExpiresAt)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()

        // 5 dakika kala veya expire olmuşsa refresh et
        if (timeUntilExpiry < 5 * 60 * 1000 || timeUntilExpiry < 0) {
          if (integration.outlookOAuthRefreshToken) {
            const refreshed = await refreshOutlookToken(
              integration.outlookOAuthRefreshToken,
              process.env.MICROSOFT_CLIENT_ID || '',
              process.env.MICROSOFT_CLIENT_SECRET || ''
            )

            if (refreshed) {
              accessToken = refreshed.accessToken
              
              // Veritabanını güncelle
              await supabase
                .from('CompanyIntegration')
                .update({
                  outlookOAuthToken: refreshed.accessToken,
                  outlookOAuthTokenExpiresAt: refreshed.expiresAt?.toISOString(),
                })
                .eq('companyId', companyId)
            }
          }
        }
      }

      const result = await sendEmailViaOutlook(accessToken, options)
      
      // Hata durumunu kaydet
      if (!result.success) {
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: result.error === 'TOKEN_EXPIRED' ? 'ERROR' : 'ERROR',
            emailLastError: result.error,
          })
          .eq('companyId', companyId)
      } else {
        // Başarılı - status'u ACTIVE yap
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ACTIVE',
            emailLastError: null,
          })
          .eq('companyId', companyId)
      }

      return result
    }

    if (integration.smtpEnabled && integration.smtpHost && integration.smtpUser && integration.smtpPassword) {
      // SMTP ile gönder
      const smtpConfig: SmtpConfig = {
        host: integration.smtpHost,
        port: integration.smtpPort || 587,
        user: integration.smtpUser,
        password: integration.smtpPassword,
        fromEmail: integration.smtpFromEmail || integration.smtpUser,
        fromName: integration.smtpFromName,
        secure: integration.smtpPort === 465,
      }

      const result = await sendEmailViaSmtp(smtpConfig, {
        ...options,
        from: options.from || smtpConfig.fromEmail,
        fromName: options.fromName || smtpConfig.fromName,
      })
      
      // Hata durumunu kaydet
      if (!result.success) {
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ERROR',
            emailLastError: result.error,
          })
          .eq('companyId', companyId)
      } else {
        // Başarılı - status'u ACTIVE yap
        await supabase
          .from('CompanyIntegration')
          .update({
            emailStatus: 'ACTIVE',
            emailLastError: null,
          })
          .eq('companyId', companyId)
      }

      return result
    }

    // Hiçbir entegrasyon aktif değil
    return {
      success: false,
      error: 'Aktif e-posta entegrasyonu bulunamadı. Lütfen Ayarlar > API Entegrasyonları bölümünden e-posta entegrasyonunu yapılandırın.',
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error?.message || 'E-posta gönderilemedi',
    }
  }
}



