/**
 * Outlook OAuth - Authorize Endpoint
 * Kullanıcıyı Microsoft OAuth sayfasına yönlendirir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('companies', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    // CompanyIntegration'dan Microsoft Client ID'yi al
    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('microsoftClientId, microsoftClientSecret, microsoftRedirectUri')
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    const MICROSOFT_CLIENT_ID = integration?.microsoftClientId || process.env.MICROSOFT_CLIENT_ID
    if (!MICROSOFT_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Microsoft Client ID yapılandırılmamış. Lütfen Kullanıcı Entegrasyonları sayfasından Microsoft Teams & Outlook bölümünde Client ID girin ve kaydedin.' },
        { status: 500 }
      )
    }

    // OAuth callback URL - CompanyIntegration'dan veya env'den
    const redirectUri = integration?.microsoftRedirectUri 
      || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/outlook/callback`

    // OAuth scope'ları
    const scopes = [
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
    ]

    // State: companyId ve userId'yi güvenli şekilde geçirmek için
    const state = Buffer.from(JSON.stringify({
      companyId: session.user.companyId,
      userId: session.user.id,
    })).toString('base64')

    // Microsoft OAuth URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    authUrl.searchParams.set('client_id', MICROSOFT_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('response_mode', 'query')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('prompt', 'consent') // Her zaman consent göster (refresh token için)

    // Kullanıcıyı Microsoft OAuth sayfasına yönlendir
    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error('Outlook OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'OAuth yetkilendirme başlatılamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}





