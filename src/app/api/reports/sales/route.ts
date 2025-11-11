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

    // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    // DÜZELTME: Pagination ekle - tüm invoice'ları çekmek için
    let allInvoices: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      let invoicesQuery = supabase
        .from('Invoice')
        .select('totalAmount, createdAt, status, companyId')
        .gte('createdAt', twelveMonthsAgo.toISOString())
        .order('createdAt', { ascending: true })
        .range(from, from + pageSize - 1)
    
      // SuperAdmin tüm firmaları görür, normal kullanıcı sadece kendi firmasını görür
      if (!isSuperAdmin) {
        invoicesQuery = invoicesQuery.eq('companyId', companyId)
      }
      
      const { data: invoices, error } = await invoicesQuery

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (invoices && invoices.length > 0) {
        allInvoices = [...allInvoices, ...invoices]
        from += pageSize
        hasMore = invoices.length === pageSize // Eğer tam sayfa geldiyse devam et
      } else {
        hasMore = false
      }
    }

    const invoices = allInvoices

    // Aylık trend verisi (Line Chart için)
    const monthlyTrend: Record<string, number> = {}
    // Aylık karşılaştırma verisi (Bar Chart için)
    const monthlyComparison: Record<string, number> = {}
    // Durum dağılımı (Pie Chart için)
    const statusDistribution: Record<string, number> = {}

    // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    invoices?.forEach((invoice: { createdAt: string; totalAmount?: number; status?: string }) => {
      const date = new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const total = invoice.totalAmount || 0
      const status = invoice.status || 'UNKNOWN'

      // Aylık trend (sadece PAID invoice'lar - gerçek satış)
      if (status === 'PAID') {
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + total
      }

      // Aylık karşılaştırma (sadece PAID invoice'lar - tutarlılık için)
      // NOT: Tüm invoice'ları göstermek yerine sadece ödenenleri gösteriyoruz
      // Çünkü ödenmemiş invoice'lar henüz satış değil
      if (status === 'PAID') {
        monthlyComparison[monthKey] = (monthlyComparison[monthKey] || 0) + total
      }

      // Durum dağılımı (tüm invoice'lar)
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
          total: monthlyTrend[month],
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



