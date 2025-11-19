/**
 * Google Calendar OAuth Authorization API
 * Google Calendar entegrasyonu için OAuth authorization URL'i döner
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
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CompanyIntegration'dan Google Calendar Client ID'yi al
    const supabase = getSupabaseWithServiceRole()
    const { data: integration } = await supabase
      .from('CompanyIntegration')
      .select('googleCalendarClientId, googleCalendarClientSecret, googleCalendarRedirectUri')
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    const clientId = integration?.googleCalendarClientId || process.env.GOOGLE_CLIENT_ID
    const redirectUri = integration?.googleCalendarRedirectUri 
      || process.env.GOOGLE_CALENDAR_REDIRECT_URI 
      || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/google-calendar/callback`

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID yapılandırılmamış. Lütfen Kullanıcı Entegrasyonları sayfasından Google Calendar bölümünde Client ID girin ve kaydedin.' },
        { status: 500 }
      )
    }

    // OAuth scopes - Google Calendar için gerekli izinler
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ]

    // State - CSRF koruması için kullanıcı ID'sini ekle
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        companyId: session.user.companyId,
      })
    ).toString('base64')

    // Google OAuth authorization URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Refresh token almak için
      prompt: 'consent', // Her zaman consent göster (refresh token için)
      state,
    })}`

    // Kullanıcıyı Google OAuth sayfasına yönlendir
    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error('Google Calendar authorize error:', error)
    return NextResponse.json(
      { error: 'Authorization URL oluşturulamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



