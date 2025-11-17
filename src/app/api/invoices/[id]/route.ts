import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { updateRecord } from '@/lib/crud'
import { 
  isValidInvoiceTransition, 
  isInvoiceImmutable, 
  canDeleteInvoice,
  getTransitionErrorMessage
} from '@/lib/stageValidation'
import { formatCurrency } from '@/lib/utils'

type ServiceSupabaseClient = ReturnType<typeof getSupabaseWithServiceRole>

interface InvoiceItemAutomation {
  id: string
  productId: string | null
  quantity: number
  total?: number | null
  unitPrice?: number | null
}

function parseNumericValue(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

async function fetchInvoiceItemsForAutomation(
  supabase: ServiceSupabaseClient,
  invoiceId: string,
  companyId: string
): Promise<InvoiceItemAutomation[]> {
  const { data } = await supabase
    .from('InvoiceItem')
    .select('id, productId, quantity, total, unitPrice')
    .eq('invoiceId', invoiceId)
    .eq('companyId', companyId)

  return (
    data?.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      quantity: parseNumericValue(item.quantity),
      total: item.total ?? null,
      unitPrice: item.unitPrice ?? null,
    })) || []
  )
}

async function updateProductQuantities(
  supabase: ServiceSupabaseClient,
  companyId: string,
  productId: string,
  deltas: { reservedDelta?: number; incomingDelta?: number; stockDelta?: number }
) {
  const { data: product } = await supabase
    .from('Product')
    .select('reservedQuantity, incomingQuantity, stock')
    .eq('id', productId)
    .eq('companyId', companyId)
    .maybeSingle()

  if (!product) {
    return
  }

  const updatePayload: Record<string, number | string> = {}

  if (typeof deltas.reservedDelta === 'number' && deltas.reservedDelta !== 0) {
    const currentReserved = parseNumericValue((product as any).reservedQuantity)
    updatePayload.reservedQuantity = Math.max(0, currentReserved + deltas.reservedDelta)
  }

  if (typeof deltas.incomingDelta === 'number' && deltas.incomingDelta !== 0) {
    const currentIncoming = parseNumericValue((product as any).incomingQuantity)
    updatePayload.incomingQuantity = Math.max(0, currentIncoming + deltas.incomingDelta)
  }

  if (typeof deltas.stockDelta === 'number' && deltas.stockDelta !== 0) {
    const currentStock = parseNumericValue((product as any).stock)
    updatePayload.stock = Math.max(0, currentStock + deltas.stockDelta)
  }

  if (Object.keys(updatePayload).length === 0) {
    return
  }

  updatePayload.updatedAt = new Date().toISOString()

  await supabase
    .from('Product')
    .update(updatePayload)
    .eq('id', productId)
    .eq('companyId', companyId)
}

