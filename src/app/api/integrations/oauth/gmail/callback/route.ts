/**
 * Gmail OAuth - Callback Endpoint
 * Google'dan dönen authorization code ile access token alır
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=unauthorized`
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=missing_code`
      )
    }

    // State'ten companyId ve userId'yi al
    let stateData: { companyId: string; userId: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (parseError) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=invalid_state`
      )
    }

    // Session kontrolü - state'teki userId ile eşleşmeli
    if (session?.user?.id !== stateData.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=user_mismatch`
      )
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=config_missing`
      )
    }

    // Redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/gmail/callback`

    // Access token al
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}))
      console.error('Gmail token exchange error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=token_exchange_failed`
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    if (!access_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=no_access_token`
      )
    }

    // Expires at hesapla
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null

    const supabase = getSupabaseWithServiceRole()

    // CompanyIntegration kaydını güncelle veya oluştur (mevcut sistem için)
    const { data: existingCompanyIntegration } = await supabase
      .from('CompanyIntegration')
      .select('id')
      .eq('companyId', stateData.companyId)
      .maybeSingle()

    const companyUpdateData: any = {
      gmailOAuthToken: access_token,
      gmailOAuthRefreshToken: refresh_token || null,
      gmailOAuthTokenExpiresAt: expiresAt,
      gmailEnabled: true,
      emailProvider: 'GMAIL',
      emailStatus: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }

    if (existingCompanyIntegration) {
      await supabase
        .from('CompanyIntegration')
        .update(companyUpdateData)
        .eq('id', existingCompanyIntegration.id)
    } else {
      await supabase
        .from('CompanyIntegration')
        .insert({
          ...companyUpdateData,
          companyId: stateData.companyId,
        })
    }

    // UserIntegration kaydını güncelle veya oluştur (yeni sistem için)
    const { data: existingUserIntegration } = await supabase
      .from('UserIntegration')
      .select('id')
      .eq('userId', stateData.userId)
      .eq('companyId', stateData.companyId)
      .eq('integrationType', 'GOOGLE_EMAIL')
      .maybeSingle()

    if (existingUserIntegration) {
      // Güncelle
      await supabase
        .from('UserIntegration')
        .update({
          accessToken: access_token,
          refreshToken: refresh_token || null,
          tokenExpiresAt: expiresAt,
          status: 'ACTIVE',
          lastError: null,
        })
        .eq('id', existingUserIntegration.id)
    } else {
      // Yeni kayıt oluştur
      await supabase
        .from('UserIntegration')
        .insert({
          userId: stateData.userId,
          companyId: stateData.companyId,
          integrationType: 'GOOGLE_EMAIL',
          accessToken: access_token,
          refreshToken: refresh_token || null,
          tokenExpiresAt: expiresAt,
          status: 'ACTIVE',
        })
    }

    // Başarılı - user-integrations sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/user-integrations?success=gmail_connected`
    )
  } catch (error: any) {
    console.error('Gmail OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=callback_error`
    )
  }
}



