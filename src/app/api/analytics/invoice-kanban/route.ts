import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

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
    let quoteId = ''
    let search = ''
    let invoiceType = ''
    
    try {
      const { searchParams } = new URL(request.url)
      quoteId = searchParams.get('quoteId') || ''
      search = searchParams.get('search') || ''
      invoiceType = searchParams.get('invoiceType') || '' // SALES veya PURCHASE
    } catch (error) {
      // request.url undefined veya geçersizse, filtreler boş kalır
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invoice Kanban API: Could not parse request.url', error)
      }
    }

    // Tüm invoice'ları çek - limit yok (tüm verileri çek)
    // ÖNEMLİ: totalAmount kolonunu çek (050 migration ile total → totalAmount olarak değiştirildi)
    // serviceDescription kolonu migration 065 ile eklendi
    let query = supabase
      .from('Invoice')
      .select('id, title, status, totalAmount, quoteId, createdAt, invoiceType, serviceDescription')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Filtreler
    if (quoteId) {
      query = query.eq('quoteId', quoteId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    // invoiceType filtresi (SALES veya PURCHASE)
    if (invoiceType && (invoiceType === 'SALES' || invoiceType === 'PURCHASE')) {
      query = query.eq('invoiceType', invoiceType)
    }

    const { data: invoices, error } = await query

    // Debug: Invoices verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Kanban API - Invoices count:', invoices?.length || 0)
      console.log('Invoice Kanban API - Invoices sample:', invoices?.slice(0, 3)) // İlk 3 invoice'i göster
    }

    if (error) {
      console.error('Invoice kanban error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!invoices) {
      return NextResponse.json({ kanban: [] })
    }

    // Status'lere göre grupla
    const statuses = ['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']
    const kanban = statuses.map((status) => {
      const statusInvoices = invoices.filter((invoice: any) => invoice.status === status)
      // Her status için toplam tutarı hesapla - totalAmount kullan (050 migration ile total → totalAmount olarak değiştirildi)
      const totalValue = statusInvoices.reduce((sum: number, invoice: any) => {
        const value = invoice.totalAmount
        const invoiceValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
        return sum + invoiceValue
      }, 0)
      
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development' && status === 'PAID') {
        console.log('Invoice Kanban API - PAID invoices:', {
          totalInvoices: invoices.length,
          paidInvoices: statusInvoices.length,
          paidInvoiceIds: statusInvoices.map((inv: any) => inv.id),
          paidInvoiceTitles: statusInvoices.map((inv: any) => inv.title),
        })
      }
      
      return {
        status,
        count: statusInvoices.length,
        totalValue, // Her status için toplam tutar
        invoices: statusInvoices.map((invoice: any) => ({
          id: invoice.id,
          title: invoice.title,
          status: invoice.status || status, // Status eklendi (invoice.status varsa onu kullan, yoksa column status'ünü kullan)
          totalAmount: invoice.totalAmount || 0,
          quoteId: invoice.quoteId,
          createdAt: invoice.createdAt,
          invoiceType: invoice.invoiceType, // Fatura tipi eklendi
          serviceDescription: invoice.serviceDescription, // Hizmet açıklaması eklendi
        })),
      }
    })

    // Debug: Kanban verisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice Kanban API - Kanban array length:', kanban.length)
      console.log('Invoice Kanban API - Kanban data:', kanban.map((col: any) => ({
        status: col.status,
        count: col.count,
        totalValue: col.totalValue,
        invoicesCount: col.invoices?.length || 0,
      })))
    }

    return NextResponse.json(
      { kanban },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    console.error('Invoice kanban exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice kanban' },
      { status: 500 }
    )
  }
}

