import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'
import { updateRecord } from '@/lib/crud'
import { buildPermissionDeniedResponse } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const supabase = getSupabase()

    const { data: permission, error } = await supabase
      .from('CompanyPermission')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kurum yetkisi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin güncelleyebilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return buildPermissionDeniedResponse('Sadece SuperAdmin şirket izinlerini güncelleyebilir.')
    }

    const { id } = await params
    const body: any = await request.json()
    const supabase = getSupabase()

    // updateRecord kullanarak tip sorununu bypass ediyoruz
    const permission = await updateRecord(
      'CompanyPermission',
      id,
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      `Şirket yetkisi güncellendi`
    )

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // updateRecord zaten ActivityLog kaydı yapıyor
    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kurum yetkisi güncellenemedi' },
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
      return buildPermissionDeniedResponse('Sadece SuperAdmin şirket izinlerini silebilir.')
    }

    const { id } = await params
    const supabase = getSupabase()

    // Önce mevcut yetkiyi kontrol et
    const { data: existing } = await supabase
      .from('CompanyPermission')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    const existingPermission = existing as any

    const { error } = await supabase.from('CompanyPermission').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    const { logAction } = await import('@/lib/logger')
    await logAction({
      entity: 'CompanyPermission',
      action: 'DELETE',
      description: `Şirket yetkisi silindi: ${existingPermission.feature}`,
      meta: { entity: 'CompanyPermission', action: 'delete', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Kurum yetkisi silinemedi' },
      { status: 500 }
    )
  }
}


