import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

// Build-time'da çalışmasın - sadece runtime'da çalışsın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const entityId = searchParams.get('entityId')
    const limit = parseInt(searchParams.get('limit') || '200') // Limit artırıldı - bağlı kayıtların işlemleri de gösterilecek

    const supabase = getSupabase()

    let query = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          id,
          name,
          email
        )
      `
      )
      .order('createdAt', { ascending: false })
      .limit(limit)

    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Entity ID filtresi (meta JSON içinde)
    // NOT: Entity filtresini kaldırdık çünkü bağlı kayıtlar farklı entity'ler olabilir
    // (örneğin Deal için Quote, Invoice, Contract, Task işlemleri de gösterilmeli)
    // NOT: Kart ile bağlantılı TÜM işlemleri göster (kartın kendisi + bağlı kayıtlar)
    if (entityId && entity) {
      // Önce entity'nin kendisi ile ilgili işlemleri bul
      // DÜZELTME: meta->>'id' yerine meta->>id kullan (tek tırnak yok)
      let orConditions: string[] = [
        `meta->>id.eq.${entityId}`,
        `meta->>${entity.toLowerCase()}Id.eq.${entityId}`,
      ]
      
      // Entity filtresi ekle (opsiyonel - eğer entity belirtilmişse)
      // Ama bağlı kayıtlar farklı entity'ler olabilir, bu yüzden sadece primary entity için
      // query = query.eq('entity', entity) // Bu satırı kaldırdık - bağlı kayıtlar için

      // Entity tipine göre bağlı kayıtların ID'lerini bul ve onların işlemlerini de ekle
      if (entity === 'Deal') {
        // CompanyId kontrolü için query builder
        let dealQuery = supabase.from('Deal').select('id').eq('id', entityId)
        if (!isSuperAdmin) {
          dealQuery = dealQuery.eq('companyId', companyId)
        }
        const { data: dealCheck } = await dealQuery.single()
        
        if (!dealCheck) {
          // Deal bulunamadı veya yetkisiz erişim
          return NextResponse.json([])
        }

        // Deal'a bağlı Quote'ları bul (companyId kontrolü ile)
        let quotesQuery = supabase.from('Quote').select('id').eq('dealId', entityId).limit(100)
        if (!isSuperAdmin) {
          quotesQuery = quotesQuery.eq('companyId', companyId)
        }
        const { data: quotes } = await quotesQuery
        
        // Deal'a bağlı Invoice'ları bul (Quote üzerinden, companyId kontrolü ile)
        const quoteIds = (quotes as { id: string }[])?.map(q => q.id) || []
        let invoices: { id: string }[] = []
        if (quoteIds.length > 0) {
          let invoicesQuery = supabase.from('Invoice').select('id').in('quoteId', quoteIds).limit(100)
          if (!isSuperAdmin) {
            invoicesQuery = invoicesQuery.eq('companyId', companyId)
          }
          const { data: invoicesData } = await invoicesQuery
          invoices = (invoicesData as { id: string }[]) || []
          
          // Tüm bağlı kayıtların ID'lerini orConditions'a ekle
          invoices.forEach(i => {
            orConditions.push(`meta->>id.eq.${i.id}`)
            orConditions.push(`meta->>invoiceId.eq.${i.id}`)
          })
        }
        
        // Deal'a bağlı Contract'ları bul (companyId kontrolü ile)
        let contractsQuery = supabase.from('Contract').select('id').eq('dealId', entityId).limit(100)
        if (!isSuperAdmin) {
          contractsQuery = contractsQuery.eq('companyId', companyId)
        }
        const { data: contracts } = await contractsQuery
        
        // Deal'a bağlı Task'ları bul (relatedTo='Deal', relatedId=entityId, companyId kontrolü ile)
        let tasksQuery = supabase
          .from('Task')
          .select('id')
          .eq('relatedTo', 'Deal')
          .eq('relatedId', entityId)
          .limit(100)
        if (!isSuperAdmin) {
          tasksQuery = tasksQuery.eq('companyId', companyId)
        }
        const { data: tasksData } = await tasksQuery
        const tasks: { id: string }[] = Array.isArray(tasksData) ? (tasksData as { id: string }[]) : []

        // Tüm bağlı kayıtların ID'lerini orConditions'a ekle
        const quotesArray: { id: string }[] = Array.isArray(quotes) ? (quotes as { id: string }[]) : []
        const contractsArray: { id: string }[] = Array.isArray(contracts) ? (contracts as { id: string }[]) : []
        
        quotesArray.forEach(q => {
          orConditions.push(`meta->>id.eq.${q.id}`)
          orConditions.push(`meta->>quoteId.eq.${q.id}`)
        })
        contractsArray.forEach(c => {
          orConditions.push(`meta->>id.eq.${c.id}`)
          orConditions.push(`meta->>contractId.eq.${c.id}`)
        })
        tasks.forEach(t => {
          orConditions.push(`meta->>id.eq.${t.id}`)
          orConditions.push(`meta->>taskId.eq.${t.id}`)
        })
        
        // Deal stage değişiklikleri için
        orConditions.push(`meta->>dealId.eq.${entityId}`)
        orConditions.push(`meta->>from.eq.${entityId}`)
        orConditions.push(`meta->>to.eq.${entityId}`)
      } else if (entity === 'Quote') {
        // CompanyId kontrolü için query builder
        let quoteQuery = supabase.from('Quote').select('id, dealId').eq('id', entityId)
        if (!isSuperAdmin) {
          quoteQuery = quoteQuery.eq('companyId', companyId)
        }
        const { data: quoteData } = await quoteQuery.single()
        
        if (!quoteData) {
          // Quote bulunamadı veya yetkisiz erişim
          return NextResponse.json([])
        }
        
        // Quote'a bağlı Invoice'ları bul (companyId kontrolü ile)
        let invoicesQuery = supabase.from('Invoice').select('id').eq('quoteId', entityId).limit(100)
        if (!isSuperAdmin) {
          invoicesQuery = invoicesQuery.eq('companyId', companyId)
        }
        const { data: invoicesData } = await invoicesQuery
        const invoices: { id: string }[] = (invoicesData as { id: string }[]) || []
        
        // Quote'a bağlı Contract'ları bul (companyId kontrolü ile)
        let contractsQuery = supabase.from('Contract').select('id').eq('quoteId', entityId).limit(100)
        if (!isSuperAdmin) {
          contractsQuery = contractsQuery.eq('companyId', companyId)
        }
        const { data: contractsData } = await contractsQuery
        const contracts: { id: string }[] = (contractsData as { id: string }[]) || []

        // Tüm bağlı kayıtların ID'lerini orConditions'a ekle
        const quoteDataTyped = quoteData as { dealId?: string }
        if (quoteDataTyped.dealId) {
          orConditions.push(`meta->>id.eq.${quoteDataTyped.dealId}`)
          orConditions.push(`meta->>dealId.eq.${quoteDataTyped.dealId}`)
        }
        invoices.forEach(i => {
          orConditions.push(`meta->>id.eq.${i.id}`)
          orConditions.push(`meta->>invoiceId.eq.${i.id}`)
        })
        contracts.forEach(c => {
          orConditions.push(`meta->>id.eq.${c.id}`)
          orConditions.push(`meta->>contractId.eq.${c.id}`)
        })
        
        // Quote status değişiklikleri için
        orConditions.push(`meta->>quoteId.eq.${entityId}`)
        orConditions.push(`meta->>fromQuote.eq.${entityId}`)
      } else if (entity === 'Invoice') {
        // CompanyId kontrolü için query builder
        let invoiceQuery = supabase.from('Invoice').select('id, quoteId, dealId').eq('id', entityId)
        if (!isSuperAdmin) {
          invoiceQuery = invoiceQuery.eq('companyId', companyId)
        }
        const { data: invoiceData } = await invoiceQuery.single()
        
        if (!invoiceData) {
          // Invoice bulunamadı veya yetkisiz erişim
          return NextResponse.json([])
        }
        
        // Invoice'a bağlı Shipment'ları bul (companyId kontrolü ile)
        let shipmentsQuery = supabase.from('Shipment').select('id').eq('invoiceId', entityId).limit(100)
        if (!isSuperAdmin) {
          shipmentsQuery = shipmentsQuery.eq('companyId', companyId)
        }
        const { data: shipmentsData } = await shipmentsQuery
        const shipments: { id: string }[] = (shipmentsData as { id: string }[]) || []
        
        // Invoice'a bağlı Finance kayıtlarını bul (companyId kontrolü ile)
        let financeQuery = supabase
          .from('Finance')
          .select('id')
          .eq('relatedTo', 'Invoice')
          .eq('relatedId', entityId)
          .limit(100)
        if (!isSuperAdmin) {
          financeQuery = financeQuery.eq('companyId', companyId)
        }
        const { data: financeRecordsData } = await financeQuery
        const financeRecords: { id: string }[] = (financeRecordsData as { id: string }[]) || []

        // Tüm bağlı kayıtların ID'lerini orConditions'a ekle
        const invoiceDataTyped = invoiceData as { quoteId?: string; dealId?: string }
        if (invoiceDataTyped.quoteId) {
          orConditions.push(`meta->>id.eq.${invoiceDataTyped.quoteId}`)
          orConditions.push(`meta->>quoteId.eq.${invoiceDataTyped.quoteId}`)
        }
        if (invoiceDataTyped.dealId) {
          orConditions.push(`meta->>id.eq.${invoiceDataTyped.dealId}`)
          orConditions.push(`meta->>dealId.eq.${invoiceDataTyped.dealId}`)
        }
        shipments.forEach(s => {
          orConditions.push(`meta->>id.eq.${s.id}`)
          orConditions.push(`meta->>shipmentId.eq.${s.id}`)
        })
        financeRecords.forEach(f => {
          orConditions.push(`meta->>id.eq.${f.id}`)
          orConditions.push(`meta->>financeId.eq.${f.id}`)
        })
        
        // Invoice status değişiklikleri için
        orConditions.push(`meta->>invoiceId.eq.${entityId}`)
        orConditions.push(`meta->>fromInvoice.eq.${entityId}`)
      }

      // Tüm koşulları birleştir (OR ile)
      // NOT: Supabase .or() metodu string array bekliyor, virgülle ayrılmış string değil
      if (orConditions.length > 0) {
        // Supabase .or() formatı: "field1.eq.value1,field2.eq.value2"
        query = query.or(orConditions.join(','))
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
