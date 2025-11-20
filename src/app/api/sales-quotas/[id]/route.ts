import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    const { data, error } = await supabase
      .from('SalesQuota')
      .select(`
        *,
        user:User!SalesQuota_userId_fkey(id, name, email, role)
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Sales quota fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales quota' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Check if quota exists
    const { data: existing } = await supabase
      .from('SalesQuota')
      .select('id')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('SalesQuota')
      .update({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'SalesQuota',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Updated sales quota for ${data.period} ${data.year}`,
      meta: { quotaId: data.id, changes: body },
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Sales quota update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update sales quota' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Check if quota exists
    const { data: existing } = await supabase
      .from('SalesQuota')
      .select('id, period, year')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Sales quota not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('SalesQuota')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'SalesQuota',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Deleted sales quota for ${existing.period} ${existing.year}`,
      meta: { quotaId: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Sales quota delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete sales quota' },
      { status: 500 }
    )
  }
}
