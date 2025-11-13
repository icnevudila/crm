import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: Sevkiyat için uygun faturaları getir
// - Sadece SALES tipindeki faturalar
// - Daha önce sevkiyat kaydı olmayan faturalar
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // 1. Önce SALES tipindeki ve aktif durumdaki faturaları çek
    // İptal edilmiş (CANCELLED) faturalar hariç - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount)
    let invoiceQuery = supabase
      .from('Invoice')
      .select('id, title, invoiceNumber, status, totalAmount, createdAt, invoiceType')
      .eq('invoiceType', 'SALES') // Sadece satış faturaları
      .neq('status', 'CANCELLED') // İptal edilmiş faturalar hariç
      .order('createdAt', { ascending: false })
      .limit(1000)
    
    if (!isSuperAdmin) {
      invoiceQuery = invoiceQuery.eq('companyId', companyId)
    }

    const { data: invoices, error: invoiceError } = await invoiceQuery

    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json([])
    }

    // 2. Daha önce sevkiyat kaydı olan faturaları bul
    const invoiceIds = invoices.map((inv: any) => inv.id)
    
    const { data: existingShipments, error: shipmentError } = await supabase
      .from('Shipment')
      .select('invoiceId')
      .in('invoiceId', invoiceIds)
      .eq('companyId', companyId)
    
    if (shipmentError && process.env.NODE_ENV === 'development') {
      console.error('Shipment query error:', shipmentError)
    }

    // 3. Sevkiyat kaydı olan fatura ID'lerini filtrele
    const invoicesWithShipments = new Set(
      (existingShipments || []).map((s: any) => s.invoiceId).filter(Boolean)
    )

    // 4. Sevkiyat kaydı olmayan faturaları filtrele
    const availableInvoices = invoices.filter(
      (invoice: any) => !invoicesWithShipments.has(invoice.id)
    )

    return NextResponse.json(availableInvoices || [], {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Available invoices for shipment error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch available invoices' },
      { status: 500 }
    )
  }
}

