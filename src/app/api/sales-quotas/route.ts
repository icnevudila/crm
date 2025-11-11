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
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const period = searchParams.get('period')
    const year = searchParams.get('year')

    let query = supabase
      .from('SalesQuota')
      .select(`
        id, period, year, month, quarter,
        revenueTarget, dealsTarget, newCustomersTarget,
        revenueActual, dealsActual, newCustomersActual,
        achievementPercent, createdAt,
        user:User!SalesQuota_userId_fkey(id, name, email, role)
      `)
      .eq('companyId', session.user.companyId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (userId) query = query.eq('userId', userId)
    if (period) query = query.eq('period', period)
    if (year) query = query.eq('year', parseInt(year))

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Sales quotas fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales quotas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.userId || !body.period || !body.year || !body.revenueTarget) {
      return NextResponse.json(
        { error: 'UserId, period, year, and revenueTarget are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('SalesQuota')
      .insert({
        ...body,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'SalesQuota',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Created sales quota for ${body.period} ${body.year}`,
      meta: { quotaId: data.id, targetUserId: body.userId },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Sales quota create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sales quota' },
      { status: 500 }
    )
  }
}



