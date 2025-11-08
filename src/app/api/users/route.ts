import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Users GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const requestedCompanyId = searchParams.get('companyId')

    // SuperAdmin tüm şirketlerin kullanıcılarını görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = isSuperAdmin && requestedCompanyId ? requestedCompanyId : session.user.companyId
    
    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('User')
      .select('id, name, email, role, companyId, createdAt')
      .eq('companyId', companyId)
      .order('name')

    if (role) {
      query = query.eq('role', role)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ULTRA AGRESİF cache headers - 30 dakika cache (tek tıkla açılmalı)
    return NextResponse.json(users || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Users POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN: Herhangi bir Company'ye Admin veya User ekleyebilir
    // ADMIN: Sadece kendi Company'sine User ekleyebilir (Admin ekleyemez)
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = session.user.role === 'ADMIN'

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // ADMIN sadece USER rolünde kullanıcı ekleyebilir (Admin ekleyemez)
    if (isAdmin && body.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Admin rolünde kullanıcı ekleyemezsiniz. Sadece SuperAdmin Admin ekleyebilir.' },
        { status: 403 }
      )
    }

    // SUPER_ADMIN herhangi bir Company'ye kullanıcı ekleyebilir
    // ADMIN sadece kendi Company'sine kullanıcı ekleyebilir
    const targetCompanyId = isSuperAdmin && body.companyId ? body.companyId : session.user.companyId

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(body.password, 10)

    const { data: user, error } = await supabase
      .from('User')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([
        {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: body.role || 'USER',
          companyId: targetCompanyId,
        },
      ])
      .select('id, name, email, role, companyId, createdAt')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    const { logAction } = await import('@/lib/logger')
    await logAction({
      entity: 'User',
      action: 'CREATE',
      description: `Kullanıcı oluşturuldu: ${(user as any)?.name || 'Unknown'}`,
      meta: { entity: 'User', action: 'create', id: (user as any)?.id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
