import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Tüm rolleri listele (sadece SUPER_ADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SUPER_ADMIN erişebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Tüm rolleri getir
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*')
      .order('name')

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 })
    }

    // Tüm modülleri getir
    const { data: modules, error: modulesError } = await supabase
      .from('Module')
      .select('*')
      .eq('isActive', true)
      .order('displayOrder')

    if (modulesError) {
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Her rolün izinlerini getir
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('RolePermission')
      .select('*')

    if (permissionsError) {
      return NextResponse.json({ error: permissionsError.message }, { status: 500 })
    }

    // Rolleri izinleriyle birleştir
    const rolesWithPermissions = (roles || []).map((role) => {
      const permissions = (rolePermissions || []).filter((p) => p.roleId === role.id)

      return {
        ...role,
        permissions: permissions.map((p) => ({
          moduleId: p.moduleId,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        })),
      }
    })

    return NextResponse.json({
      roles: rolesWithPermissions,
      modules: modules || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// Rol izinlerini güncelle
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SUPER_ADMIN erişebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { roleId, permissions } = body

    if (!roleId || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Sistem rolü kontrolü - SUPER_ADMIN izinleri değiştirilemez
    const { data: role } = await supabase
      .from('Role')
      .select('isSystemRole')
      .eq('id', roleId)
      .single()

    if (role?.isSystemRole) {
      return NextResponse.json({ error: 'System roles cannot be modified' }, { status: 400 })
    }

    // Mevcut izinleri sil
    const { error: deleteError } = await supabase
      .from('RolePermission')
      .delete()
      .eq('roleId', roleId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Yeni izinleri ekle
    if (permissions.length > 0) {
      const rolePermissions = permissions.map((p: any) => ({
        roleId,
        moduleId: p.moduleId,
        canCreate: p.canCreate || false,
        canRead: p.canRead || false,
        canUpdate: p.canUpdate || false,
        canDelete: p.canDelete || false,
      }))

      const { error: insertError } = await supabase
        .from('RolePermission')
        .insert(rolePermissions)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update role permissions' },
      { status: 500 }
    )
  }
}

