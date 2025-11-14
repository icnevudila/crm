import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// ✅ %100 KESİN ÇÖZÜM: Cache'i tamamen kapat - her çağrıda fresh data
// ÖNEMLİ: Next.js App Router'ın API route cache'ini tamamen kapat
export const revalidate = 0 // Revalidation'ı kapat
export const dynamic = 'force-dynamic' // Dynamic route - her zaman çalıştır
export const fetchCache = 'force-no-store' // Fetch cache'ini kapat
export const runtime = 'nodejs' // Edge yerine Node zorla (cache sorunlarını önlemek için)

export async function GET(request: Request) {
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
    
    // Filtre parametreleri - güvenli parse
    let customerId = ''
    let customerCompanyId = '' // Firma bazlı filtreleme
    let search = ''
    let minValue: string | null = null
    let maxValue: string | null = null
    let startDate: string | null = null
    let endDate: string | null = null
    let filterCompanyId = '' // SuperAdmin için firma filtresi
    
    try {
      const { searchParams } = new URL(request.url)
      customerId = searchParams.get('customerId') || ''
      customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
      search = searchParams.get('search') || ''
      minValue = searchParams.get('minValue')
      maxValue = searchParams.get('maxValue')
      startDate = searchParams.get('startDate')
      endDate = searchParams.get('endDate')
      filterCompanyId = searchParams.get('filterCompanyId') || ''
    } catch (error) {
      // request.url undefined veya geçersizse, filtreler boş kalır
      if (process.env.NODE_ENV === 'development') {
        console.warn('Deal Kanban API: Could not parse request.url', error)
      }
    }

    // Tüm deal'ları çek - limit yok (tüm verileri çek)
    // Customer join'i ekle (performans için sadece gerekli alanlar)
    // NOT: lostReason kolonu migration 033'te eklenmiş olmalı, yoksa hata verir
    // PERFORMANS: Sadece gerekli kolonları çek
    // ÖNEMLİ: displayOrder kolonu migration 062'de eklenmiş olmalı
    // Eğer displayOrder kolonu yoksa migration 062'yi çalıştırın!
    // NOT: displayOrder kolonu select'te var ama .order() kullanılmıyor (kolon yoksa hata vermemesi için)
    // ÖNEMLİ: status kolonu migration 072'de eklenmiş olmalı, yoksa hata verir
    let query = supabase
      .from('Deal')
      .select(`
        id, 
        title, 
        stage, 
        value, 
        customerId, 
        customerCompanyId, 
        createdAt, 
        updatedAt,
        displayOrder,
        Customer:customerId (
          id,
          name
        )
      `)
      .order('updatedAt', { ascending: false }) // updatedAt'e göre sırala (displayOrder yoksa)
      .order('createdAt', { ascending: false }) // Aynı updatedAt için createdAt'e göre
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    // Filtreler
    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    // Firma bazlı filtreleme (customerCompanyId)
    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
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

    // Status kolonunu kontrol et (kolon yoksa hata vermemesi için)
    // Önce status olmadan deneyelim, sonra varsa ekleyelim
    let deals: any[] = []
    let queryError: any = null
    
    // Önce status olmadan deneyelim
    const { data: dealsWithoutStatus, error: errorWithoutStatus } = await query
    
    if (errorWithoutStatus && (errorWithoutStatus.message?.includes('status') || (errorWithoutStatus.message?.includes('column') && errorWithoutStatus.message?.includes('does not exist')))) {
      // Status kolonu yok, status olmadan kullan
      queryError = null
      deals = dealsWithoutStatus || []
    } else if (errorWithoutStatus) {
      // Başka bir hata var
      queryError = errorWithoutStatus
      deals = []
    } else {
      // Status kolonu var, status ile tekrar çek
      let queryWithStatus = supabase
        .from('Deal')
        .select(`
          id, 
          title, 
          stage, 
          value, 
          customerId, 
          customerCompanyId, 
          createdAt, 
          updatedAt,
          status,
          displayOrder,
          Customer:customerId (
            id,
            name
          )
        `)
        .order('updatedAt', { ascending: false })
        .order('createdAt', { ascending: false })
      
      // Filtreleri tekrar uygula
      if (!isSuperAdmin) {
        queryWithStatus = queryWithStatus.eq('companyId', companyId)
      } else if (filterCompanyId) {
        queryWithStatus = queryWithStatus.eq('companyId', filterCompanyId)
      }
      
      if (customerId) {
        queryWithStatus = queryWithStatus.eq('customerId', customerId)
      }
      if (customerCompanyId) {
        queryWithStatus = queryWithStatus.eq('customerCompanyId', customerCompanyId)
      }
      if (search) {
        queryWithStatus = queryWithStatus.ilike('title', `%${search}%`)
      }
      if (minValue) {
        queryWithStatus = queryWithStatus.gte('value', parseFloat(minValue))
      }
      if (maxValue) {
        queryWithStatus = queryWithStatus.lte('value', parseFloat(maxValue))
      }
      if (startDate) {
        queryWithStatus = queryWithStatus.gte('createdAt', startDate)
      }
      if (endDate) {
        queryWithStatus = queryWithStatus.lte('createdAt', endDate)
      }
      
      const { data: dealsWithStatus, error: errorWithStatus } = await queryWithStatus
      queryError = errorWithStatus
      deals = dealsWithStatus || []
    }

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
      
      // ✅ ÇÖZÜM: Her stage kolonu içinde displayOrder'a göre sırala - Kanban sıralama için
      stageDeals.sort((a: any, b: any) => {
        // Önce displayOrder'a göre sırala (0 ise en alta)
        const aOrder = a.displayOrder || 999999
        const bOrder = b.displayOrder || 999999
        if (aOrder !== bOrder) {
          return aOrder - bOrder // Küçükten büyüğe (1, 2, 3...)
        }
        // Aynı displayOrder için updatedAt'e göre sırala
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

    // ✅ ÇÖZÜM: Cache'i tamamen kapat - her zaman fresh data çek
    return NextResponse.json(
      { kanban },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate, max-age=0', // ✅ ÇÖZÜM: Cache'i tamamen kapat - her zaman fresh data çek
          'Pragma': 'no-cache', // ✅ ÇÖZÜM: Eski browser'lar için cache'i kapat
          'Expires': '0', // ✅ ÇÖZÜM: Cache'i hemen expire et
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



