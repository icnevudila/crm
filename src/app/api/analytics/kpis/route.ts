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
      { count: totalQuotesCount, error: quotesError },
      { count: acceptedQuotes, error: acceptedError },
      { count: draftQuotes, error: draftQuotesError },
      { count: sentQuotes, error: sentQuotesError },
      { count: waitingQuotes, error: waitingQuotesError },
      { count: rejectedQuotes, error: rejectedQuotesError },
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
      // Toplam Satış (PAID Invoice'ların toplamı) - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        let query = supabase.from('Invoice').select('totalAmount, total').eq('status', 'PAID')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Toplam Teklif Sayısı - sadece count (fallback için)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Başarı Oranı (ACCEPTED / TOTAL) - sadece count
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'ACCEPTED')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // DRAFT teklifler (status bazlı count - doğru hesaplama için)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // SENT teklifler (status bazlı count - doğru hesaplama için)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'SENT')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // WAITING teklifler (status bazlı count - doğru hesaplama için)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'WAITING')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // REJECTED teklifler (status bazlı count - doğru hesaplama için)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Son Aktivite Sayısı (son 24 saat) - sadece count, limit ile
      (() => {
        let query = supabase
          .from('ActivityLog')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Toplam Fatura Tutarı - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        let query = supabase.from('Invoice').select('totalAmount, total')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Toplam Müşteri Sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Toplam Fırsat Sayısı
      (() => {
        let query = supabase.from('Deal').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Fırsat değerleri (ortalama için) - Limit kaldırıldı (doğru hesaplama için)
      (() => {
        let query = supabase.from('Deal').select('value')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Bekleyen Faturalar - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        let query = supabase.from('Invoice').select('totalAmount, total').eq('status', 'SENT')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Aktif Firmalar Sayısı - CustomerCompany tablosundan çek
      (() => {
        let query = supabase.from('CustomerCompany').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Son 3 ayın satış verileri (aylık KPI için) - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Invoice')
          .select('totalAmount, total, createdAt')
          .eq('status', 'PAID')
          .gte('createdAt', threeMonthsAgo.toISOString())
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Son 3 ayın teklif verileri (aylık KPI için) - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Quote')
          .select('id, createdAt, status, totalAmount, total')
          .gte('createdAt', threeMonthsAgo.toISOString())
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Son 3 ayın fatura verileri (aylık KPI için) - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Invoice')
          .select('id, createdAt, status, totalAmount') // DÜZELTME: total kaldır (050 migration ile total → totalAmount, total kolonu artık yok!)
          .gte('createdAt', threeMonthsAgo.toISOString())
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Son 3 ayın fırsat verileri (aylık KPI için) - Limit kaldırıldı (doğru hesaplama için)
      (() => {
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        let query = supabase
          .from('Deal')
          .select('id, createdAt, status, value')
          .gte('createdAt', threeMonthsAgo.toISOString())
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
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
    // DÜZELTME: SuperAdmin için özel log ekle - sorunun ne olduğunu anla
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Session info:', {
        isSuperAdmin,
        companyId,
        userId: session.user.id,
        role: session.user.role,
      })
      
      if (salesError) {
        console.error('[KPIs API] Sales query error:', salesError)
        console.error('[KPIs API] Sales error details:', {
          message: salesError?.message,
          code: salesError?.code,
          details: salesError?.details,
          hint: salesError?.hint,
        })
      }
      if (quotesError) console.warn('Quotes query error:', quotesError)
      if (acceptedError) console.warn('Accepted quotes query error:', acceptedError)
      if (draftQuotesError) console.warn('Draft quotes query error:', draftQuotesError)
      if (sentQuotesError) console.warn('Sent quotes query error:', sentQuotesError)
      if (waitingQuotesError) console.warn('Waiting quotes query error:', waitingQuotesError)
      if (rejectedQuotesError) console.warn('Rejected quotes query error:', rejectedQuotesError)
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
      
      // Debug: monthlySalesData tipini kontrol et - DÜZELTME: Daha detaylı log
      console.log('[KPIs API] Monthly data:', {
        monthlySalesData: {
          type: typeof monthlySalesData,
          isArray: Array.isArray(monthlySalesData),
          length: Array.isArray(monthlySalesData) ? monthlySalesData.length : 0,
          sample: Array.isArray(monthlySalesData) && monthlySalesData.length > 0 ? monthlySalesData[0] : null,
        },
        monthlyQuotesData: {
          type: typeof monthlyQuotesData,
          isArray: Array.isArray(monthlyQuotesData),
          length: Array.isArray(monthlyQuotesData) ? monthlyQuotesData.length : 0,
          sample: Array.isArray(monthlyQuotesData) && monthlyQuotesData.length > 0 ? monthlyQuotesData[0] : null,
        },
        monthlyInvoicesData: {
          type: typeof monthlyInvoicesData,
          isArray: Array.isArray(monthlyInvoicesData),
          length: Array.isArray(monthlyInvoicesData) ? monthlyInvoicesData.length : 0,
          sample: Array.isArray(monthlyInvoicesData) && monthlyInvoicesData.length > 0 ? monthlyInvoicesData[0] : null,
        },
        monthlyDealsData: {
          type: typeof monthlyDealsData,
          isArray: Array.isArray(monthlyDealsData),
          length: Array.isArray(monthlyDealsData) ? monthlyDealsData.length : 0,
          sample: Array.isArray(monthlyDealsData) && monthlyDealsData.length > 0 ? monthlyDealsData[0] : null,
        },
      })
    }
    
    // Genel KPI'lar - DÜZELTME: totalAmount öncelikli kullan (050 migration ile total → totalAmount)
    // CRITICAL FIX: salesData boş array geliyorsa veya totalAmount NULL ise, direkt SQL'den çek
    // DEBUG: salesData'yı logla - sorunun ne olduğunu anla
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] salesData:', {
        isArray: Array.isArray(salesData),
        length: Array.isArray(salesData) ? salesData.length : 0,
        sample: Array.isArray(salesData) && salesData.length > 0 ? salesData[0] : null,
        first3: Array.isArray(salesData) ? salesData.slice(0, 3) : null,
        hasError: !!salesError,
        error: salesError,
      })
    }
    
    // CRITICAL FIX: Eğer salesData boş array ise veya hata varsa, direkt SQL'den toplamı çek
    let totalSales = 0
    if (salesError || !Array.isArray(salesData) || salesData.length === 0) {
      // Fallback: Direkt SQL'den SUM çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] salesData boş veya hata var, direkt SQL SUM çekiliyor...')
      }
      let sumQuery = supabase.from('Invoice').select('totalAmount', { count: 'exact', head: false }).eq('status', 'PAID')
      if (!isSuperAdmin) {
        sumQuery = sumQuery.eq('companyId', companyId)
      }
      const { data: allInvoices, error: sumError } = await sumQuery
      if (!sumError && Array.isArray(allInvoices)) {
        totalSales = allInvoices.reduce((sum: number, inv: any) => sum + (inv?.totalAmount || 0), 0)
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback SQL SUM result:', { totalSales, count: allInvoices.length })
        }
      }
    } else {
      // Normal hesaplama
      totalSales = (salesData as any).reduce((sum: number, inv: any) => {
        const invValue = inv?.totalAmount || inv?.total || inv?.grandTotal || 0
        // DEBUG: Her invoice değerini logla (ilk 5)
        if (process.env.NODE_ENV === 'development' && sum === 0 && invValue > 0) {
          console.log('[KPIs API] First invoice with value:', {
            id: inv?.id,
            title: inv?.title,
            totalAmount: inv?.totalAmount,
            total: inv?.total,
            grandTotal: inv?.grandTotal,
            calculatedValue: invValue,
          })
        }
        return sum + invValue
      }, 0)
    }
    
    // DEBUG: totalSales'ı logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] totalSales calculated:', totalSales)
    }
    
    // Toplam Teklif Sayısı: Status bazlı count'ları topla (en doğru yöntem)
    // TOPLAM = DRAFT + SENT + ACCEPTED + REJECTED + WAITING
    const calculatedTotalQuotes = (draftQuotes || 0) + (sentQuotes || 0) + (acceptedQuotes || 0) + (rejectedQuotes || 0) + (waitingQuotes || 0)
    // ÖNEMLİ: calculatedTotalQuotes kullan (status bazlı count'ların toplamı) - totalQuotesCount query'si yanlış sonuç verebilir
    // Eğer calculatedTotalQuotes 0 ise, totalQuotesCount'u kullan (fallback)
    const totalQuotes = calculatedTotalQuotes > 0 ? calculatedTotalQuotes : (totalQuotesCount || 0)
    
    const successRate = totalQuotes ? Math.round((acceptedQuotes || 0) / totalQuotes * 100) : 0
    // DÜZELTME: totalAmount öncelikli kullan (050 migration ile total → totalAmount)
    // DEBUG: pendingInvoices'ı logla - BEKLEYEN için
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] pendingInvoices:', {
        isArray: Array.isArray(pendingInvoices),
        length: Array.isArray(pendingInvoices) ? pendingInvoices.length : 0,
        sample: Array.isArray(pendingInvoices) && pendingInvoices.length > 0 ? pendingInvoices[0] : null,
        hasError: !!pendingError,
        error: pendingError,
      })
    }
    const totalInvoices = Array.isArray(invoiceData) ? (invoiceData as any).reduce((sum: number, inv: any) => sum + (inv?.totalAmount || inv?.total || inv?.grandTotal || 0), 0) : 0
    // CRITICAL FIX: Eğer dealsData boş array ise veya hata varsa, direkt SQL'den toplamı çek
    let totalDealsValue = 0
    if (dealsDataError || !Array.isArray(dealsData) || dealsData.length === 0) {
      // Fallback: Direkt SQL'den SUM çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] dealsData boş veya hata var, direkt SQL SUM çekiliyor...')
      }
      let sumQuery = supabase.from('Deal').select('value')
      if (!isSuperAdmin) {
        sumQuery = sumQuery.eq('companyId', companyId)
      }
      const { data: allDeals, error: sumError } = await sumQuery
      if (!sumError && Array.isArray(allDeals)) {
        totalDealsValue = allDeals.reduce((sum: number, deal: any) => {
          const dealValue = typeof deal?.value === 'string' ? parseFloat(deal.value) || 0 : (deal?.value || 0)
          return sum + dealValue
        }, 0)
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback SQL SUM result (deals):', { totalDealsValue, count: allDeals.length })
        }
      }
    } else {
      // Normal hesaplama
      totalDealsValue = (dealsData as any).reduce((sum: number, deal: any) => {
        const dealValue = typeof deal?.value === 'string' ? parseFloat(deal.value) || 0 : (deal?.value || 0)
        return sum + dealValue
      }, 0)
    }
    
    const avgDealValue = totalDeals ? Math.round(totalDealsValue / totalDeals) : 0
    
    // DEBUG: totalDealsValue'ı logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] totalDealsValue calculated:', { totalDealsValue, totalDeals, avgDealValue })
    }
    
    // CRITICAL FIX: Eğer pendingInvoices boş array ise veya hata varsa, direkt SQL'den toplamı çek
    let pendingInvoicesTotal = 0
    if (pendingError || !Array.isArray(pendingInvoices) || pendingInvoices.length === 0) {
      // Fallback: Direkt SQL'den SUM çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] pendingInvoices boş veya hata var, direkt SQL SUM çekiliyor...')
      }
      let sumQuery = supabase.from('Invoice').select('totalAmount', { count: 'exact', head: false }).eq('status', 'SENT')
      if (!isSuperAdmin) {
        sumQuery = sumQuery.eq('companyId', companyId)
      }
      const { data: allPendingInvoices, error: sumError } = await sumQuery
      if (!sumError && Array.isArray(allPendingInvoices)) {
        pendingInvoicesTotal = allPendingInvoices.reduce((sum: number, inv: any) => sum + (inv?.totalAmount || 0), 0)
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback SQL SUM result (pending):', { pendingInvoicesTotal, count: allPendingInvoices.length })
        }
      }
    } else {
      // Normal hesaplama
      pendingInvoicesTotal = (pendingInvoices as any).reduce((sum: number, inv: any) => {
        const invValue = inv?.totalAmount || inv?.total || inv?.grandTotal || 0
        // DEBUG: Her invoice değerini logla (ilk 5)
        if (process.env.NODE_ENV === 'development' && sum === 0 && invValue > 0) {
          console.log('[KPIs API] First pending invoice with value:', {
            id: inv?.id,
            title: inv?.title,
            totalAmount: inv?.totalAmount,
            total: inv?.total,
            grandTotal: inv?.grandTotal,
            calculatedValue: invValue,
          })
        }
        return sum + invValue
      }, 0)
    }
    
    // DEBUG: pendingInvoicesTotal'ı logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] pendingInvoicesTotal calculated:', pendingInvoicesTotal)
    }

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

    // Aylık satış verilerini grupla - DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
    // CRITICAL FIX: Eğer monthlySalesData boş array ise, direkt SQL'den çek
    if (!Array.isArray(monthlySalesData) || monthlySalesData.length === 0) {
      // Fallback: Direkt SQL'den son 3 ayın PAID invoice'larını çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] monthlySalesData bos, direkt SQL\'den cekiliyor...')
      }
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      let monthlyQuery = supabase
        .from('Invoice')
        .select('totalAmount, createdAt')
        .eq('status', 'PAID')
        .gte('createdAt', threeMonthsAgo.toISOString())
      if (!isSuperAdmin) {
        monthlyQuery = monthlyQuery.eq('companyId', companyId)
      }
      const { data: allMonthlyInvoices, error: monthlyError } = await monthlyQuery
      if (!monthlyError && Array.isArray(allMonthlyInvoices)) {
        allMonthlyInvoices.forEach((invoice: any) => {
          const date = new Date(invoice.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (monthlyKPIs[monthKey]) {
            monthlyKPIs[monthKey].sales += invoice.totalAmount || 0
          }
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback monthly sales loaded:', { count: allMonthlyInvoices.length })
        }
      }
    } else {
      // Normal hesaplama
      (monthlySalesData as any).forEach((invoice: any) => {
        const date = new Date(invoice.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyKPIs[monthKey]) {
          // DÜZELTME: totalAmount öncelikli, total fallback
          monthlyKPIs[monthKey].sales += invoice.totalAmount || invoice.total || invoice.grandTotal || 0
        }
      })
    }

    // Aylık teklif verilerini grupla - CRITICAL FIX: Eğer monthlyQuotesData boş array ise, direkt SQL'den çek
    if (!Array.isArray(monthlyQuotesData) || monthlyQuotesData.length === 0) {
      // Fallback: Direkt SQL'den son 3 ayın quote'larını çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] monthlyQuotesData bos, direkt SQL\'den cekiliyor...')
      }
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      let monthlyQuery = supabase
        .from('Quote')
        .select('id, createdAt, status')
        .gte('createdAt', threeMonthsAgo.toISOString())
      if (!isSuperAdmin) {
        monthlyQuery = monthlyQuery.eq('companyId', companyId)
      }
      const { data: allMonthlyQuotes, error: monthlyError } = await monthlyQuery
      if (!monthlyError && Array.isArray(allMonthlyQuotes)) {
        allMonthlyQuotes.forEach((quote: any) => {
          const date = new Date(quote.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (monthlyKPIs[monthKey]) {
            monthlyKPIs[monthKey].quotes += 1
            if (quote.status === 'ACCEPTED') {
              monthlyKPIs[monthKey].acceptedQuotes += 1
            }
          }
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback monthly quotes loaded:', { count: allMonthlyQuotes.length })
        }
      }
    } else {
      // Normal hesaplama
      (monthlyQuotesData as any).forEach((quote: any) => {
        const date = new Date(quote.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyKPIs[monthKey]) {
          monthlyKPIs[monthKey].quotes += 1
          if (quote.status === 'ACCEPTED') {
            monthlyKPIs[monthKey].acceptedQuotes += 1
          }
        }
      })
    }

    // Aylık fatura verilerini grupla - DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
    // CRITICAL FIX: Eğer monthlyInvoicesData boş array ise, direkt SQL'den çek
    if (!Array.isArray(monthlyInvoicesData) || monthlyInvoicesData.length === 0) {
      // Fallback: Direkt SQL'den son 3 ayın invoice'larını çek
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] monthlyInvoicesData bos, direkt SQL\'den cekiliyor...')
      }
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      let monthlyQuery = supabase
        .from('Invoice')
        .select('totalAmount, createdAt')
        .gte('createdAt', threeMonthsAgo.toISOString())
      if (!isSuperAdmin) {
        monthlyQuery = monthlyQuery.eq('companyId', companyId)
      }
      const { data: allMonthlyInvoices, error: monthlyError } = await monthlyQuery
      if (!monthlyError && Array.isArray(allMonthlyInvoices)) {
        allMonthlyInvoices.forEach((invoice: any) => {
          const date = new Date(invoice.createdAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (monthlyKPIs[monthKey]) {
            monthlyKPIs[monthKey].invoices += invoice.totalAmount || 0
          }
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback monthly invoices loaded:', { count: allMonthlyInvoices.length })
        }
      }
    } else {
      // Normal hesaplama
      (monthlyInvoicesData as any).forEach((invoice: any) => {
        const date = new Date(invoice.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyKPIs[monthKey]) {
          // DÜZELTME: totalAmount öncelikli, total fallback
          monthlyKPIs[monthKey].invoices += invoice.totalAmount || invoice.total || invoice.grandTotal || 0
        }
      })
    }

    // Aylık fırsat verilerini grupla
    if (Array.isArray(monthlyDealsData)) {
      (monthlyDealsData as any).forEach((deal: any) => {
        const date = new Date(deal.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (monthlyKPIs[monthKey]) {
          monthlyKPIs[monthKey].deals += deal.value || 0
        }
      })
    }

    // Aylık KPI'ları array formatına çevir
    const monthlyData = Object.keys(monthlyKPIs)
      .sort()
      .map((month) => ({
        month,
        ...monthlyKPIs[month],
      }))

    // DÜZELTME: Development'ta detaylı log ekle - SuperAdmin için sorun tespiti
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Response data:', {
        isSuperAdmin,
        companyId,
        totalSales,
        totalQuotes,
        successRate,
        totalInvoices,
        pendingInvoices: pendingInvoicesTotal,
        monthlyKPIsCount: monthlyData.length,
        monthlyKPIs: monthlyData,
      })
    }

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
          'Cache-Control': 'no-store, must-revalidate, max-age=0', // DÜZELTME: Cache'i tamamen kapat - her zaman fresh data
          'Pragma': 'no-cache', // DÜZELTME: Eski browser'lar için cache kapat
          'Expires': '0', // DÜZELTME: Cache'i tamamen kapat
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('KPIs API error:', error)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      console.error('Error name:', error?.name)
    }
    // Hata durumunda default değerler dön (UI bozulmasın)
    return NextResponse.json(
      {
        totalSales: 0,
        totalQuotes: 0,
        successRate: 0,
        activeCompanies: 0,
        recentActivity: 0,
        totalInvoices: 0,
        totalCustomers: 0,
        totalDeals: 0,
        avgDealValue: 0,
        pendingInvoices: 0,
        pendingShipments: 0,
        pendingPurchaseShipments: 0,
        monthlyKPIs: [],
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 200 } // 200 dön - UI bozulmasın
    )
  }
}










