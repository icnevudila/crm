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
    
    if (!session?.user?.companyId) {
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
        isSuperAdmin: session.user.role === 'SUPER_ADMIN',
      })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Tüm deal'ları çek - limit yok (tüm verileri çek)
    // ÖNEMLİ: Deal-kanban API'si ile AYNI kolonları seç (tutarlılık için)
    let query = supabase
      .from('Deal')
      .select('id, title, stage, value, customerId, createdAt, status, companyId') // DÜZELTME: deal-kanban API'si ile AYNI kolonları seç (tutarlılık için) - companyId eklendi
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse MUTLAKA filtrele)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
      // DEBUG: companyId filtresi uygulandı
      if (process.env.NODE_ENV === 'development') {
        console.log('[Stats Deals API] 🔒 Deal query filtered by companyId:', companyId)
      }
    } else {
      // DEBUG: SuperAdmin - tüm firmaları göster
      if (process.env.NODE_ENV === 'development') {
        console.log('[Stats Deals API] 👑 SuperAdmin - showing all companies')
      }
    }
    
    const { data: deals, error } = await query
    
    if (error) {
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
    const openCount = deals.filter((d: any) => d.status === 'OPEN').length
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



