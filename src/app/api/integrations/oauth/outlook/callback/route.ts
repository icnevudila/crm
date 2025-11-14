/**
 * Outlook OAuth - Callback Endpoint
 * Microsoft'dan dönen authorization code ile access token alır
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

    const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID
    const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET

    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=config_missing`
      )
    }

    // Redirect URI
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/outlook/callback`

    // Access token al
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}))
      console.error('Outlook token exchange error:', error)
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

    // CompanyIntegration kaydını güncelle veya oluştur
    const supabase = getSupabaseWithServiceRole()
    const { data: existingIntegration } = await supabase
      .from('CompanyIntegration')
      .select('id')
      .eq('companyId', stateData.companyId)
      .maybeSingle()

    const updateData: any = {
      outlookOAuthToken: access_token,
      outlookOAuthRefreshToken: refresh_token || null,
      outlookOAuthTokenExpiresAt: expiresAt,
      outlookEnabled: true,
      emailProvider: 'OUTLOOK',
      emailStatus: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }

    let result
    if (existingIntegration) {
      result = await supabase
        .from('CompanyIntegration')
        .update(updateData)
        .eq('id', existingIntegration.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('CompanyIntegration')
        .insert({
          ...updateData,
          companyId: stateData.companyId,
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('CompanyIntegration save error:', result.error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=save_failed`
      )
    }

    // Başarılı - settings sayfasına yönlendir
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?email_connected=outlook`
    )
  } catch (error: any) {
    console.error('Outlook OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=callback_error`
    )
  }
}



