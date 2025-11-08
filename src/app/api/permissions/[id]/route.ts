import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'
import { updateRecord } from '@/lib/crud'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Admin veya SuperAdmin kontrolü
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: permission, error } = await supabase
      .from('UserPermission')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error || !permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch permission' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin veya SuperAdmin kontrolü
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabase()

    // Önce mevcut yetkiyi kontrol et
    const { data: existing } = await supabase
      .from('UserPermission')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // updateRecord kullanarak tip sorununu bypass ediyoruz
    const permission = await updateRecord(
      'UserPermission',
      id,
      {
        ...body,
        updatedAt: new Date().toISOString(),
      },
      `Yetki güncellendi: ${(existing as any).module}`
    )

    if (!permission) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    // ActivityLog
    const { logAction } = await import('@/lib/logger')
    await logAction({
      entity: 'UserPermission',
      action: 'UPDATE',
      description: `Yetki güncellendi: ${(permission as any).module}`,
      meta: { entity: 'UserPermission', action: 'update', id: (permission as any).id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json(permission)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update permission' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin veya SuperAdmin kontrolü
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Önce mevcut yetkiyi kontrol et
    const { data: existing } = await supabase
      .from('UserPermission')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('UserPermission')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    const { logAction } = await import('@/lib/logger')
    await logAction({
      entity: 'UserPermission',
      action: 'DELETE',
      description: `Yetki silindi: ${(existing as any).module}`,
      meta: { entity: 'UserPermission', action: 'delete', id },
      userId: session.user.id,
      companyId: session.user.companyId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete permission' },
      { status: 500 }
    )
  }
}


