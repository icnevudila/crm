import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

export async function GET(
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

    const { id } = await params

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Normal kullanıcı sadece kendi firmasını görebilir
    if (!isSuperAdmin && id !== session.user.companyId) {
      return buildPermissionDeniedResponse('Sadece kendi firmanızı görüntüleyebilirsiniz.')
    }

    const supabase = getSupabaseWithServiceRole()

    // Company'yi ilişkili verilerle çek
    const { data: company, error } = await supabase
      .from('Company')
      .select(
        `
        *,
        User (
          id,
          name,
          email,
          role,
          createdAt
        ),
        Customer (
          id,
          name,
          email,
          phone,
          status,
          createdAt
        ),
        Deal (
          id,
          title,
          stage,
          value,
          status,
          createdAt
        ),
        Quote (
          id,
          title,
          status,
          total,
          createdAt
        ),
        Invoice (
          id,
          title,
          status,
          total,
          createdAt
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: error?.message || 'Company not found' }, { status: error ? 500 : 404 })
    }

    // ActivityLog'ları çek
    const { data: activities } = await supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('companyId', id)
      .eq('entity', 'Company')
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(company as any),
      activities: activities || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Firma bilgileri getirilemedi' },
      { status: 500 }
    )
  }
}

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

    // Sadece SuperAdmin firma düzenleyebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin firma bilgilerini güncelleyebilir.')
    }

    const { id } = await params
    const body = await request.json()

    const data = await updateRecord(
      'Company',
      id,
      body,
      `Firma güncellendi: ${body.name || id}`
    )

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Firma güncellenemedi' },
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

    // Sadece SuperAdmin firma silebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin firmaları silebilir.')
    }

    const { id } = await params

    await deleteRecord(
      'Company',
      id,
      `Firma silindi: ${id}`
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Firma silinemedi' },
      { status: 500 }
    )
  }
}