async function ensureSalesShipmentForSentStatus({
  supabase,
  invoiceId,
  companyId,
  sessionUserId,
  invoiceItems,
  request,
}: {
  supabase: ServiceSupabaseClient
  invoiceId: string
  companyId: string
  sessionUserId: string
  invoiceItems: InvoiceItemAutomation[]
  request: Request
}) {
  try {
    const { getMessages, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const msgs = getMessages(locale)
    // Ürün varsa rezerve et
    if (invoiceItems.length > 0) {
      for (const item of invoiceItems) {
        if (!item.productId) {
          continue
        }
        try {
          await updateProductQuantities(supabase, companyId, item.productId, {
            reservedDelta: item.quantity,
          })
        } catch (productError) {
          console.error('Product quantity update error:', productError)
          // Ürün güncelleme hatası sevkiyat oluşturmayı engellemez
        }
      }
    }

    // Sevkiyat kaydı oluştur (ürün olsun ya da olmasın)
    const { data: shipment, error: shipmentError } = await supabase
      .from('Shipment')
      .insert([
        {
          invoiceId,
          status: 'DRAFT',
          companyId,
        },
      ])
      .select()
      .maybeSingle()

    if (shipmentError) {
      console.error('Shipment creation error:', shipmentError)
      return { shipmentId: null, created: false, error: shipmentError.message }
    }

    if (shipment) {
      // ActivityLog kaydı
      try {
        await supabase.from('ActivityLog').insert([
          {
            entity: 'Shipment',
            action: 'CREATE',
            description: msgs.activity.invoiceSentShipmentCreated,
            meta: {
              entity: 'Shipment',
              action: 'create_from_invoice',
              invoiceId,
              shipmentId: shipment.id,
            },
            userId: sessionUserId,
            companyId,
          },
        ])
      } catch (activityError) {
        console.error('ActivityLog creation error:', activityError)
        // ActivityLog hatası sevkiyat oluşturmayı engellemez
      }

      return {
        shipmentId: shipment.id,
        created: true,
      }
    }

    return { shipmentId: null, created: false, error: 'Shipment creation returned null' }
  } catch (error: any) {
    console.error('ensureSalesShipmentForSentStatus error:', error)
    return { shipmentId: null, created: false, error: error?.message || 'Unknown error' }
  }
}

async function ensurePurchaseTransactionForSentStatus({
  supabase,
  invoiceId,
  companyId,
  sessionUserId,
  invoiceItems,
  request,
}: {
  supabase: ServiceSupabaseClient
  invoiceId: string
  companyId: string
  sessionUserId: string
  invoiceItems: InvoiceItemAutomation[]
  request: Request
}) {
  try {
    const { getMessages, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const msgs = getMessages(locale)
    // Ürün varsa bekleyen stok olarak işaretle
    if (invoiceItems.length > 0) {
      for (const item of invoiceItems) {
        if (!item.productId) {
          continue
        }
        try {
          await updateProductQuantities(supabase, companyId, item.productId, {
            incomingDelta: item.quantity,
          })
        } catch (productError) {
          console.error('Product quantity update error:', productError)
          // Ürün güncelleme hatası satın alma kaydı oluşturmayı engellemez
        }
      }
    }

    // Satın alma kaydı oluştur (ürün olsun ya da olmasın)
    const { data: purchaseTransaction, error: purchaseError } = await supabase
      .from('PurchaseTransaction')
      .insert([
        {
          invoiceId,
          status: 'DRAFT',
          companyId,
        },
      ])
      .select()
      .maybeSingle()

    if (purchaseError) {
      console.error('PurchaseTransaction creation error:', purchaseError)
      return { purchaseShipmentId: null, created: false, error: purchaseError.message }
    }

    if (purchaseTransaction) {
      // ActivityLog kaydı
      try {
        await supabase.from('ActivityLog').insert([
          {
            entity: 'PurchaseTransaction',
            action: 'CREATE',
            description: msgs.activity.purchaseInvoiceSentRecordCreated,
            meta: {
              entity: 'PurchaseTransaction',
              action: 'create_from_invoice',
              invoiceId,
              purchaseTransactionId: purchaseTransaction.id,
            },
            userId: sessionUserId,
            companyId,
          },
        ])
      } catch (activityError) {
        console.error('ActivityLog creation error:', activityError)
        // ActivityLog hatası satın alma kaydı oluşturmayı engellemez
      }

      return {
        purchaseShipmentId: purchaseTransaction.id,
        created: true,
      }
    }

    return { purchaseShipmentId: null, created: false, error: 'PurchaseTransaction creation returned null' }
  } catch (error: any) {
    console.error('ensurePurchaseTransactionForSentStatus error:', error)
    return { purchaseShipmentId: null, created: false, error: error?.message || 'Unknown error' }
  }
}

// ✅ %100 KESİN ÇÖZÜM: Cache'i tamamen kapat - her çağrıda fresh data
// ÖNEMLİ: Next.js App Router'ın API route cache'ini tamamen kapat
export const revalidate = 0 // Revalidation'ı kapat
export const dynamic = 'force-dynamic' // Dynamic route - her zaman çalıştır
export const fetchCache = 'force-no-store' // Fetch cache'ini kapat
export const runtime = 'nodejs' // Edge yerine Node zorla (cache sorunlarını önlemek için)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // DEBUG: API endpoint çağrıldı
    if (process.env.NODE_ENV === 'development') {
      console.log('[Invoices [id] API] 🚀 GET endpoint called:', {
        invoiceId: id,
        url: request.url,
      })
    }
    
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Invoices [id] API] ❌ Session Error:', sessionError)
      }
      return sessionError
    }

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir, bu durumda filtreleme yapma
    const companyId = session.user.companyId || null

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice GET request:', {
        invoiceId: id,
        companyId,
        isSuperAdmin,
        userId: session.user.id,
      })
    }

    // Önce invoice'ın var olup olmadığını kontrol et (companyId olmadan)
    // SuperAdmin için tüm invoice'ları görebilir, normal kullanıcı için sadece kendi companyId'sini
    let invoiceCheck = null
    let checkError = null
    
    // DEBUG: Invoice sorgusu başlatılıyor
    if (process.env.NODE_ENV === 'development') {
      console.log('[Invoices [id] API] 🔍 Checking invoice existence:', {
        invoiceId: id,
        isSuperAdmin,
        companyId,
        willFilterByCompany: !isSuperAdmin && companyId,
      })
    }
    
    // SuperAdmin değilse ve companyId varsa filtrele, SuperAdmin ise filtreleme yapma
    let checkQuery = supabase
      .from('Invoice')
      .select('id, companyId')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin && companyId) {
      checkQuery = checkQuery.eq('companyId', companyId)
    }
    
    const { data: checkData, error: checkQueryError } = await checkQuery.maybeSingle()
    
    invoiceCheck = checkData
    checkError = checkQueryError

    if (process.env.NODE_ENV === 'development') {
      console.log('[Invoices [id] API] 🔍 Invoice check result:', {
        invoiceExists: !!invoiceCheck,
        invoiceCompanyId: invoiceCheck?.companyId,
        userCompanyId: companyId,
        isSuperAdmin,
        checkError: checkError?.message,
        checkErrorCode: checkError?.code,
      })
    }

    // Invoice yoksa veya companyId eşleşmiyorsa (SuperAdmin değilse)
    if (!invoiceCheck) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Invoices [id] API] ❌ Invoice not found:', { 
          invoiceId: id,
          isSuperAdmin,
          companyId,
          checkError: checkError?.message,
          checkErrorCode: checkError?.code,
        })
      }
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ 
        error: getErrorMessage('errors.api.invoiceNotFound', request),
        message: getErrorMessage('errors.api.invoiceNotFoundMessage', request),
        invoiceId: id,
      }, { status: 404 })
    }

    // SuperAdmin değilse ve companyId eşleşmiyorsa erişim reddedilir
    if (!isSuperAdmin && invoiceCheck.companyId !== companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Invoices [id] API] ❌ Invoice companyId mismatch:', {
          invoiceId: id,
          invoiceCompanyId: invoiceCheck.companyId,
          userCompanyId: companyId,
          isSuperAdmin,
        })
      }
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ 
        error: getErrorMessage('errors.api.invoiceNotFound', request),
        message: getErrorMessage('errors.api.invoiceAccessDenied', request),
        invoiceId: id,
      }, { status: 404 })
    }

    // DEBUG: SuperAdmin için invoice verilerini kontrol et
    if (process.env.NODE_ENV === 'development') {
      console.log('[Invoices [id] API] 🔍 Invoice Data Check:', {
        invoiceId: id,
        isSuperAdmin,
        companyId,
        invoiceCompanyId: invoiceCheck.companyId,
        hasStatus: !!invoiceCheck.status,
        status: invoiceCheck.status,
        statusType: typeof invoiceCheck.status,
      })
    }

    // Invoice'u sadece gerekli kolonlarla çek (performans için)
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let query = supabase
      .from('Invoice')
      .select(`
        id, title, status, totalAmount, quoteId, shipmentId, invoiceType, companyId, createdAt, updatedAt, invoiceNumber, dueDate, paidAmount, paymentDate, taxRate, notes
      `)
      .eq('id', id)

    // SuperAdmin değilse ve companyId varsa filtrele
    if (!isSuperAdmin && companyId) {
      query = query.eq('companyId', companyId)
    }

    let { data: invoiceResult, error: invoiceError } = await query
    
    // Hata varsa (kolon bulunamadı veya foreign key hatası), tekrar dene
    if (invoiceError && (invoiceError.code === 'PGRST200' || invoiceError.message?.includes('Could not find a relationship') || invoiceError.message?.includes('does not exist'))) {
      console.warn('Invoice GET API: Hata oluştu, tekrar deneniyor...', invoiceError.message)
      let queryWithoutJoin = supabase
        .from('Invoice')
        .select(`
          id, title, status, totalAmount, quoteId, shipmentId, invoiceType, companyId, createdAt, updatedAt, invoiceNumber, dueDate, paidAmount, paymentDate, taxRate, notes
        `)
        .eq('id', id)
      
      if (!isSuperAdmin && companyId) {
        queryWithoutJoin = queryWithoutJoin.eq('companyId', companyId)
      }
      
      const retryResult = await queryWithoutJoin
      invoiceResult = retryResult.data as any
      invoiceError = retryResult.error
    }

    if (process.env.NODE_ENV === 'development') {
      const invoiceResultTyped: any = invoiceResult
      console.log('Invoice GET - basic data:', {
        invoiceFound: !!invoiceResultTyped,
        invoiceId: Array.isArray(invoiceResultTyped) ? invoiceResultTyped[0]?.id : invoiceResultTyped?.id,
        invoiceTitle: Array.isArray(invoiceResultTyped) ? invoiceResultTyped[0]?.title : invoiceResultTyped?.title,
        error: invoiceError?.message,
      })
    }

    // .single() yerine array kontrolü yap - "Cannot coerce the result to a single JSON object" hatasını önle
    const invoiceData: any = Array.isArray(invoiceResult) && invoiceResult.length > 0 
      ? invoiceResult[0] 
      : invoiceResult

    if (invoiceError || !invoiceData) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice GET error:', {
          invoiceId: id,
          companyId,
          isSuperAdmin,
          error: invoiceError?.message,
        })
      }
      return NextResponse.json({ error: 'Invoice not found', details: invoiceError?.message }, { status: 404 })
    }

    // İlişkili verileri ayrı ayrı çek (hata olsa bile invoice'ı döndür)
    let quoteData = null
    let customerData = null
    let shipmentData = null
    let invoiceItemsData = null

    // Quote verisini çek (varsa)
    if (invoiceData.quoteId) {
      try {
        let quoteQuery = supabase
          .from('Quote')
          .select(
            `
            id,
            title,
            status,
            Deal (
              id,
              title,
              Customer (
                id,
                name,
                email,
                phone,
                city,
                address,
                CustomerCompany:customerCompanyId (
                  id,
                  name,
                  address,
                  city
                )
              )
            )
          `
          )
          .eq('id', invoiceData.quoteId)
        
        // SuperAdmin değilse ve companyId varsa filtrele
        if (!isSuperAdmin && companyId) {
          quoteQuery = quoteQuery.eq('companyId', companyId)
        }
        
        const { data: quote, error: quoteError } = await quoteQuery.maybeSingle()
        
        if (!quoteError && quote) {
          quoteData = quote
        }
      } catch (quoteErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Quote fetch error:', quoteErr)
        }
      }
    }

    // Customer verisini çek - Quote'dan al (Invoice'da customerId kolonu yok)
    // Önce Quote'dan Customer bilgisini al, yoksa direkt Customer tablosundan ara
    if (quoteData?.Deal?.Customer) {
      // Quote'dan Customer bilgisi geldi
      customerData = quoteData.Deal.Customer
    } else if (invoiceData.quoteId) {
      // Quote'dan Customer bilgisi gelmediyse, Quote'dan Deal'ı çek ve Customer'ı al
      try {
        let quoteWithDealQuery = supabase
          .from('Quote')
          .select(
            `
            Deal (
              Customer (
                id,
                name,
                email,
                phone,
                city,
                address,
                CustomerCompany:customerCompanyId (
                  id,
                  name,
                  address,
                  city
                )
              )
            )
          `
          )
          .eq('id', invoiceData.quoteId)
        
        // SuperAdmin değilse ve companyId varsa filtrele
        if (!isSuperAdmin && companyId) {
          quoteWithDealQuery = quoteWithDealQuery.eq('companyId', companyId)
        }
        
        const { data: quoteWithDeal, error: quoteWithDealError } = await quoteWithDealQuery.maybeSingle()
        
        if (!quoteWithDealError && quoteWithDeal) {
          const quoteWithDealTyped: any = quoteWithDeal
          if (quoteWithDealTyped?.Deal?.Customer) {
            customerData = quoteWithDealTyped.Deal.Customer
          }
        }
      } catch (customerErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Customer fetch from Quote error:', customerErr)
        }
      }
    }

    // Shipment verisini çek (varsa - önce shipmentId'den, yoksa invoiceId'den)
    try {
      if (invoiceData.shipmentId) {
        // Invoice'da shipmentId varsa onu kullan
        let shipmentQuery = supabase
          .from('Shipment')
          .select('id, tracking, status, createdAt')
          .eq('id', invoiceData.shipmentId)
        
        // SuperAdmin değilse ve companyId varsa filtrele
        if (!isSuperAdmin && companyId) {
          shipmentQuery = shipmentQuery.eq('companyId', companyId)
        }
        
        const { data: shipment, error: shipmentError } = await shipmentQuery.maybeSingle()
        
        if (!shipmentError && shipment) {
          shipmentData = shipment
        }
      } else {
        // Invoice'da shipmentId yoksa invoiceId'den ara
        let shipmentsQuery = supabase
          .from('Shipment')
          .select('id, tracking, status, createdAt')
          .eq('invoiceId', id)
        
        // SuperAdmin değilse ve companyId varsa filtrele
        if (!isSuperAdmin && companyId) {
          shipmentsQuery = shipmentsQuery.eq('companyId', companyId)
        }
        
        const { data: shipments, error: shipmentError } = await shipmentsQuery
          .order('createdAt', { ascending: false })
          .limit(1)
        
        if (!shipmentError && shipments && shipments.length > 0) {
          shipmentData = shipments[0]
        }
      }
    } catch (shipmentErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipment fetch error:', shipmentErr)
      }
    }

    // InvoiceItem verisini çek (varsa)
    try {
      let invoiceItemsQuery = supabase
        .from('InvoiceItem')
        .select(
          `
          *,
          Product (
            id,
            name,
            price,
            stock,
            sku,
            barcode,
            category
          )
        `
        )
        .eq('invoiceId', id)
      
      // SuperAdmin değilse ve companyId varsa filtrele
      if (!isSuperAdmin && companyId) {
        invoiceItemsQuery = invoiceItemsQuery.eq('companyId', companyId)
      }
      
      const { data: invoiceItems, error: invoiceItemsError } = await invoiceItemsQuery
        .order('createdAt', { ascending: true })
      
      if (!invoiceItemsError && invoiceItems) {
        invoiceItemsData = invoiceItems
      }
    } catch (invoiceItemsErr) {
      if (process.env.NODE_ENV === 'development') {
        console.error('InvoiceItem fetch error:', invoiceItemsErr)
      }
    }

    // Invoice verisini ilişkili verilerle birleştir
    const invoiceResponseData: any = {
      ...invoiceData,
      Quote: quoteData,
      Customer: customerData,
      Shipment: shipmentData,
      InvoiceItem: invoiceItemsData || [],
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice GET result:', {
        invoiceFound: !!invoiceResponseData,
        invoiceId: invoiceResponseData?.id,
        invoiceTitle: invoiceResponseData?.title,
        hasQuote: !!quoteData,
        hasCustomer: !!customerData,
        hasShipment: !!shipmentData,
        invoiceItemsCount: invoiceItemsData?.length || 0,
      })
    }

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Invoice&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json({
      ...(invoiceResponseData as any),
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('invoice', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const bodyRaw = await request.json()
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id: bodyId, companyId: bodyCompanyId, createdAt, updatedAt, createdBy, updatedBy, ...body } = bodyRaw
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    // Quote'tan oluşturulan faturalar ve kesinleşmiş faturalar korumalı - hiçbir şekilde değiştirilemez
    // Retry mekanizması - yeni oluşturulan invoice için (commit gecikmesi olabilir)
    let currentInvoice = null
    const maxRetries = 10
    const retryDelay = 300
    let lastError = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Sadece kesinlikle var olan kolonları çek (schema.sql'deki temel kolonlar)
      // customerId trigger'lar için gerekli, eklemeye çalışalım
      // invoiceType sevkiyat/mal kabul oluşturmak için gerekli
      // Diğer kolonlar migration'larla eklenmiş olabilir, eksikse hata vermez
      let invoiceQuery = supabase
        .from('Invoice')
        .select('id, quoteId, status, title, companyId')
        .eq('id', id)
      
      // SuperAdmin değilse companyId filtresi ekle
      if (!isSuperAdmin) {
        invoiceQuery = invoiceQuery.eq('companyId', session.user.companyId)
      }
      
      let { data, error } = await invoiceQuery.maybeSingle()
      
      // customerId kolonunu da çekmeyi dene (trigger'lar için gerekli)
      if (!error && data) {
        try {
          const { data: customerData, error: customerError } = await supabase
            .from('Invoice')
            .select('customerId')
            .eq('id', id)
            .maybeSingle()
          if (!customerError && customerData !== null) {
            // customerData null değilse (kolon varsa) değeri al
            (data as any).customerId = customerData.customerId || null
          } else {
            // Kolon yoksa veya hata varsa null set et
            (data as any).customerId = null
          }
        } catch (e) {
          // customerId kolonu yoksa null set et
          (data as any).customerId = null
        }
        
        // invoiceType kolonunu da çekmeyi dene (sevkiyat/mal kabul için gerekli)
        try {
          const { data: invoiceTypeData, error: invoiceTypeError } = await supabase
            .from('Invoice')
            .select('invoiceType')
            .eq('id', id)
            .maybeSingle()
          if (!invoiceTypeError && invoiceTypeData !== null) {
            // invoiceTypeData null değilse (kolon varsa) değeri al
            (data as any).invoiceType = invoiceTypeData.invoiceType || null
          } else {
            // Kolon yoksa veya hata varsa null set et
            (data as any).invoiceType = null
          }
        } catch (e) {
          // invoiceType kolonu yoksa null set et
          (data as any).invoiceType = null
        }
      }
      
      if (error) {
        lastError = error
        // Kolon hatası varsa direkt hata döndür
        if (error.code === '42703' || error.message?.includes('does not exist')) {
          console.error('Database schema error:', {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details
          })
          return NextResponse.json(
            { 
              error: 'Database schema error',
              message: 'Veritabanı şeması güncel değil. Lütfen migration\'ları çalıştırın.',
              details: error.message,
              code: error.code,
              hint: error.hint || 'Temel kolonlar eksik. Migration dosyalarını kontrol edin.'
            },
            { status: 500 }
          )
        }
      }
      
      currentInvoice = data
      
      if (currentInvoice) {
        break // Invoice bulundu, retry'ye gerek yok
      }
      
      // Son deneme değilse bekle ve tekrar dene
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    // Invoice bulunamazsa hata döndür
    if (!currentInvoice) {
      // Önce companyId kontrolü yap - belki fatura başka bir şirkete ait
      const { data: checkInvoice } = await supabase
        .from('Invoice')
        .select('id, companyId')
        .eq('id', id)
        .maybeSingle()
      
      const { getErrorMessage } = await import('@/lib/api-locale')
      if (checkInvoice && checkInvoice.companyId !== session.user.companyId) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: getErrorMessage('errors.api.invoiceAccessDenied', request),
            invoiceId: id,
            invoiceCompanyId: checkInvoice.companyId,
            userCompanyId: session.user.companyId
          },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceNotFound', request),
          message: getErrorMessage('errors.api.invoiceNotFoundMessage', request),
          invoiceId: id,
          companyId: session.user.companyId,
          lastError: lastError?.message || null
        },
        { status: 404 }
      )
    }

    // Tekliften gelen faturalar için: Sadece içerik güncellemeleri engellenmeli, status güncellemeleri yapılabilmeli
    if (currentInvoice && currentInvoice.quoteId) {
      // Sadece status güncelleniyorsa izin ver (DRAFT → SENT → SHIPPED → PAID gibi)
      const bodyKeys = Object.keys(body || {})
      const isOnlyStatusUpdate = 
        body.status !== undefined && 
        bodyKeys.length === 1 // Sadece 'status' var
      
      // Status dışında başka bir şey güncelleniyorsa engelle
      if (!isOnlyStatusUpdate) {
        const { getErrorMessage } = await import('@/lib/api-locale')
        return NextResponse.json(
          { 
            error: getErrorMessage('errors.api.invoiceFromQuoteCannotBeChanged', request),
            message: getErrorMessage('errors.api.invoiceFromQuoteCannotBeChangedMessage', request),
            reason: 'QUOTE_INVOICE_CANNOT_BE_UPDATED',
            relatedQuote: {
              id: currentInvoice.quoteId,
              link: `/quotes/${currentInvoice.quoteId}`
            }
          },
          { status: 403 }
        )
      }
    }

    // ÖNEMLİ: Immutability kontrol (PAID, CANCELLED)
    const currentStatus = currentInvoice?.status
    if (currentStatus && isInvoiceImmutable(currentStatus)) {
      // İlgili Finance kaydını kontrol et (PAID ise)
      let relatedFinance = null
      if (currentStatus === 'PAID') {
        const { data } = await supabase
          .from('Finance')
          .select('id, amount, type')
          .eq('relatedTo', `Invoice: ${id}`)
          .eq('companyId', session.user.companyId)
          .maybeSingle()
        relatedFinance = data
      }

      const { getErrorMessage } = await import('@/lib/api-locale')
      const immutableMessage = currentStatus === 'PAID' 
        ? getErrorMessage('errors.api.invoicePaidCannotBeChanged', request, { status: currentStatus })
        : getErrorMessage('errors.api.invoiceCancelledCannotBeChanged', request, { status: currentStatus })
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceCannotBeChanged', request),
          message: immutableMessage,
          reason: 'IMMUTABLE_INVOICE',
          status: currentStatus,
          relatedFinance
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Status transition validation
    const { getMessages, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const msgs = getMessages(locale)
    if (body.status !== undefined && body.status !== currentStatus) {
      // currentStatus null/undefined ise DRAFT olarak kabul et (yeni oluşturulan faturalar için)
      const statusForValidation = currentStatus || 'DRAFT'
      
      // invoiceType'ı belirle (body'den veya mevcut invoice'dan)
      const invoiceTypeForValidation =
        body.invoiceType ||
        (typeof (currentInvoice as any)?.invoiceType === 'string'
          ? (currentInvoice as any).invoiceType
          : null)
      
      const validation = isValidInvoiceTransition(
        statusForValidation,
        body.status,
        invoiceTypeForValidation as 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE' | undefined
      )
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Geçersiz status geçişi',
            message: validation.error || getTransitionErrorMessage('invoice', statusForValidation, body.status),
            reason: 'INVALID_STATUS_TRANSITION',
            currentStatus: statusForValidation,
            attemptedStatus: body.status,
            allowedTransitions: validation.allowed || []
          },
          { status: 400 }
        )
      }
    }

    // Status değiştirme yetkisi kontrolü
    if (body.status !== undefined) {
      const { checkUserPermission } = await import('@/lib/permissions')
      const permissions = await checkUserPermission('invoices')
      
      if (!permissions.canUpdate) {
        return NextResponse.json(
          { error: 'Status değiştirme yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    const companyId = session.user.companyId
    const previousStatus = currentInvoice?.status || null
    const requestedStatus = body.status ?? previousStatus
    // invoiceType'ı belirle (body'den veya mevcut invoice'dan)
    let invoiceType =
      body.invoiceType ||
      (typeof (currentInvoice as any)?.invoiceType === 'string'
        ? (currentInvoice as any).invoiceType
        : null)

    let shipmentIdForAutomation =
      (currentInvoice as any)?.shipmentId || null
    let purchaseTransactionIdForAutomation =
      (currentInvoice as any)?.purchaseShipmentId || null
    
    // Otomasyon flag'lerini sakla (response'a eklemek için)
    let shipmentCreated = false
    let purchaseTransactionCreated = false

    let shouldNotifySent = false
    let shouldNotifyShipped = false
    let shouldNotifyReceived = false
    let shouldNotifyCancelled = false
    let shouldSendSentEmail = false

    // ÖNEMLİ: Invoice OVERDUE durumuna geçtiğinde bildirim gönder (dueDate kontrolü)
    // Database trigger ile de yapılabilir ama burada da kontrol ediyoruz
    if (body.dueDate !== undefined || body.status !== undefined) {
      const invoiceDueDate = body.dueDate ? new Date(body.dueDate) : (currentInvoice as any)?.dueDate ? new Date((currentInvoice as any).dueDate) : null
      const invoiceStatus = body.status !== undefined ? body.status : currentInvoice?.status
      
      if (invoiceDueDate && invoiceStatus && invoiceStatus !== 'PAID' && invoiceStatus !== 'CANCELLED') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dueDate = new Date(invoiceDueDate)
        dueDate.setHours(0, 0, 0, 0)
        
        // Vade geçmişse OVERDUE durumuna geç ve bildirim gönder
        if (dueDate < today && invoiceStatus !== 'OVERDUE') {
          // Status'u OVERDUE yap (eğer değiştirilmemişse)
          if (body.status === undefined) {
            body.status = 'OVERDUE'
          }
          
          // Bildirim gönder (database trigger da gönderecek ama burada da gönderiyoruz)
          try {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            const invoiceNumber = (currentInvoice as any)?.invoiceNumber || currentInvoice?.title || msgs.activity.defaultInvoiceTitle
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: msgs.activity.invoiceOverdue,
              message: msgs.activity.invoiceOverdueMessage.replace('{invoiceNumber}', invoiceNumber),
              type: 'error',
              priority: 'high',
              relatedTo: 'Invoice',
              relatedId: id,
            })
          } catch (notificationError) {
            // Bildirim hatası ana işlemi engellemez
          }
        }
        // Vade yaklaşıyorsa bildirim gönder (3 gün öncesi uyarı, 1 gün öncesi kritik)
        else if (dueDate > today && dueDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
          
          try {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            const invoiceNumber = (currentInvoice as any)?.invoiceNumber || currentInvoice?.title || msgs.activity.defaultInvoiceTitle
            const notificationTitle = daysUntilDue <= 1 ? msgs.activity.invoiceDueSoonCritical : msgs.activity.invoiceDueSoon
            const notificationMessage = daysUntilDue <= 1 
              ? msgs.activity.invoiceDueSoonCriticalMessage.replace('{invoiceNumber}', invoiceNumber).replace('{days}', String(daysUntilDue))
              : msgs.activity.invoiceDueSoonMessage.replace('{invoiceNumber}', invoiceNumber).replace('{days}', String(daysUntilDue))
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: notificationTitle,
              message: notificationMessage,
              type: 'warning',
              priority: daysUntilDue <= 1 ? 'critical' : 'high',
              relatedTo: 'Invoice',
              relatedId: id,
            })
          } catch (notificationError) {
            // Bildirim hatası ana işlemi engellemez
          }
        }
      }
    }

    let invoiceItemsForAutomation: InvoiceItemAutomation[] = []

    if (
      requestedStatus &&
      previousStatus !== requestedStatus &&
      ['SENT', 'SHIPPED', 'RECEIVED', 'CANCELLED'].includes(requestedStatus)
    ) {
      invoiceItemsForAutomation = await fetchInvoiceItemsForAutomation(
        supabase,
        id,
        companyId
      )
    }

    // invoiceType yoksa ve invoice items varsa varsayılan olarak SALES kabul et
    // (Çoğu durumda satış faturası olur)
    if (!invoiceType && invoiceItemsForAutomation.length > 0) {
      invoiceType = 'SALES'
      if (process.env.NODE_ENV === 'development') {
        console.warn('invoiceType missing, defaulting to SALES based on invoice items:', {
          invoiceId: id,
          invoiceItemsCount: invoiceItemsForAutomation.length,
        })
      }
    }

    if (
      requestedStatus === 'SENT' &&
      previousStatus !== 'SENT'
    ) {
      shouldNotifySent = true
      shouldSendSentEmail = true

      if (process.env.NODE_ENV === 'development') {
        console.log('SENT status transition:', {
          invoiceId: id,
          invoiceType,
          previousStatus,
          requestedStatus,
          shipmentIdForAutomation,
          purchaseTransactionIdForAutomation,
          invoiceItemsCount: invoiceItemsForAutomation.length,
        })
      }

      // invoiceType kontrolü
      if (!invoiceType || (invoiceType !== 'SALES' && invoiceType !== 'PURCHASE' && invoiceType !== 'SERVICE_SALES' && invoiceType !== 'SERVICE_PURCHASE')) {
        console.warn('Invalid or missing invoiceType:', {
          invoiceId: id,
          invoiceType,
          bodyInvoiceType: body.invoiceType,
          currentInvoiceType: (currentInvoice as any)?.invoiceType,
        })
      }

      // Hizmet faturaları için sevkiyat/mal kabul oluşturulmaz (ürün yok)
      if (invoiceType === 'SALES' && !shipmentIdForAutomation) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('Creating shipment for SENT status:', {
              invoiceId: id,
              invoiceType,
              invoiceItemsCount: invoiceItemsForAutomation.length,
            })
          }

          const { shipmentId, created, error } = await ensureSalesShipmentForSentStatus({
            request,
            supabase,
            invoiceId: id,
            companyId,
            sessionUserId: session.user.id,
            invoiceItems: invoiceItemsForAutomation,
          })

          if (error) {
            console.error('Shipment creation failed:', error)
            // Hata olsa bile devam et, kullanıcıya bilgi ver
          }

          if (shipmentId) {
            shipmentIdForAutomation = shipmentId
            if (process.env.NODE_ENV === 'development') {
              console.log('Shipment created successfully:', {
                shipmentId,
                created,
              })
            }
          }

          if (created) {
            shipmentCreated = true
            shouldNotifySent = true
          } else if (!shipmentId) {
            console.warn('Shipment creation returned no ID:', {
              invoiceId: id,
              invoiceType,
              invoiceItemsCount: invoiceItemsForAutomation.length,
            })
          }
        } catch (error: any) {
          console.error('Error in shipment creation:', error)
          // Hata olsa bile devam et, kullanıcıya bilgi ver
        }
      }

      if (invoiceType === 'PURCHASE' && !purchaseTransactionIdForAutomation) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('Creating purchase transaction for SENT status:', {
              invoiceId: id,
              invoiceType,
              invoiceItemsCount: invoiceItemsForAutomation.length,
            })
          }

          const { purchaseShipmentId, created, error } =
            await ensurePurchaseTransactionForSentStatus({
              request,
              supabase,
              invoiceId: id,
              companyId,
              sessionUserId: session.user.id,
              invoiceItems: invoiceItemsForAutomation,
            })

          if (error) {
            console.error('Purchase transaction creation failed:', error)
          }

          if (purchaseShipmentId) {
            purchaseTransactionIdForAutomation = purchaseShipmentId
            if (process.env.NODE_ENV === 'development') {
              console.log('Purchase transaction created successfully:', {
                purchaseShipmentId,
                created,
              })
            }
          }

          if (created) {
            purchaseTransactionCreated = true
            shouldNotifySent = true
          }
        } catch (error: any) {
          console.error('Error in purchase transaction creation:', error)
        }
      }

      // Hizmet faturaları için sadece bildirim gönder (sevkiyat/mal kabul yok)
      if (invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') {
        // Hizmet faturaları için sevkiyat/mal kabul oluşturulmaz
        // Sadece bildirim ve email gönderilir
      }
    }

    if (
      requestedStatus === 'SHIPPED' &&
      previousStatus !== 'SHIPPED' &&
      invoiceType === 'SALES'
    ) {
      // Sevkiyat kaydı yoksa önce SENT durumuna geçilmesi gerektiğini belirt
      if (!shipmentIdForAutomation) {
        // Invoice'da shipmentId var mı kontrol et
        const { data: invoiceShipment } = await supabase
          .from('Invoice')
          .select('shipmentId')
          .eq('id', id)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (invoiceShipment?.shipmentId) {
          shipmentIdForAutomation = invoiceShipment.shipmentId
        } else {
          // Sevkiyat kaydı yok - önce SENT durumuna geçilmeli
          // İş akışı: DRAFT → SENT (sevkiyat kaydı oluştur) → SHIPPED (sevkiyat kaydı onayla)
          const { getErrorMessage } = await import('@/lib/api-locale')
          return NextResponse.json(
            { 
              error: getErrorMessage('errors.api.shipmentNotFound', request),
              message: getErrorMessage('errors.api.shipmentNotFoundMessage', request),
              reason: 'SHIPMENT_NOT_FOUND',
              requiredStep: 'SENT',
              workflow: 'DRAFT → SENT (sevkiyat kaydı oluştur) → SHIPPED (sevkiyat kaydı onayla)'
            },
            { status: 400 }
          )
        }
      }

      // Sevkiyat kaydını onayla (APPROVED yap)
      if (shipmentIdForAutomation) {
        const { error: updateError } = await supabase
          .from('Shipment')
          .update({
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', shipmentIdForAutomation)
          .eq('companyId', companyId)
        
        if (updateError) {
          console.error('Shipment update error:', updateError)
          const { getErrorMessage } = await import('@/lib/api-locale')
          return NextResponse.json(
            { 
              error: getErrorMessage('errors.api.shipmentCannotBeApproved', request),
              message: getErrorMessage('errors.api.shipmentCannotBeApprovedMessage', request),
              details: updateError.message
            },
            { status: 500 }
          )
        }
      }

      for (const item of invoiceItemsForAutomation) {
        if (!item.productId || item.quantity === 0) {
          continue
        }
        await updateProductQuantities(supabase, companyId, item.productId, {
          reservedDelta: item.quantity * -1,
          stockDelta: item.quantity * -1,
        })
      }

      await supabase.from('ActivityLog').insert([
        {
          entity: 'Invoice',
          action: 'UPDATE',
          description: msgs.activity.shipmentApprovedMessage.replace('{invoiceNumber}', (currentInvoice as any)?.invoiceNumber || currentInvoice?.title || msgs.activity.defaultInvoiceTitle),
          meta: {
            entity: 'Invoice',
            action: 'shipment_approved_from_invoice',
            invoiceId: id,
            shipmentId: shipmentIdForAutomation,
          },
          userId: session.user.id,
          companyId,
        },
      ])

      shouldNotifyShipped = true
    }

    if (
      requestedStatus === 'RECEIVED' &&
      previousStatus !== 'RECEIVED' &&
      invoiceType === 'PURCHASE'
    ) {
      // Mal kabul kaydı yoksa önce SENT durumuna geçilmesi gerektiğini belirt
      if (!purchaseTransactionIdForAutomation) {
        // Invoice'da purchaseShipmentId var mı kontrol et
        const { data: invoicePurchase } = await supabase
          .from('Invoice')
          .select('purchaseShipmentId')
          .eq('id', id)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (invoicePurchase?.purchaseShipmentId) {
          purchaseTransactionIdForAutomation = invoicePurchase.purchaseShipmentId
        } else {
          // Mal kabul kaydı yok - önce SENT durumuna geçilmeli
          // İş akışı: DRAFT → SENT (mal kabul kaydı oluştur) → RECEIVED (mal kabul kaydı onayla)
          const { getErrorMessage } = await import('@/lib/api-locale')
          return NextResponse.json(
            { 
              error: getErrorMessage('errors.api.purchaseRecordNotFound', request),
              message: getErrorMessage('errors.api.purchaseRecordNotFoundMessage', request),
              reason: 'PURCHASE_TRANSACTION_NOT_FOUND',
              requiredStep: 'SENT',
              workflow: 'DRAFT → SENT (mal kabul kaydı oluştur) → RECEIVED (mal kabul kaydı onayla)'
            },
            { status: 400 }
          )
        }
      }

      // Mal kabul kaydını onayla (APPROVED yap)
      if (purchaseTransactionIdForAutomation) {
        const { error: updateError } = await supabase
          .from('PurchaseTransaction')
          .update({
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', purchaseTransactionIdForAutomation)
          .eq('companyId', companyId)
        
        if (updateError) {
          console.error('PurchaseTransaction update error:', updateError)
          const { getErrorMessage } = await import('@/lib/api-locale')
          return NextResponse.json(
            { 
              error: getErrorMessage('errors.api.purchaseCannotBeApproved', request),
              message: getErrorMessage('errors.api.purchaseCannotBeApprovedMessage', request),
              details: updateError.message
            },
            { status: 500 }
          )
        }
      }

      for (const item of invoiceItemsForAutomation) {
        if (!item.productId || item.quantity === 0) {
          continue
        }
        await updateProductQuantities(supabase, companyId, item.productId, {
          incomingDelta: item.quantity * -1,
          stockDelta: item.quantity,
        })
      }

      await supabase.from('ActivityLog').insert([
        {
          entity: 'Invoice',
          action: 'UPDATE',
          description: msgs.activity.purchaseApprovedMessage.replace('{invoiceNumber}', (currentInvoice as any)?.invoiceNumber || currentInvoice?.title || msgs.activity.defaultInvoiceTitle),
          meta: {
            entity: 'Invoice',
            action: 'purchase_received_from_invoice',
            invoiceId: id,
            purchaseTransactionId: purchaseTransactionIdForAutomation,
          },
          userId: session.user.id,
          companyId,
        },
      ])

      shouldNotifyReceived = true
    }

    if (
      requestedStatus === 'CANCELLED' &&
      previousStatus !== 'CANCELLED'
    ) {
      if (invoiceType === 'SALES' && shipmentIdForAutomation) {
        for (const item of invoiceItemsForAutomation) {
          if (!item.productId || item.quantity === 0) {
            continue
          }
          await updateProductQuantities(supabase, companyId, item.productId, {
            reservedDelta: item.quantity * -1,
          })
        }

        await supabase
          .from('Shipment')
          .update({
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', shipmentIdForAutomation)
          .eq('companyId', companyId)
      }

      if (invoiceType === 'PURCHASE' && purchaseTransactionIdForAutomation) {
        for (const item of invoiceItemsForAutomation) {
          if (!item.productId || item.quantity === 0) {
            continue
          }
          await updateProductQuantities(supabase, companyId, item.productId, {
            incomingDelta: item.quantity * -1,
          })
        }

        await supabase
          .from('PurchaseTransaction')
          .update({
            status: 'CANCELLED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', purchaseTransactionIdForAutomation)
          .eq('companyId', companyId)
      }

      shouldNotifyCancelled = true
    }

    // Invoice verilerini güncelle - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, totalAmount, quoteId, companyId, updatedAt (050 migration ile total → totalAmount)
    // schema-extension.sql: invoiceNumber, dueDate, paymentDate, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 007: invoiceType (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 065: serviceDescription (migration çalıştırılmamış olabilir - GÖNDERME!)
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }
    
    // ÖNEMLİ: customerId kolonunu kontrol et - eğer yoksa UPDATE sorgusuna ekleme
    // Trigger'lar NEW.customerId'ye erişmeye çalışıyor ama kolon yoksa hata verir
    let customerIdColumnExists = false
    try {
      const { error: checkError } = await supabase
        .from('Invoice')
        .select('customerId')
        .limit(0)
      customerIdColumnExists = !checkError
    } catch (e) {
      customerIdColumnExists = false
    }
    
    // customerId kolonu varsa ekle
    if (customerIdColumnExists) {
      const currentCustomerId = (currentInvoice as any)?.customerId
      if (body.customerId !== undefined) {
        // Body'de customerId varsa onu kullan
        updateData.customerId = body.customerId || null
      } else {
        // Mevcut customerId'yi koru (null bile olsa, trigger'lar için gerekli)
        updateData.customerId = currentCustomerId !== undefined ? currentCustomerId : null
      }
    }
    
    // Sadece gönderilen alanları ekle
    if (body.title !== undefined) updateData.title = body.title
    if (body.status !== undefined) updateData.status = body.status
    if (body.totalAmount !== undefined) {
      updateData.totalAmount = parseFloat(body.totalAmount)
    } else if (body.total !== undefined) {
      updateData.totalAmount = parseFloat(body.total)
    }
    
    // Migration 065: serviceDescription ekle (eğer migration çalıştırıldıysa)
    if (body.serviceDescription !== undefined) {
      try {
        // serviceDescription kolonunun varlığını kontrol et
        const { error: checkError } = await supabase
          .from('Invoice')
          .select('serviceDescription')
          .limit(0)
        
        if (!checkError) {
          updateData.serviceDescription = body.serviceDescription || null
        }
      } catch (e) {
        // Kolon yoksa atla (migration çalıştırılmamış)
        console.warn('serviceDescription kolonu bulunamadı, migration 065 çalıştırılmamış olabilir')
      }
    }

    // Migration 007: invoiceType ekle (eğer migration çalıştırıldıysa)
    // invoiceType body'den gelmişse veya varsayılan olarak belirlenmişse ekle
    if (body.invoiceType || invoiceType) {
      try {
        // invoiceType kolonunun varlığını kontrol et
        const { error: checkError } = await supabase
          .from('Invoice')
          .select('invoiceType')
          .limit(0)
        
        if (!checkError) {
          // Body'den gelen invoiceType varsa onu kullan, yoksa varsayılan olarak belirlenen invoiceType'ı kullan
          updateData.invoiceType = body.invoiceType || invoiceType
        }
      } catch (e) {
        // Kolon yoksa atla (migration çalıştırılmamış)
      }
    }

    // Sadece schema.sql'de olan alanlar
    if (body.quoteId !== undefined) updateData.quoteId = body.quoteId || null
    if (shipmentIdForAutomation && !(currentInvoice as any)?.shipmentId) {
      updateData.shipmentId = shipmentIdForAutomation
    }
    if (purchaseTransactionIdForAutomation && !(currentInvoice as any)?.purchaseShipmentId) {
      updateData.purchaseShipmentId = purchaseTransactionIdForAutomation
    }
    // NOT: invoiceNumber, dueDate, paymentDate, taxRate, vendorId, customerId, description, billingAddress, billingCity, billingTaxNumber, paymentMethod, paymentNotes schema-extension/schema-vendor'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // undefined değerleri temizle - Supabase trigger'ları için
    const cleanUpdateData: any = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        cleanUpdateData[key] = value
      }
    }
    
    // NOT: updatedAt ve updatedBy updateRecord fonksiyonunda otomatik ekleniyor
    
    // updateRecord kullanarak audit trail desteği (updatedBy otomatik eklenir)
    const data = await updateRecord(
      'Invoice',
      id,
      cleanUpdateData,
      msgs.activity.invoiceUpdated.replace('{title}', body.title || currentInvoice?.title || msgs.activity.defaultInvoiceTitle)
    )

    if (!data) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.api.invoiceCannotBeUpdated', request) }, { status: 500 })
    }

    const invoiceDisplayName =
      data?.title ||
      data?.invoiceNumber ||
      `${msgs.activity.defaultInvoiceTitle} #${String(id).substring(0, 8)}`

    if (shouldNotifySent && data) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.invoiceSent,
          message: msgs.activity.invoiceSentMessage.replace('{invoiceNumber}', invoiceDisplayName),
          type: 'info',
          relatedTo: 'Invoice',
          relatedId: data.id,
        })
      } catch (notificationError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice SENT notification error:', notificationError)
        }
      }

      if (shouldSendSentEmail) {
        try {
          const { getAndRenderEmailTemplate, getTemplateVariables } = await import('@/lib/template-renderer')
          const { sendEmail } = await import('@/lib/email-service')

          const variables = await getTemplateVariables('Invoice', data, companyId)
          let emailTemplate = null

          try {
            emailTemplate = await getAndRenderEmailTemplate('INVOICE_SENT', companyId, variables)
          } catch (templateError) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('INVOICE_SENT template not found, fallback to INVOICE.', templateError)
            }
          }

          if (!emailTemplate) {
            try {
              emailTemplate = await getAndRenderEmailTemplate('INVOICE', companyId, variables)
            } catch (fallbackError) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Invoice SENT fallback template error:', fallbackError)
              }
            }
          }

          if (emailTemplate && variables.customerEmail) {
            await sendEmail({
              to: variables.customerEmail as string,
              subject: emailTemplate.subject || msgs.activity.invoiceSentEmailSubject,
              html: emailTemplate.body,
            })
          }
        } catch (emailError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Invoice SENT email error:', emailError)
          }
        }
      }
    }

    if (shouldNotifyShipped && data) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.shipmentApproved,
          message: msgs.activity.shipmentApprovedMessage.replace('{invoiceNumber}', invoiceDisplayName),
          type: 'success',
          relatedTo: 'Invoice',
          relatedId: data.id,
        })
      } catch (notificationError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice SHIPPED notification error:', notificationError)
        }
      }
    }

    if (shouldNotifyReceived && data) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.purchaseApproved,
          message: msgs.activity.purchaseApprovedMessage.replace('{invoiceNumber}', invoiceDisplayName),
          type: 'success',
          relatedTo: 'Invoice',
          relatedId: data.id,
        })
      } catch (notificationError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice RECEIVED notification error:', notificationError)
        }
      }
    }

    if (shouldNotifyCancelled && data) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: msgs.activity.invoiceCancelled,
          message: msgs.activity.invoiceCancelledMessage.replace('{invoiceNumber}', invoiceDisplayName),
          type: 'warning',
          relatedTo: 'Invoice',
          relatedId: data.id,
        })
      } catch (notificationError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice CANCELLED notification error:', notificationError)
        }
      }
    }

    // Invoice PAID olduğunda otomatik Finance kaydı oluştur
    // ÖNEMLİ: Status değişikliği yapıldığında (DRAFT → PAID) veya zaten PAID ise kontrol et
    if ((body.status === 'PAID' || data?.status === 'PAID') && data) {
      // Fatura tipine göre Finance kaydı tipi belirle
      const invoiceTypeForFinance = (data as any).invoiceType || invoiceType || 'SALES'
      const financeType = (invoiceTypeForFinance === 'PURCHASE' || invoiceTypeForFinance === 'SERVICE_PURCHASE') 
        ? 'EXPENSE' 
        : 'INCOME'
      const financeCategory = (invoiceTypeForFinance === 'PURCHASE' || invoiceTypeForFinance === 'SERVICE_PURCHASE')
        ? 'PURCHASE'
        : 'INVOICE_INCOME'
      
      // Önce bu invoice için Finance kaydı var mı kontrol et (duplicate önleme)
      const { data: existingFinance } = await supabase
        .from('Finance')
        .select('id')
        .eq('relatedTo', `Invoice: ${data.id}`)
        .eq('companyId', session.user.companyId)
        .maybeSingle()

      // Eğer Finance kaydı yoksa oluştur
      if (!existingFinance) {
        const { data: finance } = await supabase
          .from('Finance')
          .insert([
            {
              type: financeType,
              amount: data.totalAmount || 0,
              relatedTo: `Invoice: ${data.id}`,
              companyId: session.user.companyId,
              category: financeCategory,
            },
          ])
          .select()
          .single()

        if (finance) {
          // ActivityLog kaydı
          // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
          await supabase.from('ActivityLog').insert([
            {
              entity: 'Finance',
              action: 'CREATE',
              description: msgs.activity.invoicePaidFinanceCreated.replace('{financeType}', financeType === 'EXPENSE' ? msgs.activity.expense : msgs.activity.income),
              meta: { 
                entity: 'Finance', 
                action: 'create', 
                id: (finance as any).id, 
                fromInvoice: data.id,
                financeType,
                financeCategory,
              },
              userId: session.user.id,
              companyId: session.user.companyId,
            },
          ])

          // Bildirim: Fatura ödendi (sadece yeni kayıt oluşturulduğunda)
          if (body.status === 'PAID') {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: msgs.activity.invoicePaid,
              message: msgs.activity.invoicePaidMessage.replace('{financeType}', financeType === 'EXPENSE' ? msgs.activity.expense : msgs.activity.income),
              type: 'success',
              relatedTo: 'Invoice',
              relatedId: data.id,
            })

            // ✅ Email otomasyonu: Invoice PAID → Müşteriye email gönder
            try {
              const { getAndRenderEmailTemplate, getTemplateVariables } = await import('@/lib/template-renderer')
              const { sendEmail } = await import('@/lib/email-service')
              
              // Template değişkenlerini hazırla
              const variables = await getTemplateVariables('Invoice', data, session.user.companyId)
              
              // Email template'ini çek ve render et
              const emailTemplate = await getAndRenderEmailTemplate('INVOICE', session.user.companyId, variables)
              
              if (emailTemplate && variables.customerEmail) {
                // Email gönder
                const emailResult = await sendEmail({
                  to: variables.customerEmail as string,
                  subject: emailTemplate.subject || msgs.activity.invoicePaidEmailSubject,
                  html: emailTemplate.body,
                })
                
                if (emailResult.success) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ Invoice PAID email sent to:', variables.customerEmail)
                  }
                } else {
                  console.error('Invoice PAID email send error:', emailResult.error)
                }
              }
            } catch (emailError) {
              // Email hatası ana işlemi engellemez
              if (process.env.NODE_ENV === 'development') {
                console.error('Invoice PAID email automation error:', emailError)
              }
            }
          }
        }
      }
    }

    const hasStatusChange =
      requestedStatus && requestedStatus !== previousStatus

    let activityDescription = msgs.activity.invoiceInfoUpdated.replace('{title}', body.title || data.title || msgs.activity.defaultInvoiceTitle)

    if (hasStatusChange) {
      switch (requestedStatus) {
        case 'SENT':
          activityDescription = msgs.activity.invoiceSentDescription.replace('{invoiceNumber}', invoiceDisplayName)
          break
        case 'SHIPPED':
          activityDescription = msgs.activity.invoiceShippedDescription.replace('{invoiceNumber}', invoiceDisplayName)
          break
        case 'RECEIVED':
          activityDescription = msgs.activity.invoiceReceivedDescription.replace('{invoiceNumber}', invoiceDisplayName)
          break
        case 'PAID':
          activityDescription = msgs.activity.invoicePaidDescription.replace('{invoiceNumber}', invoiceDisplayName)
          break
        case 'OVERDUE':
          activityDescription = msgs.activity.invoiceOverdueMessage.replace('{invoiceNumber}', invoiceDisplayName)
          // OVERDUE notification gönder
          try {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: '⚠️ Fatura Vadesi Geçti',
              message: `${invoiceDisplayName} faturasının vadesi geçti. Ödeme yapılması gerekiyor.`,
              type: 'error',
              priority: 'high',
              relatedTo: 'Invoice',
              relatedId: id,
            }).catch(() => {}) // Notification hatası ana işlemi engellemez
          } catch (notificationError) {
            // Bildirim hatası ana işlemi engellemez
          }
          break
        case 'CANCELLED':
          activityDescription = msgs.activity.invoiceCancelledDescription.replace('{invoiceNumber}', invoiceDisplayName)
          break
        default:
          activityDescription = msgs.activity.invoiceUpdatedStatus.replace('{invoiceNumber}', invoiceDisplayName).replace('{status}', requestedStatus)
      }
    } else if (body.title && body.title !== currentInvoice?.title) {
      activityDescription = msgs.activity.invoiceTitleUpdated.replace('{oldTitle}', currentInvoice?.title || '-').replace('{newTitle}', body.title)
    }

    const activityMeta: Record<string, unknown> = {
      entity: 'Invoice',
      action: 'update',
      id,
    }

    if (hasStatusChange) {
      activityMeta.status = requestedStatus
      activityMeta.previousStatus = previousStatus
    }

    // ActivityLog kaydı
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Invoice',
        action: 'UPDATE',
        description: activityDescription,
        meta: activityMeta,
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    // Otomasyon bilgilerini response'a ekle
    const automationInfo: any = {}
    
    if (shipmentIdForAutomation) {
      automationInfo.shipmentId = shipmentIdForAutomation
      automationInfo.shipmentCreated = shipmentCreated
    }
    
    if (purchaseTransactionIdForAutomation) {
      automationInfo.purchaseTransactionId = purchaseTransactionIdForAutomation
      automationInfo.purchaseTransactionCreated = purchaseTransactionCreated
    }
    
    // Finance kaydı oluşturuldu mu kontrol et
    if (body.status === 'PAID' || data?.status === 'PAID') {
      const { data: financeRecord } = await supabase
        .from('Finance')
        .select('id')
        .eq('relatedTo', `Invoice: ${data.id}`)
        .eq('companyId', session.user.companyId)
        .maybeSingle()
      
      if (financeRecord) {
        automationInfo.financeId = financeRecord.id
        automationInfo.financeCreated = true
      }
    }
    
    // CANCELLED durumunda iptal edilen kayıtları kontrol et
    if (body.status === 'CANCELLED' || data?.status === 'CANCELLED') {
      if ((currentInvoice as any)?.shipmentId) {
        automationInfo.shipmentCancelled = true
        automationInfo.shipmentId = (currentInvoice as any).shipmentId
      }
      if ((currentInvoice as any)?.purchaseShipmentId) {
        automationInfo.purchaseTransactionCancelled = true
        automationInfo.purchaseTransactionId = (currentInvoice as any).purchaseShipmentId
      }
    }
    
    // Hizmet faturaları için bildirim gönderildiğini belirt
    if ((invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') && shouldNotifySent) {
      automationInfo.notificationSent = true
      automationInfo.emailSent = shouldSendSentEmail
    }

    return NextResponse.json({
      ...data,
      automation: automationInfo,
      invoiceType: invoiceType || data?.invoiceType || null, // invoiceType'ı response'a ekle
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice DELETE request:', {
        invoiceId: id,
        companyId: session.user.companyId,
        userId: session.user.id,
      })
    }

    // Önce invoice'u kontrol et - ActivityLog için title lazım ve koruma kontrolü için
    const { data: invoice } = await supabase
      .from('Invoice')
      .select('title, status, quoteId')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice fetch result:', {
        invoiceFound: !!invoice,
        invoiceTitle: invoice?.title,
        invoiceStatus: invoice?.status,
        hasQuoteId: !!invoice?.quoteId,
      })
    }

    // ÖNEMLİ: Delete validation - Status kontrolü
    const deleteCheck = canDeleteInvoice(invoice?.status)
    if (!deleteCheck.canDelete) {
      // İlgili Finance kaydını kontrol et (kullanıcıya bilgi vermek için)
      const { data: relatedFinance } = await supabase
        .from('Finance')
        .select('id, amount, type')
        .eq('relatedTo', `Invoice: ${id}`)
        .eq('companyId', session.user.companyId)
        .maybeSingle()

      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceCannotBeDeletedMessage', request),
          message: deleteCheck.error,
          reason: 'CANNOT_DELETE_INVOICE',
          status: invoice?.status,
          relatedFinance: relatedFinance ? {
            id: relatedFinance.id,
            amount: relatedFinance.amount,
            type: relatedFinance.type
          } : null
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Invoice SHIPPED olduğunda silinemez (Stok düşüldüğü için)
    if (invoice?.status === 'SHIPPED') {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceShippedCannotBeDeleted', request),
          message: getErrorMessage('errors.api.invoiceShippedCannotBeDeletedMessage', request),
          reason: 'SHIPPED_INVOICE_CANNOT_BE_DELETED',
          action: 'Sevkiyatı iptal edip stok işlemini geri alın'
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Invoice RECEIVED olduğunda silinemez (Stok artırıldığı için)
    if (invoice?.status === 'RECEIVED') {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceReceivedCannotBeDeleted', request),
          message: getErrorMessage('errors.api.invoiceReceivedCannotBeDeletedMessage', request),
          reason: 'RECEIVED_INVOICE_CANNOT_BE_DELETED',
          action: 'Mal kabul işlemini iptal edip stok işlemini geri alın'
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Invoice quoteId varsa silinemez (Tekliften oluşturulduğu için)
    if (invoice?.quoteId) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.invoiceFromQuoteCannotBeDeleted', request),
          message: getErrorMessage('errors.api.invoiceFromQuoteCannotBeDeletedMessage', request),
          reason: 'QUOTE_INVOICE_CANNOT_BE_DELETED',
          relatedQuote: {
            id: invoice.quoteId,
            link: `/quotes/${invoice.quoteId}`
          }
        },
        { status: 403 }
      )
    }

    // Silme işlemini yap - data kontrolü ile
    const { data: deletedData, error: deleteError } = await supabase
      .from('Invoice')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()

    if (deleteError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice DELETE error:', deleteError)
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Silme işleminin başarılı olduğunu kontrol et
    if (!deletedData || deletedData.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice DELETE: No data deleted, invoice might not exist or RLS blocked deletion', {
          invoiceId: id,
          companyId: session.user.companyId,
          invoiceFound: !!invoice,
        })
      }
      return NextResponse.json({ error: 'Invoice not found or could not be deleted' }, { status: 404 })
    }

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    // invoice null olabilir (maybeSingle() kullandık), o yüzden deletedData'dan title al
    try {
      const { getMessages, getLocaleFromRequest } = await import('@/lib/api-locale')
      const deleteLocale = getLocaleFromRequest(request)
      const deleteMsgs = getMessages(deleteLocale)
      const invoiceTitle = (invoice as any)?.title || (deletedData[0] as any)?.title || deleteMsgs.activity.defaultInvoiceTitle
      const activityData = {
        entity: 'Invoice',
        action: 'DELETE',
        description: deleteMsgs.activity.invoiceDeleted.replace('{title}', invoiceTitle),
        meta: { entity: 'Invoice', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }
      
      await supabase.from('ActivityLog').insert([activityData])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog insert error:', logError)
      }
    }

    return NextResponse.json({ 
      success: true,
      deletedCount: deletedData.length,
      deletedInvoice: deletedData[0],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}



