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
    const canRead = await hasPermission('segment', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()
    
    // Segment'i çek
    const { data, error } = await supabase
      .from('CustomerSegment')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    // Üye sayısını ve üyeleri çek
    const { count } = await supabase
      .from('SegmentMember')
      .select('*', { count: 'exact', head: true })
      .eq('segmentId', id)

    const { data: membersData } = await supabase
      .from('SegmentMember')
      .select(`
        id,
        customerId,
        addedAt,
        Customer (
          id,
          name,
          email,
          phone,
          status
        )
      `)
      .eq('segmentId', id)
      .order('addedAt', { ascending: false })

    // members array'ini formatla (detay sayfası için)
    const members = (membersData || []).map((member: any) => ({
      id: member.id,
      customerId: member.customerId,
      joinedAt: member.addedAt,
      customer: member.Customer ? {
        name: member.Customer.name,
        email: member.Customer.email,
        phone: member.Customer.phone,
        status: member.Customer.status,
      } : null,
    }))

    return NextResponse.json({
      ...data,
      memberCount: count || 0,
      members: members || [],
    })
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('segment', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('segment', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
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


