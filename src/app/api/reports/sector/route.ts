import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getCacheScope, getReportCache, setReportCache } from '@/lib/cache/report-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const scope = getCacheScope(isSuperAdmin, companyId)
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

    const cached = await getReportCache({
      supabase,
      reportType: 'sector',
      scope,
      ttlMinutes: 120,
      forceRefresh,
    })

    if (cached) {
      return NextResponse.json(cached.payload, {
        headers: { 'Cache-Control': 'no-store, must-revalidate', 'x-cache-hit': 'report-cache' },
      })
    }

    // Son 12 ayın verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Customer'ları sektör bazlı çek
    let customersQuery = supabase
      .from('Customer')
      .select('id, sector, createdAt')
      .not('sector', 'is', null)
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .limit(5000)
    
    if (!isSuperAdmin) {
      customersQuery = customersQuery.eq('companyId', companyId)
    }
    
    const { data: customers, error: customersError } = await customersQuery

    // Deal'ları çek (customer üzerinden sektör)
    let dealsQuery = supabase
      .from('Deal')
      .select('id, value, status, stage, customerId, createdAt, Customer!inner(sector)')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .limit(5000)
    
    if (!isSuperAdmin) {
      dealsQuery = dealsQuery.eq('companyId', companyId)
    }
    
    const { data: deals, error: dealsError } = await dealsQuery

    // Invoice'ları çek (customer üzerinden sektör - Quote üzerinden) - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    // DÜZELTME: Pagination ekle - tüm invoice'ları çekmek için
    let allInvoices: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      let invoicesQuery = supabase
        .from('Invoice')
        .select('id, totalAmount, status, quoteId, createdAt, companyId, Quote!inner(dealId, Deal!inner(customerId, Customer!inner(sector)))')
        .eq('status', 'PAID')
        .gte('createdAt', twelveMonthsAgo.toISOString())
        .range(from, from + pageSize - 1)
      
      if (!isSuperAdmin) {
        invoicesQuery = invoicesQuery.eq('companyId', companyId)
      }
      
      const { data: invoices, error: invoicesError } = await invoicesQuery

      if (invoicesError) {
        return NextResponse.json(
          { error: invoicesError.message || 'Failed to fetch invoices' },
          { status: 500 }
        )
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

    if (customersError || dealsError) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    // Sektör bazlı analiz
    const sectorAnalysis: Record<
      string,
      {
        sales: number
        customers: number
        deals: number
        wonDeals: number
        averageOrderValue: number
        profitability: number
      }
    > = {}

    // Customer bazlı sektör dağılımı
    const sectorCustomerCount: Record<string, number> = {}
    customers?.forEach((customer) => {
      const sector = customer.sector || 'UNKNOWN'
      sectorCustomerCount[sector] = (sectorCustomerCount[sector] || 0) + 1
    })

    // Deal bazlı sektör analizi
    deals?.forEach((deal: any) => {
      const sector = deal.Customer?.sector || 'UNKNOWN'
      if (!sectorAnalysis[sector]) {
        sectorAnalysis[sector] = {
          sales: 0,
          customers: sectorCustomerCount[sector] || 0,
          deals: 0,
          wonDeals: 0,
          averageOrderValue: 0,
          profitability: 0,
        }
      }
      sectorAnalysis[sector].deals += 1
      if (deal.status === 'WON' || deal.stage === 'WON') {
        sectorAnalysis[sector].wonDeals += 1
        sectorAnalysis[sector].sales += deal.value || 0
      }
    })

    // Invoice bazlı sektör analizi
    invoices?.forEach((invoice: any) => {
      const sector = invoice.Quote?.Deal?.Customer?.sector || 'UNKNOWN'
      if (!sectorAnalysis[sector]) {
        sectorAnalysis[sector] = {
          sales: 0,
          customers: sectorCustomerCount[sector] || 0,
          deals: 0,
          wonDeals: 0,
          averageOrderValue: 0,
          profitability: 0,
        }
      }
      // DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
      sectorAnalysis[sector].sales += invoice.totalAmount || invoice.total || 0
    })

    // Ortalama sipariş değeri ve karlılık hesapla
    Object.keys(sectorAnalysis).forEach((sector) => {
      const analysis = sectorAnalysis[sector]
      const invoiceCount = invoices?.filter(
        (inv: any) => inv.Quote?.Deal?.Customer?.sector === sector
      ).length || 0
      analysis.averageOrderValue = invoiceCount > 0 ? analysis.sales / invoiceCount : 0
      // Karlılık = (Won Deals / Total Deals) * 100
      analysis.profitability = analysis.deals > 0 ? (analysis.wonDeals / analysis.deals) * 100 : 0
    })

    // Sektör satış karşılaştırması (Radar Chart için)
    const sectorSales = Object.keys(sectorAnalysis)
      .map((sector) => ({
        sector,
        sales: sectorAnalysis[sector].sales,
        customers: sectorAnalysis[sector].customers,
        deals: sectorAnalysis[sector].deals,
      }))
      .sort((a, b) => b.sales - a.sales)

    // Sektör karlılık analizi (Bar Chart için)
    const sectorProfitability = Object.keys(sectorAnalysis)
      .map((sector) => ({
        sector,
        profitability: Math.round(sectorAnalysis[sector].profitability * 100) / 100,
        sales: sectorAnalysis[sector].sales,
        averageOrderValue: Math.round(sectorAnalysis[sector].averageOrderValue * 100) / 100,
      }))
      .sort((a, b) => b.profitability - a.profitability)

    // Sektör müşteri dağılımı (Pie Chart için)
    const sectorCustomerDistribution = Object.keys(sectorCustomerCount)
      .map((sector) => ({
        name: sector,
        value: sectorCustomerCount[sector],
      }))
      .sort((a, b) => b.value - a.value)

    // Sektör trend analizi (Line Chart için - aylık)
    const sectorTrend: Record<string, Record<string, number>> = {}
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthInvoices = invoices?.filter(
        (inv: any) => {
          const invDate = new Date(inv.createdAt)
          return invDate >= monthStart && invDate <= monthEnd
        }
      ) || []

      monthInvoices.forEach((inv: any) => {
        const sector = inv.Quote?.Deal?.Customer?.sector || 'UNKNOWN'
        if (!sectorTrend[sector]) {
          sectorTrend[sector] = {}
        }
        // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
        sectorTrend[sector][monthKey] = (sectorTrend[sector][monthKey] || 0) + (inv.totalAmount || 0)
      })
    }

    // Trend verisini formatla
    const sectorTrendData = Object.keys(sectorTrend)
      .map((sector) => {
        const trend = Object.keys(sectorTrend[sector])
          .sort()
          .map((month) => ({
            month,
            sales: sectorTrend[sector][month],
          }))
        return {
          sector,
          trend,
        }
      })
      .filter((item) => item.trend.length > 0)

    const payload = {
      sectorSales: sectorSales.map((s) => ({
        sector: s.sector,
        sales: s.sales,
        customers: s.customers,
        deals: s.deals,
      })),
      sectorProfitability: sectorProfitability.map((s) => ({
        sector: s.sector,
        profitability: s.profitability,
        sales: s.sales,
        averageOrderValue: s.averageOrderValue,
      })),
      sectorCustomerDistribution,
      sectorTrend: sectorTrendData,
    }

    await setReportCache({
      supabase,
      reportType: 'sector',
      scope,
      payload,
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, must-revalidate', 'x-cache-hit': 'miss' },
    })
  } catch (error: any) {
    console.error('Error fetching sector reports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sector reports' },
      { status: 500 }
    )
  }
}



