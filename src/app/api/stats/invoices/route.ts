import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
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
      { count: paid },
      { count: draft },
      { count: sent },
      { count: overdue },
      { count: cancelled },
      { data: invoiceData },
      { count: thisMonth },
    ] = await Promise.all([
      // Toplam fatura sayısı
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // PAID faturalar
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'PAID')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // DRAFT faturalar
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // SENT faturalar
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'SENT')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // OVERDUE faturalar
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'OVERDUE')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // CANCELLED faturalar
      (() => {
        let query = supabase.from('Invoice').select('*', { count: 'exact', head: true }).eq('status', 'CANCELLED')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Toplam fatura değerleri - TÜM verileri çek (limit yok, status hesaplaması için gerekli)
      (() => {
        let query = supabase.from('Invoice').select('total, status').limit(10000)
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bu ay oluşturulan faturalar
      (() => {
        let query = supabase
          .from('Invoice')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(new Date().setDate(1)).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    // ÖNEMLİ: invoiceData üzerinden doğrudan hesaplama yap - count değerlerine güvenme
    // Çünkü count değerleri yanlış olabilir ama invoiceData gerçek veriyi içerir
    const invoices = invoiceData || []
    
    // Status bazlı sayıları invoiceData'dan hesapla (count yerine)
    const paidInvoices = invoices.filter((inv: any) => inv.status === 'PAID')
    const paidCount = paidInvoices.length
    const draftCount = invoices.filter((inv: any) => inv.status === 'DRAFT').length
    const sentCount = invoices.filter((inv: any) => inv.status === 'SENT').length
    const overdueCount = invoices.filter((inv: any) => inv.status === 'OVERDUE').length
    const cancelledCount = invoices.filter((inv: any) => inv.status === 'CANCELLED').length
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Stats API - PAID invoices:', {
        totalInvoices: invoices.length,
        paidCount,
        paidInvoiceIds: paidInvoices.map((inv: any) => inv.id),
        paidInvoiceTitles: paidInvoices.map((inv: any) => inv.title),
      })
    }
    
    // Toplam değer hesapla
    const totalValue = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0
    
    // Ödenmemiş faturalar: DRAFT + SENT + OVERDUE (PAID ve CANCELLED hariç)
    // ÖNEMLİ: invoiceData'dan hesapla, count değerlerine güvenme
    const unpaid = draftCount + sentCount + overdueCount
    const unpaidValue = invoices
      .filter((inv: any) => inv.status === 'DRAFT' || inv.status === 'SENT' || inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0
    
    // Aktif faturalar: SENT + PAID + OVERDUE (CANCELLED hariç)
    // ÖNEMLİ: invoiceData'dan hesapla, count değerlerine güvenme
    const active = sentCount + paidCount + overdueCount
    const activeInvoices = invoices.filter((inv: any) => 
      inv.status === 'SENT' || inv.status === 'PAID' || inv.status === 'OVERDUE'
    ) || []
    const activeValue = activeInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0
    
    // Mantıksal kontrol: TOPLAM = PAID + DRAFT + SENT + OVERDUE + CANCELLED olmalı
    // Eğer eşleşmiyorsa, invoiceData'dan hesaplanan total'i kullan
    const calculatedTotal = paidCount + draftCount + sentCount + overdueCount + cancelledCount
    const finalTotal = calculatedTotal > 0 ? calculatedTotal : (total || 0)

    return NextResponse.json(
      {
        total: finalTotal, // invoiceData'dan hesaplanan total (mantıksal kontrol ile)
        paid: paidCount, // invoiceData'dan hesaplanan paid count
        unpaid, // DRAFT + SENT + OVERDUE (invoiceData'dan hesaplanan)
        overdue: overdueCount, // invoiceData'dan hesaplanan overdue count
        active, // SENT + PAID + OVERDUE (invoiceData'dan hesaplanan)
        draft: draftCount, // invoiceData'dan hesaplanan draft count
        cancelled: cancelledCount, // invoiceData'dan hesaplanan cancelled count
        sent: sentCount, // invoiceData'dan hesaplanan sent count
        totalValue,
        unpaidValue, // DRAFT + SENT + OVERDUE toplam tutarı
        activeValue, // SENT + PAID + OVERDUE toplam tutarı
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
      { error: error.message || 'Failed to fetch invoice stats' },
      { status: 500 }
    )
  }
}



