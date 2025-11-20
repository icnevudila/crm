import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { buildPermissionDeniedResponse } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const requestedCompanyId = searchParams.get('companyId')

    // SuperAdmin tüm şirketlerin kullanıcılarını görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = requestedCompanyId ?? session.user.companyId
    
    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('User')
      .select('id, name, email, role, companyId, createdAt')
      .order('name')

    query = query.not('companyId', 'is', null)

    if (isSuperAdmin) {
      if (requestedCompanyId) {
        query = query.eq('companyId', companyId)
      } else {
        query = query.not('companyId', 'is', null)
      }
    } else {
      query = query.eq('companyId', companyId).neq('role', 'SUPER_ADMIN')
    }

    if (role) {
      if (role === 'SUPER_ADMIN' && !isSuperAdmin) {
        query = query.eq('role', 'USER') // yetkisi yoksa hiç sonuç döndürme
      } else {
        query = query.eq('role', role)
      }
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
      { error: error.message || 'Kullanıcı listesi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN: Herhangi bir Company'ye Admin veya User ekleyebilir
    // ADMIN: Sadece kendi Company'sine User ekleyebilir (Admin ekleyemez)
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = session.user.role === 'ADMIN'

    if (!isSuperAdmin) {
      return buildPermissionDeniedResponse('Kullanıcı yönetimi için gerekli yetkiniz bulunmuyor.')
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // ADMIN sadece USER rolünde kullanıcı ekleyebilir (Admin ekleyemez)
    const targetCompanyId = isSuperAdmin && body.companyId ? body.companyId : session.user.companyId

    // Limitasyon kontrolleri
    if (targetCompanyId) {
      // Kurumun mevcut kullanıcı sayısını kontrol et
      const { count: currentUserCount } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', targetCompanyId)
        .neq('role', 'SUPER_ADMIN')

      // Kurum limitasyonlarını kontrol et
      const { data: company } = await supabase
        .from('Company')
        .select('maxUsers, adminUserLimit')
        .eq('id', targetCompanyId)
        .single()

      if (company) {
        // maxUsers kontrolü
        if (company.maxUsers !== null && currentUserCount !== null && currentUserCount >= company.maxUsers) {
          return NextResponse.json(
            { error: 'Limit aşıldı', message: `Bu kurumun maksimum kullanıcı sayısı ${company.maxUsers}. Mevcut kullanıcı sayısı: ${currentUserCount}` },
            { status: 403 }
          )
        }

        // Admin kullanıcı limiti kontrolü (sadece ADMIN rolü için)
        if (body.role === 'ADMIN' && company.adminUserLimit !== null) {
          const { count: adminCount } = await supabase
            .from('User')
            .select('*', { count: 'exact', head: true })
            .eq('companyId', targetCompanyId)
            .eq('role', 'ADMIN')

          if (adminCount !== null && adminCount >= company.adminUserLimit) {
            return NextResponse.json(
              { error: 'Admin limiti aşıldı', message: `Bu kurumun maksimum admin sayısı ${company.adminUserLimit}. Mevcut admin sayısı: ${adminCount}` },
              { status: 403 }
            )
          }
        }
      }
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(body.password, 10)

    const { data: user, error } = await supabase
      .from('User')
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
      { error: error.message || 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    )
  }
}
