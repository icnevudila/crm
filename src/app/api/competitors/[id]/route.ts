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
    const canRead = await hasPermission('competitor', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Rakip görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('Competitor')
      .select('*')
      .eq('id', params.id)
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
      { error: error.message || 'Failed to fetch competitor' },
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
    const canUpdate = await hasPermission('competitor', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Rakip güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('Competitor')
      .update(body)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'Competitor',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated competitor: ${data.name}`,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Competitor update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update competitor' },
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
    const canDelete = await hasPermission('competitor', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Rakip silme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('Competitor')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Competitor',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted competitor`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Competitor delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete competitor' },
      { status: 500 }
    )
  }
}


