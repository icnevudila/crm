import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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
        console.error('Products [id] GET API session error:', sessionError)
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
    const canRead = await hasPermission('product', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Ürün görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Product bilgilerini çek - yeni kolonlar dahil (dinamik kontrol ile)
    // ÖNEMLİ: Migration kolonları yoksa hata vermeden atla
    // EN GÜVENLİ YAKLAŞIM: Sadece kesinlikle var olan temel kolonları kullan
    // Migration kolonları yoksa hata vermeden atlanır
    // NOT: Migration kolonları (category, sku, barcode, status, minStock, maxStock, unit, weight, dimensions, description, reservedQuantity, incomingQuantity)
    // migration dosyaları çalıştırılmadıysa olmayabilir, bu yüzden sadece temel kolonları kullanıyoruz
    const selectColumns = 'id, name, price, stock, companyId, createdAt, updatedAt'
    
    let productQuery = supabase
      .from('Product')
      .select(selectColumns)
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      productQuery = productQuery.eq('companyId', companyId)
    }
    
    const { data: productData, error } = await productQuery
    
    if (error) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    
    // .single() yerine array'in ilk elemanını al
    const data = Array.isArray(productData) && productData.length > 0 ? productData[0] : productData
    
    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Dinamik stok hesaplama (opsiyonel - StockMovement'lerden hesapla)
    // NOT: Product.stock kolonu trigger'lar ile güncelleniyor, bu sadece doğrulama için
    try {
      const { data: stockMovements } = await supabase
        .from('StockMovement')
        .select('type, quantity')
        .eq('productId', id)
        .eq('companyId', session.user.companyId)

      if (stockMovements && stockMovements.length > 0) {
        // Stok miktarını dinamik hesapla: girişlerin toplamı - çıkışların toplamı
        const calculatedStock = stockMovements.reduce((acc: number, movement: any) => {
          if (movement.type === 'IN' || movement.type === 'RETURN') {
            return acc + Math.abs(movement.quantity)
          } else if (movement.type === 'OUT') {
            return acc - Math.abs(movement.quantity)
          } else if (movement.type === 'ADJUSTMENT') {
            // ADJUSTMENT için quantity direkt yeni stok miktarı
            return movement.quantity
          }
          return acc
        }, 0)

        // Hesaplanan stok ile mevcut stok arasında fark varsa uyarı ver (sadece development'ta)
        if (process.env.NODE_ENV === 'development' && Math.abs(calculatedStock - ((data as any).stock || 0)) > 0.01) {
          console.warn('⚠️  Stok uyumsuzluğu:', {
            productId: id,
            calculatedStock,
            currentStock: (data as any).stock,
            difference: calculatedStock - ((data as any).stock || 0),
          })
        }
      }
    } catch (stockCalcError) {
      // Stok hesaplama hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('Stock calculation error:', stockCalcError)
      }
    }

    // Satış geçmişi: QuoteItem'ları çek (Teklifler)
    const { data: quoteItems } = await supabase
      .from('QuoteItem')
      .select(
        `
        id,
        quantity,
        unitPrice,
        total,
        createdAt,
        Quote (
          id,
          title,
          status,
          total,
          createdAt,
          Deal (
            id,
            title,
            stage,
            value,
            Customer (
              id,
              name,
              email,
              phone
            )
          )
        )
      `
      )
      .eq('productId', id)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(50)

    // Satış geçmişi: InvoiceItem'ları çek (Faturalar)
    const { data: invoiceItems } = await supabase
      .from('InvoiceItem')
      .select(
        `
        id,
        quantity,
        unitPrice,
        total,
        createdAt,
        Invoice (
          id,
          title,
          status,
          total,
          invoiceNumber,
          createdAt,
          Quote (
            id,
            title,
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
          )
        )
      `
      )
      .eq('productId', id)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(50)

    // Stok hareketleri
    const { data: stockMovements } = await supabase
      .from('StockMovement')
      .select(
        `
        id,
        type,
        quantity,
        previousStock,
        newStock,
        reason,
        relatedTo,
        relatedId,
        notes,
        createdAt,
        User (
          id,
          name,
          email
        )
      `
      )
      .eq('productId', id)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(100)

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
      .eq('entity', 'Product')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(data as any),
      salesHistory: {
        quotes: quoteItems || [],
        invoices: invoiceItems || [],
      },
      stockMovements: stockMovements || [],
      activities: activities || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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
        console.error('Products [id] PUT API session error:', sessionError)
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
    const canUpdate = await hasPermission('product', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Ürün güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Products PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Ürün adı gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Product verilerini güncelle - SADECE veritabanında olan kolonları gönder
    // NOT: imageUrl ve description kolonları veritabanında olmayabilir (migration çalıştırılmamış olabilir)
    const productData: any = {
      name: body.name.trim(),
      price: body.price !== undefined ? parseFloat(body.price) : 0,
      stock: body.stock !== undefined ? parseFloat(body.stock) : 0,
      updatedAt: new Date().toISOString(),
    }

    // Yeni kolonlar (migration 005'te eklendi)
    if (body.category !== undefined && body.category !== null && body.category !== '') {
      productData.category = body.category
    }
    if (body.sku !== undefined && body.sku !== null && body.sku !== '') {
      productData.sku = body.sku
    }
    if (body.barcode !== undefined && body.barcode !== null && body.barcode !== '') {
      productData.barcode = body.barcode
    }
    if (body.status !== undefined && body.status !== null) {
      productData.status = body.status
    }
    if (body.minStock !== undefined && body.minStock !== null) {
      productData.minStock = parseFloat(body.minStock)
    }
    if (body.maxStock !== undefined && body.maxStock !== null) {
      productData.maxStock = parseFloat(body.maxStock)
    }
    if (body.unit !== undefined && body.unit !== null && body.unit !== '') {
      productData.unit = body.unit
    }
    if (body.weight !== undefined && body.weight !== null) {
      productData.weight = parseFloat(body.weight)
    }
    if (body.dimensions !== undefined && body.dimensions !== null && body.dimensions !== '') {
      productData.dimensions = body.dimensions
    }
    if (body.description !== undefined && body.description !== null && body.description !== '') {
      productData.description = body.description
    }

    // NOT: imageUrl kolonu veritabanında olmayabilir - GÖNDERME!
    // NOT: vendorId schema-vendor'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
    const { data: updateData, error } = await supabase
      .from('Product')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update(productData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select('id, name, price, stock, companyId, createdAt, updatedAt')
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Products PUT API update error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to update product' },
        { status: 500 }
      )
    }
    
    // .single() yerine array'in ilk elemanını al
    const data = Array.isArray(updateData) && updateData.length > 0 ? updateData[0] : updateData

    // ActivityLog kaydı (hata olsa bile devam et)
    try {
      // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Product',
          action: 'UPDATE',
          description: `Ürün bilgileri güncellendi: ${body.name || (data as any)?.name || ''}`,
          meta: { entity: 'Product', action: 'update', id },
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

    return NextResponse.json(data)
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Products PUT API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to update product' },
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
        console.error('Products [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canDelete = await hasPermission('product', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Ürün silme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Product silinmeden önce ilişkili InvoiceItem/QuoteItem kontrolü
    // İlişkili InvoiceItem kontrolü
    const { data: invoiceItems, error: invoiceItemsError } = await supabase
      .from('InvoiceItem')
      .select('id, invoiceId')
      .eq('productId', id)
      .limit(1)
    
    if (invoiceItemsError && process.env.NODE_ENV === 'development') {
      console.error('Product DELETE - InvoiceItem check error:', invoiceItemsError)
    }
    
    if (invoiceItems && invoiceItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ürün silinemez',
          message: 'Bu ürün faturalarda kullanılıyor. Ürünü silmek için önce ilgili fatura kalemlerini silmeniz gerekir.',
          reason: 'PRODUCT_HAS_INVOICE_ITEMS',
          relatedItems: {
            invoiceItems: invoiceItems.length,
            exampleInvoiceId: invoiceItems[0]?.invoiceId
          }
        },
        { status: 403 }
      )
    }
    
    // İlişkili QuoteItem kontrolü
    const { data: quoteItems, error: quoteItemsError } = await supabase
      .from('QuoteItem')
      .select('id, quoteId')
      .eq('productId', id)
      .limit(1)
    
    if (quoteItemsError && process.env.NODE_ENV === 'development') {
      console.error('Product DELETE - QuoteItem check error:', quoteItemsError)
    }
    
    if (quoteItems && quoteItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Ürün silinemez',
          message: 'Bu ürün tekliflerde kullanılıyor. Ürünü silmek için önce ilgili teklif kalemlerini silmeniz gerekir.',
          reason: 'PRODUCT_HAS_QUOTE_ITEMS',
          relatedItems: {
            quoteItems: quoteItems.length,
            exampleQuoteId: quoteItems[0]?.quoteId
          }
        },
        { status: 403 }
      )
    }

    const { data: product } = await supabase
      .from('Product')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (product) {
      try {
        // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
        await supabase.from('ActivityLog').insert([
          {
            entity: 'Product',
            action: 'DELETE',
            description: `Ürün silindi: ${(product as any)?.name || 'Unknown'}`,
            meta: { entity: 'Product', action: 'delete', id },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
