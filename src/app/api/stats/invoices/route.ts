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

    // Tüm invoice'ları çek - limit yok (tüm verileri çek)
    // ÖNEMLİ: totalAmount kolonunu çek (050 migration ile total → totalAmount olarak değiştirildi)
    let query = supabase
      .from('Invoice')
      .select('id, status, totalAmount, createdAt')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: invoices, error } = await query
    
    if (error) {
      console.error('[Stats Invoices API] Invoice data fetch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch invoice stats' },
        { status: 500 }
      )
    }
    
    // Null check - invoices undefined olabilir
    if (!invoices || !Array.isArray(invoices)) {
      console.error('[Stats Invoices API] Invoices is not an array:', invoices)
      return NextResponse.json(
        { error: 'Invalid invoices data' },
        { status: 500 }
      )
    }
    
    // JavaScript'te say (invoice-kanban API'si ile aynı mantık - DOĞRU SONUÇ)
    const draftCount = invoices.filter((inv: any) => inv.status === 'DRAFT').length
    const sentCount = invoices.filter((inv: any) => inv.status === 'SENT').length
    const paidCount = invoices.filter((inv: any) => inv.status === 'PAID').length
    const overdueCount = invoices.filter((inv: any) => inv.status === 'OVERDUE').length
    const cancelledCount = invoices.filter((inv: any) => inv.status === 'CANCELLED').length
    const shippedCount = invoices.filter((inv: any) => inv.status === 'SHIPPED').length
    const receivedCount = invoices.filter((inv: any) => inv.status === 'RECEIVED').length
    const totalCount = invoices.length
    
    // Bu ay oluşturulan faturalar - doğru hesaplama
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = invoices.filter((inv: any) => {
      if (!inv.createdAt) return false
      const invoiceDate = new Date(inv.createdAt)
      return invoiceDate >= new Date(firstDayOfMonth)
    }).length
    
    // Debug: JavaScript'te sayılan değerleri logla - HER ZAMAN logla (sorun tespiti için)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stats Invoices API] Counted from invoices array:', {
        draftCount,
        sentCount,
        paidCount,
        overdueCount,
        cancelledCount,
        shippedCount,
        receivedCount,
        totalCount,
        thisMonthCount,
        totalInvoicesFetched: invoices?.length || 0,
        firstDayOfMonth,
      })
    }
    
    // Toplam değer hesapla - totalAmount kullan (050 migration ile total → totalAmount olarak değiştirildi)
    const totalValue = invoices.reduce((sum: number, inv: any) => {
      const invValue = inv.totalAmount || (typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) || 0 : 0)
      return sum + invValue
    }, 0) || 0
    
    // Ödenmemiş faturalar: DRAFT + SENT + OVERDUE (PAID ve CANCELLED hariç)
    const unpaid = draftCount + sentCount + overdueCount
    const unpaidInvoices = invoices.filter((inv: any) => 
      inv.status === 'DRAFT' || inv.status === 'SENT' || inv.status === 'OVERDUE'
    ) || []
    const unpaidValue = unpaidInvoices.reduce((sum: number, inv: any) => {
      const invValue = inv.totalAmount || (typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) || 0 : 0)
      return sum + invValue
    }, 0) || 0
    
    // Aktif faturalar: SENT + PAID + OVERDUE (CANCELLED hariç)
    const active = sentCount + paidCount + overdueCount
    const activeInvoices = invoices.filter((inv: any) => 
      inv.status === 'SENT' || inv.status === 'PAID' || inv.status === 'OVERDUE'
    ) || []
    const activeValue = activeInvoices.reduce((sum: number, inv: any) => {
      const invValue = inv.totalAmount || (typeof inv.totalAmount === 'string' ? parseFloat(inv.totalAmount) || 0 : 0)
      return sum + invValue
    }, 0) || 0
    
    // Toplam sayı: JavaScript'te sayılan değerleri kullan (invoice-kanban API'si ile aynı mantık)
    const finalTotal = totalCount

    return NextResponse.json(
      {
        total: finalTotal, // JavaScript'te sayılan toplam (invoice-kanban API'si ile aynı mantık - DOĞRU)
        paid: paidCount, // JavaScript'te sayılan paid count
        unpaid, // DRAFT + SENT + OVERDUE (JavaScript'te sayılan)
        overdue: overdueCount, // JavaScript'te sayılan overdue count
        active, // SENT + PAID + OVERDUE (JavaScript'te sayılan)
        draft: draftCount, // JavaScript'te sayılan draft count
        cancelled: cancelledCount, // JavaScript'te sayılan cancelled count
        sent: sentCount, // JavaScript'te sayılan sent count
        shipped: shippedCount, // JavaScript'te sayılan shipped count
        received: receivedCount, // JavaScript'te sayılan received count
        totalValue, // Tüm invoice'ların toplam tutarı
        unpaidValue, // DRAFT + SENT + OVERDUE toplam tutarı
        activeValue, // SENT + PAID + OVERDUE toplam tutarı
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
      { error: error.message || 'Failed to fetch invoice stats' },
      { status: 500 }
    )
  }
}



