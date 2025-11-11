import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { data, error } = await supabase
      .from('CustomerSegment')
      .select('*, members:SegmentMember(count)')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
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

    // Mevcut segment'i çek (ActivityLog için)
    const { data: existingSegment } = await supabase
      .from('CustomerSegment')
      .select('name')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    const body = await request.json()

    const { data, error } = await supabase
      .from('CustomerSegment')
      .update(body)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'UPDATE',
        entityType: 'CustomerSegment',
        entityId: params.id,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Segment güncellendi: ${body.name || existingSegment?.name || params.id}`,
        meta: { segmentId: params.id },
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
  { params }: { params: { id: string } }
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

    // Mevcut segment'i çek (ActivityLog için)
    const { data: existingSegment } = await supabase
      .from('CustomerSegment')
      .select('name')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    const { error } = await supabase
      .from('CustomerSegment')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'DELETE',
        entityType: 'CustomerSegment',
        entityId: params.id,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Segment silindi: ${existingSegment?.name || params.id}`,
        meta: { segmentId: params.id },
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


