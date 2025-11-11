import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Cache kaldırıldı - multi-tenant güvenlik için fresh data gerekli
export const revalidate = 0

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Kullanıcıları çek - Sadece gerekli kolonlar
    // MUTLAKA companyId filtresi uygula - multi-tenant güvenlik için kritik
    let usersQuery = supabase
      .from('User')
      .select('id, name, companyId')
      .not('companyId', 'is', null) // companyId null olanları filtrele
      .limit(20) // Performans için limit
    
    // Normal kullanıcı: kendi companyId'sine göre filtrele
    // SuperAdmin: tüm firmaları göster
    if (!isSuperAdmin) {
      usersQuery = usersQuery.eq('companyId', companyId)
    }
    
    const { data: usersRaw, error: usersError } = await usersQuery
    
    // Hata kontrolü
    if (usersError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('User Performance API - Users query error:', usersError)
      }
      return NextResponse.json(
        { error: 'Failed to fetch users', message: usersError.message },
        { status: 500 }
      )
    }
    
    // CRITICAL: Kullanıcıları bir kez daha filtrele - multi-tenant güvenlik için ekstra kontrol
    // Normal kullanıcı: sadece aynı companyId'ye sahip kullanıcıları al
    // SuperAdmin: tüm kullanıcıları göster
    let users = usersRaw || []
    if (!isSuperAdmin) {
      users = users.filter((u: any) => u.companyId === companyId && u.companyId != null)
    }
    
    // Debug: Users ve companyId kontrolü
    if (process.env.NODE_ENV === 'development') {
      console.log('User Performance API - Request companyId:', companyId)
      console.log('User Performance API - Is SuperAdmin:', isSuperAdmin)
      console.log('User Performance API - Raw users count:', usersRaw?.length || 0)
      console.log('User Performance API - Filtered users count:', users.length)
      console.log('User Performance API - Users:', users.map((u: any) => ({ id: u.id, name: u.name, companyId: u.companyId })))
      
      // Eğer SuperAdmin değilse, tüm kullanıcıların aynı companyId'ye sahip olduğunu kontrol et
      if (!isSuperAdmin && users.length > 0) {
        const wrongCompanyUsers = users.filter((u: any) => u.companyId !== companyId)
        if (wrongCompanyUsers.length > 0) {
          console.error('User Performance API - SECURITY ERROR: Found users from different company!', wrongCompanyUsers)
          // Güvenlik hatası - yanlış kullanıcıları listeden çıkar
          users = users.filter((u: any) => u.companyId === companyId)
        }
      }
    }

    if (!users || users.length === 0) {
      // Eğer kullanıcı yoksa, boş array döndür (grafik placeholder gösterir)
      // Cache kaldırıldı - multi-tenant güvenlik için fresh data gerekli
      return NextResponse.json(
        { performance: [] },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store',
          },
        }
      )
    }

    // Invoice, Quote, Deal tablolarında userId kolonu YOK!
    // ActivityLog'dan kullanıcı bazlı veri çek veya toplam veriyi eşit dağıt
    const [allInvoices, allQuotes, allDeals, activityLogs] = await Promise.all([
      // Tüm PAID invoice'ları çek - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount)
      (() => {
        let query = supabase.from('Invoice').select('totalAmount, total').eq('status', 'PAID').limit(100)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Tüm quote'ları çek (sadece count)
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Tüm deal'ları çek (sadece count)
      (() => {
        let query = supabase.from('Deal').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // ActivityLog'dan kullanıcı bazlı veri çek (userId var) - meta JSON'dan status bilgisi al
      (() => {
        let query = supabase
          .from('ActivityLog')
          .select('userId, entity, action, meta')
          .not('userId', 'is', null)
          .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    // Toplam değerleri hesapla - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount)
    const totalSales = allInvoices.data?.reduce((sum, inv: { total?: number; totalAmount?: number; grandTotal?: number }) => sum + (inv.totalAmount || inv.total || inv.grandTotal || 0), 0) || 0
    const totalQuotes = allQuotes.count || 0
    const totalDeals = allDeals.count || 0

    // ActivityLog'dan kullanıcı bazlı istatistikleri çıkar
    const userStats = new Map<string, { sales: number; quotes: number; deals: number }>()

    // Her kullanıcı için başlangıç değerleri
    users.forEach((user: { id: string }) => {
      userStats.set(user.id, { sales: 0, quotes: 0, deals: 0 })
    })

    // ActivityLog'dan entity bazlı sayıları çıkar
    activityLogs.data?.forEach((log: { userId?: string; entity?: string; action?: string; meta?: any }) => {
      if (!log.userId) return
      const stats = userStats.get(log.userId) || { sales: 0, quotes: 0, deals: 0 }
      
      // Quote oluşturma/güncelleme
      if (log.entity === 'Quote' && (log.action === 'CREATE' || log.action === 'UPDATE')) {
        stats.quotes += 1
      }
      
      // Deal oluşturma/güncelleme
      if (log.entity === 'Deal' && (log.action === 'CREATE' || log.action === 'UPDATE')) {
        stats.deals += 1
      }
      
      // Invoice PAID durumu - meta'dan status kontrol et
      // NOT: avgSales henüz tanımlanmadı, bu yüzden sadece meta'dan gelen değeri kullan
      if (log.entity === 'Invoice' && log.action === 'UPDATE') {
        try {
          const meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta
          if (meta?.status === 'PAID' || meta?.newStatus === 'PAID' || meta?.oldStatus === 'PAID') {
            // PAID invoice değerini meta'dan al
            const invoiceValue = meta?.total || meta?.amount || meta?.value || 0
            if (invoiceValue > 0) {
              stats.sales += invoiceValue
            }
          }
        } catch (e) {
          // Meta parse edilemezse, sadece log action'ına bak (değer ekleme)
        }
      }
      
      // Invoice CREATE durumu - yeni fatura oluşturulduğunda
      if (log.entity === 'Invoice' && log.action === 'CREATE') {
        try {
          const meta = typeof log.meta === 'string' ? JSON.parse(log.meta) : log.meta
          const invoiceValue = meta?.total || meta?.amount || meta?.value || 0
          if (invoiceValue > 0) {
            stats.sales += invoiceValue
          }
        } catch (e) {
          // Meta parse edilemezse, varsayılan değer ekleme
        }
      }
      
      userStats.set(log.userId, stats)
    })
    
    // Eğer ActivityLog'da veri yoksa, toplam değerleri kullanıcı sayısına eşit dağıt
    const userCount = users.length || 1
    const avgSales = totalSales > 0 ? totalSales / userCount : 0
    const avgQuotes = totalQuotes > 0 ? Math.round(totalQuotes / userCount) : 0
    const avgDeals = totalDeals > 0 ? Math.round(totalDeals / userCount) : 0
    
    // Eğer hiç ActivityLog verisi yoksa ve toplam değerler de 0 ise, her kullanıcıya minimum değer ver
    const hasActivityData = Array.from(userStats.values()).some(stats => stats.sales > 0 || stats.quotes > 0 || stats.deals > 0)

    // Kullanıcı listesine göre performans verilerini oluştur
    const performance = users.map((user: { id: string; name: string }) => {
      const stats = userStats.get(user.id) || { sales: 0, quotes: 0, deals: 0 }
      
      // ActivityLog'dan gelen gerçek verileri kullan - sahte değerler verme
      // Eğer veri yoksa 0 göster, minimum değerler verme (multi-tenant güvenlik için)
      let finalSales = stats.sales
      let finalQuotes = stats.quotes
      let finalDeals = stats.deals
      
      // Eğer ActivityLog'dan veri yoksa ve toplam değerler varsa, eşit dağıtım kullan
      // Ama sadece gerçek veri varsa - sahte minimum değerler verme
      if (finalSales === 0 && avgSales > 0 && hasActivityData) {
        finalSales = Math.round(avgSales)
      } else if (finalSales === 0 && totalSales > 0 && hasActivityData) {
        finalSales = Math.round(totalSales / userCount)
      }
      // Hiç veri yoksa 0 göster - sahte değerler verme
      
      if (finalQuotes === 0 && avgQuotes > 0 && hasActivityData) {
        finalQuotes = avgQuotes
      } else if (finalQuotes === 0 && totalQuotes > 0 && hasActivityData) {
        finalQuotes = Math.round(totalQuotes / userCount)
      }
      // Hiç veri yoksa 0 göster - sahte değerler verme
      
      if (finalDeals === 0 && avgDeals > 0 && hasActivityData) {
        finalDeals = avgDeals
      } else if (finalDeals === 0 && totalDeals > 0 && hasActivityData) {
        finalDeals = Math.round(totalDeals / userCount)
      }
      // Hiç veri yoksa 0 göster - sahte değerler verme
      
      return {
        user: user.name || 'Kullanıcı',
        sales: Math.max(0, finalSales),
        quotes: Math.max(0, finalQuotes),
        deals: Math.max(0, finalDeals),
      }
    })

    // Debug: Performance verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('User Performance API - Performance array length:', performance.length)
      console.log('User Performance API - Performance data:', performance)
    }

    // Cache kaldırıldı - multi-tenant güvenlik için fresh data gerekli
    return NextResponse.json(
      { performance },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('User Performance API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch user performance' },
      { status: 500 }
    )
  }
}





