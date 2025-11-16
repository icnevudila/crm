/**
 * Google Calendar OAuth Callback API
 * Google Calendar OAuth callback'ini işler ve token'ları kaydeder
 */

import { NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Hata kontrolü
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=missing_code_or_state`
      )
    }

    // State'den kullanıcı bilgilerini çıkar
    let userId: string
    let companyId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
      companyId = stateData.companyId
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=invalid_state`
      )
    }

    // Google OAuth token exchange
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/oauth/google-calendar/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=missing_credentials`
      )
    }

    // Token exchange
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=${encodeURIComponent(errorData.error || 'token_exchange_failed')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    // UserIntegration tablosuna kaydet
    const supabase = getSupabaseWithServiceRole()
    
    // Önce mevcut entegrasyonu kontrol et
    const { data: existingIntegration } = await supabase
      .from('UserIntegration')
      .select('id')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .eq('integrationType', 'GOOGLE_CALENDAR')
      .maybeSingle()

    if (existingIntegration) {
      // Güncelle
      await supabase
        .from('UserIntegration')
        .update({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiresAt: expiresAt.toISOString(),
          status: 'ACTIVE',
          lastError: null,
        })
        .eq('id', existingIntegration.id)
    } else {
      // Yeni kayıt oluştur
      await supabase.from('UserIntegration').insert({
        userId,
        companyId,
        integrationType: 'GOOGLE_CALENDAR',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: expiresAt.toISOString(),
        status: 'ACTIVE',
      })
    }

    // Başarılı - user-integrations sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user-integrations?success=google_calendar_connected`
    )
  } catch (error: any) {
    console.error('Google Calendar callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings/integrations?error=${encodeURIComponent(error?.message || 'unknown_error')}`
    )
  }
}

