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

    // Son 12 ayın müşteri verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let customersQuery = supabase
      .from('Customer')
      .select('id, createdAt, sector, city')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000)
    
    if (!isSuperAdmin) {
      customersQuery = customersQuery.eq('companyId', companyId)
    }
    
    const { data: customers, error } = await customersQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Büyüme trendi (Line Chart için)
    const growthTrend: Record<string, number> = {}
    // Sektör dağılımı (Radar Chart için)
    const sectorDistribution: Record<string, number> = {}
    // Şehir dağılımı (Bar Chart için)
    const cityDistribution: Record<string, number> = {}

    customers?.forEach((customer: { createdAt: string; sector?: string | null; city?: string | null }) => {
      const date = new Date(customer.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Büyüme trendi
      growthTrend[monthKey] = (growthTrend[monthKey] || 0) + 1

      // Sektör dağılımı
      const sector = customer.sector || 'Belirtilmemiş'
      sectorDistribution[sector] = (sectorDistribution[sector] || 0) + 1

      // Şehir dağılımı
      const city = customer.city || 'Belirtilmemiş'
      cityDistribution[city] = (cityDistribution[city] || 0) + 1
    })

    // Son 12 ay için boş veri oluştur
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!growthTrend[monthKey]) growthTrend[monthKey] = 0
    }

    return NextResponse.json({
      growthTrend: Object.keys(growthTrend)
        .sort()
        .map((month) => ({
          month,
          count: growthTrend[month],
        })),
      sectorDistribution: Object.keys(sectorDistribution).map((sector) => ({
        name: sector,
        value: sectorDistribution[sector],
      })),
      cityDistribution: Object.keys(cityDistribution)
        .sort((a, b) => cityDistribution[b] - cityDistribution[a])
        .slice(0, 10)
        .map((city) => ({
          city,
          count: cityDistribution[city],
        })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch customer reports' },
      { status: 500 }
    )
  }
}



