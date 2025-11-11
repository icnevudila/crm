import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deal Kanban API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    
    // Filtre parametreleri - güvenli parse
    let customerId = ''
    let search = ''
    let minValue: string | null = null
    let maxValue: string | null = null
    let startDate: string | null = null
    let endDate: string | null = null
    
    try {
      const { searchParams } = new URL(request.url)
      customerId = searchParams.get('customerId') || ''
      search = searchParams.get('search') || ''
      minValue = searchParams.get('minValue')
      maxValue = searchParams.get('maxValue')
      startDate = searchParams.get('startDate')
      endDate = searchParams.get('endDate')
    } catch (error) {
      // request.url undefined veya geçersizse, filtreler boş kalır
      if (process.env.NODE_ENV === 'development') {
        console.warn('Deal Kanban API: Could not parse request.url', error)
      }
    }

    // Tüm deal'ları çek - limit yok (tüm verileri çek)
    // Customer join'i ekle (performans için sadece gerekli alanlar)
    // NOT: lostReason kolonu migration 033'te eklenmiş olmalı, yoksa hata verir
    // PERFORMANS: Sadece gerekli kolonları çek, updatedAt index'i kullan
    let query = supabase
      .from('Deal')
      .select(`
        id, 
        title, 
        stage, 
        value, 
        customerId, 
        createdAt, 
        updatedAt,
        status,
        Customer:customerId (
          id,
          name
        )
      `)
      .order('updatedAt', { ascending: false }) // En son güncellenen en üstte (idx_deal_updated_at index'i kullanılır)
      .order('createdAt', { ascending: false }) // Aynı updatedAt için createdAt'e göre
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Filtreler
    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (minValue) {
      query = query.gte('value', parseFloat(minValue))
    }

    if (maxValue) {
      query = query.lte('value', parseFloat(maxValue))
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    const { data: deals, error: queryError } = await query

    // Debug: Deals verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Deal Kanban API - Deals count:', deals?.length || 0)
      console.log('Deal Kanban API - Deals sample:', deals?.slice(0, 3)) // İlk 3 deal'i göster
      if (deals && deals.length > 0) {
        console.log('Deal Kanban API - First deal:', deals[0])
        console.log('Deal Kanban API - Deal stages:', [...new Set(deals.map((d: any) => d.stage))])
      } else {
        console.warn('Deal Kanban API - No deals found!')
      }
    }

    if (queryError) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Deal kanban query error:', queryError)
      }
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // Stage'lere göre grupla - CONTACTED dahil
    const stages = ['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const kanban = stages.map((stage) => {
      const stageDeals = (deals || []).filter((deal: any) => deal.stage === stage)
      
      // ✅ ÇÖZÜM: Her stage kolonu içinde updatedAt'e göre sırala - en son güncellenen en üstte
      stageDeals.sort((a: any, b: any) => {
        const aUpdated = new Date(a.updatedAt || a.createdAt).getTime()
        const bUpdated = new Date(b.updatedAt || b.createdAt).getTime()
        return bUpdated - aUpdated // En son güncellenen en üstte
      })
      
      // Her stage için toplam tutar hesapla - value string olabilir, parseFloat kullan
      const totalValue = stageDeals.reduce((sum: number, deal: any) => {
        const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0)
        return sum + dealValue
      }, 0)
      
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development') {
        console.log(`Deal Kanban API - Stage: ${stage}`, {
          stageDealsCount: stageDeals.length,
          totalValue,
          deals: stageDeals.map((d: any) => ({ id: d.id, title: d.title, value: d.value, valueType: typeof d.value, updatedAt: d.updatedAt })),
        })
      }
      
      return {
        stage,
        count: stageDeals.length,
        totalValue, // Her stage için toplam tutar (0 dahil)
        deals: stageDeals.map((deal: any) => ({
          id: deal.id,
          title: deal.title,
          value: typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0),
          customerId: deal.customerId,
          customer: deal.Customer ? { name: deal.Customer.name, id: deal.Customer.id } : undefined,
          Customer: deal.Customer ? { name: deal.Customer.name, id: deal.Customer.id } : undefined,
          status: deal.status,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt || deal.createdAt, // ✅ ÇÖZÜM: updatedAt ekle - sıralama için
          lostReason: deal.lostReason || undefined, // Kayıp sebebi (migration 033 - eğer kolon yoksa undefined)
        })),
      }
    })

    // Debug: Kanban verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Deal Kanban API - Kanban array length:', kanban.length)
      console.log('Deal Kanban API - Kanban data:', kanban.map((col: any) => ({
        stage: col.stage,
        count: col.count,
        totalValue: col.totalValue,
        dealsCount: col.deals?.length || 0,
      })))
    }

    // Cache headers - Performans için 60 saniye cache (repo kurallarına uygun)
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı ama Next.js edge cache kullanabiliriz
    return NextResponse.json(
      { kanban },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // 60 saniye cache, 120 saniye stale-while-revalidate
        },
      }
    )
  } catch (error: any) {
    // Production'da console.error kaldırıldı
    if (process.env.NODE_ENV === 'development') {
      console.error('Deal kanban API error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to fetch deal kanban', message: error?.message },
      { status: 500 }
    )
  }
}



