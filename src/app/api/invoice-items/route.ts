import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: InvoiceItem'ları listele
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('InvoiceItem')
      .select(`
        *,
        Product (
          id,
          name,
          price,
          stock,
          sku,
          barcode
        )
      `)
      .eq('invoiceId', invoiceId)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch invoice items' },
      { status: 500 }
    )
  }
}

// POST: Yeni InvoiceItem oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Zorunlu alanları kontrol et
    if (!body.invoiceId) {
      return NextResponse.json({ error: 'Fatura ID gereklidir' }, { status: 400 })
    }

    if (!body.productId) {
      return NextResponse.json({ error: 'Ürün ID gereklidir' }, { status: 400 })
    }

    if (body.quantity === undefined || body.quantity === null) {
      return NextResponse.json({ error: 'Miktar gereklidir' }, { status: 400 })
    }

    // Invoice'ı kontrol et (vendorId ve invoiceType var mı?)
    const { data: invoiceData } = await supabase
      .from('Invoice')
      .select('vendorId, status, invoiceType')
      .eq('id', body.invoiceId)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    const invoice = invoiceData as any

    if (!invoice) {
      return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
    }

    // Mevcut stoku al
    const { data: productData } = await supabase
      .from('Product')
      .select('stock')
      .eq('id', body.productId)
      .eq('companyId', session.user.companyId)
    
    const product = Array.isArray(productData) && productData.length > 0 ? productData[0] : productData
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }

    const currentStock = (product as any).stock || 0
    const quantity = parseFloat(body.quantity) || 0
    const unitPrice = parseFloat(body.unitPrice) || (product as any).price || 0
    const total = quantity * unitPrice

    // InvoiceItem oluştur - unitPrice kolonunu kontrol et
    const invoiceItemData: any = {
      invoiceId: body.invoiceId,
      productId: body.productId,
      quantity: quantity,
      total: total,
      companyId: session.user.companyId,
    }
    
    // unitPrice kolonunu kontrol et (PostgreSQL küçük harfe çevirebilir: unitprice)
    try {
      // unitPrice kolonunun varlığını kontrol et (hem unitPrice hem unitprice)
      const { error: checkError1 } = await supabase
        .from('InvoiceItem')
        .select('unitPrice')
        .limit(0)
      
      const { error: checkError2 } = await supabase
        .from('InvoiceItem')
        .select('unitprice')
        .limit(0)
      
      if (!checkError1) {
        // unitPrice kolonu var (camelCase)
        invoiceItemData.unitPrice = unitPrice
      } else if (!checkError2) {
        // unitprice kolonu var (lowercase)
        invoiceItemData.unitprice = unitPrice
      } else {
        // Her iki kolon da yok - migration çalıştırılmamış
        return NextResponse.json({ 
          error: 'unitPrice/unitprice kolonu bulunamadı. Lütfen migration 005_enhance_product_system.sql dosyasını Supabase SQL Editor\'de çalıştırın.' 
        }, { status: 500 })
      }
    } catch (e) {
      // Hata durumunda unitPrice olmadan devam et (fallback)
      console.warn('unitPrice kontrolü başarısız, unitPrice olmadan devam ediliyor:', e)
      // unitPrice olmadan da devam edebiliriz, sadece total kullanılır
    }

    const { data: insertData, error: insertError } = await supabase
      .from('InvoiceItem')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([invoiceItemData])
      .select(`
        *,
        Product (
          id,
          name,
          price,
          stock,
          sku,
          barcode
        )
      `)
    
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
    
    const invoiceItem = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData

    // YENİ: Satış faturası (SALES) ise rezerve miktar güncelle (stok hemen düşmesin)
    // Alış faturası (PURCHASE) ise stok hemen artar (trigger kaldırıldı, manuel yapılacak)
    if (invoice && invoice.invoiceType !== 'PURCHASE' && (!invoice.vendorId || invoice.invoiceType === 'SALES')) {
      // Satış faturası - rezerve miktar güncelle
      try {
        const { data: productData } = await supabase
          .from('Product')
          .select('reservedQuantity, stock')
          .eq('id', body.productId)
          .eq('companyId', session.user.companyId)
          .single()
        
        if (productData) {
          const currentReserved = parseFloat((productData as any).reservedQuantity || 0)
          const quantity = parseFloat(body.quantity) || 0
          
          // Rezerve miktarı artır
          await supabase
            .from('Product')
            // @ts-expect-error - Supabase database type tanımları eksik
            .update({
              reservedQuantity: currentReserved + quantity,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', body.productId)
            .eq('companyId', session.user.companyId)
        }
      } catch (reserveError) {
        // Rezerve miktar güncelleme hatası ana işlemi engellemez
        console.error('Reserved quantity update error:', reserveError)
      }
    } else if (invoice && (invoice.invoiceType === 'PURCHASE' || invoice.vendorId)) {
      // Alış faturası - stok hemen artar (manuel güncelleme)
      try {
        const { data: productData } = await supabase
          .from('Product')
          .select('stock')
          .eq('id', body.productId)
          .eq('companyId', session.user.companyId)
          .single()
        
        if (productData) {
          const currentStock = parseFloat((productData as any).stock || 0)
          const quantity = parseFloat(body.quantity) || 0
          
          // Stoku artır
          await supabase
            .from('Product')
            // @ts-expect-error - Supabase database type tanımları eksik
            .update({
              stock: currentStock + quantity,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', body.productId)
            .eq('companyId', session.user.companyId)
          
          // Stok hareketi kaydı oluştur (giriş)
          await supabase
            .from('StockMovement')
            // @ts-expect-error - Supabase database type tanımları eksik
            .insert([{
              productId: body.productId,
              type: 'IN',
              quantity: quantity,
              previousStock: currentStock,
              newStock: currentStock + quantity,
              reason: 'TEDARIKCI',
              relatedTo: 'Invoice',
              relatedId: body.invoiceId,
              companyId: session.user.companyId,
              userId: session.user.id,
            }])
        }
      } catch (stockError) {
        // Stok güncelleme hatası ana işlemi engellemez
        console.error('Stock update error:', stockError)
      }
    }

    // ActivityLog kaydı
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
        {
          entity: 'InvoiceItem',
          action: 'CREATE',
          description: `Fatura kalemi eklendi: ${quantity} adet`,
          meta: { 
            entity: 'InvoiceItem', 
            action: 'create', 
            id: (invoiceItem as any)?.id,
            invoiceId: body.invoiceId,
            productId: body.productId,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    return NextResponse.json(invoiceItem, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create invoice item' },
      { status: 500 }
    )
  }
}

