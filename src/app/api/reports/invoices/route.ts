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

    let invoicesQuery = supabase
      .from('Invoice')
      .select('id, status, createdAt')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000)
    
    if (!isSuperAdmin) {
      invoicesQuery = invoicesQuery.eq('companyId', companyId)
    }
    
    const { data: invoices, error } = await invoicesQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const paymentDistribution: Record<string, number> = {}
    const monthlyTrend: Record<string, number> = {}

    invoices?.forEach((invoice: { status?: string; createdAt: string }) => {
      const date = new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const status = invoice.status || 'UNKNOWN'
      paymentDistribution[status] = (paymentDistribution[status] || 0) + 1
      monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1
    })

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = 0
    }

    return NextResponse.json({
      paymentDistribution: Object.keys(paymentDistribution).map((status) => ({
        status,
        count: paymentDistribution[status],
      })),
      monthlyTrend: Object.keys(monthlyTrend)
        .sort()
        .map((month) => ({
          month,
          count: monthlyTrend[month],
        })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch invoice reports' },
      { status: 500 }
    )
  }
}



