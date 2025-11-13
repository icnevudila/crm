import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('competitor', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .select('*')
      .eq('id', (await params).id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitor fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip bilgisi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
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

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('competitor', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()
    const { id } = await params

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .update(body)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'Competitor',
      entityId: id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated competitor: ${data.name}`,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitor update error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
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

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('competitor', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    const { error } = await supabase
      .from('Competitor')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Competitor',
      entityId: id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted competitor`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Competitor delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip silinemedi' },
      { status: 500 }
    )
  }
}


