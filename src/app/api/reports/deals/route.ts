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

    // Son 12 ayın fırsat verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let dealsQuery = supabase
      .from('Deal')
      .select('id, stage, value, createdAt')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000)
    
    if (!isSuperAdmin) {
      dealsQuery = dealsQuery.eq('companyId', companyId)
    }
    
    const { data: deals, error } = await dealsQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Aşama dağılımı (Area Chart için)
    const stageDistribution: Record<string, number> = {}
    // Değer trendi (Composed Chart için)
    const valueTrend: Record<string, { count: number; totalValue: number }> = {}

    deals?.forEach((deal: { stage?: string; value?: number | string; createdAt: string }) => {
      const date = new Date(deal.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Aşama dağılımı
      const stage = deal.stage || 'UNKNOWN'
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1

      // Değer trendi
      const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0)
      if (!valueTrend[monthKey]) {
        valueTrend[monthKey] = { count: 0, totalValue: 0 }
      }
      valueTrend[monthKey].count += 1
      valueTrend[monthKey].totalValue += dealValue
    })

    // Son 12 ay için boş veri oluştur
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!valueTrend[monthKey]) {
        valueTrend[monthKey] = { count: 0, totalValue: 0 }
      }
    }

    return NextResponse.json({
      stageDistribution: Object.keys(stageDistribution).map((stage) => ({
        stage,
        count: stageDistribution[stage],
      })),
      valueTrend: Object.keys(valueTrend)
        .sort()
        .map((month) => ({
          month,
          count: valueTrend[month].count,
          totalValue: valueTrend[month].totalValue,
        })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch deal reports' },
      { status: 500 }
    )
  }
}



