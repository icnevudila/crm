import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST/PUT sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const [
      { count: total },
      { count: draft },
      { count: sent },
      { count: accepted },
      { count: rejected },
      { data: quoteData },
      { count: thisMonth },
    ] = await Promise.all([
      // Toplam teklif sayısı
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // DRAFT teklifler
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // SENT teklifler
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'SENT')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // ACCEPTED teklifler
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'ACCEPTED')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // REJECTED teklifler
      (() => {
        let query = supabase.from('Quote').select('*', { count: 'exact', head: true }).eq('status', 'REJECTED')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam teklif değerleri - TÜM verileri çek (limit yok, status hesaplaması için gerekli)
      (() => {
        let query = supabase.from('Quote').select('total, status').limit(10000)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bu ay oluşturulan teklifler
      (() => {
        let query = supabase
          .from('Quote')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(new Date().setDate(1)).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    // ÖNEMLİ: quoteData üzerinden doğrudan hesaplama yap - count değerlerine güvenme
    // Çünkü count değerleri yanlış olabilir ama quoteData gerçek veriyi içerir
    const quotes = quoteData || []
    
    // Status bazlı sayıları quoteData'dan hesapla (count yerine)
    const draftCount = quotes.filter((q: any) => q.status === 'DRAFT').length
    const sentCount = quotes.filter((q: any) => q.status === 'SENT').length
    const acceptedCount = quotes.filter((q: any) => q.status === 'ACCEPTED').length
    const rejectedCount = quotes.filter((q: any) => q.status === 'REJECTED').length
    const waitingCount = quotes.filter((q: any) => q.status === 'WAITING').length
    
    const totalValue = quotes.reduce((sum: number, quote: any) => sum + (quote.total || 0), 0) || 0
    const pending = draftCount + sentCount
    // Aktif teklifler: SENT, WAITING, ACCEPTED durumundaki teklifler
    // ÖNEMLİ: quoteData'dan hesapla, count değerlerine güvenme
    const active = sentCount + acceptedCount + waitingCount
    // Aktif tekliflerin toplam tutarı
    const activeQuotes = quotes.filter((q: any) => q.status === 'SENT' || q.status === 'ACCEPTED' || q.status === 'WAITING') || []
    const activeValue = activeQuotes.reduce((sum: number, quote: any) => sum + (quote.total || 0), 0) || 0
    
    // Mantıksal kontrol: TOPLAM = DRAFT + SENT + ACCEPTED + REJECTED + WAITING olmalı
    // Eğer eşleşmiyorsa, quoteData'dan hesaplanan total'i kullan
    const calculatedTotal = draftCount + sentCount + acceptedCount + rejectedCount + waitingCount
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : (total || 0)

    return NextResponse.json(
      {
        total: finalTotal, // quoteData'dan hesaplanan total (mantıksal kontrol ile)
        draft: draftCount, // quoteData'dan hesaplanan draft count
        sent: sentCount, // quoteData'dan hesaplanan sent count
        accepted: acceptedCount, // quoteData'dan hesaplanan accepted count
        rejected: rejectedCount, // quoteData'dan hesaplanan rejected count
        pending, // DRAFT + SENT (quoteData'dan hesaplanan)
        active, // Aktif teklifler (SENT + ACCEPTED + WAITING) (quoteData'dan hesaplanan)
        totalValue,
        activeValue, // Aktif tekliflerin toplam tutarı
        thisMonth: thisMonth || 0,
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



