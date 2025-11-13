import { NextResponse } from 'next/server'

import { getSafeSession } from '@/lib/safe-session'

// Test endpoint - NextAuth'un çalışıp çalışmadığını kontrol et
export async function GET() {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
        }
      } : null,
      message: 'NextAuth çalışıyor'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// Test login endpoint - direkt authorize çağır
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email ve password gereklidir'
      }, { status: 400 })
    }

    // Direkt authorize fonksiyonunu çağır
    const { providers } = authOptions
    const credentialsProvider = providers?.find((p: any) => p.id === 'credentials')
    
    if (!credentialsProvider) {
      return NextResponse.json({
        success: false,
        error: 'Credentials provider bulunamadı'
      }, { status: 500 })
    }

    // Authorize fonksiyonunu çağır
    const user = await (credentialsProvider as any).authorize({
      email,
      password,
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Kullanıcı bulunamadı veya şifre hatalı'
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      message: 'Login başarılı (test endpoint)'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}


