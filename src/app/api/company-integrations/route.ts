import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

/**
 * GET /api/company-integrations
 * Şirket API entegrasyonlarını getir
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin, SuperAdmin ve normal kullanıcılar kendi şirketlerinin entegrasyonlarını görebilir
    // (Kullanıcı entegrasyonları sayfasından yapılandırma için)

    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin için companyId query parametresinden alınabilir
    const { searchParams } = new URL(request.url)
    const requestedCompanyId = searchParams.get('companyId')
    const companyId = session.user.role === 'SUPER_ADMIN' && requestedCompanyId 
      ? requestedCompanyId 
      : session.user.companyId

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID bulunamadı' }, { status: 400 })
    }

    // CompanyIntegration kaydını getir
    const { data, error } = await supabase
      .from('CompanyIntegration')
      .select('*')
      .eq('companyId', companyId)
      .maybeSingle()

    if (error) {
      console.error('CompanyIntegration GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Kayıt yoksa boş obje döndür
    return NextResponse.json(data || {
      zoomEnabled: false,
      googleEnabled: false,
      microsoftEnabled: false,
    })
  } catch (error: any) {
    console.error('CompanyIntegration GET exception:', error)
    return NextResponse.json(
      { error: 'Entegrasyonlar yüklenemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/company-integrations
 * Şirket API entegrasyonlarını güncelle
 */
