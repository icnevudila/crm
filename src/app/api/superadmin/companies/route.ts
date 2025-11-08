import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Tüm kurumları listele (sadece SUPER_ADMIN)
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

    // Tüm kurumları getir
    const { data: companies, error: companiesError } = await supabase
      .from('Company')
      .select('*')
      .order('name')

    if (companiesError) {
      return NextResponse.json({ error: companiesError.message }, { status: 500 })
    }

    // Her kurumun modül izinlerini getir
    const { data: modules, error: modulesError } = await supabase
      .from('Module')
      .select('*')
      .eq('isActive', true)
      .order('displayOrder')

    if (modulesError) {
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Her kurumun modül izinlerini getir
    const { data: companyModulePermissions, error: permissionsError } = await supabase
      .from('CompanyModulePermission')
      .select('*')

    if (permissionsError) {
      return NextResponse.json({ error: permissionsError.message }, { status: 500 })
    }

    // Kurumları modül izinleriyle birleştir
    const companiesWithPermissions = (companies || []).map((company) => {
      const permissions = (companyModulePermissions || [])
        .filter((p) => p.companyId === company.id)
        .map((p) => p.moduleId)

      return {
        ...company,
        moduleIds: permissions,
        modules: modules?.filter((m) => permissions.includes(m.id)) || [],
      }
    })

    return NextResponse.json({
      companies: companiesWithPermissions,
      modules: modules || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// Kurum modül izinlerini güncelle
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
    const { companyId, moduleIds } = body

    if (!companyId || !Array.isArray(moduleIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Mevcut izinleri sil
    const { error: deleteError } = await supabase
      .from('CompanyModulePermission')
      .delete()
      .eq('companyId', companyId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Yeni izinleri ekle
    if (moduleIds.length > 0) {
      const permissions = moduleIds.map((moduleId: string) => ({
        companyId,
        moduleId,
        enabled: true,
      }))

      const { error: insertError } = await supabase
        .from('CompanyModulePermission')
        .insert(permissions)

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update company permissions' },
      { status: 500 }
    )
  }
}

