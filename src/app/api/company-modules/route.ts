import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin görebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('CompanyModule') as any)
      .select('*')
      .eq('companyId', companyId)
      .order('module', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch company modules' },
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

    // SUPER_ADMIN: Herhangi bir Company'nin modüllerini yönetebilir
    // ADMIN: Sadece kendi Company'sinin modüllerini görebilir (yönetemez - SuperAdmin yapar)
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Sadece SuperAdmin modül yönetimi yapabilir' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyId, module, enabled = true } = body

    if (!companyId || !module) {
      return NextResponse.json(
        { error: 'companyId and module are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Upsert - varsa güncelle, yoksa oluştur
    const upsertData = {
      companyId,
      module,
      enabled,
      updatedAt: new Date().toISOString(),
    }

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('CompanyModule') as any)
      .upsert(upsertData, {
        onConflict: 'companyId,module',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create/update company module' },
      { status: 500 }
    )
  }
}


