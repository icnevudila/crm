import { NextResponse } from 'next/server'
import { loginWithCredentials } from '@/lib/auth-supabase'
import { createServerSupabase } from '@/lib/auth-supabase'
import { cookies } from 'next/headers'

// Supabase Auth ile login endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      )
    }

    // Credentials ile login yap
    const result = await loginWithCredentials(email, password)

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Giriş başarısız oldu' },
        { status: 401 }
      )
    }

    // Supabase Auth session oluştur
    const supabase = await createServerSupabase()
    
    // Custom token oluştur (Supabase JWT kullanarak)
    // NOT: Supabase Auth normalde email/password ile çalışır, ama biz User tablosunu kullanıyoruz
    // Bu yüzden custom session oluşturuyoruz
    
    // Session bilgisini cookie'ye kaydet
    const cookieStore = await cookies()
    const sessionData = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      companyId: result.user.companyId,
      companyName: result.user.companyName,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
    }

    // Cookie'ye session bilgisini kaydet
    cookieStore.set('crm_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 gün
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}


