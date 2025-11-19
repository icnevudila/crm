/**
 * SMS Integration Helper
 * Twilio ile SMS gönderimi
 * Kurum bazlı credentials desteği
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export interface SendSmsOptions {
  to: string // Telefon numarası (E.164 formatında: +905551234567)
  message: string // SMS mesajı
  from?: string // Gönderen telefon numarası (opsiyonel)
  companyId?: string // Kurum ID (kurum bazlı credentials için)
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * SMS gönder (Twilio)
 * Önce companyId'den credentials alır, yoksa environment variable'lardan
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  try {
    let accountSid: string | undefined
    let authToken: string | undefined
    let fromNumber: string | undefined

    // Kurum bazlı credentials kontrolü
    if (options.companyId) {
      const supabase = getSupabaseWithServiceRole()
      const { data: integration } = await supabase
        .from('CompanyIntegration')
        .select('twilioAccountSid, twilioAuthToken, twilioPhoneNumber')
        .eq('companyId', options.companyId)
        .maybeSingle()

      if (integration?.twilioAccountSid && integration?.twilioAuthToken && integration?.twilioPhoneNumber) {
        accountSid = integration.twilioAccountSid
        authToken = integration.twilioAuthToken
        fromNumber = options.from || integration.twilioPhoneNumber
      }
    }

    // Environment variable'lardan al (fallback)
    if (!accountSid || !authToken) {
      accountSid = process.env.TWILIO_ACCOUNT_SID
      authToken = process.env.TWILIO_AUTH_TOKEN
      fromNumber = options.from || process.env.TWILIO_PHONE_NUMBER
    }

    if (!accountSid || !authToken) {
      return {
        success: false,
        error: 'Twilio credentials bulunamadı. Lütfen TWILIO_ACCOUNT_SID ve TWILIO_AUTH_TOKEN environment variable\'larını ayarlayın.',
      }
    }

    if (!fromNumber) {
      return {
        success: false,
        error: 'Gönderen telefon numarası bulunamadı. Lütfen TWILIO_PHONE_NUMBER environment variable\'ını ayarlayın veya from parametresini gönderin.',
      }
    }

    // Telefon numarası formatı kontrolü (E.164 formatında olmalı)
    if (!options.to.startsWith('+')) {
      return {
        success: false,
        error: 'Telefon numarası E.164 formatında olmalıdır (örn: +905551234567)',
      }
    }

    // Twilio client import et
    let twilio: any
    try {
      twilio = await import('twilio')
    } catch (importError) {
      return {
        success: false,
        error: 'Twilio paketi kurulu değil. Lütfen şu komutu çalıştırın: npm install twilio',
      }
    }

    // Twilio client oluştur
    const client = twilio.default(accountSid, authToken)

    // SMS gönder
    const message = await client.messages.create({
      body: options.message,
      from: fromNumber,
      to: options.to,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error: any) {
    console.error('SMS send error:', error)
    
    // Twilio hata mesajlarını parse et
    let errorMessage = 'SMS gönderilemedi'
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.code) {
      switch (error.code) {
        case 21211:
          errorMessage = 'Geçersiz telefon numarası'
          break
        case 21608:
          errorMessage = 'Twilio numarası doğrulanmamış. Lütfen Twilio Console\'dan numarayı doğrulayın.'
          break
        case 21614:
          errorMessage = 'Gönderen telefon numarası geçersiz'
          break
        default:
          errorMessage = `Twilio hatası: ${error.code}`
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Toplu SMS gönder (batch)
 */
export async function sendBulkSms(
  recipients: Array<{ phone: string; name?: string }>,
  message: string,
  from?: string
): Promise<{ success: number; failed: number; errors: Array<{ phone: string; error: string }> }> {
  let success = 0
  let failed = 0
  const errors: Array<{ phone: string; error: string }> = []

  for (const recipient of recipients) {
    try {
      // Mesajı kişiselleştir
      const personalizedMessage = message.replace(/{{name}}/g, recipient.name || recipient.phone)

      const result = await sendSms({
        to: recipient.phone,
        message: personalizedMessage,
        from,
      })

      if (result.success) {
        success++
      } else {
        failed++
        errors.push({ phone: recipient.phone, error: result.error || 'Unknown error' })
      }
    } catch (error: any) {
      failed++
      errors.push({ phone: recipient.phone, error: error?.message || 'Failed to send' })
    }
  }

  return { success, failed, errors }
}

