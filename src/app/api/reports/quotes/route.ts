import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let quotesQuery = supabase
      .from('Quote')
      .select('id, status, createdAt')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000)
    
    if (!isSuperAdmin) {
      quotesQuery = quotesQuery.eq('companyId', companyId)
    }
    
    const { data: quotes, error } = await quotesQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const statusDistribution: Record<string, number> = {}
    const trend: Record<string, number> = {}

    quotes?.forEach((quote: { status?: string; createdAt: string }) => {
      const date = new Date(quote.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const status = quote.status || 'UNKNOWN'
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
      trend[monthKey] = (trend[monthKey] || 0) + 1
    })

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!trend[monthKey]) trend[monthKey] = 0
    }

    return NextResponse.json({
      statusDistribution: Object.keys(statusDistribution).map((status) => ({
        name: status,
        value: statusDistribution[status],
      })),
      trend: Object.keys(trend)
        .sort()
        .map((month) => ({
          month,
          count: trend[month],
        })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch quote reports' },
      { status: 500 }
    )
  }
}



