import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

/**
 * Segment üyelerini yönetme endpoint'leri
 * GET: Segment üyelerini listele
 * POST: Segment'e müşteri ekle
 * DELETE: Segment'ten müşteri çıkar
 */

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
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('segment', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const segmentId = params.id

    // Segment'in var olduğunu kontrol et
    const { data: segment } = await supabase
      .from('CustomerSegment')
      .select('id, name')
      .eq('id', segmentId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!segment) {
      return NextResponse.json({ error: 'Segment bulunamadı' }, { status: 404 })
    }

    // Segment üyelerini çek
    const { data: members, error } = await supabase
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
          company
        )
      `)
      .eq('segmentId', segmentId)
      .order('addedAt', { ascending: false })

    if (error) throw error

    return NextResponse.json(members || [])
  } catch (error: any) {
    console.error('Segment members fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Segment üyeleri getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü (üye ekleme update sayılır)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('segment', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()
    const { customerId } = body

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId alanı zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const segmentId = params.id

    // Segment'in var olduğunu kontrol et
    const { data: segment } = await supabase
      .from('CustomerSegment')
      .select('id, name')
      .eq('id', segmentId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    // Customer'ın var olduğunu kontrol et
    const { data: customer } = await supabase
      .from('Customer')
      .select('id, name')
      .eq('id', customerId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // Zaten üye mi kontrol et
    const { data: existingMember } = await supabase
      .from('SegmentMember')
      .select('id')
      .eq('segmentId', segmentId)
      .eq('customerId', customerId)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Bu müşteri segmentte zaten kayıtlı' },
        { status: 400 }
      )
    }

    // Üyeyi ekle
    const { data: member, error } = await supabase
      .from('SegmentMember')
      .insert({
        segmentId,
        customerId,
        addedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'UPDATE',
        entityType: 'CustomerSegment',
        entityId: segmentId,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Müşteri segment'e eklendi: ${customer.name} → ${segment.name}`,
        meta: { segmentId, customerId, action: 'add_member' },
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error: any) {
    console.error('Segment member add error:', error)
    return NextResponse.json(
      { error: error.message || 'Segment üyesi eklenemedi' },
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

    // Permission check - canUpdate kontrolü (üye çıkarma update sayılır)
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('segment', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId sorgu parametresi zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const segmentId = params.id

    // Segment ve Customer bilgilerini çek (ActivityLog için)
    const { data: segment } = await supabase
      .from('CustomerSegment')
      .select('id, name')
      .eq('id', segmentId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!segment) {
      return NextResponse.json({ error: 'Segment bulunamadı' }, { status: 404 })
    }

    const { data: customer } = await supabase
      .from('Customer')
      .select('id, name')
      .eq('id', customerId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // Üyeyi çıkar
    const { error } = await supabase
      .from('SegmentMember')
      .delete()
      .eq('segmentId', segmentId)
      .eq('customerId', customerId)

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'UPDATE',
        entityType: 'CustomerSegment',
        entityId: segmentId,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Müşteri segment'ten çıkarıldı: ${customer.name} ← ${segment.name}`,
        meta: { segmentId, customerId, action: 'remove_member' },
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Segment member remove error:', error)
    return NextResponse.json(
      { error: error.message || 'Segment üyesi çıkarılamadı' },
      { status: 500 }
    )
  }
}



