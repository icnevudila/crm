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
    let dealId = ''
    let search = ''
    let filterCompanyId = '' // SuperAdmin için firma filtresi
    
    try {
      const { searchParams } = new URL(request.url)
      dealId = searchParams.get('dealId') || ''
      search = searchParams.get('search') || ''
      filterCompanyId = searchParams.get('filterCompanyId') || ''
    } catch (error) {
      // request.url undefined veya geçersizse, filtreler boş kalır
      if (process.env.NODE_ENV === 'development') {
        console.warn('Quote Kanban API: Could not parse request.url', error)
      }
    }

    // Tüm quote'ları çek - limit yok (tüm verileri çek)
    let query = supabase
      .from('Quote')
        .select('id, title, status, totalAmount, dealId, createdAt, updatedAt, notes') // ✅ ÇÖZÜM: notes kolonu migration ile eklendi (057_add_quote_notes.sql)
      .order('updatedAt', { ascending: false }) // ✅ ÇÖZÜM: updatedAt'e göre sırala - en son güncellenen en üstte
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    // Filtreler
    if (dealId) {
      query = query.eq('dealId', dealId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    const { data: quotes, error } = await query
    
    if (error) {
      console.error('[Quote Kanban API] Quote data fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ kanban: [] })
    }

    // Status'lere göre grupla - REJECTED ve DECLINED ikisini tek kolonda birleştir
    // ÖNEMLİ: DECLINED status'ünü REJECTED olarak normalize et - tek kolon göster
    const normalizedQuotes = quotes.map((quote: any) => {
      // DECLINED → REJECTED olarak normalize et
      if (quote.status === 'DECLINED') {
        return { ...quote, status: 'REJECTED' }
      }
      return quote
    })
    
    const statuses = ['DRAFT', 'SENT', 'WAITING', 'ACCEPTED', 'REJECTED']
    const kanban = statuses.map((status) => {
      const statusQuotes = normalizedQuotes.filter((quote: any) => quote.status === status)
      // ✅ ÇÖZÜM: Her status kolonu içinde updatedAt'e göre sırala - en son güncellenen en üstte
      statusQuotes.sort((a: any, b: any) => {
        const aUpdated = new Date(a.updatedAt || a.createdAt).getTime()
        const bUpdated = new Date(b.updatedAt || b.createdAt).getTime()
        return bUpdated - aUpdated // En son güncellenen en üstte
      })
      // Her status için toplam tutarı hesapla - DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount) - total kolonu artık yok!
      const totalValue = statusQuotes.reduce((sum: number, quote: any) => {
        const quoteValue = quote.totalAmount || (typeof quote.totalAmount === 'string' ? parseFloat(quote.totalAmount) || 0 : 0)
        return sum + quoteValue
      }, 0)
      return {
        status,
        count: statusQuotes.length,
        totalValue, // Her status için toplam tutar
        quotes: statusQuotes.map((quote: any) => ({
          id: quote.id,
          title: quote.title,
          totalAmount: quote.totalAmount || 0, // DÜZELTME: totalAmount kullan (total kolonu artık yok!)
          dealId: quote.dealId,
          createdAt: quote.createdAt,
            updatedAt: quote.updatedAt, // ✅ ÇÖZÜM: updatedAt ekle - status güncellemesi sonrası sıralama için
            notes: quote.notes || null, // ✅ ÇÖZÜM: notes kolonu migration ile eklendi (057_add_quote_notes.sql)
          })),
      }
    })

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
    console.error('Quote kanban exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote kanban' },
      { status: 500 }
    )
  }
}






