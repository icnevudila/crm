import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
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
    const { data: activities } = await supabase
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
      .eq('companyId', session.user.companyId)
      .eq('entity', 'Invoice')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

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

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Invoice verilerini güncelle - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, total, quoteId, companyId, updatedAt
    // schema-extension.sql: invoiceNumber, dueDate, paymentDate, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 007: invoiceType (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: any = {
      title: body.title,
      status: body.status,
      total: body.total,
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
    if (body.status === 'PAID' && data) {
      const { data: finance } = await supabase
        .from('Finance')
        // @ts-expect-error - Supabase database type tanımları eksik
        .insert([
          {
            type: 'INCOME',
            amount: data.total,
            relatedTo: `Invoice: ${data.id}`,
            companyId: session.user.companyId,
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
            description: `Fatura ödendi, finans kaydı oluşturuldu: ${formatCurrency(data.total)}`,
            meta: { entity: 'Finance', action: 'create', id: (finance as any).id, fromInvoice: data.id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      }
    }

    // ActivityLog kaydı
    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Invoice',
        action: 'UPDATE',
        description: `Fatura güncellendi: ${body.title || data.title}`,
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

    // Önce invoice'u kontrol et - ActivityLog için title lazım (optional - hata olsa bile silme işlemi yapılır)
    const { data: invoice } = await supabase
      .from('Invoice')
      .select('title')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice fetch result:', {
        invoiceFound: !!invoice,
        invoiceTitle: invoice?.title,
      })
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



