import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { 
  isValidInvoiceTransition, 
  isInvoiceImmutable, 
  canDeleteInvoice,
  getTransitionErrorMessage
} from '@/lib/stageValidation'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoices [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Fatura görüntüleme yetkiniz yok' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoices [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('invoice', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Fatura güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Quote'tan oluşturulan faturalar ve kesinleşmiş faturalar korumalı - hiçbir şekilde değiştirilemez
    const { data: currentInvoice } = await supabase
      .from('Invoice')
      .select('quoteId, status, title')
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

    // SHIPPED/RECEIVED kontrolü - özel kural (stok işlemi var)
    if (currentInvoice && (currentInvoice.status === 'SHIPPED' || currentInvoice.status === 'RECEIVED')) {
      return NextResponse.json(
        { 
          error: currentInvoice.status === 'SHIPPED' 
            ? 'Sevkiyatı yapılmış faturalar değiştirilemez' 
            : 'Mal kabul edilmiş faturalar değiştirilemez',
          message: currentInvoice.status === 'SHIPPED'
            ? 'Bu fatura için sevkiyat yapıldı ve stoktan düşüldü.'
            : 'Bu fatura için mal kabul edildi ve stoğa girişi yapıldı.',
          reason: currentInvoice.status === 'SHIPPED' 
            ? 'SHIPPED_INVOICE_CANNOT_BE_UPDATED'
            : 'RECEIVED_INVOICE_CANNOT_BE_UPDATED'
        },
        { status: 403 }
      )
    }

    // PAID kontrolü artık immutability'de var ama eski kod uyumluluğu için bırakıyoruz
    if (currentInvoice?.status === 'PAID') {
      // İlgili Finance kaydını kontrol et (kullanıcıya bilgi vermek için)
      const { data: relatedFinance } = await supabase
        .from('Finance')
        .select('id, amount, type')
        .eq('relatedTo', `Invoice: ${id}`)
        .eq('companyId', session.user.companyId)
        .maybeSingle()

      return NextResponse.json(
        { 
          error: 'Ödenmiş faturalar değiştirilemez',
          message: 'Bu fatura ödendi ve finans kaydı oluşturuldu. Fatura bilgilerini değiştirmek için önce ilgili finans kaydını silmeniz gerekir.',
          reason: 'PAID_INVOICE_CANNOT_BE_UPDATED',
          relatedFinance: relatedFinance ? {
            id: relatedFinance.id,
            amount: relatedFinance.amount,
            type: relatedFinance.type
          } : null
        },
        { status: 403 }
      )
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

    // ACCEPTED olan faturalar iptal edilemez
    if (body.status === 'CANCELLED') {
      if (currentInvoice && currentInvoice.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Kabul edilmiş faturalar iptal edilemez' },
          { status: 400 }
        )
      }
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

    // ActivityLog kaydı
    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Invoice',
        action: 'UPDATE',
        description: `Fatura bilgileri güncellendi: ${body.title || data.title}`,
        meta: { entity: 'Invoice', action: 'update', id },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoices [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
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



