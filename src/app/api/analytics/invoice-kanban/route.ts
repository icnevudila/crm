import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice Kanban API session error:', sessionError)
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
    const { searchParams } = new URL(request.url)
    
    // Filtre parametreleri
    const quoteId = searchParams.get('quoteId') || ''
    const search = searchParams.get('search') || ''
    const invoiceType = searchParams.get('invoiceType') || '' // SALES veya PURCHASE

    // Base query - OPTİMİZE: JOIN kaldırıldı - çok yavaş
    // ÖNEMLİ: Limit 10000'e çıkarıldı - Stats API ile tutarlı olması için (tüm faturaları çek)
    let query = supabase
      .from('Invoice')
      .select('id, title, status, total, quoteId, createdAt, invoiceType')
      .order('createdAt', { ascending: false })
      .limit(10000) // Stats API ile tutarlı olması için limit 10000 (tüm faturaları çek)
    
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
      // Her status için toplam tutarı hesapla
      const totalValue = statusInvoices.reduce((sum: number, invoice: any) => {
        const invoiceValue = typeof invoice.total === 'string' ? parseFloat(invoice.total) || 0 : (invoice.total || 0)
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
          total: invoice.total || 0,
          quoteId: invoice.quoteId,
          createdAt: invoice.createdAt,
        })),
      }
    })

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

