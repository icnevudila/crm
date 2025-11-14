/**
 * Gmail OAuth - Authorize Endpoint
 * Kullanıcıyı Google OAuth sayfasına yönlendirir
 */

import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

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

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Google Client ID yapılandırılmamış' },
        { status: 500 }
      )
    }

    // OAuth callback URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/oauth/gmail/callback`

    // OAuth scope'ları
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // State: companyId ve userId'yi güvenli şekilde geçirmek için
    const state = Buffer.from(JSON.stringify({
      companyId: session.user.companyId,
      userId: session.user.id,
    })).toString('base64')

    // Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline') // Refresh token almak için
    authUrl.searchParams.set('prompt', 'consent') // Her zaman consent göster (refresh token için)
    authUrl.searchParams.set('state', state)

    // Kullanıcıyı Google OAuth sayfasına yönlendir
    return NextResponse.redirect(authUrl.toString())
  } catch (error: any) {
    console.error('Gmail OAuth authorize error:', error)
    return NextResponse.json(
      { error: 'OAuth yetkilendirme başlatılamadı', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}



