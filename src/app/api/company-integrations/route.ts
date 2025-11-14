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

    // Sadece Admin ve SuperAdmin görebilir
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId

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

    // Sadece Admin ve SuperAdmin güncelleyebilir
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
    const companyId = session.user.companyId

    // Mevcut kaydı kontrol et
    const { data: existing } = await supabase
      .from('CompanyIntegration')
      .select('id')
      .eq('companyId', companyId)
      .maybeSingle()

    const integrationData: any = {
      companyId,
      // Video meeting entegrasyonları
      zoomEnabled: body.zoomEnabled || false,
      zoomAccountId: body.zoomAccountId || null,
      zoomClientId: body.zoomClientId || null,
      zoomClientSecret: body.zoomClientSecret || null,
      googleEnabled: body.googleEnabled || false,
      googleAccessToken: body.googleAccessToken || null,
      microsoftEnabled: body.microsoftEnabled || false,
      microsoftAccessToken: body.microsoftAccessToken || null,
      // E-posta entegrasyonları
      gmailEnabled: body.gmailEnabled || false,
      outlookEnabled: body.outlookEnabled || false,
      smtpEnabled: body.smtpEnabled || false,
      smtpHost: body.smtpHost || null,
      smtpPort: body.smtpPort || null,
      smtpUser: body.smtpUser || null,
      smtpPassword: body.smtpPassword || null,
      smtpFromEmail: body.smtpFromEmail || null,
      smtpFromName: body.smtpFromName || null,
      emailProvider: body.emailProvider || null,
      updatedAt: new Date().toISOString(),
    }

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
      microsoftAccessToken: result.microsoftAccessToken ? '***' : null,
      gmailOAuthToken: result.gmailOAuthToken ? '***' : null,
      gmailOAuthRefreshToken: result.gmailOAuthRefreshToken ? '***' : null,
      outlookOAuthToken: result.outlookOAuthToken ? '***' : null,
      outlookOAuthRefreshToken: result.outlookOAuthRefreshToken ? '***' : null,
      smtpPassword: result.smtpPassword ? '***' : null,
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

