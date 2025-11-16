/**
 * WhatsApp Integration Helper
 * Twilio WhatsApp API ile WhatsApp mesajı gönderimi
 * Kurum bazlı credentials desteği
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export interface SendWhatsAppOptions {
  to: string // Telefon numarası (E.164 formatında: +905551234567)
  message: string // WhatsApp mesajı
  from?: string // Gönderen WhatsApp numarası (opsiyonel)
  companyId?: string // Kurum ID (kurum bazlı credentials için)
}

export interface SendWhatsAppResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * WhatsApp mesajı gönder (Twilio WhatsApp API)
 * Önce companyId'den credentials alır, yoksa environment variable'lardan
 */
export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  try {
    let accountSid: string | undefined
    let authToken: string | undefined
    let fromNumber: string | undefined

    // Kurum bazlı credentials kontrolü
    if (options.companyId) {
      const supabase = getSupabaseWithServiceRole()
      const { data: integration } = await supabase
        .from('CompanyIntegration')
        .select('twilioAccountSid, twilioAuthToken, twilioWhatsappNumber')
        .eq('companyId', options.companyId)
        .maybeSingle()

      if (integration?.twilioAccountSid && integration?.twilioAuthToken && integration?.twilioWhatsappNumber) {
        accountSid = integration.twilioAccountSid
        authToken = integration.twilioAuthToken
        fromNumber = options.from || integration.twilioWhatsappNumber
      }
    }

    // Environment variable'lardan al (fallback)
    if (!accountSid || !authToken) {
      accountSid = process.env.TWILIO_ACCOUNT_SID
      authToken = process.env.TWILIO_AUTH_TOKEN
      fromNumber = options.from || process.env.TWILIO_WHATSAPP_NUMBER
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
        error: 'Gönderen WhatsApp numarası bulunamadı. Lütfen TWILIO_WHATSAPP_NUMBER environment variable\'ını ayarlayın veya from parametresini gönderin.',
      }
    }

    // Telefon numarası formatı kontrolü (E.164 formatında olmalı)
    if (!options.to.startsWith('+')) {
      return {
        success: false,
        error: 'Telefon numarası E.164 formatında olmalıdır (örn: +905551234567)',
      }
    }

    // WhatsApp numarası formatı kontrolü (whatsapp: prefix'i olmalı)
    const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`
    const toWhatsApp = options.to.startsWith('whatsapp:') ? options.to : `whatsapp:${options.to}`

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

    // WhatsApp mesajı gönder
    const message = await client.messages.create({
      body: options.message,
      from: fromWhatsApp,
      to: toWhatsApp,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error)
    
    // Twilio hata mesajlarını parse et
    let errorMessage = 'WhatsApp mesajı gönderilemedi'
    if (error?.message) {
      errorMessage = error.message
    } else if (error?.code) {
      switch (error.code) {
        case 21211:
          errorMessage = 'Geçersiz telefon numarası'
          break
        case 21608:
          errorMessage = 'Twilio WhatsApp numarası doğrulanmamış. Lütfen Twilio Console\'dan WhatsApp numarasını doğrulayın.'
          break
        case 21614:
          errorMessage = 'Gönderen WhatsApp numarası geçersiz'
          break
        case 63007:
          errorMessage = 'WhatsApp mesajı gönderilemedi. Alıcı WhatsApp\'ı kullanmıyor olabilir veya numara doğrulanmamış olabilir.'
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
 * Toplu WhatsApp mesajı gönder (batch)
 */
export async function sendBulkWhatsApp(
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

      const result = await sendWhatsApp({
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

