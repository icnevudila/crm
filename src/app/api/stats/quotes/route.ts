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
      console.log('[Stats Quotes API] 🔍 Session Check:', {
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

    // Tüm quote'ları çek - limit yok (tüm verileri çek)
    let query = supabase
      .from('Quote')
      .select('id, status, totalAmount, createdAt, companyId') // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount) - companyId eklendi
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse MUTLAKA filtrele)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
      // DEBUG: companyId filtresi uygulandı
      if (process.env.NODE_ENV === 'development') {
        console.log('[Stats Quotes API] 🔒 Quote query filtered by companyId:', companyId)
      }
    } else {
      // DEBUG: SuperAdmin - tüm firmaları göster
      if (process.env.NODE_ENV === 'development') {
        console.log('[Stats Quotes API] 👑 SuperAdmin - showing all companies')
      }
    }
    
    const { data: quotes, error } = await query
    
    if (error) {
      console.error('[Stats Quotes API] Quote data fetch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quote stats' },
        { status: 500 }
      )
    }
    
    // Null check - quotes undefined olabilir
    if (!quotes || !Array.isArray(quotes)) {
      console.error('[Stats Quotes API] Quotes is not an array:', quotes)
      return NextResponse.json(
        { error: 'Invalid quotes data' },
        { status: 500 }
      )
    }
    
    // JavaScript'te say (quote-kanban API'si ile aynı mantık - DOĞRU SONUÇ)
    const draftCount = quotes.filter((q: any) => q.status === 'DRAFT').length
    const sentCount = quotes.filter((q: any) => q.status === 'SENT').length
    const acceptedCount = quotes.filter((q: any) => q.status === 'ACCEPTED').length
    const rejectedCount = quotes.filter((q: any) => q.status === 'REJECTED').length
    const waitingCount = quotes.filter((q: any) => q.status === 'WAITING').length
    const totalCount = quotes.length
    
    // Bu ay oluşturulan teklifler - doğru hesaplama
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = quotes.filter((q: any) => {
      if (!q.createdAt) return false
      const quoteDate = new Date(q.createdAt)
      return quoteDate >= new Date(firstDayOfMonth)
    }).length
    
    // Debug: JavaScript'te sayılan değerleri logla - HER ZAMAN logla (sorun tespiti için)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stats Quotes API] Counted from quotes array:', {
        draftCount,
        sentCount,
        acceptedCount,
        rejectedCount,
        waitingCount,
        totalCount,
        thisMonthCount,
        totalQuotesFetched: quotes?.length || 0,
        firstDayOfMonth,
      })
    }
    
    // Total value hesaplaması (tüm quote'ların totalAmount'ını topla) - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    const totalValue = quotes.reduce((sum: number, quote: any) => {
      const quoteValue = quote.totalAmount || (typeof quote.totalAmount === 'string' ? parseFloat(quote.totalAmount) || 0 : 0)
      return sum + quoteValue
    }, 0) || 0
    
    const pending = draftCount + sentCount
    // Aktif teklifler: SENT, WAITING, ACCEPTED durumundaki teklifler
    const active = sentCount + acceptedCount + waitingCount
    // Aktif tekliflerin toplam tutarı - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    const activeQuotes = quotes.filter((q: any) => q.status === 'SENT' || q.status === 'ACCEPTED' || q.status === 'WAITING') || []
    const activeValue = activeQuotes.reduce((sum: number, quote: any) => {
      const quoteValue = quote.totalAmount || (typeof quote.totalAmount === 'string' ? parseFloat(quote.totalAmount) || 0 : 0)
      return sum + quoteValue
    }, 0) || 0
    
    // Toplam sayı: JavaScript'te sayılan değerleri kullan (quote-kanban API'si ile aynı mantık)
    // Bu yöntem DOĞRU çünkü quote-kanban API'si de aynı şekilde çalışıyor ve doğru sonuç veriyor
    const finalTotal = totalCount

    return NextResponse.json(
      {
        total: finalTotal, // JavaScript'te sayılan toplam (quote-kanban API'si ile aynı mantık - DOĞRU)
        draft: draftCount, // JavaScript'te sayılan draft count
        sent: sentCount, // JavaScript'te sayılan sent count
        accepted: acceptedCount, // JavaScript'te sayılan accepted count
        rejected: rejectedCount, // JavaScript'te sayılan rejected count
        waiting: waitingCount, // JavaScript'te sayılan waiting count
        pending, // DRAFT + SENT
        active, // Aktif teklifler (SENT + ACCEPTED + WAITING)
        totalValue, // Tüm quote'ların toplam tutarı
        activeValue, // Aktif tekliflerin toplam tutarı
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
      { error: error.message || 'Failed to fetch quote stats' },
      { status: 500 }
    )
  }
}



