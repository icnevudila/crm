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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('SalesQuota')
      .select('*, user:User(id, name, email)')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Quota not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Quota fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quota' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('SalesQuota')
      .update({
        userId: body.userId,
        targetRevenue: body.targetRevenue,
        period: body.period,
        startDate: body.startDate,
        endDate: body.endDate,
      })
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'SalesQuota',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated sales quota`,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Quota update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update quota' },
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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('SalesQuota')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'SalesQuota',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted sales quota`,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Quota delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete quota' },
      { status: 500 }
    )
  }
}


