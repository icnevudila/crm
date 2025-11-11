import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('segment', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Segment görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('CustomerSegment')
      .select('*, members:SegmentMember(count)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Segment fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch segment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('segment', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Segment güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    
    // Mevcut segment'i çek (ActivityLog için)
    const { data: existingSegment } = await supabase
      .from('CustomerSegment')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    const body = await request.json()

    const { data, error } = await supabase
      .from('CustomerSegment')
      .update(body)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'UPDATE',
        entityType: 'CustomerSegment',
        entityId: id,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Segment güncellendi: ${body.name || existingSegment?.name || id}`,
        meta: { segmentId: id },
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Segment update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update segment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canDelete = await hasPermission('segment', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Segment silme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    
    // Mevcut segment'i çek (ActivityLog için)
    const { data: existingSegment } = await supabase
      .from('CustomerSegment')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    const { error } = await supabase
      .from('CustomerSegment')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'DELETE',
        entityType: 'CustomerSegment',
        entityId: id,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Segment silindi: ${existingSegment?.name || id}`,
        meta: { segmentId: id },
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Segment delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete segment' },
      { status: 500 }
    )
  }
}


