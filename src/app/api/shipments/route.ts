import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - Status güncellemeleri için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipments GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // YENİ: Shipment'ları çek (Invoice'ı ayrı query ile çekeceğiz - ilişki hatası nedeniyle)
    // estimatedDelivery kolonunu dinamik kontrol et
    let selectColumns = 'id, tracking, status, invoiceId, createdAt, updatedAt'
    
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
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

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

    const { data: shipments, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invoice'ları ayrı query ile çek (ilişki hatası nedeniyle)
    const shipmentsWithInvoices = await Promise.all(
      (shipments || []).map(async (shipment: any) => {
        if (!shipment.invoiceId) {
          return shipment
        }

        try {
          const { data: invoice } = await supabase
            .from('Invoice')
            .select(`
              id,
              title,
              invoiceNumber,
              total,
              createdAt,
              Customer (
                id,
                name,
                email
              )
            `)
            .eq('id', shipment.invoiceId)
            .eq('companyId', companyId)
            .maybeSingle()

          if (invoice) {
            const invoiceObj = invoice as any
            // Quote ve Deal bilgilerini ayrı çek (eğer varsa)
            if (invoiceObj.quoteId) {
              try {
                const { data: quote } = await supabase
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
                  .eq('id', invoiceObj.quoteId)
                  .eq('companyId', companyId)
                  .maybeSingle()
                
                if (quote) {
                  return {
                    ...shipment,
                    Invoice: {
                      ...invoiceObj,
                      Quote: quote,
                    },
                  }
                }
              } catch (quoteErr) {
                // Quote çekilemedi, sadece invoice ile devam et
              }
            }

            return {
              ...shipment,
              Invoice: invoiceObj,
            }
          }
        } catch (invoiceErr) {
          // Invoice çekilemedi, shipment'ı olduğu gibi döndür
        }

        return shipment
      })
    )

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
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Shipments POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
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
    if (body.invoiceId) shipmentData.invoiceId = body.invoiceId
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
        { error: error.message || 'Failed to create shipment' },
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
        description: `Yeni sevkiyat oluşturuldu: ${body.tracking || 'Takipsiz'}`,
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

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Shipments POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create shipment' },
      { status: 500 }
    )
  }
}



