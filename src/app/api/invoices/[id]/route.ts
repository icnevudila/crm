import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
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
}: {
  supabase: ServiceSupabaseClient
  invoiceId: string
  companyId: string
  sessionUserId: string
  invoiceItems: InvoiceItemAutomation[]
}) {
  if (!invoiceItems.length) {
    return { shipmentId: null, created: false }
  }

  for (const item of invoiceItems) {
    if (!item.productId) {
      continue
    }
    await updateProductQuantities(supabase, companyId, item.productId, {
      reservedDelta: item.quantity,
    })
  }

  const { data: shipment } = await supabase
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

  if (shipment) {
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Shipment',
        action: 'CREATE',
        description: 'Fatura gönderildi, taslak sevkiyat oluşturuldu.',
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
  }

  return {
    shipmentId: shipment?.id || null,
    created: !!shipment,
  }
}

async function ensurePurchaseTransactionForSentStatus({
  supabase,
  invoiceId,
  companyId,
  sessionUserId,
  invoiceItems,
}: {
  supabase: ServiceSupabaseClient
  invoiceId: string
  companyId: string
  sessionUserId: string
  invoiceItems: InvoiceItemAutomation[]
}) {
  if (!invoiceItems.length) {
    return { purchaseShipmentId: null, created: false }
  }

  for (const item of invoiceItems) {
    if (!item.productId) {
      continue
    }
    await updateProductQuantities(supabase, companyId, item.productId, {
      incomingDelta: item.quantity,
    })
  }

  const { data: purchaseTransaction } = await supabase
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

  if (purchaseTransaction) {
    await supabase.from('ActivityLog').insert([
      {
        entity: 'PurchaseTransaction',
        action: 'CREATE',
        description: 'Alış faturası gönderildi, taslak mal kabul oluşturuldu.',
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
  }

  return {
    purchaseShipmentId: purchaseTransaction?.id || null,
    created: !!purchaseTransaction,
  }
}

export const dynamic = 'force-dynamic'

export async function GET(
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

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice GET request:', {
        invoiceId: id,
        companyId,
        isSuperAdmin,
        userId: session.user.id,
      })
    }

    // Önce invoice'ın var olup olmadığını kontrol et (companyId olmadan)
    // Retry mekanizması - yeni oluşturulan invoice için (commit gecikmesi olabilir)
    let invoiceCheck = null
    let checkError = null
    const maxRetries = 10 // Daha fazla deneme
    const retryDelay = 300 // 300ms - daha uzun bekleme
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await supabase
        .from('Invoice')
        .select('id, companyId')
        .eq('id', id)
        .maybeSingle()
      
      invoiceCheck = data
      checkError = error
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Invoice GET - retry attempt ${attempt + 1}/${maxRetries}:`, {
          invoiceId: id,
          invoiceFound: !!invoiceCheck,
          error: checkError?.message,
        })
      }
      
      if (invoiceCheck) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Invoice GET - invoice found after retry:', {
            attempt: attempt + 1,
            invoiceId: invoiceCheck.id,
            invoiceCompanyId: invoiceCheck.companyId,
          })
        }
        break // Invoice bulundu, retry'ye gerek yok
      }
      
      // Son deneme değilse bekle ve tekrar dene
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice check result:', {
        invoiceExists: !!invoiceCheck,
        invoiceCompanyId: invoiceCheck?.companyId,
        userCompanyId: companyId,
        isSuperAdmin,
        checkError: checkError?.message,
        attempts: maxRetries,
      })
    }

    // Invoice yoksa veya companyId eşleşmiyorsa (SuperAdmin değilse)
    if (!invoiceCheck) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice not found in database after retries:', { invoiceId: id })
      }
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (!isSuperAdmin && invoiceCheck.companyId !== companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoice companyId mismatch:', {
          invoiceId: id,
          invoiceCompanyId: invoiceCheck.companyId,
          userCompanyId: companyId,
        })
      }
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Invoice'u önce sadece temel verilerle çek (ilişkiler olmadan)
    let query = supabase
      .from('Invoice')
      .select('*')
      .eq('id', id)

    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    const { data: invoiceResult, error: invoiceError } = await query

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice GET - basic data:', {
        invoiceFound: !!invoiceResult,
        invoiceId: Array.isArray(invoiceResult) ? invoiceResult[0]?.id : invoiceResult?.id,
        invoiceTitle: Array.isArray(invoiceResult) ? invoiceResult[0]?.title : invoiceResult?.title,
        error: invoiceError?.message,
      })
    }

    // .single() yerine array kontrolü yap - "Cannot coerce the result to a single JSON object" hatasını önle
    const invoiceData = Array.isArray(invoiceResult) && invoiceResult.length > 0 
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
        const { data: quote, error: quoteError } = await supabase
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
                phone
              )
            )
          `
          )
          .eq('id', invoiceData.quoteId)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (!quoteError && quote) {
          quoteData = quote
        }
      } catch (quoteErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Quote fetch error:', quoteErr)
        }
      }
    }

    // Customer verisini çek (varsa - invoice'da customerId yoksa Quote'dan al)
    if (invoiceData.customerId) {
      try {
        const { data: customer, error: customerError } = await supabase
          .from('Customer')
          .select('id, name, email, phone')
          .eq('id', invoiceData.customerId)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (!customerError && customer) {
          customerData = customer
        }
      } catch (customerErr) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Customer fetch error:', customerErr)
        }
      }
    }

    // Shipment verisini çek (varsa - önce shipmentId'den, yoksa invoiceId'den)
    try {
      if (invoiceData.shipmentId) {
        // Invoice'da shipmentId varsa onu kullan
        const { data: shipment, error: shipmentError } = await supabase
          .from('Shipment')
          .select('id, tracking, status, createdAt')
          .eq('id', invoiceData.shipmentId)
          .eq('companyId', companyId)
          .maybeSingle()
        
        if (!shipmentError && shipment) {
          shipmentData = shipment
        }
      } else {
        // Invoice'da shipmentId yoksa invoiceId'den ara
        const { data: shipments, error: shipmentError } = await supabase
          .from('Shipment')
          .select('id, tracking, status, createdAt')
          .eq('invoiceId', id)
          .eq('companyId', companyId)
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
      const { data: invoiceItems, error: invoiceItemsError } = await supabase
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
        .eq('companyId', companyId)
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
    const data = {
      ...invoiceData,
      Quote: quoteData,
      Customer: customerData,
      Shipment: shipmentData,
      InvoiceItem: invoiceItemsData || [],
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice GET result:', {
        invoiceFound: !!data,
        invoiceId: data?.id,
        invoiceTitle: data?.title,
        hasQuote: !!quoteData,
        hasCustomer: !!customerData,
        hasShipment: !!shipmentData,
        invoiceItemsCount: invoiceItemsData?.length || 0,
      })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'Invoice')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery

    return NextResponse.json({
      ...(data as any),
      activities: activities || [],
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
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Quote'tan oluşturulan faturalar ve kesinleşmiş faturalar korumalı - hiçbir şekilde değiştirilemez
    const { data: currentInvoice } = await supabase
      .from('Invoice')
      .select(
        'quoteId, status, title, invoiceType, shipmentId, purchaseShipmentId, totalAmount, invoiceNumber, customerId'
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (currentInvoice && currentInvoice.quoteId) {
      return NextResponse.json(
        { 
          error: 'Tekliften oluşturulan faturalar değiştirilemez',
          message: 'Bu fatura tekliften otomatik olarak oluşturuldu. Fatura bilgilerini değiştirmek için önce teklifi reddetmeniz gerekir.',
          reason: 'QUOTE_INVOICE_CANNOT_BE_UPDATED',
          relatedQuote: {
            id: currentInvoice.quoteId,
            link: `/quotes/${currentInvoice.quoteId}`
          }
        },
        { status: 403 }
      )
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

      return NextResponse.json(
        { 
          error: 'Bu fatura artık değiştirilemez',
          message: `${currentStatus} durumundaki faturalar değiştirilemez (immutable). ${
            currentStatus === 'PAID' ? 'Finance kaydı oluşturulmuştur.' : 'İptal edilmiştir.'
          }`,
          reason: 'IMMUTABLE_INVOICE',
          status: currentStatus,
          relatedFinance
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Status transition validation
    if (body.status !== undefined && body.status !== currentStatus) {
      const validation = isValidInvoiceTransition(currentStatus, body.status)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Geçersiz status geçişi',
            message: validation.error || getTransitionErrorMessage('invoice', currentStatus, body.status),
            reason: 'INVALID_STATUS_TRANSITION',
            currentStatus,
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
    const invoiceType =
      body.invoiceType ||
      (typeof (currentInvoice as any)?.invoiceType === 'string'
        ? (currentInvoice as any).invoiceType
        : null)

    let shipmentIdForAutomation =
      (currentInvoice as any)?.shipmentId || null
    let purchaseTransactionIdForAutomation =
      (currentInvoice as any)?.purchaseShipmentId || null

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
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: 'Fatura Vadesi Geçti',
              message: `${(currentInvoice as any)?.invoiceNumber || currentInvoice?.title || 'Fatura'} faturasının vadesi geçti. Ödeme yapılması gerekiyor.`,
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
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: daysUntilDue <= 1 ? 'Fatura Vadesi Yaklaşıyor (Kritik)' : 'Fatura Vadesi Yaklaşıyor',
              message: `${(currentInvoice as any)?.invoiceNumber || currentInvoice?.title || 'Fatura'} faturasının vadesi ${daysUntilDue} gün sonra. ${daysUntilDue <= 1 ? 'Acil ödeme yapılması gerekiyor.' : 'Ödeme yapılması gerekiyor.'}`,
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

    if (
      requestedStatus === 'SENT' &&
      previousStatus !== 'SENT'
    ) {
      shouldNotifySent = true
      shouldSendSentEmail = true

      if (invoiceType === 'SALES' && !shipmentIdForAutomation) {
        const { shipmentId, created } = await ensureSalesShipmentForSentStatus({
          supabase,
          invoiceId: id,
          companyId,
          sessionUserId: session.user.id,
          invoiceItems: invoiceItemsForAutomation,
        })

        if (shipmentId) {
          shipmentIdForAutomation = shipmentId
        }

        if (created) {
          shouldNotifySent = true
        }
      }

      if (invoiceType === 'PURCHASE' && !purchaseTransactionIdForAutomation) {
        const { purchaseShipmentId, created } =
          await ensurePurchaseTransactionForSentStatus({
            supabase,
            invoiceId: id,
            companyId,
            sessionUserId: session.user.id,
            invoiceItems: invoiceItemsForAutomation,
          })

        if (purchaseShipmentId) {
          purchaseTransactionIdForAutomation = purchaseShipmentId
        }

        if (created) {
          shouldNotifySent = true
        }
      }
    }

    if (
      requestedStatus === 'SHIPPED' &&
      previousStatus !== 'SHIPPED' &&
      invoiceType === 'SALES'
    ) {
      if (!shipmentIdForAutomation) {
        const { shipmentId } = await ensureSalesShipmentForSentStatus({
          supabase,
          invoiceId: id,
          companyId,
          sessionUserId: session.user.id,
          invoiceItems: invoiceItemsForAutomation,
        })
        if (shipmentId) {
          shipmentIdForAutomation = shipmentId
        }
      }

      if (shipmentIdForAutomation) {
        await supabase
          .from('Shipment')
          .update({
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', shipmentIdForAutomation)
          .eq('companyId', companyId)
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
          description:
            'Fatura sevkiyatı onaylandı ve stoktan düşüldü.',
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
      if (!purchaseTransactionIdForAutomation) {
        const { purchaseShipmentId } =
          await ensurePurchaseTransactionForSentStatus({
            supabase,
            invoiceId: id,
            companyId,
            sessionUserId: session.user.id,
            invoiceItems: invoiceItemsForAutomation,
          })

        if (purchaseShipmentId) {
          purchaseTransactionIdForAutomation = purchaseShipmentId
        }
      }

      if (purchaseTransactionIdForAutomation) {
        await supabase
          .from('PurchaseTransaction')
          .update({
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', purchaseTransactionIdForAutomation)
          .eq('companyId', companyId)
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
          description:
            'Mal kabul tamamlandı ve stoğa giriş yapıldı.',
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
    const updateData: any = {
      title: body.title,
      status: body.status,
      totalAmount: body.totalAmount !== undefined ? parseFloat(body.totalAmount) : (body.total !== undefined ? parseFloat(body.total) : undefined),
      updatedAt: new Date().toISOString(),
    }

    // Migration 007: invoiceType ekle (eğer migration çalıştırıldıysa)
    if (body.invoiceType) {
      try {
        // invoiceType kolonunun varlığını kontrol et
        const { error: checkError } = await supabase
          .from('Invoice')
          .select('invoiceType')
          .limit(0)
        
        if (!checkError) {
          updateData.invoiceType = body.invoiceType
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

    // @ts-ignore - Supabase type inference issue with dynamic updateData
    const { data: updateResult, error } = await (supabase.from('Invoice') as any)
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // .single() yerine array kontrolü yap - "Cannot coerce the result to a single JSON object" hatasını önle
    const data = Array.isArray(updateResult) && updateResult.length > 0 
      ? updateResult[0] 
      : updateResult

    if (!data) {
      return NextResponse.json({ error: 'Invoice not found after update' }, { status: 404 })
    }

    const invoiceDisplayName =
      data?.title ||
      data?.invoiceNumber ||
      `Fatura #${String(id).substring(0, 8)}`

    if (shouldNotifySent && data) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: 'Fatura Gönderildi',
          message: `${invoiceDisplayName} faturası gönderildi. Sevkiyat hazırlıkları tamamlandı.`,
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
              subject: emailTemplate.subject || 'Faturanız gönderildi',
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
          title: 'Sevkiyat Onaylandı',
          message: `${invoiceDisplayName} faturası için sevkiyat onaylandı ve stoktan düşüldü.`,
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
          title: 'Mal Kabul Tamamlandı',
          message: `${invoiceDisplayName} faturası için mal kabul tamamlandı ve stoğa giriş yapıldı.`,
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
          title: 'Fatura İptal Edildi',
          message: `${invoiceDisplayName} faturası iptal edildi.`,
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
          // @ts-expect-error - Supabase database type tanımları eksik
          .insert([
            {
              type: 'INCOME',
              amount: data.totalAmount || 0,
              relatedTo: `Invoice: ${data.id}`,
              companyId: session.user.companyId,
              category: 'INVOICE_INCOME', // Kategori ekle
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
              description: `Fatura ödendi, finans kaydı oluşturuldu`,
              meta: { entity: 'Finance', action: 'create', id: (finance as any).id, fromInvoice: data.id },
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
              title: 'Fatura Ödendi',
              message: `Fatura ödendi ve finans kaydı oluşturuldu. Detayları görmek ister misiniz?`,
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
                  subject: emailTemplate.subject || 'Faturanız Ödendi',
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

    let activityDescription = `Fatura bilgileri güncellendi: ${body.title || data.title}`

    if (hasStatusChange) {
      switch (requestedStatus) {
        case 'SENT':
          activityDescription = `${invoiceDisplayName} faturası gönderildi.`
          break
        case 'SHIPPED':
          activityDescription = `${invoiceDisplayName} faturası sevkiyatı onaylandı.`
          break
        case 'RECEIVED':
          activityDescription = `${invoiceDisplayName} faturası için mal kabul tamamlandı.`
          break
        case 'PAID':
          activityDescription = `${invoiceDisplayName} faturası ödendi olarak işaretlendi.`
          break
        case 'OVERDUE':
          activityDescription = `${invoiceDisplayName} faturası vadesi geçmiş olarak işaretlendi.`
          break
        case 'CANCELLED':
          activityDescription = `${invoiceDisplayName} faturası iptal edildi.`
          break
        default:
          activityDescription = `${invoiceDisplayName} faturası güncellendi (durum: ${requestedStatus}).`
      }
    } else if (body.title && body.title !== currentInvoice?.title) {
      activityDescription = `Fatura başlığı güncellendi: ${currentInvoice?.title || '-'} → ${body.title}`
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

    return NextResponse.json(data)
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

      return NextResponse.json(
        { 
          error: 'Bu fatura silinemez',
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
      return NextResponse.json(
        { 
          error: 'Sevkiyatı yapılmış faturalar silinemez',
          message: 'Bu fatura için sevkiyat yapıldı ve stoktan düşüldü. Faturayı silmek için önce sevkiyatı iptal etmeniz ve stok işlemini geri almanız gerekir.',
          reason: 'SHIPPED_INVOICE_CANNOT_BE_DELETED',
          action: 'Sevkiyatı iptal edip stok işlemini geri alın'
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Invoice RECEIVED olduğunda silinemez (Stok artırıldığı için)
    if (invoice?.status === 'RECEIVED') {
      return NextResponse.json(
        { 
          error: 'Mal kabul edilmiş faturalar silinemez',
          message: 'Bu fatura için mal kabul edildi ve stoğa girişi yapıldı. Faturayı silmek için önce mal kabul işlemini iptal etmeniz ve stok işlemini geri almanız gerekir.',
          reason: 'RECEIVED_INVOICE_CANNOT_BE_DELETED',
          action: 'Mal kabul işlemini iptal edip stok işlemini geri alın'
        },
        { status: 403 }
      )
    }

    // ÖNEMLİ: Invoice quoteId varsa silinemez (Tekliften oluşturulduğu için)
    if (invoice?.quoteId) {
      return NextResponse.json(
        { 
          error: 'Tekliften oluşturulan faturalar silinemez',
          message: 'Bu fatura tekliften otomatik olarak oluşturuldu. Faturayı silmek için önce teklifi reddetmeniz gerekir.',
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
      const invoiceTitle = (invoice as any)?.title || (deletedData[0] as any)?.title || 'Unknown'
      const activityData = {
        entity: 'Invoice',
        action: 'DELETE',
        description: `Fatura silindi: ${invoiceTitle}`,
        meta: { entity: 'Invoice', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }
      
      // @ts-expect-error - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
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



