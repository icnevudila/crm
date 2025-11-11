import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Eksik Finance kayıtlarını kontrol et (PAID invoice'lar için)
export async function GET(request: Request) {
  try {
    // Session kontrolü
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Tüm PAID invoice'ları çek - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount)
    let invoiceQuery = supabase
      .from('Invoice')
      .select('id, totalAmount, companyId, status, title, invoiceNumber, createdAt')
      .eq('status', 'PAID')
    
    if (!isSuperAdmin) {
      invoiceQuery = invoiceQuery.eq('companyId', companyId)
    }

    const { data: paidInvoices, error: invoiceError } = await invoiceQuery

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message || 'Failed to fetch paid invoices' },
        { status: 500 }
      )
    }

    if (!paidInvoices || paidInvoices.length === 0) {
      return NextResponse.json({
        message: 'No paid invoices found',
        missingCount: 0,
        totalPaidInvoices: 0,
        missingInvoices: [],
      })
    }

    // Eksik Finance kayıtlarını bul
    const missingInvoices: any[] = []
    let existingCount = 0

    for (const invoice of paidInvoices) {
      // Bu invoice için Finance kaydı var mı kontrol et
      // Önce yeni format ile kontrol et (relatedEntityType + relatedEntityId)
      let { data: existingFinance } = await supabase
        .from('Finance')
        .select('id')
        .eq('relatedEntityType', 'INVOICE')
        .eq('relatedEntityId', invoice.id)
        .eq('companyId', invoice.companyId)
        .maybeSingle()
      
      // Eğer yeni formatta yoksa eski format ile kontrol et (relatedTo)
      if (!existingFinance) {
        const { data: oldFormatFinance } = await supabase
          .from('Finance')
          .select('id')
          .eq('relatedTo', `Invoice: ${invoice.id}`)
          .eq('companyId', invoice.companyId)
          .maybeSingle()
        existingFinance = oldFormatFinance
      }

      // Eğer Finance kaydı yoksa eksik listesine ekle
      if (!existingFinance) {
        missingInvoices.push({
          id: invoice.id,
          title: invoice.title,
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.totalAmount || 0, // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
          createdAt: invoice.createdAt,
          companyId: invoice.companyId,
        })
      } else {
        existingCount++
      }
    }

    // Toplam eksik tutar hesapla
    // DÜZELTME: totalAmount öncelikli (050 migration ile total → totalAmount)
    const totalMissingAmount = missingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) // inv.total zaten totalAmount'dan geliyor (satır 80)

    return NextResponse.json({
      message: 'Missing finance records checked',
      totalPaidInvoices: paidInvoices.length,
      existingCount,
      missingCount: missingInvoices.length,
      totalMissingAmount,
      missingInvoices,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check missing finance records' },
      { status: 500 }
    )
  }
}

