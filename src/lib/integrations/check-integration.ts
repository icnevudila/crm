/**
 * Integration Check Helper
 * Kurum bazlı entegrasyon kontrolü
 */

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export interface IntegrationStatus {
  hasIntegration: boolean
  isActive: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'NO_INTEGRATION'
  lastError?: string
  message: string
}

/**
 * Email entegrasyonu kontrolü
 */
export async function checkEmailIntegration(
  companyId: string
): Promise<IntegrationStatus> {
  try {
    const supabase = getSupabaseWithServiceRole()
    const { data: integration, error: integrationError } = await supabase
      .from('CompanyIntegration')
      .select('gmailEnabled, outlookEnabled, smtpEnabled, emailStatus, emailLastError, resendEnabled, resendApiKey')
      .eq('companyId', companyId)
      .maybeSingle()

    // Debug: Entegrasyon kaydını logla
    console.log('CompanyIntegration Check:', {
      companyId,
      integration: integration ? {
        resendEnabled: integration.resendEnabled,
        resendApiKey: integration.resendApiKey ? '***' : null,
        gmailEnabled: integration.gmailEnabled,
        outlookEnabled: integration.outlookEnabled,
        smtpEnabled: integration.smtpEnabled,
        emailStatus: integration.emailStatus,
      } : null,
      error: integrationError,
    })

    // Resend kontrolü (öncelik 1) - önce env variable, sonra integration kaydı
    const hasResendEnv = !!process.env.RESEND_API_KEY
    // Resend entegrasyonu: resendApiKey varsa aktif sayılır (resendEnabled flag'i opsiyonel)
    const hasResendIntegration = integration && !!integration.resendApiKey
    const hasResend = hasResendEnv || hasResendIntegration

    // Integration kaydı yoksa ama env variable varsa, Resend kullanılabilir
    if (!integration && hasResendEnv) {
      return {
        hasIntegration: true,
        isActive: true,
        status: 'ACTIVE',
        message: 'E-posta entegrasyonu aktif ve hazır (Resend - Environment Variable).',
      }
    }

    // Integration kaydı yoksa ve env variable da yoksa
    if (!integration && !hasResendEnv) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'E-posta entegrasyonu bulunamadı. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden yapılandırın.',
      }
    }

    // Diğer entegrasyonlar
    const hasIntegration = hasResend || integration.gmailEnabled || integration.outlookEnabled || integration.smtpEnabled
    
    if (!hasIntegration) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'E-posta entegrasyonu aktif değil. Lütfen Ayarlar > E-posta Entegrasyonları bölümünden aktifleştirin.',
      }
    }

    // Resend için özel kontrol - resendEnabled ve resendApiKey varsa aktif sayılır
    if (hasResendIntegration) {
      return {
        hasIntegration: true,
        isActive: true,
        status: 'ACTIVE',
        message: 'E-posta entegrasyonu aktif ve hazır (Resend).',
      }
    }

    // Diğer entegrasyonlar için status kontrolü
    const isActive = integration.emailStatus === 'ACTIVE'
    const hasError = integration.emailStatus === 'ERROR'

    return {
      hasIntegration: true,
      isActive: isActive && !hasError,
      status: hasError
        ? 'ERROR'
        : isActive
        ? 'ACTIVE'
        : 'INACTIVE',
      lastError: integration.emailLastError || undefined,
      message: hasError
        ? `E-posta entegrasyonunda hata var: ${integration.emailLastError || 'Bilinmeyen hata'}`
        : !isActive
        ? 'E-posta entegrasyonu pasif durumda.'
        : 'E-posta entegrasyonu aktif ve hazır.',
    }
  } catch (error: any) {
    console.error('Email integration check error:', error)
    return {
      hasIntegration: false,
      isActive: false,
      status: 'NO_INTEGRATION',
      message: 'E-posta entegrasyonu kontrol edilemedi.',
    }
  }
}

/**
 * SMS entegrasyonu kontrolü
 */
export async function checkSmsIntegration(
  companyId: string
): Promise<IntegrationStatus> {
  try {
    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('smsEnabled, smsProvider, smsStatus, smsLastError, twilioAccountSid, twilioAuthToken, twilioPhoneNumber')
      .eq('companyId', companyId)
      .maybeSingle()

    if (!integration || !integration.smsEnabled) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'SMS entegrasyonu bulunamadı. Lütfen Ayarlar > Entegrasyonlar bölümünden yapılandırın.',
      }
    }

    // Twilio credentials kontrolü
    const hasCredentials =
      (integration.twilioAccountSid && integration.twilioAuthToken && integration.twilioPhoneNumber) ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)

    if (!hasCredentials) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'SMS entegrasyonu için Twilio credentials eksik. Lütfen Ayarlar > Entegrasyonlar bölümünden Twilio bilgilerini girin.',
      }
    }

    const isActive = integration.smsStatus === 'ACTIVE'
    const hasError = integration.smsStatus === 'ERROR'

    return {
      hasIntegration: true,
      isActive: isActive,
      status: hasError ? 'ERROR' : isActive ? 'ACTIVE' : 'INACTIVE',
      lastError: integration.smsLastError || undefined,
      message: hasError
        ? `SMS entegrasyonunda hata var: ${integration.smsLastError || 'Bilinmeyen hata'}`
        : !isActive
        ? 'SMS entegrasyonu pasif durumda.'
        : 'SMS entegrasyonu aktif ve hazır.',
    }
  } catch (error: any) {
    console.error('SMS integration check error:', error)
    return {
      hasIntegration: false,
      isActive: false,
      status: 'NO_INTEGRATION',
      message: 'SMS entegrasyonu kontrol edilemedi.',
    }
  }
}

