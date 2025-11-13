import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

// Tüm kullanıcıları listele (sadece SUPER_ADMIN)
export async function GET() {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SUPER_ADMIN erişebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Bu endpoint sadece SuperAdmin tarafından kullanılabilir.')
    }

    const supabase = getSupabaseWithServiceRole()

    // Tüm kullanıcıları getir (şirket ve rol bilgileriyle)
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        role,
        companyId,
        roleId,
        createdAt,
        Company:companyId (
          id,
          name
        ),
        Role:roleId (
          id,
          code,
          name
        )
      `)
      .order('name')

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Tüm şirketleri getir
    const { data: companies, error: companiesError } = await supabase
      .from('Company')
      .select('*')
      .order('name')

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    // Tüm rolleri getir
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*')
      .order('name')

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    return NextResponse.json({
      users: users || [],
      companies: companies || [],
      roles: roles || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kullanıcı listesi getirilemedi' },
      { status: 500 }
    )
  }
}

// Kullanıcı rolünü güncelle
export async function PUT(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SUPER_ADMIN erişebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Bu endpoint sadece SuperAdmin tarafından kullanılabilir.')
    }

    const body = await request.json()
    const { userId, roleId, companyId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Güncelleme verisi
    const updateData: any = {}
    if (roleId !== undefined) {
      updateData.roleId = roleId
      // Role tablosundan role code'unu al ve User.role'ü güncelle
      if (roleId) {
        const { data: role } = await supabase
          .from('Role')
          .select('code')
          .eq('id', roleId)
          .single()

        if (role) {
          updateData.role = role.code
        }
      }
    }
    if (companyId !== undefined) {
      updateData.companyId = companyId
    }

    const { error: updateError } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kullanıcı güncellenemedi' },
      { status: 500 }
    )
  }
}

