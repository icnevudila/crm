import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// PERFORMANCE FIX: Cache ekle - eksik kayıt kontrolü sık değişmez
export const revalidate = 60

// Eksik Finance kayıtlarını kontrol et (PAID invoice'lar için)
export async function GET(request: Request) {
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
      .select('id, totalAmount, companyId, status, title, invoiceNumber, createdAt')
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
        missingCount: 0,
        totalPaidInvoices: 0,
        missingInvoices: [],
      })
    }

    // PERFORMANCE FIX: N+1 query problemini çöz - tek query ile tüm Finance kayıtlarını çek
    // Önceki: Her invoice için 2 ayrı query (N+1 problem - çok yavaş! 100 invoice = 200 query)
    // Yeni: Tek query ile tüm Finance kayıtlarını çek, JavaScript'te map et (çok daha hızlı!)
    const invoiceIds = paidInvoices.map((inv: any) => inv.id)
    
    // Tüm Finance kayıtlarını tek seferde çek (yeni format + eski format)
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

    // Finance kayıtlarını map'e çevir (hızlı lookup için)
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

    // Eksik Finance kayıtlarını bul
    const missingInvoices: any[] = []
    let existingCount = 0

    for (const invoice of paidInvoices) {
      const key = `${invoice.companyId}:${invoice.id}`
      const hasFinance = financeMap.has(key)

      // Eğer Finance kaydı yoksa eksik listesine ekle
      if (!hasFinance) {
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
      message: 'Eksik finans kayıtları kontrol edildi',
      totalPaidInvoices: paidInvoices.length,
      existingCount,
      missingCount: missingInvoices.length,
      totalMissingAmount,
      missingInvoices,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // PERFORMANCE FIX: Cache headers eklendi
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Eksik finans kayıtları kontrol edilemedi' },
      { status: 500 }
    )
  }
}

