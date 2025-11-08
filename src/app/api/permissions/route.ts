import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import { createRecord } from '@/lib/crud'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const moduleName = searchParams.get('module')

    const supabase = getSupabase()

    // SUPER_ADMIN: Tüm şirketlerin yetkilerini görebilir
    // ADMIN: Sadece kendi Company'sinin yetkilerini görebilir ve yönetebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('UserPermission')
      .select('*')

    // SUPER_ADMIN: Herhangi bir Company'nin yetkilerini görebilir (companyId parametresi ile)
    // ADMIN: Sadece kendi Company'sinin yetkilerini görebilir
    const requestedCompanyId = searchParams.get('companyId')
    const targetCompanyId = isSuperAdmin && requestedCompanyId ? requestedCompanyId : session.user.companyId
    
    query = query.eq('companyId', targetCompanyId)

    if (userId) {
      query = query.eq('userId', userId)
    }

    if (moduleName) {
      query = query.eq('module', moduleName)
    }

    const { data: permissions, error } = await query.order('module')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(permissions || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN: Herhangi bir Company'nin yetkilerini yönetebilir
    // ADMIN: Sadece kendi Company'sinin yetkilerini yönetebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = session.user.role === 'ADMIN'
    
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const supabase = getSupabase()

    // SUPER_ADMIN: Herhangi bir Company'nin kullanıcısına yetki verebilir
    // ADMIN: Sadece kendi Company'sinin kullanıcısına yetki verebilir
    const targetCompanyId = isSuperAdmin && body.companyId ? body.companyId : session.user.companyId

    // Kullanıcının hedef şirkette olduğunu kontrol et
    if (body.userId) {
      const { data: user } = await supabase
        .from('User')
        .select('companyId')
        .eq('id', body.userId)
        .single()

      const userData = user as any
      if (!user || userData.companyId !== targetCompanyId) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Kullanıcı bu şirkete ait değil' },
          { status: 403 }
        )
      }
    }

    // createRecord kullanarak tip sorununu bypass ediyoruz
    const permission = await createRecord(
      'UserPermission',
      {
        ...body,
        companyId: targetCompanyId,
      },
      `Yetki oluşturuldu: ${body.module}`
    )

    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create permission' },
      { status: 500 }
    )
  }
}


