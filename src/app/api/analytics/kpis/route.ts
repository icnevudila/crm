import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getCacheScope, getKpiCache, setKpiCache } from '@/lib/cache/report-cache'

// PERFORMANCE FIX: force-dynamic cache'i tamamen kapatıyor - kaldırıldı
// Dashboard'da staleTime ile cache yapılıyor, API seviyesinde de cache ekliyoruz
// export const dynamic = 'force-dynamic' // KALDIRILDI - cache performansı için
export const revalidate = 60 // 60 saniye revalidate (performans için)
// Edge Runtime kaldırıldı - NextAuth.js Edge Runtime'da çalışmıyor
// export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const cronToken = url.searchParams.get('cronToken')
    const targetCompanyId = url.searchParams.get('companyId')
    const globalCron = cronToken && url.searchParams.get('global') === '1'

    let isSuperAdmin = false
    let companyId: string
    let sessionUser: { id?: string; role?: string } | null = null

    if (cronToken && process.env.CRON_TASK_TOKEN && cronToken === process.env.CRON_TASK_TOKEN) {
      if (!targetCompanyId && !globalCron) {
        return NextResponse.json(
          { error: 'companyId parametresi gerekli' },
          { status: 400 }
        )
      }
      companyId = targetCompanyId || 'global'
      isSuperAdmin = Boolean(globalCron)
    } else {
      const { session, error: sessionError } = await getSafeSession(request)
      if (sessionError) {
        return sessionError
      }

      if (!session?.user?.companyId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      sessionUser = session.user
      isSuperAdmin = session.user.role === 'SUPER_ADMIN'
      companyId = session.user.companyId

      // DEBUG: Session bilgisini logla - multi-tenant kontrolü için
      if (process.env.NODE_ENV === 'development') {
        console.log('[KPIs API] 🔍 Session Check:', {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
          companyId: session.user.companyId,
          companyName: session.user.companyName,
          isSuperAdmin,
        })
      }
    }

    const supabase = getSupabaseWithServiceRole()
    const scope = globalCron ? { isGlobal: true } : getCacheScope(isSuperAdmin, companyId)
    const forceRefresh = url.searchParams.get('refresh') === '1'

    const cached = await getKpiCache({
      supabase,
      scope,
      ttlMinutes: 15,
      forceRefresh,
    })

    if (cached) {
      return NextResponse.json(cached.payload, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // PERFORMANCE FIX: Cache headers eklendi
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
          'x-cache-hit': 'kpi-cache',
        },
      })
    }

    // TÜM QUERY'LERİ PARALEL ÇALIŞTIR - ÇOK DAHA HIZLI!
    // Sadece gerekli alanları seç - performans için
    // Hata yakalama ile - bir query hata verse bile diğerleri çalışsın
    // ULTRA AGRESİF: Paralel query'leri azalt - sadece kritik olanları paralel çalıştır
    // Diğerlerini sıralı çalıştır (connection pool limit'ini aşmamak için)
    const [
      { data: salesData, error: salesError },
      { data: allQuotes, error: quotesError },
      { count: acceptedQuotes, error: acceptedError },
      { count: draftQuotes, error: draftQuotesError },
      { count: sentQuotes, error: sentQuotesError },
      { count: waitingQuotes, error: waitingQuotesError },
      { count: rejectedQuotes, error: rejectedQuotesError },
      { count: recentActivity, error: activityError },
      { data: invoiceData, error: invoiceError },
      { data: allCustomers, error: customersError },
      { data: allDeals, error: dealsError },
      { data: dealsData, error: dealsDataError },
      { data: pendingInvoices, error: pendingError },
      { data: allCompanies, error: companiesError },
      // Aylık KPI'lar için son 3 ayın verilerini çek
      { data: monthlySalesData, error: monthlySalesError },
      { data: monthlyQuotesData, error: monthlyQuotesError },
      { data: monthlyInvoicesData, error: monthlyInvoicesError },
      { data: monthlyDealsData, error: monthlyDealsError },
      // Yeni modüller
      { data: returnOrdersData, error: returnOrdersError },
      { data: creditNotesData, error: creditNotesError },
      { data: paymentPlansData, error: paymentPlansError },
      { data: salesQuotasData, error: salesQuotasError },
      { data: productBundlesData, error: productBundlesError },
    ] = await Promise.all([
      // Toplam Satış (PAID Invoice'ların toplamı) - totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        let query = supabase.from('Invoice').select('totalAmount, total, companyId').eq('status', 'PAID')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
          // DEBUG: companyId filtresi uygulandı
          if (process.env.NODE_ENV === 'development') {
            console.log('[KPIs API] 🔒 Invoice query filtered by companyId:', companyId)
          }
        } else {
          // DEBUG: SuperAdmin - tüm firmaları göster
          if (process.env.NODE_ENV === 'development') {
            console.log('[KPIs API] 👑 SuperAdmin - showing all companies')
          }
        }
        return query
      })(),
      // Toplam Teklif Sayısı - tüm quote'ları çekip JavaScript'te say (quotes sayfası ile tutarlılık için)
      (() => {
        let query = supabase.from('Quote').select('id, status')
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
      // Toplam Müşteri Sayısı - tüm customer'ları çekip JavaScript'te say (customers sayfası ile tutarlılık için)
      (() => {
        let query = supabase.from('Customer').select('id')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Toplam Fırsat Sayısı - tüm deal'ları çekip JavaScript'te say (deals sayfası ile tutarlılık için)
      (() => {
        let query = supabase.from('Deal').select('id')
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
      // Aktif Firmalar Sayısı - CustomerCompany tablosundan tüm verileri çekip JavaScript'te say (companies sayfası ile tutarlılık için)
      // ÖNEMLİ: Companies sayfası her zaman companyId filtresi kullanıyor (SuperAdmin dahil), bu yüzden burada da aynı mantığı kullanıyoruz
      (() => {
        // Companies sayfası ile tutarlılık için: Her zaman companyId filtresi kullan (SuperAdmin dahil)
        // Companies sayfasında: .eq('companyId', session.user.companyId) - her zaman filtreleniyor
        let query = supabase.from('CustomerCompany').select('id').eq('companyId', companyId)
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
      // ÖNEMLİ: Son 3 ayın ilk gününden başla (monthlyKPIs ile tutarlılık için)
      (() => {
        const now = new Date()
        // Son 3 ayın ilk gününü hesapla (monthlyKPIs ile aynı mantık)
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1) // Son 3 ayın ilk günü
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
      // Return Orders - Toplam iade sayısı ve tutarı
      (() => {
        let query = supabase.from('ReturnOrder').select('id, totalAmount, status, createdAt')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Credit Notes - Toplam iade fatura sayısı ve tutarı
      (() => {
        let query = supabase.from('CreditNote').select('id, amount, status, createdAt')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Payment Plans - Toplam taksit planı sayısı ve tutarı
      (() => {
        let query = supabase.from('PaymentPlan').select('id, totalAmount, status, createdAt')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Sales Quotas - Aktif kotalar ve performans
      (() => {
        let query = supabase.from('SalesQuota').select('id, targetRevenue, actualRevenue, period, status')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Product Bundles - Aktif paket sayısı
      (() => {
        let query = supabase.from('ProductBundle').select('id, status, finalPrice').eq('status', 'ACTIVE')
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
        userId: sessionUser?.id ?? 'cron',
        role: sessionUser?.role ?? (isSuperAdmin ? 'SUPER_ADMIN' : 'CRON'),
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
      if (quotesError) {
        console.error('[KPIs API] Quotes query error:', quotesError)
        console.error('[KPIs API] Quotes error details:', {
          message: quotesError?.message,
          code: quotesError?.code,
          details: quotesError?.details,
          hint: quotesError?.hint,
        })
      }
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
    
    // Toplam Teklif Sayısı: Tüm quote'ları çekip JavaScript'te say (quotes sayfası ile tutarlılık için)
    // Bu yöntem quotes sayfasındaki /api/stats/quotes endpoint'i ile aynı mantık - DOĞRU SONUÇ
    let totalQuotes = 0
    if (quotesError || !Array.isArray(allQuotes)) {
      // Fallback: Status bazlı count'ları topla (eski yöntem)
      const calculatedTotalQuotes = (draftQuotes || 0) + (sentQuotes || 0) + (acceptedQuotes || 0) + (rejectedQuotes || 0) + (waitingQuotes || 0)
      totalQuotes = calculatedTotalQuotes
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] Quotes query hatası, fallback kullanılıyor:', {
          quotesError,
          calculatedTotalQuotes,
        })
      }
    } else {
      // Normal yöntem: JavaScript'te say
      totalQuotes = allQuotes.length
    }
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Total quotes calculated:', {
        totalQuotes,
        allQuotesLength: Array.isArray(allQuotes) ? allQuotes.length : 0,
        calculatedFromStatus: (draftQuotes || 0) + (sentQuotes || 0) + (acceptedQuotes || 0) + (rejectedQuotes || 0) + (waitingQuotes || 0),
        hasError: !!quotesError,
      })
    }
    
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
    // Toplam Fatura Tutarı ve Sayısı: invoiceData array'inden hesapla (invoices sayfası ile tutarlılık için)
    const totalInvoicesValue = Array.isArray(invoiceData) ? (invoiceData as any).reduce((sum: number, inv: any) => sum + (inv?.totalAmount || inv?.total || inv?.grandTotal || 0), 0) : 0
    const totalInvoices = Array.isArray(invoiceData) ? invoiceData.length : 0
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Total invoices calculated:', {
        totalInvoices,
        totalInvoicesValue,
        invoiceDataLength: Array.isArray(invoiceData) ? invoiceData.length : 0,
        hasError: !!invoiceError,
      })
    }
    // Toplam Fırsat Sayısı: Tüm deal'ları çekip JavaScript'te say (deals sayfası ile tutarlılık için)
    // ÖNEMLİ: Bu hesaplama avgDealValue'dan ÖNCE yapılmalı
    let totalDeals = 0
    if (dealsError || !Array.isArray(allDeals)) {
      // Fallback: Eğer hata varsa 0 döndür
      totalDeals = 0
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] Deals query hatası, fallback kullanılıyor:', {
          dealsError,
        })
      }
    } else {
      // Normal yöntem: JavaScript'te say
      totalDeals = allDeals.length
    }
    
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
      const { data: allDealsForValue, error: sumError } = await sumQuery
      if (!sumError && Array.isArray(allDealsForValue)) {
        totalDealsValue = allDealsForValue.reduce((sum: number, deal: any) => {
          const dealValue = typeof deal?.value === 'string' ? parseFloat(deal.value) || 0 : (deal?.value || 0)
          return sum + dealValue
        }, 0)
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback SQL SUM result (deals):', { totalDealsValue, count: allDealsForValue.length })
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
    // ÖNEMLİ: Son 3 ayın ilk gününden başla (monthlyKPIs ile tutarlılık için)
    if (!Array.isArray(monthlyQuotesData) || monthlyQuotesData.length === 0) {
      // Fallback: Direkt SQL'den son 3 ayın quote'larını çek (monthlyKPIs ile tutarlılık için)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] monthlyQuotesData bos, direkt SQL\'den cekiliyor...')
      }
      // Son 3 ayın ilk gününü hesapla (monthlyKPIs ile aynı mantık) - now değişkenini tekrar tanımla
      const currentDate = new Date()
      const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
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
          // monthlyKPIs'de varsa say (son 3 ay için)
          if (monthlyKPIs[monthKey]) {
            monthlyKPIs[monthKey].quotes += 1
            if (quote.status === 'ACCEPTED') {
              monthlyKPIs[monthKey].acceptedQuotes += 1
            }
          }
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('[KPIs API] Fallback monthly quotes loaded:', { 
            count: allMonthlyQuotes.length,
            threeMonthsAgo: threeMonthsAgo.toISOString(),
            monthlyKPIsKeys: Object.keys(monthlyKPIs),
          })
        }
      }
    } else {
      // Normal hesaplama - monthlyQuotesData zaten son 3 ayın ilk gününden başlıyor
      (monthlyQuotesData as any).forEach((quote: any) => {
        const date = new Date(quote.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        // monthlyKPIs'de varsa say (son 3 ay için)
        if (monthlyKPIs[monthKey]) {
          monthlyKPIs[monthKey].quotes += 1
          if (quote.status === 'ACCEPTED') {
            monthlyKPIs[monthKey].acceptedQuotes += 1
          }
        } else {
          // Debug: Eğer monthKey yoksa logla (son 3 ay dışında bir ay)
          if (process.env.NODE_ENV === 'development') {
            console.warn('[KPIs API] Quote found outside last 3 months:', {
              quoteId: quote.id,
              createdAt: quote.createdAt,
              monthKey,
              availableKeys: Object.keys(monthlyKPIs),
            })
          }
        }
      })
      
      // Debug: Development'ta aylık toplamları logla
      if (process.env.NODE_ENV === 'development') {
        const monthlyTotal = Object.values(monthlyKPIs).reduce((sum, month) => sum + month.quotes, 0)
        console.log('[KPIs API] Monthly quotes calculated:', {
          monthlyTotal,
          monthlyKPIs: Object.entries(monthlyKPIs).map(([key, value]) => ({ month: key, quotes: value.quotes })),
          totalQuotesFromData: monthlyQuotesData.length,
        })
      }
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

    // Aktif Firmalar Sayısı: Tüm company'leri çekip JavaScript'te say (companies sayfası ile tutarlılık için)
    let activeCompanies = 0
    if (companiesError || !Array.isArray(allCompanies)) {
      // Fallback: Eğer hata varsa 0 döndür
      activeCompanies = 0
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] Companies query hatası, fallback kullanılıyor:', {
          companiesError,
        })
      }
    } else {
      // Normal yöntem: JavaScript'te say
      activeCompanies = allCompanies.length
    }
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Active companies calculated:', {
        activeCompanies,
        allCompaniesLength: Array.isArray(allCompanies) ? allCompanies.length : 0,
        hasError: !!companiesError,
      })
    }

    // Toplam Müşteri Sayısı: Tüm customer'ları çekip JavaScript'te say (customers sayfası ile tutarlılık için)
    let totalCustomers = 0
    if (customersError || !Array.isArray(allCustomers)) {
      // Fallback: Eğer hata varsa 0 döndür
      totalCustomers = 0
      if (process.env.NODE_ENV === 'development') {
        console.warn('[KPIs API] Customers query hatası, fallback kullanılıyor:', {
          customersError,
        })
      }
    } else {
      // Normal yöntem: JavaScript'te say
      totalCustomers = allCustomers.length
    }
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Total customers calculated:', {
        totalCustomers,
        allCustomersLength: Array.isArray(allCustomers) ? allCustomers.length : 0,
        hasError: !!customersError,
      })
    }

    // Debug: Development'ta log ekle (totalDeals zaten yukarıda hesaplandı)
    if (process.env.NODE_ENV === 'development') {
      console.log('[KPIs API] Total deals calculated:', {
        totalDeals,
        allDealsLength: Array.isArray(allDeals) ? allDeals.length : 0,
        hasError: !!dealsError,
      })
    }

    // Yeni modüller için hesaplamalar
    // Return Orders
    const totalReturnOrders = Array.isArray(returnOrdersData) ? returnOrdersData.length : 0
    const totalReturnOrdersValue = Array.isArray(returnOrdersData)
      ? returnOrdersData.reduce((sum: number, ro: any) => sum + (ro?.totalAmount || 0), 0)
      : 0
    const pendingReturnOrders = Array.isArray(returnOrdersData)
      ? returnOrdersData.filter((ro: any) => ro?.status === 'PENDING' || ro?.status === 'APPROVED').length
      : 0

    // Credit Notes
    const totalCreditNotes = Array.isArray(creditNotesData) ? creditNotesData.length : 0
    const totalCreditNotesValue = Array.isArray(creditNotesData)
      ? creditNotesData.reduce((sum: number, cn: any) => sum + (cn?.amount || 0), 0)
      : 0
    const appliedCreditNotes = Array.isArray(creditNotesData)
      ? creditNotesData.filter((cn: any) => cn?.status === 'APPLIED').length
      : 0

    // Payment Plans
    const totalPaymentPlans = Array.isArray(paymentPlansData) ? paymentPlansData.length : 0
    const totalPaymentPlansValue = Array.isArray(paymentPlansData)
      ? paymentPlansData.reduce((sum: number, pp: any) => sum + (pp?.totalAmount || 0), 0)
      : 0
    const activePaymentPlans = Array.isArray(paymentPlansData)
      ? paymentPlansData.filter((pp: any) => pp?.status === 'ACTIVE').length
      : 0
    const overduePaymentPlans = Array.isArray(paymentPlansData)
      ? paymentPlansData.filter((pp: any) => pp?.status === 'OVERDUE').length
      : 0

    // Sales Quotas
    const totalSalesQuotas = Array.isArray(salesQuotasData) ? salesQuotasData.length : 0
    const activeSalesQuotas = Array.isArray(salesQuotasData)
      ? salesQuotasData.filter((sq: any) => sq?.status === 'ACTIVE').length
      : 0
    const totalTargetRevenue = Array.isArray(salesQuotasData)
      ? salesQuotasData.reduce((sum: number, sq: any) => sum + (sq?.targetRevenue || 0), 0)
      : 0
    const totalActualRevenue = Array.isArray(salesQuotasData)
      ? salesQuotasData.reduce((sum: number, sq: any) => sum + (sq?.actualRevenue || 0), 0)
      : 0
    const quotaAchievementRate = totalTargetRevenue > 0
      ? Math.round((totalActualRevenue / totalTargetRevenue) * 100)
      : 0

    // Product Bundles
    const totalProductBundles = Array.isArray(productBundlesData) ? productBundlesData.length : 0
    const totalProductBundlesValue = Array.isArray(productBundlesData)
      ? productBundlesData.reduce((sum: number, pb: any) => sum + (pb?.finalPrice || pb?.totalPrice || 0), 0)
      : 0

    const payload = {
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
      // Yeni modüller KPI'ları
      totalReturnOrders,
      totalReturnOrdersValue,
      pendingReturnOrders,
      totalCreditNotes,
      totalCreditNotesValue,
      appliedCreditNotes,
      totalPaymentPlans,
      totalPaymentPlansValue,
      activePaymentPlans,
      overduePaymentPlans,
      totalSalesQuotas,
      activeSalesQuotas,
      totalTargetRevenue,
      totalActualRevenue,
      quotaAchievementRate,
      totalProductBundles,
      totalProductBundlesValue,
      // Aylık KPI'lar (son 3 ay)
      monthlyKPIs: monthlyData,
    }

    await setKpiCache({
      supabase,
      scope,
      payload,
    })

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // PERFORMANCE FIX: Cache headers eklendi
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        'x-cache-hit': 'miss',
      },
    })
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










