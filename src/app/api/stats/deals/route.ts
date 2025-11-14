import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST/PUT sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    // SuperAdmin kontrolü - SuperAdmin companyId olmadan da erişebilir
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    if (!session?.user || (!session?.user?.companyId && !isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // DEBUG: Session ve companyId kontrolü logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stats Deals API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
        isSuperAdmin: isSuperAdmin,
      })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Tüm deal'ları çek - limit yok (tüm verileri çek)
    // ÖNEMLİ: Deal-kanban API'si ile AYNI kolonları seç (tutarlılık için)
    // ÖNEMLİ: status kolonu migration 072'de eklenmiş olmalı, yoksa hata vermemesi için fallback
    let query = supabase
      .from('Deal')
      .select('id, title, stage, value, customerId, createdAt, companyId') // Status olmadan başla
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse MUTLAKA filtrele)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
      // DEBUG: companyId filtresi uygulandı
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Stats Deals API] 🔒 Deal query filtered by companyId:', companyId)
      }
    } else {
      // DEBUG: SuperAdmin - tüm firmaları göster
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Stats Deals API] 👑 SuperAdmin - showing all companies')
      }
    }
    
    // Status kolonunu kontrol et - önce status olmadan deneyelim
    let deals: any[] = []
    let error: any = null
    
    const { data: dealsWithoutStatus, error: errorWithoutStatus } = await query
    
    if (errorWithoutStatus && (errorWithoutStatus.message?.includes('status') || (errorWithoutStatus.message?.includes('column') && errorWithoutStatus.message?.includes('does not exist')))) {
      // Status kolonu yok, status olmadan kullan
      error = null
      deals = dealsWithoutStatus || []
    } else if (errorWithoutStatus) {
      // Başka bir hata var
      error = errorWithoutStatus
      deals = []
    } else {
      // Status kolonu var, status ile tekrar çek
      let queryWithStatus = supabase
        .from('Deal')
        .select('id, title, stage, value, customerId, createdAt, status, companyId')
        .order('createdAt', { ascending: false })
      
      // Filtreleri tekrar uygula
      if (!isSuperAdmin) {
        queryWithStatus = queryWithStatus.eq('companyId', companyId)
      }
      
      const { data: dealsWithStatus, error: errorWithStatus } = await queryWithStatus
      error = errorWithStatus
      deals = dealsWithStatus || []
    }
    
    if (error && !(error.message?.includes('status') || (error.message?.includes('column') && error.message?.includes('does not exist')))) {
      console.error('[Stats Deals API] Deal data fetch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch deal stats' },
        { status: 500 }
      )
    }
    
    // Null check - deals undefined olabilir
    if (!deals || !Array.isArray(deals)) {
      console.error('[Stats Deals API] Deals is not an array:', deals)
      return NextResponse.json(
        { error: 'Invalid deals data' },
        { status: 500 }
      )
    }
    
    // JavaScript'te say (deal-kanban API'si ile aynı mantık - DOĞRU SONUÇ)
    const leadCount = deals.filter((d: any) => d.stage === 'LEAD').length
    const contactedCount = deals.filter((d: any) => d.stage === 'CONTACTED').length
    const proposalCount = deals.filter((d: any) => d.stage === 'PROPOSAL').length
    const negotiationCount = deals.filter((d: any) => d.stage === 'NEGOTIATION').length
    const wonCount = deals.filter((d: any) => d.stage === 'WON').length
    const lostCount = deals.filter((d: any) => d.stage === 'LOST').length
    const openCount = deals.filter((d: any) => d.status === 'OPEN' || (!d.status && d.stage !== 'WON' && d.stage !== 'LOST')).length
    const totalCount = deals.length
    
    // Bu ay oluşturulan deal'lar - doğru hesaplama
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = deals.filter((d: any) => {
      if (!d.createdAt) return false
      const dealDate = new Date(d.createdAt)
      return dealDate >= new Date(firstDayOfMonth)
    }).length
    
    // Tüm deal'ların toplam değeri
    const totalValue = deals.reduce((sum: number, deal: any) => {
      const dealValue = deal.value || (typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : 0)
      return sum + dealValue
    }, 0) || 0

    // OPEN olan deal'ların toplam değeri (aktif tutar)
    const openDeals = deals.filter((d: any) => d.status === 'OPEN') || []
    const activeValue = openDeals.reduce((sum: number, deal: any) => {
      const dealValue = deal.value || (typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : 0)
      return sum + dealValue
    }, 0) || 0

    // Ortalama değer (tüm deal'lar için)
    const avgValue = totalCount > 0 ? Math.round(totalValue / totalCount) : 0
    
    // Aktif deal'lar: OPEN status'ündeki deal'lar
    const active = openCount

    // Debug: Değerleri logla (development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stats Deals API] Counted from deals array:', {
        leadCount,
        contactedCount,
        proposalCount,
        negotiationCount,
        wonCount,
        lostCount,
        openCount,
        totalCount,
        thisMonthCount,
        totalDealsFetched: deals?.length || 0,
        firstDayOfMonth,
        totalValue,
        activeValue,
        avgValue,
        active,
      })
    }

    return NextResponse.json(
      {
        total: totalCount, // JavaScript'te sayılan toplam (deal-kanban API'si ile aynı mantık - DOĞRU)
        active, // OPEN olan deal sayısı (JavaScript'te sayılan)
        totalValue, // Tüm deal'ların toplam değeri
        activeValue, // OPEN olan deal'ların toplam değeri (aktif tutar)
        avgValue, // Ortalama değer
        thisMonth: thisMonthCount, // JavaScript'te sayılan bu ay count
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch deal stats' },
      { status: 500 }
    )
  }
}