/**
 * WhatsApp entegrasyonu kontrolü
 */
export async function checkWhatsAppIntegration(
  companyId: string
): Promise<IntegrationStatus> {
  try {
    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('whatsappEnabled, whatsappProvider, whatsappStatus, whatsappLastError, twilioAccountSid, twilioAuthToken, twilioWhatsappNumber')
      .eq('companyId', companyId)
      .maybeSingle()

    if (!integration || !integration.whatsappEnabled) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'WhatsApp entegrasyonu bulunamadı. Lütfen Ayarlar > Entegrasyonlar bölümünden yapılandırın.',
      }
    }

    // Twilio credentials kontrolü
    const hasCredentials =
      (integration.twilioAccountSid && integration.twilioAuthToken && integration.twilioWhatsappNumber) ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER)

    if (!hasCredentials) {
      return {
        hasIntegration: false,
        isActive: false,
        status: 'NO_INTEGRATION',
        message: 'WhatsApp entegrasyonu için Twilio credentials eksik. Lütfen Ayarlar > Entegrasyonlar bölümünden Twilio bilgilerini girin.',
      }
    }

    const isActive = integration.whatsappStatus === 'ACTIVE'
    const hasError = integration.whatsappStatus === 'ERROR'

    return {
      hasIntegration: true,
      isActive: isActive,
      status: hasError ? 'ERROR' : isActive ? 'ACTIVE' : 'INACTIVE',
      lastError: integration.whatsappLastError || undefined,
      message: hasError
        ? `WhatsApp entegrasyonunda hata var: ${integration.whatsappLastError || 'Bilinmeyen hata'}`
        : !isActive
        ? 'WhatsApp entegrasyonu pasif durumda.'
        : 'WhatsApp entegrasyonu aktif ve hazır.',
    }
  } catch (error: any) {
    console.error('WhatsApp integration check error:', error)
    return {
      hasIntegration: false,
      isActive: false,
      status: 'NO_INTEGRATION',
      message: 'WhatsApp entegrasyonu kontrol edilemedi.',
    }
  }
}

/**
 * Google Calendar entegrasyonu kontrolü (kurum bazlı)
 * CompanyIntegration'dan Google Calendar credentials kontrolü yapar
 */
export async function checkGoogleCalendarIntegration(
  companyId: string
): Promise<IntegrationStatus> {
  try {
    const supabase = getSupabaseWithServiceRole()
    
    // Önce CompanyIntegration'dan Google Calendar credentials kontrolü
    const { data: companyIntegration, error: companyError } = await supabase
      .from('CompanyIntegration')
      .select('googleCalendarClientId, googleCalendarClientSecret, googleCalendarRedirectUri')
      .eq('companyId', companyId)
      .maybeSingle()

    if (companyError) {
      console.error('Error checking Google Calendar integration:', companyError)
      return { hasIntegration: false, isActive: false, status: 'NO_INTEGRATION', message: 'Google Takvim entegrasyon durumu kontrol edilirken bir hata oluştu.' }
    }

    // CompanyIntegration'da Google Calendar credentials yoksa entegrasyon yok
    if (!companyIntegration || !companyIntegration.googleCalendarClientId || !companyIntegration.googleCalendarClientSecret || !companyIntegration.googleCalendarRedirectUri) {
      return { hasIntegration: false, isActive: false, status: 'NO_INTEGRATION', message: 'Google Takvim entegrasyonu henüz yapılandırılmamış.' }
    }

    // CompanyIntegration'da credentials varsa aktif sayılır
    // Kullanıcı bazlı OAuth bağlantısı UserIntegration tablosunda kontrol edilecek (gelecekte)
    
    return {
      hasIntegration: true,
      isActive: true, // CompanyIntegration'da credentials varsa aktif sayılır
      status: 'ACTIVE',
      message: 'Google Takvim entegrasyonu aktif.',
    }
  } catch (error: any) {
    console.error('Google Calendar integration check error:', error)
    return {
      hasIntegration: false,
      isActive: false,
      status: 'NO_INTEGRATION',
      message: 'Google Calendar entegrasyonu kontrol edilemedi.',
    }
  }
}