export async function PUT(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin, SuperAdmin ve normal kullanıcılar kendi şirketlerinin entegrasyonlarını güncelleyebilir
    // (Kullanıcı entegrasyonları sayfasından yapılandırma için)

    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin için companyId body'den alınabilir
    const companyId = session.user.role === 'SUPER_ADMIN' && body.companyId
      ? body.companyId
      : session.user.companyId

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID bulunamadı' }, { status: 400 })
    }

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('CompanyIntegration')
      .select('*')
      .eq('companyId', companyId)
      .maybeSingle()

    // Sadece body'de gönderilen alanları güncelle, diğerlerini mevcut değerlerden al
    const integrationData: any = {
      companyId,
      updatedAt: new Date().toISOString(),
    }

    // E-posta entegrasyonları (body'de varsa güncelle)
    if (body.hasOwnProperty('gmailEnabled')) integrationData.gmailEnabled = body.gmailEnabled || false
    if (body.hasOwnProperty('outlookEnabled')) integrationData.outlookEnabled = body.outlookEnabled || false
    if (body.hasOwnProperty('smtpEnabled')) integrationData.smtpEnabled = body.smtpEnabled || false
    if (body.hasOwnProperty('resendEnabled')) integrationData.resendEnabled = body.resendEnabled || false
    if (body.hasOwnProperty('smtpHost')) integrationData.smtpHost = body.smtpHost || null
    if (body.hasOwnProperty('smtpPort')) integrationData.smtpPort = body.smtpPort || null
    if (body.hasOwnProperty('smtpUser')) integrationData.smtpUser = body.smtpUser || null
    if (body.hasOwnProperty('smtpPassword')) integrationData.smtpPassword = body.smtpPassword || null
    if (body.hasOwnProperty('smtpFromEmail')) integrationData.smtpFromEmail = body.smtpFromEmail || null
    if (body.hasOwnProperty('smtpFromName')) integrationData.smtpFromName = body.smtpFromName || null
    if (body.hasOwnProperty('resendApiKey')) integrationData.resendApiKey = body.resendApiKey || null
    if (body.hasOwnProperty('resendFromEmail')) integrationData.resendFromEmail = body.resendFromEmail || null
    if (body.hasOwnProperty('emailProvider')) integrationData.emailProvider = body.emailProvider || null
    
    // Email status hesapla
    if (body.hasOwnProperty('resendEnabled') || body.hasOwnProperty('resendApiKey')) {
      const resendEnabled = body.resendEnabled ?? existing?.resendEnabled ?? false
      const resendApiKey = body.resendApiKey ?? existing?.resendApiKey ?? null
      integrationData.emailStatus = resendEnabled && resendApiKey ? (body.emailStatus || 'ACTIVE') : (body.emailStatus || existing?.emailStatus || 'INACTIVE')
    }

    // Video meeting entegrasyonları (body'de varsa güncelle)
    if (body.hasOwnProperty('zoomEnabled')) integrationData.zoomEnabled = body.zoomEnabled || false
    if (body.hasOwnProperty('zoomAccountId')) integrationData.zoomAccountId = body.zoomAccountId || null
    if (body.hasOwnProperty('zoomClientId')) integrationData.zoomClientId = body.zoomClientId || null
    if (body.hasOwnProperty('zoomClientSecret')) integrationData.zoomClientSecret = body.zoomClientSecret || null
    if (body.hasOwnProperty('googleEnabled')) integrationData.googleEnabled = body.googleEnabled || false
    if (body.hasOwnProperty('googleAccessToken')) integrationData.googleAccessToken = body.googleAccessToken || null
    if (body.hasOwnProperty('googleRefreshToken')) integrationData.googleRefreshToken = body.googleRefreshToken || null
    if (body.hasOwnProperty('microsoftEnabled')) integrationData.microsoftEnabled = body.microsoftEnabled || false
    if (body.hasOwnProperty('microsoftAccessToken')) integrationData.microsoftAccessToken = body.microsoftAccessToken || null
    if (body.hasOwnProperty('microsoftRefreshToken')) integrationData.microsoftRefreshToken = body.microsoftRefreshToken || null
    
    // Microsoft OAuth alanları - sadece body'de varsa ve migration çalışmışsa ekle
    if (body.hasOwnProperty('microsoftClientId')) {
      // Kolonun var olup olmadığını kontrol etmek için try-catch kullanabiliriz
      // Ama şimdilik sadece body'de varsa ekleyelim
      integrationData.microsoftClientId = body.microsoftClientId || null
    }
    if (body.hasOwnProperty('microsoftClientSecret')) {
      integrationData.microsoftClientSecret = body.microsoftClientSecret || null
    }
    if (body.hasOwnProperty('microsoftRedirectUri')) {
      integrationData.microsoftRedirectUri = body.microsoftRedirectUri || null
    }

    // SMS entegrasyonları (body'de varsa güncelle)
    if (body.hasOwnProperty('smsEnabled')) integrationData.smsEnabled = body.smsEnabled || false
    if (body.hasOwnProperty('smsProvider')) integrationData.smsProvider = body.smsProvider || null
    if (body.hasOwnProperty('twilioAccountSid')) integrationData.twilioAccountSid = body.twilioAccountSid || null
    if (body.hasOwnProperty('twilioAuthToken')) integrationData.twilioAuthToken = body.twilioAuthToken || null
    if (body.hasOwnProperty('twilioPhoneNumber')) integrationData.twilioPhoneNumber = body.twilioPhoneNumber || null
    if (body.hasOwnProperty('smsStatus')) integrationData.smsStatus = body.smsStatus || null

    // WhatsApp entegrasyonları (body'de varsa güncelle)
    if (body.hasOwnProperty('whatsappEnabled')) integrationData.whatsappEnabled = body.whatsappEnabled || false
    if (body.hasOwnProperty('whatsappProvider')) integrationData.whatsappProvider = body.whatsappProvider || null
    if (body.hasOwnProperty('twilioWhatsappNumber')) integrationData.twilioWhatsappNumber = body.twilioWhatsappNumber || null
    if (body.hasOwnProperty('whatsappStatus')) integrationData.whatsappStatus = body.whatsappStatus || null

    // Google Calendar entegrasyonları (body'de varsa güncelle)
    if (body.hasOwnProperty('googleCalendarClientId')) integrationData.googleCalendarClientId = body.googleCalendarClientId || null
    if (body.hasOwnProperty('googleCalendarClientSecret')) integrationData.googleCalendarClientSecret = body.googleCalendarClientSecret || null
    if (body.hasOwnProperty('googleCalendarRedirectUri')) integrationData.googleCalendarRedirectUri = body.googleCalendarRedirectUri || null

    let result
    if (existing) {
      // Güncelle
      const { data, error } = await supabase
        .from('CompanyIntegration')
        .update(integrationData)
        .eq('companyId', companyId)
        .select()
        .single()

      if (error) {
        console.error('CompanyIntegration UPDATE error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    } else {
      // Yeni kayıt oluştur
      const { data, error } = await supabase
        .from('CompanyIntegration')
        .insert([integrationData])
        .select()
        .single()

      if (error) {
        console.error('CompanyIntegration INSERT error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    // Hassas bilgileri gizle (response'da gönderme)
    const response = {
      ...result,
      zoomClientSecret: result.zoomClientSecret ? '***' : null,
      googleAccessToken: result.googleAccessToken ? '***' : null,
      googleRefreshToken: result.googleRefreshToken ? '***' : null,
      microsoftAccessToken: result.microsoftAccessToken ? '***' : null,
      microsoftRefreshToken: result.microsoftRefreshToken ? '***' : null,
      microsoftClientSecret: result.microsoftClientSecret ? '***' : null,
      gmailOAuthToken: result.gmailOAuthToken ? '***' : null,
      gmailOAuthRefreshToken: result.gmailOAuthRefreshToken ? '***' : null,
      outlookOAuthToken: result.outlookOAuthToken ? '***' : null,
      outlookOAuthRefreshToken: result.outlookOAuthRefreshToken ? '***' : null,
      smtpPassword: result.smtpPassword ? '***' : null,
      resendApiKey: result.resendApiKey ? '***' : null,
      twilioAuthToken: result.twilioAuthToken ? '***' : null,
      googleCalendarClientSecret: result.googleCalendarClientSecret ? '***' : null,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('CompanyIntegration PUT exception:', error)
    return NextResponse.json(
      { error: 'Entegrasyonlar kaydedilemedi', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

