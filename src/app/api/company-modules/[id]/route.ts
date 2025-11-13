import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin güncelleyebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin modül izinlerini güncelleyebilir.')
    }

    const { id } = await params
    const body = await request.json()

    const supabase = getSupabaseWithServiceRole()

    const updateData = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('CompanyModule') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Modül güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin silebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin modül izinlerini silebilir.')
    }

    const { id } = await params

    const supabase = getSupabaseWithServiceRole()

    // Supabase database type tanımları eksik, CompanyModule tablosu için type tanımı yok
    const { error } = await (supabase
      .from('CompanyModule') as any)
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Modül silinemedi' },
      { status: 500 }
    )
  }
}


