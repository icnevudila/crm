import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST/PUT sonrası fresh data için)
// NOT: Dashboard'da staleTime ile cache yapılıyor, API seviyesinde cache kapatıyoruz
export const dynamic = 'force-dynamic'
// Edge Runtime kaldırıldı - NextAuth.js Edge Runtime'da çalışmıyor
// export const runtime = 'edge'

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('KPIs API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // TÜM QUERY'LERİ PARALEL ÇALIŞTIR - ÇOK DAHA HIZLI!
    // Sadece gerekli alanları seç - performans için
    // Hata yakalama ile - bir query hata verse bile diğerleri çalışsın
    // ULTRA AGRESİF: Paralel query'leri azalt - sadece kritik olanları paralel çalıştır
    // Diğerlerini sıralı çalıştır (connection pool limit'ini aşmamak için)
    const [
      { data: salesData, error: salesError },
      { count: totalQuotes, error: quotesError },
      { count: acceptedQuotes, error: acceptedError },
      { count: recentActivity, error: activityError },
      { data: invoiceData, error: invoiceError },
      { count: totalCustomers, error: customersError },
      { count: totalDeals, error: dealsError },
      { data: dealsData, error: dealsDataError },
      { data: pendingInvoices, error: pendingError },
      { count: activeCompanies, error: companiesError },
      // Aylık KPI'lar için son 3 ayın verilerini çek
      { data: monthlySalesData, error: monthlySalesError },
      { data: monthlyQuotesData, error: monthlyQuotesError },
      { data: monthlyInvoicesData, error: monthlyInvoicesError },
      { data: monthlyDealsData, error: monthlyDealsError },
    ] = await Promise.all([
      // Toplam Satış (PAID Invoice'ların toplamı) - sadece total alanı - ULTRA AGRESİF limit
      (() => {
        let query = supabase.from('Invoice').select('total').eq('status', 'PAID').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam Teklif Sayısı - sadece count
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Başarı Oranı (ACCEPTED / TOTAL) - sadece count
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'ACCEPTED')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Son Aktivite Sayısı (son 24 saat) - sadece count, limit ile
      (() => {
        let query = supabase
          .from('ActivityLog')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam Fatura Tutarı - sadece total alanı - ULTRA AGRESİF limit
      (() => {
        let query = supabase.from('Invoice').select('total').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam Müşteri Sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam Fırsat Sayısı
      (() => {
        let query = supabase.from('Deal').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Fırsat değerleri (ortalama için) - ULTRA AGRESİF limit
      (() => {
        let query = supabase.from('Deal').select('value').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bekleyen Faturalar - ULTRA AGRESİF limit
      (() => {
        let query = supabase.from('Invoice').select('total').eq('status', 'SENT').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Aktif Firmalar Sayısı
      (() => {
        let query = supabase.from('Company').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
        return query
      })(),
      // Son 3 ayın satış verileri (aylık KPI için)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Invoice')
          .select('total, createdAt')
          .eq('status', 'PAID')
          .gte('createdAt', threeMonthsAgo.toISOString())
          .limit(500)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Son 3 ayın teklif verileri (aylık KPI için)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Quote')
          .select('id, createdAt, status, total')
          .gte('createdAt', threeMonthsAgo.toISOString())
          .limit(500)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Son 3 ayın fatura verileri (aylık KPI için)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Invoice')
          .select('id, createdAt, status, total')
          .gte('createdAt', threeMonthsAgo.toISOString())
          .limit(500)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Son 3 ayın fırsat verileri (aylık KPI için)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Deal')
          .select('id, createdAt, status, value')
          .gte('createdAt', threeMonthsAgo.toISOString())
          .limit(500)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])
    
    // Onay bekleyen sevkiyatlar ve mal kabul - ayrı query (tablo yoksa hata vermeden atla)
    let pendingShipmentsCount = 0
    let pendingPurchaseShipmentsCount = 0
    
    try {
      let shipmentQuery = supabase.from('Shipment').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')
      if (!isSuperAdmin) shipmentQuery = shipmentQuery.eq('companyId', companyId)
      const { count: pendingShipments, error: pendingShipmentsError } = await shipmentQuery
      if (!pendingShipmentsError) {
        pendingShipmentsCount = pendingShipments || 0
      }
    } catch (err: any) {
      // Shipment tablosu yoksa sessizce atla
    }
    
    try {
      let purchaseQuery = supabase.from('PurchaseTransaction').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')
      if (!isSuperAdmin) purchaseQuery = purchaseQuery.eq('companyId', companyId)
      const { count: pendingPurchaseShipments, error: pendingPurchaseShipmentsError } = await purchaseQuery
      if (!pendingPurchaseShipmentsError) {
        pendingPurchaseShipmentsCount = pendingPurchaseShipments || 0
      }
    } catch (err: any) {
      // PurchaseTransaction tablosu yoksa sessizce atla
    }
    
    // Hata kontrolü - bir query hata verse bile devam et (graceful degradation)
    if (process.env.NODE_ENV === 'development') {
      if (salesError) console.warn('Sales query error:', salesError)
      if (quotesError) console.warn('Quotes query error:', quotesError)
      if (acceptedError) console.warn('Accepted quotes query error:', acceptedError)
      if (activityError) console.warn('Activity query error:', activityError)
      if (invoiceError) console.warn('Invoice query error:', invoiceError)
      if (customersError) console.warn('Customers query error:', customersError)
      if (dealsError) console.warn('Deals query error:', dealsError)
      if (dealsDataError) console.warn('Deals data query error:', dealsDataError)
      if (pendingError) console.warn('Pending invoices query error:', pendingError)
      if (companiesError) console.warn('Companies query error:', companiesError)
      if (monthlySalesError) console.warn('Monthly sales query error:', monthlySalesError)
      if (monthlyQuotesError) console.warn('Monthly quotes query error:', monthlyQuotesError)
      if (monthlyInvoicesError) console.warn('Monthly invoices query error:', monthlyInvoicesError)
      if (monthlyDealsError) console.warn('Monthly deals query error:', monthlyDealsError)
    }
    
    // Genel KPI'lar
    const totalSales = salesData?.reduce((sum, inv: { total?: number }) => sum + (inv.total || 0), 0) || 0
    const successRate = totalQuotes ? Math.round((acceptedQuotes || 0) / totalQuotes * 100) : 0
    const totalInvoices = invoiceData?.reduce((sum, inv: { total?: number }) => sum + (inv.total || 0), 0) || 0
    const totalDealsValue = dealsData?.reduce((sum, deal: { value?: number }) => sum + (deal.value || 0), 0) || 0
    const avgDealValue = totalDeals ? Math.round(totalDealsValue / totalDeals) : 0
    const pendingInvoicesTotal = pendingInvoices?.reduce((sum, inv: { total?: number }) => sum + (inv.total || 0), 0) || 0

    // Aylık KPI'lar - Son 3 ayın verilerini aylara göre grupla
    const monthlyKPIs: Record<string, {
      sales: number
      quotes: number
      invoices: number
      deals: number
      acceptedQuotes: number
    }> = {}

    // Son 3 ay için boş veri oluştur
    const now = new Date()
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyKPIs[monthKey] = {
        sales: 0,
        quotes: 0,
        invoices: 0,
        deals: 0,
        acceptedQuotes: 0,
      }
    }

    // Aylık satış verilerini grupla
    monthlySalesData?.forEach((invoice: { createdAt: string; total?: number }) => {
      const date = new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyKPIs[monthKey]) {
        monthlyKPIs[monthKey].sales += invoice.total || 0
      }
    })

    // Aylık teklif verilerini grupla
    monthlyQuotesData?.forEach((quote: { createdAt: string; status: string }) => {
      const date = new Date(quote.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyKPIs[monthKey]) {
        monthlyKPIs[monthKey].quotes += 1
        if (quote.status === 'ACCEPTED') {
          monthlyKPIs[monthKey].acceptedQuotes += 1
        }
      }
    })

    // Aylık fatura verilerini grupla
    monthlyInvoicesData?.forEach((invoice: { createdAt: string; total?: number }) => {
      const date = new Date(invoice.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyKPIs[monthKey]) {
        monthlyKPIs[monthKey].invoices += invoice.total || 0
      }
    })

    // Aylık fırsat verilerini grupla
    monthlyDealsData?.forEach((deal: { createdAt: string; value?: number }) => {
      const date = new Date(deal.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyKPIs[monthKey]) {
        monthlyKPIs[monthKey].deals += deal.value || 0
      }
    })

    // Aylık KPI'ları array formatına çevir
    const monthlyData = Object.keys(monthlyKPIs)
      .sort()
      .map((month) => ({
        month,
        ...monthlyKPIs[month],
      }))

    return NextResponse.json(
      {
        // Genel KPI'lar
        totalSales,
        totalQuotes: totalQuotes || 0,
        successRate,
        activeCompanies: activeCompanies || 0,
        recentActivity: recentActivity || 0,
        totalInvoices,
        totalCustomers: totalCustomers || 0,
        totalDeals: totalDeals || 0,
        avgDealValue,
        pendingInvoices: pendingInvoicesTotal,
        pendingShipments: pendingShipmentsCount,
        pendingPurchaseShipments: pendingPurchaseShipmentsCount,
        // Aylık KPI'lar (son 3 ay)
        monthlyKPIs: monthlyData,
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
          // NOT: Dashboard'da staleTime ile cache yapılıyor, API seviyesinde cache kapatıyoruz
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KPIs API error:', error)
      console.error('Error stack:', error?.stack)
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch KPIs',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}




