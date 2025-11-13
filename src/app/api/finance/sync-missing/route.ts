import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Eksik Finance kayıtlarını oluştur (PAID invoice'lar için)
export async function POST(request: Request) {
  try {
    // PERFORMANCE FIX: getSafeSession kullan (cache var) - getServerSession yerine
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
        { error: invoiceError.message || 'Ödenmiş faturalar getirilemedi' },
        { status: 500 }
      )
    }

    if (!paidInvoices || paidInvoices.length === 0) {
      return NextResponse.json({
        message: 'Ödenmiş fatura bulunamadı',
        created: 0,
        skipped: 0,
      })
    }

    // PERFORMANCE FIX: N+1 query problemini çöz - check-missing ile aynı mantık
    // Önceki: Her invoice için 2 ayrı query (N+1 problem - çok yavaş! 100 invoice = 200 query)
    // Yeni: Tek query ile tüm Finance kayıtlarını çek, JavaScript'te map et (çok daha hızlı!)
    const invoiceIds = paidInvoices.map((inv: any) => inv.id)
    
    // Tüm Finance kayıtlarını tek seferde çek (yeni format + eski format) - check-missing ile aynı mantık
    const [newFormatFinance, oldFormatFinance] = await Promise.all([
      invoiceIds.length > 0
        ? supabase
            .from('Finance')
            .select('relatedEntityId, companyId')
            .eq('relatedEntityType', 'INVOICE')
            .in('relatedEntityId', invoiceIds)
        : Promise.resolve({ data: [], error: null }),
      invoiceIds.length > 0
        ? supabase
            .from('Finance')
            .select('relatedTo, companyId')
            .in('companyId', paidInvoices.map((inv: any) => inv.companyId).filter((id: string, index: number, arr: string[]) => arr.indexOf(id) === index))
            .not('relatedTo', 'is', null)
        : Promise.resolve({ data: [], error: null }),
    ])

    // Finance kayıtlarını map'e çevir (hızlı lookup için) - check-missing ile aynı mantık
    const financeMap = new Map<string, boolean>()
    
    // Yeni format: relatedEntityId bazında
    ;(newFormatFinance.data || []).forEach((f: any) => {
      if (f.relatedEntityId) {
        financeMap.set(`${f.companyId}:${f.relatedEntityId}`, true)
      }
    })
    
    // Eski format: relatedTo'dan invoice ID çıkar
    ;(oldFormatFinance.data || []).forEach((f: any) => {
      if (f.relatedTo && f.relatedTo.startsWith('Invoice: ')) {
        const invoiceId = f.relatedTo.replace('Invoice: ', '')
        financeMap.set(`${f.companyId}:${invoiceId}`, true)
      }
    })

    // Eksik Finance kayıtlarını bul - check-missing ile aynı mantık
    const financeRecordsToCreate: any[] = []
    let skippedCount = 0

    for (const invoice of paidInvoices) {
      const key = `${invoice.companyId}:${invoice.id}`
      const hasFinance = financeMap.has(key)

      // Eğer Finance kaydı yoksa oluştur (yeni format ile)
      if (!hasFinance) {
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
          { error: financeError.message || 'Finans kayıtları oluşturulamadı' },
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
      message: 'Finans kayıtları başarıyla senkronize edildi',
      totalPaidInvoices: paidInvoices.length,
      created: createdCount,
      skipped: skippedCount,
      alreadyExists: skippedCount,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Finans kayıtları senkronize edilemedi' },
      { status: 500 }
    )
  }
}

