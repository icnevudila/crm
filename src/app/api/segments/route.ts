import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
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
      .select(`
        id, name, description, criteria, autoAssign, color, memberCount, createdAt
      `)
      .eq('companyId', session.user.companyId)
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Segments fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canCreate = await hasPermission('segment', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Segment oluşturma yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

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
      { error: error.message || 'Failed to create segment' },
      { status: 500 }
    )
  }
}

