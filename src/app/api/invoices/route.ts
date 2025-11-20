import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createRecord } from '@/lib/crud'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DEBUG: Session ve permission bilgisini logla (sadece gerekirse)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[Invoices API] 🔍 Session Check:', {
    //     userId: session.user.id,
    //     email: session.user.email,
    //     role: session.user.role,
    //     companyId: session.user.companyId,
    //     companyName: session.user.companyName,
    //   })
    // }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Invoices API] ❌ Permission Denied:', {
          module: 'invoice',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const invoiceType = searchParams.get('invoiceType') || '' // SALES veya PURCHASE
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // OPTİMİZE: Sadece gerekli kolonları seç - performans için
    // SuperAdmin için Company bilgisi ekle
    // ÖNEMLİ: totalAmount kolonunu çek (050 migration ile total → totalAmount olarak değiştirildi)
    let query = supabase
      .from('Invoice')
      .select(`
        id, title, status, totalAmount, quoteId, createdAt, invoiceType, companyId,
        Company:companyId (
          id,
          name
        )
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // invoiceType filtresi (SALES veya PURCHASE)
    if (invoiceType && (invoiceType === 'SALES' || invoiceType === 'PURCHASE')) {
      query = query.eq('invoiceType', invoiceType)
    }

    // Firma bazlı filtreleme (customerCompanyId)
    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    // Pagination uygula - EN SON (filtrelerden sonra)
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    // Dengeli cache - 60 saniye (performans + veri güncelliği dengesi)
    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canCreate = await hasPermission('invoice', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Invoices POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: (await import('@/lib/api-locale')).getErrorMessage('errors.api.invoiceTitleRequired', request) },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Otomatik fatura numarası oluştur (eğer invoiceNumber gönderilmemişse)
    let invoiceNumber = body.invoiceNumber
    if (!invoiceNumber || invoiceNumber.trim() === '') {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      
      // Bu ay oluşturulan fatura sayısını al (invoiceNumber ile başlayanlar)
      const { count } = await supabase
        .from('Invoice')
        .select('*', { count: 'exact', head: true })
        .eq('companyId', session.user.companyId)
        .like('invoiceNumber', `INV-${year}-${month}-%`)
      
      // Sıradaki numara
      const nextNumber = String((count || 0) + 1).padStart(4, '0')
      invoiceNumber = `INV-${year}-${month}-${nextNumber}`
    }

    // Invoice verilerini oluştur - totalAmount kullan (050 migration ile total → totalAmount olarak değiştirildi)
    // schema.sql: title, status, totalAmount, quoteId, companyId
    // schema-extension.sql: invoiceNumber, dueDate, paymentDate, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    const invoiceData: any = {
      title: body.title.trim(),
      status: body.status || 'DRAFT',
      totalAmount: body.totalAmount !== undefined ? parseFloat(body.totalAmount) : (body.total !== undefined ? parseFloat(body.total) : 0),
      companyId: session.user.companyId,
      invoiceNumber: invoiceNumber, // Otomatik oluşturulan numara
    }

    // Sadece schema.sql'de olan alanlar
    if (body.quoteId) invoiceData.quoteId = body.quoteId
    // Firma bazlı ilişki (customerCompanyId)
    if (body.customerCompanyId) invoiceData.customerCompanyId = body.customerCompanyId
    // ÖNEMLİ: invoiceType ekle (PURCHASE, SALES, SERVICE_SALES, SERVICE_PURCHASE) - mal kabul/sevkiyat kaydı açmak için gerekli
    if (body.invoiceType && (
      body.invoiceType === 'PURCHASE' || 
      body.invoiceType === 'SALES' || 
      body.invoiceType === 'SERVICE_SALES' || 
      body.invoiceType === 'SERVICE_PURCHASE'
    )) {
      invoiceData.invoiceType = body.invoiceType
    }
    // Hizmet açıklaması ekle (hizmet faturaları için)
    if (body.serviceDescription && body.serviceDescription.trim() !== '') {
      invoiceData.serviceDescription = body.serviceDescription.trim()
    }
    // NOT: invoiceNumber, dueDate, paymentDate, taxRate, vendorId schema-extension/schema-vendor'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // createRecord kullanarak tip sorununu bypass ediyoruz
    const { getActivityMessage, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const data = await createRecord(
      'Invoice',
      invoiceData,
      getActivityMessage(locale, 'invoiceCreated', { title: body.title })
    )

    // Oluşturulan invoice'ı tam bilgileriyle çek (commit edildiğinden emin olmak için)
    // OPTİMİZE: Retry mekanizması azaltıldı - sadece 2 deneme, 100ms bekleme (performans için)
    // Normal kullanımda invoice hemen commit edilir, retry'ye gerek yok
    let fullData = data
    const maxRetries = 2 // Sadece 2 deneme (performans için)
    const retryDelay = 100 // 100ms - çok kısa bekleme (performans için)
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (data?.id) {
        const { data: fetchedData, error: fetchError } = await supabase
          .from('Invoice')
          .select('*')
          .eq('id', data.id)
          .eq('companyId', session.user.companyId)
          .single()
        
        if (fetchedData && !fetchError) {
          fullData = fetchedData
          break // Invoice bulundu, retry'ye gerek yok
        }
      }
      
      // Son deneme değilse bekle ve tekrar dene
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Invoice POST result:', {
        invoiceId: fullData?.id,
        invoiceTitle: fullData?.title,
        companyId: fullData?.companyId,
        attempts: maxRetries,
        finalData: fullData ? 'found' : 'not found',
      })
    }

    // Eğer hala invoice bulunamadıysa, createRecord'dan dönen data'yı kullan
    const invoiceResult = fullData || data

    // YENİ: Alış faturası (PURCHASE) ise ve invoiceItem'lar varsa:
    // 1. InvoiceItem'ları kaydet
    // 2. IncomingQuantity güncelle
    // 3. Taslak mal kabul (PurchaseTransaction) oluştur
    // 4. Invoice'a purchaseShipmentId ekle
    // ÖNEMLİ: Sadece invoiceItems varsa mal kabul kaydı açılır (malzeme yokken mal kabul açılmaz)
    if (invoiceResult?.id && body.invoiceType === 'PURCHASE' && body.invoiceItems && Array.isArray(body.invoiceItems) && body.invoiceItems.length > 0) {
      try {
        // InvoiceItem'ları kaydet (eğer henüz kaydedilmediyse)
        const invoiceItems = body.invoiceItems
        
        for (const item of invoiceItems) {
          try {
            const quantity = parseFloat(item.quantity) || 0
            const unitPrice = parseFloat(item.unitPrice) || 0
            const total = quantity * unitPrice
            
            const invoiceItemData: any = {
              invoiceId: invoiceResult.id,
              productId: item.productId,
              quantity: quantity,
              total: total,
              companyId: session.user.companyId,
            }
            
            // unitPrice kolonunu kontrol et
            try {
              const { error: checkError1 } = await supabase
                .from('InvoiceItem')
                .select('unitPrice')
                .limit(0)
              
              const { error: checkError2 } = await supabase
                .from('InvoiceItem')
                .select('unitprice')
                .limit(0)
              
              if (!checkError1) {
                invoiceItemData.unitPrice = unitPrice
              } else if (!checkError2) {
                invoiceItemData.unitprice = unitPrice
              }
            } catch (e) {
              // unitPrice olmadan devam et
            }
            
            const { error: itemError } = await supabase
              .from('InvoiceItem')
              // @ts-expect-error - Supabase database type tanımları eksik
              .insert([invoiceItemData])
            
            if (itemError) {
              console.error('InvoiceItem save error:', itemError)
            }
          } catch (itemError) {
            console.error('InvoiceItem save error:', itemError)
          }
        }

        // Her ürün için incomingQuantity güncelle
        for (const item of invoiceItems) {
          try {
            const { data: productData } = await supabase
              .from('Product')
              .select('incomingQuantity, stock')
              .eq('id', item.productId)
              .eq('companyId', session.user.companyId)
              .single()
            
            if (productData) {
              const currentIncoming = parseFloat((productData as any).incomingQuantity || 0)
              const quantity = parseFloat(item.quantity) || 0
              
              // IncomingQuantity artır
              await supabase
                .from('Product')
                .update({
                  incomingQuantity: currentIncoming + quantity,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', item.productId)
                .eq('companyId', session.user.companyId)
            }
          } catch (incomingError) {
            console.error('Incoming quantity update error:', incomingError)
          }
        }

        // Taslak mal kabul (PurchaseTransaction) oluştur (sadece invoiceItems varsa)
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('PurchaseTransaction')
          // @ts-expect-error - Supabase database type tanımları eksik
          .insert([{
            invoiceId: invoiceResult.id,
            status: 'DRAFT', // Taslak durumunda
            companyId: session.user.companyId,
          }])
          .select()
          .single()
        
        if (purchaseData && !purchaseError) {
          // Invoice'a purchaseShipmentId ekle
          await supabase
            .from('Invoice')
            .update({ purchaseShipmentId: (purchaseData as any).id })
            .eq('id', invoiceResult.id)
            .eq('companyId', session.user.companyId)
          
          // ActivityLog kaydı
          try {
            // @ts-expect-error - Supabase database type tanımları eksik
            await supabase.from('ActivityLog').insert([{
              entity: 'PurchaseTransaction',
              action: 'CREATE',
              description: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.draftPurchaseCreated,
              meta: { 
                entity: 'PurchaseTransaction', 
                action: 'create', 
                id: (purchaseData as any).id,
                invoiceId: invoiceResult.id,
              },
              userId: session.user.id,
              companyId: session.user.companyId,
            }])
          } catch (activityError) {
            // ActivityLog hatası ana işlemi engellemez
          }

          // Invoice sonucuna purchaseShipmentId ekle
          invoiceResult.purchaseShipmentId = (purchaseData as any).id
          invoiceResult.purchaseShipmentCreated = true
          invoiceResult.purchaseShipmentMessage = getActivityMessage(locale, 'draftPurchaseCreatedMessage', { id: (purchaseData as any).id })
        }
      } catch (error) {
        // Hata olsa bile invoice oluşturuldu, sadece logla
        console.error('Incoming stock and purchase shipment creation error:', error)
      }
    }

    // YENİ: Satış faturası (SALES) ise ve invoiceItem'lar varsa:
    // 1. Rezerve miktar güncelle
    // 2. Taslak sevkiyat oluştur
    // 3. Invoice'a shipmentId ekle
    if (invoiceResult?.id && body.invoiceType === 'SALES' && body.invoiceItems && Array.isArray(body.invoiceItems) && body.invoiceItems.length > 0) {
      try {
        // InvoiceItem'ları kaydet (eğer henüz kaydedilmediyse)
        // NOT: InvoiceForm.tsx'den invoiceItems geliyor, ama henüz kaydedilmemiş olabilir
        // Bu yüzden önce InvoiceItem'ları kaydet, sonra rezerve miktar güncelle
        
        // InvoiceItem'ları kaydet (doğrudan Supabase kullan)
        const invoiceItems = body.invoiceItems
        for (const item of invoiceItems) {
          try {
            const quantity = parseFloat(item.quantity) || 0
            const unitPrice = parseFloat(item.unitPrice) || 0
            const total = quantity * unitPrice
            
            const invoiceItemData: any = {
              invoiceId: invoiceResult.id,
              productId: item.productId,
              quantity: quantity,
              total: total,
              companyId: session.user.companyId,
            }
            
            // unitPrice kolonunu kontrol et
            try {
              const { error: checkError1 } = await supabase
                .from('InvoiceItem')
                .select('unitPrice')
                .limit(0)
              
              const { error: checkError2 } = await supabase
                .from('InvoiceItem')
                .select('unitprice')
                .limit(0)
              
              if (!checkError1) {
                invoiceItemData.unitPrice = unitPrice
              } else if (!checkError2) {
                invoiceItemData.unitprice = unitPrice
              }
            } catch (e) {
              // unitPrice olmadan devam et
            }
            
            const { error: itemError } = await supabase
              .from('InvoiceItem')
              // @ts-expect-error - Supabase database type tanımları eksik
              .insert([invoiceItemData])
            
            if (itemError) {
              console.error('InvoiceItem save error:', itemError)
            }
          } catch (itemError) {
            console.error('InvoiceItem save error:', itemError)
          }
        }

        // Her ürün için rezerve miktar güncelle
        for (const item of invoiceItems) {
          try {
            const { data: productData } = await supabase
              .from('Product')
              .select('reservedQuantity, stock')
              .eq('id', item.productId)
              .eq('companyId', session.user.companyId)
              .single()
            
            if (productData) {
              const currentReserved = parseFloat((productData as any).reservedQuantity || 0)
              const quantity = parseFloat(item.quantity) || 0
              
              // Rezerve miktarı artır
              await supabase
                .from('Product')
                .update({
                  reservedQuantity: currentReserved + quantity,
                  updatedAt: new Date().toISOString(),
                })
                .eq('id', item.productId)
                .eq('companyId', session.user.companyId)
            }
          } catch (reserveError) {
            console.error('Reserved quantity update error:', reserveError)
          }
        }

        // Taslak sevkiyat oluştur
        const { data: shipmentData, error: shipmentError } = await supabase
          .from('Shipment')
          // @ts-expect-error - Supabase database type tanımları eksik
          .insert([{
            invoiceId: invoiceResult.id,
            status: 'DRAFT', // Taslak durumunda
            companyId: session.user.companyId,
          }])
          .select()
          .single()
        
        if (shipmentData && !shipmentError) {
          // Invoice'a shipmentId ekle
          await supabase
            .from('Invoice')
            .update({ shipmentId: (shipmentData as any).id })
            .eq('id', invoiceResult.id)
            .eq('companyId', session.user.companyId)
          
          // ActivityLog kaydı
          try {
            // @ts-expect-error - Supabase database type tanımları eksik
            await supabase.from('ActivityLog').insert([{
              entity: 'Shipment',
              action: 'CREATE',
              description: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.draftShipmentCreated,
              meta: { 
                entity: 'Shipment', 
                action: 'create', 
                id: (shipmentData as any).id,
                invoiceId: invoiceResult.id,
              },
              userId: session.user.id,
              companyId: session.user.companyId,
            }])
          } catch (activityError) {
            // ActivityLog hatası ana işlemi engellemez
          }

          // Invoice sonucuna shipmentId ekle
          invoiceResult.shipmentId = (shipmentData as any).id
          invoiceResult.shipmentCreated = true
          invoiceResult.shipmentMessage = getActivityMessage(locale, 'draftShipmentCreatedMessage', { id: (shipmentData as any).id })
        }
      } catch (error) {
        // Hata olsa bile invoice oluşturuldu, sadece logla
        console.error('Reserved stock and shipment creation error:', error)
      }
    }

    // ActivityLog - Kritik modül için CREATE log'u (async, hata olsa bile devam et)
    if (invoiceResult?.id) {
      try {
        const { logAction } = await import('@/lib/logger')
        // Async olarak logla - ana işlemi engellemez
        logAction({
          entity: 'Invoice',
          action: 'CREATE',
          description: `Yeni fatura oluşturuldu: ${(invoiceResult as any)?.title || 'Başlıksız'}`,
          meta: { 
            entity: 'Invoice', 
            action: 'create', 
            id: (invoiceResult as any).id,
            title: (invoiceResult as any)?.title,
            status: (invoiceResult as any)?.status,
            totalAmount: (invoiceResult as any)?.totalAmount,
            invoiceType: (invoiceResult as any)?.invoiceType,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        }).catch(() => {
          // ActivityLog hatası ana işlemi engellemez
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
      }
    }

    // Bildirim: Fatura oluşturuldu
    if (invoiceResult?.id) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        
        // Firma bilgisini çek (eğer customerCompanyId varsa)
        let companyName = ''
        if (body.customerCompanyId) {
          const { data: companyData } = await supabase
            .from('CustomerCompany')
            .select('name')
            .eq('id', body.customerCompanyId)
            .single()
          if (companyData) {
            companyName = companyData.name
          }
        }
        
        // Quote bilgisini çek (eğer quoteId varsa)
        let quoteTitle = ''
        if (body.quoteId) {
          const { data: quoteData } = await supabase
            .from('Quote')
            .select('title')
            .eq('id', body.quoteId)
            .single()
          if (quoteData) {
            quoteTitle = quoteData.title
          }
        }
        
        // Bildirim mesajını oluştur
        let notificationMessage = `"${(invoiceResult as any).title}" faturası oluşturuldu.`
        if (companyName) {
          notificationMessage = `${companyName} firması için "${(invoiceResult as any).title}" faturası oluşturuldu.`
        } else if (quoteTitle) {
          notificationMessage = `"${quoteTitle}" teklifi için "${(invoiceResult as any).title}" faturası oluşturuldu.`
        }
        
        const notificationResult = await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: 'Yeni Fatura Oluşturuldu',
          message: notificationMessage,
          type: 'info',
          relatedTo: 'Invoice',
          relatedId: (invoiceResult as any).id,
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Invoice notification sent:', {
            invoiceId: (invoiceResult as any).id,
            invoiceTitle: (invoiceResult as any).title,
            companyId: session.user.companyId,
            notificationResult,
          })
        }
      } catch (notificationError: any) {
        // Bildirim hatası ana işlemi engellemez ama logla
        console.error('Invoice notification error:', {
          error: notificationError?.message || notificationError,
          invoiceId: (invoiceResult as any)?.id,
          companyId: session.user.companyId,
        })
      }
    }

    // ✅ Otomasyon: Invoice oluşturulduğunda email gönder (kullanıcı tercihine göre)
    try {
      const automationRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/invoice-created-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: invoiceResult,
        }),
      })
      // Automation hatası ana işlemi engellemez (sadece log)
      if (!automationRes.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Invoice Automation] Email gönderimi başarısız veya kullanıcı tercihi ASK')
        }
      }
    } catch (automationError) {
      // Automation hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('[Invoice Automation] Error:', automationError)
      }
    }

    return NextResponse.json(invoiceResult, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Invoices POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
