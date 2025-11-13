import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Debug endpoint - Invoice verilerini kontrol et
export async function GET() {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Tüm Invoice'ları çek (status'e göre grupla)
    let query = supabase
      .from('Invoice')
      .select('id, title, status, total, totalAmount, grandTotal, createdAt')
      .order('createdAt', { ascending: false })
      .limit(50)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: invoices, error } = await query

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Status'e göre grupla
    const statusCounts: Record<string, number> = {}
    const statusTotals: Record<string, number> = {}
    
    invoices?.forEach((inv: any) => {
      const status = inv.status || 'UNKNOWN'
      statusCounts[status] = (statusCounts[status] || 0) + 1
      
      const total = inv.grandTotal || inv.totalAmount || inv.total || 0
      statusTotals[status] = (statusTotals[status] || 0) + total
    })

    // PAID Invoice'ları özellikle kontrol et
    const paidInvoices = invoices?.filter((inv: any) => inv.status === 'PAID') || []
    const paidTotal = paidInvoices.reduce((sum: number, inv: any) => {
      return sum + (inv.grandTotal || inv.totalAmount || inv.total || 0)
    }, 0)

    return NextResponse.json({
      totalInvoices: invoices?.length || 0,
      statusCounts,
      statusTotals,
      paidInvoices: {
        count: paidInvoices.length,
        total: paidTotal,
        invoices: paidInvoices.slice(0, 5).map((inv: any) => ({
          id: inv.id,
          title: inv.title,
          status: inv.status,
          total: inv.grandTotal || inv.totalAmount || inv.total || 0,
          createdAt: inv.createdAt,
        }))
      },
      sampleInvoice: invoices && invoices.length > 0 ? {
        id: invoices[0].id,
        title: invoices[0].title,
        status: invoices[0].status,
        total: invoices[0].total,
        totalAmount: invoices[0].totalAmount,
        grandTotal: invoices[0].grandTotal,
        createdAt: invoices[0].createdAt,
      } : null,
      allColumns: invoices && invoices.length > 0 ? Object.keys(invoices[0]) : [],
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error?.message || 'Failed to check invoices',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}

