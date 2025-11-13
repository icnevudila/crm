import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
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

    const supabase = getSupabaseWithServiceRole()
    
    // Segment'leri çek
    const { data: segments, error } = await supabase
      .from('CustomerSegment')
      .select(`
        id, name, description, criteria, autoAssign, color, createdAt
      `)
      .eq('companyId', session.user.companyId)
      .order('name')

    if (error) throw error

    // Her segment için üye sayısını hesapla
    const segmentsWithMemberCount = await Promise.all(
      (segments || []).map(async (segment) => {
        const { count } = await supabase
          .from('SegmentMember')
          .select('*', { count: 'exact', head: true })
          .eq('segmentId', segment.id)

        return {
          ...segment,
          memberCount: count || 0,
        }
      })
    )

    return NextResponse.json(segmentsWithMemberCount)
  } catch (error: any) {
    console.error('Segments fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Segmentler getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('segment', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('CustomerSegment')
      .insert({
        ...body,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) throw error

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert({
        action: 'CREATE',
        entityType: 'CustomerSegment',
        entityId: data.id,
        userId: session.user.id,
        companyId: session.user.companyId,
        description: `Yeni segment oluşturuldu: ${data.name}`,
        meta: { segmentId: data.id },
      })
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Segment create error:', error)
    return NextResponse.json(
      { error: error.message || 'Segment oluşturulamadı' },
      { status: 500 }
    )
  }
}

