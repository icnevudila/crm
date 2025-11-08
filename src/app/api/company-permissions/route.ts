import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import { createRecord } from '@/lib/crud'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Company Permissions API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin görebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      { error: error.message || 'Failed to fetch company permissions' },
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
        console.error('Company Permissions POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin oluşturabilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      { error: error.message || 'Failed to create company permission' },
      { status: 500 }
    )
  }
}


