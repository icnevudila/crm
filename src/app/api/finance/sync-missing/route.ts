import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Eksik Finance kayıtlarını oluştur (PAID invoice'lar için)
export async function POST(request: Request) {
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
      .select('id, totalAmount, companyId, status, title')
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
        created: 0,
        skipped: 0,
      })
    }

    // Her invoice için Finance kaydı var mı kontrol et
    const financeRecordsToCreate: any[] = []
    let skippedCount = 0

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

      // Eğer Finance kaydı yoksa oluştur (yeni format ile)
      if (!existingFinance) {
        financeRecordsToCreate.push({
          type: 'INCOME',
          amount: invoice.totalAmount || 0, // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
          relatedEntityType: 'INVOICE', // Yeni format
          relatedEntityId: invoice.id, // Yeni format
          relatedTo: `Invoice: ${invoice.id}`, // Eski format (backward compatibility)
          companyId: invoice.companyId,
          category: 'INVOICE_INCOME',
          description: `Fatura ödendi: ${invoice.title || invoice.id}`,
        })
      } else {
        skippedCount++
      }
    }

    // Eksik Finance kayıtlarını oluştur
    let createdCount = 0
    if (financeRecordsToCreate.length > 0) {
      const { data: createdFinance, error: financeError } = await supabase
        .from('Finance')
        // @ts-expect-error - Supabase database type tanımları eksik
        .insert(financeRecordsToCreate)
        .select()

      if (financeError) {
        return NextResponse.json(
          { error: financeError.message || 'Failed to create finance records' },
          { status: 500 }
        )
      }

      createdCount = createdFinance?.length || 0

      // ActivityLog kayıtları oluştur
      if (createdFinance && createdFinance.length > 0) {
        const activityLogs = createdFinance.map((finance: any) => {
          const invoiceId = finance.relatedTo?.replace('Invoice: ', '')
          return {
            entity: 'Finance',
            action: 'CREATE',
            description: `Eksik finans kaydı oluşturuldu: Fatura ${invoiceId}`,
            meta: { 
              entity: 'Finance', 
              action: 'create', 
              id: finance.id, 
              fromInvoice: invoiceId,
              synced: true, // Senkronizasyon ile oluşturulduğunu belirt
            },
            userId: session.user.id,
            companyId: finance.companyId,
          }
        })

        await supabase.from('ActivityLog').insert(activityLogs)
      }
    }

    return NextResponse.json({
      message: 'Finance records synced successfully',
      totalPaidInvoices: paidInvoices.length,
      created: createdCount,
      skipped: skippedCount,
      alreadyExists: skippedCount,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync finance records' },
      { status: 500 }
    )
  }
}

