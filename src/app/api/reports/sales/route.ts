import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - fresh data için
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

    // Son 12 ayın satış verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let invoicesQuery = supabase
      .from('Invoice')
      .select('total, createdAt, status')
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

    // Aylık trend verisi (Line Chart için)
    const monthlyTrend: Record<string, number> = {}
    // Aylık karşılaştırma verisi (Bar Chart için)
    const monthlyComparison: Record<string, number> = {}
    // Durum dağılımı (Pie Chart için)
    const statusDistribution: Record<string, number> = {}

    invoices?.forEach((invoice: { createdAt: string; total?: number; status?: string }) => {
      const date = new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const total = invoice.total || 0

      // Aylık trend (sadece PAID invoice'lar)
      if (invoice.status === 'PAID') {
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + total
      }

      // Aylık karşılaştırma (tüm invoice'lar)
      monthlyComparison[monthKey] = (monthlyComparison[monthKey] || 0) + total

      // Durum dağılımı
      const status = invoice.status || 'UNKNOWN'
      statusDistribution[status] = (statusDistribution[status] || 0) + 1
    })

    // Son 12 ay için boş veri oluştur (trend için)
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = 0
      if (!monthlyComparison[monthKey]) monthlyComparison[monthKey] = 0
    }

    return NextResponse.json({
      monthlyTrend: Object.keys(monthlyTrend)
        .sort()
        .map((month) => ({
          month,
          total_sales: monthlyTrend[month],
        })),
      monthlyComparison: Object.keys(monthlyComparison)
        .sort()
        .map((month) => ({
          month,
          total: monthlyComparison[month],
        })),
      statusDistribution: Object.keys(statusDistribution).map((status) => ({
        name: status,
        value: statusDistribution[status],
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch sales reports' },
      { status: 500 }
    )
  }
}



