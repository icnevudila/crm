import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - Status güncellemeleri için cache'i kapat
export const dynamic = 'force-dynamic'

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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('shipment', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // YENİ: Shipment'ları çek (Invoice'ı ayrı query ile çekeceğiz - ilişki hatası nedeniyle)
    // estimatedDelivery kolonunu dinamik kontrol et
    // SuperAdmin için Company bilgisi ekle
    let selectColumns = 'id, tracking, status, invoiceId, createdAt, updatedAt, companyId, Company:companyId(id, name)'
    
    // estimatedDelivery kolonunu kontrol et
    try {
      const testQuery = supabase.from('Shipment').select('estimatedDelivery').limit(1)
      const { error: estimatedError } = await testQuery
      if (!estimatedError) {
        selectColumns += ', estimatedDelivery'
      }
    } catch (estimatedErr) {
      // estimatedDelivery kolonu yok, ekleme
    }
    
    let query = supabase
      .from('Shipment')
      .select(selectColumns)
      .order('createdAt', { ascending: false })
      .limit(50) // Agresif limit - sadece 50 kayıt (performans için)
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    if (search) {
      query = query.or(`tracking.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Tarih filtreleme
    if (dateFrom) {
      query = query.gte('createdAt', dateFrom)
    }
    if (dateTo) {
      query = query.lte('createdAt', dateTo)
    }

    // Firma bazlı filtreleme (customerCompanyId)
    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    const { data: shipments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // OPTİMİZE: N+1 query problemini çöz - tüm invoice'ları tek seferde çek
    // Önceki: Her shipment için ayrı invoice query (N+1 problem - çok yavaş!)
    // Yeni: Tüm invoice'ları tek query ile çek, JavaScript'te map et (çok daha hızlı!)
    const invoiceIds = (shipments || [])
      .map((s: any) => s.invoiceId)
      .filter((id: any) => id) // null/undefined'ları filtrele
      .filter((id: any, index: number, arr: any[]) => arr.indexOf(id) === index) // Duplicate'leri kaldır

    // Tüm invoice'ları tek seferde çek
    const { data: allInvoices } = invoiceIds.length > 0
      ? await supabase
          .from('Invoice')
          .select(`
            id,
            title,
            invoiceNumber,
            totalAmount,
            createdAt,
            quoteId,
            Customer (
              id,
              name,
              email
            )
          `)
          .in('id', invoiceIds)
          .eq('companyId', companyId)
      : { data: [] }

    // Quote ID'lerini topla (invoice'ların quoteId'lerinden)
    const quoteIds = (allInvoices || [])
      .map((inv: any) => inv.quoteId)
      .filter((id: any) => id)
      .filter((id: any, index: number, arr: any[]) => arr.indexOf(id) === index)

    // Tüm quote'ları tek seferde çek
    const { data: allQuotes } = quoteIds.length > 0
      ? await supabase
          .from('Quote')
          .select(`
            id,
            Deal (
              id,
              Customer (
                id,
                name,
                email
              )
            )
          `)
          .in('id', quoteIds)
          .eq('companyId', companyId)
      : { data: [] }

    // Invoice ve quote'ları Map'e çevir (hızlı lookup için)
    const invoiceMap = new Map((allInvoices || []).map((inv: any) => [inv.id, inv]))
    const quoteMap = new Map((allQuotes || []).map((q: any) => [q.id, q]))

    // Shipment'ları invoice ve quote bilgileriyle map et
    const shipmentsWithInvoices = (shipments || []).map((shipment: any) => {
      if (!shipment.invoiceId) {
        return shipment
      }

      const invoice = invoiceMap.get(shipment.invoiceId)
      if (!invoice) {
        return shipment
      }

      const invoiceObj = invoice as any
      const quote = invoiceObj.quoteId ? quoteMap.get(invoiceObj.quoteId) : null

      return {
        ...shipment,
        Invoice: {
          ...invoiceObj,
          ...(quote && { Quote: quote }),
        },
      }
    })

    // Cache'i kapat - Status güncellemeleri için fresh data gerekli
    return NextResponse.json(shipmentsWithInvoices || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Sevkiyatlar getirilemedi' },
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
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('shipment', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipments POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.invoiceId || body.invoiceId.trim() === '') {
      return NextResponse.json(
        { error: 'Fatura ID gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Shipment verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: tracking, status, invoiceId, companyId
    // schema-extension.sql: shippingCompany, estimatedDelivery, deliveryAddress (migration çalıştırılmamış olabilir - GÖNDERME!)
    const shipmentData: any = {
      companyId: session.user.companyId,
      status: body.status || 'PENDING',
    }

    // Sadece schema.sql'de olan alanlar
    if (body.invoiceId) {
      shipmentData.invoiceId = body.invoiceId
      // Invoice'dan customerCompanyId'yi çek (eğer varsa)
      try {
        const { data: invoice } = await supabase
          .from('Invoice')
          .select('customerCompanyId')
          .eq('id', body.invoiceId)
          .maybeSingle()
        if (invoice?.customerCompanyId) {
          shipmentData.customerCompanyId = invoice.customerCompanyId
        }
      } catch (invoiceError) {
        // Invoice bulunamazsa devam et
        if (process.env.NODE_ENV === 'development') {
          console.error('Invoice fetch error for customerCompanyId:', invoiceError)
        }
      }
    }
    // Firma bazlı ilişki (customerCompanyId) - body'den de alınabilir
    if (body.customerCompanyId) shipmentData.customerCompanyId = body.customerCompanyId
    if (body.tracking !== undefined && body.tracking !== null && body.tracking !== '') {
      shipmentData.tracking = body.tracking
    }
    // NOT: shippingCompany, estimatedDelivery, deliveryAddress schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const { data: insertData, error } = await supabase
      .from('Shipment')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([shipmentData])
      .select()
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipments POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Sevkiyat oluşturulamadı' },
        { status: 500 }
      )
    }
    
    // .single() yerine array'in ilk elemanını al
    const data = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData

    // Sevkiyat oluşturulduğunda InvoiceItem'ları kontrol et ve stok hareketi kaydı oluştur
    // NOT: InvoiceItem trigger'ı zaten stok düşürüyor/artırıyor, ama sevkiyat için ayrı bir kayıt oluşturuyoruz
    if (body.invoiceId && data) {
      try {
        // InvoiceItem'ları çek
        const { data: invoiceItems } = await supabase
          .from('InvoiceItem')
          .select('productId, quantity')
          .eq('invoiceId', body.invoiceId)
          .eq('companyId', session.user.companyId)

        if (invoiceItems && invoiceItems.length > 0) {
          // Her ürün için stok hareketi kaydı oluştur (sevkiyat çıkışı)
          for (const item of invoiceItems as any[]) {
            // Mevcut stoku al
            const { data: productData } = await supabase
              .from('Product')
              .select('stock')
              .eq('id', item.productId)
              .eq('companyId', session.user.companyId)
            
            const product = Array.isArray(productData) && productData.length > 0 ? productData[0] : productData
            if (product) {
              const currentStock = (product as any).stock || 0
              const quantity = parseFloat(item.quantity) || 0

              // Stok hareketi kaydı oluştur (sevkiyat çıkışı - zaten InvoiceItem trigger'ı düşürdü, bu sadece kayıt)
              // NOT: Stok zaten InvoiceItem trigger'ı ile düşürüldü, bu sadece sevkiyat kaydı
              await supabase
                .from('StockMovement')
                // @ts-expect-error - Supabase database type tanımları eksik
                .insert([
                  {
                    productId: item.productId,
                    type: 'OUT',
                    quantity: -quantity,
                    previousStock: currentStock + quantity, // Trigger'dan önceki stok
                    newStock: currentStock, // Trigger'dan sonraki stok
                    reason: 'SEVKIYAT',
                    relatedTo: 'Shipment',
                    relatedId: (data as any)?.id,
                    notes: `Sevkiyat: ${body.tracking || 'Takipsiz'}`,
                    userId: session.user.id,
                    companyId: session.user.companyId,
                  },
                ])
            }
          }
        }
      } catch (stockError) {
        // Stok hareketi hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Stock movement error on shipment:', stockError)
        }
      }
    }

    // ActivityLog kaydı (hata olsa bile devam et)
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
      {
        entity: 'Shipment',
        action: 'CREATE',
        description: `Yeni sevkiyat oluşturuldu`,
        meta: { entity: 'Shipment', action: 'create', id: (data as any)?.id },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    // Bildirim: Sevkiyat oluşturuldu
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: 'Yeni Sevkiyat Oluşturuldu',
        message: `Yeni bir sevkiyat oluşturuldu. Detayları görmek ister misiniz?`,
        type: 'info',
        relatedTo: 'Shipment',
        relatedId: (data as any).id,
      })
    } catch (notificationError) {
      // Bildirim hatası ana işlemi engellemez
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Shipments POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Sevkiyat oluşturulamadı' },
      { status: 500 }
    )
  }
}



