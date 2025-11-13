import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'
import { createRecord } from '@/lib/crud'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

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

    // Sadece SuperAdmin görebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin şirket izinlerini görüntüleyebilir.')
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const feature = searchParams.get('feature')

    const supabase = getSupabase()

    let query = supabase.from('CompanyPermission').select('*')

    if (companyId) {
      query = query.eq('companyId', companyId)
    }

    if (feature) {
      query = query.eq('feature', feature)
    }

    const { data: permissions, error } = await query.order('companyId')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(permissions || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kurum yetkileri getirilemedi' },
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

    // Sadece SuperAdmin oluşturabilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin şirket izinlerini yönetebilir.')
    }

    const body = await request.json()
    const supabase = getSupabase()

    // Company'nin var olduğunu kontrol et
    if (body.companyId) {
      const { data: company } = await supabase
        .from('Company')
        .select('id')
        .eq('id', body.companyId)
        .single()

      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 })
      }
    }

    // createRecord kullanarak tip sorununu bypass ediyoruz
    const permission = await createRecord(
      'CompanyPermission',
      body,
      `Şirket yetkisi oluşturuldu: ${body.feature}`
    )

    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kurum yetkisi oluşturulamadı' },
      { status: 500 }
    )
  }
}


