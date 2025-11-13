import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET: Stok hareketlerini listele
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const type = searchParams.get('type') // IN, OUT, ADJUSTMENT, RETURN
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('StockMovement')
      .select(`
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
        Product (
          id,
          name,
          sku,
          barcode
        ),
        User (
          id,
          name,
          email
        )
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (productId) {
      query = query.eq('productId', productId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}

// POST: Yeni stok hareketi oluştur
export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Zorunlu alanları kontrol et
    if (!body.productId) {
      return NextResponse.json({ error: 'Ürün ID gereklidir' }, { status: 400 })
    }

    if (!body.type || !['IN', 'OUT', 'ADJUSTMENT', 'RETURN'].includes(body.type)) {
      return NextResponse.json({ error: 'Geçerli hareket tipi gereklidir (IN, OUT, ADJUSTMENT, RETURN)' }, { status: 400 })
    }

    if (body.quantity === undefined || body.quantity === null) {
      return NextResponse.json({ error: 'Miktar gereklidir' }, { status: 400 })
    }

    // Mevcut stoku al
    const { data: productData, error: productError } = await supabase
      .from('Product')
      .select('stock')
      .eq('id', body.productId)
      .eq('companyId', session.user.companyId)
    
    if (productError) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }
    
    const product = Array.isArray(productData) && productData.length > 0 ? productData[0] : productData
    if (!product) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 })
    }

    const currentStock = (product as any).stock || 0
    const quantity = parseFloat(body.quantity)
    
    // Yeni stok miktarını hesapla
    let newStock = currentStock
    if (body.type === 'IN' || body.type === 'RETURN') {
      newStock = currentStock + quantity
    } else if (body.type === 'OUT') {
      newStock = currentStock - quantity
    } else if (body.type === 'ADJUSTMENT') {
      // ADJUSTMENT için quantity direkt yeni stok miktarı
      newStock = quantity
    }

    // Stok hareketi kaydı oluştur
    const movementData: any = {
      productId: body.productId,
      type: body.type,
      quantity: body.type === 'ADJUSTMENT' ? newStock - currentStock : (body.type === 'OUT' ? -quantity : quantity),
      previousStock: currentStock,
      newStock: newStock,
      reason: body.reason || 'MANUEL',
      relatedTo: body.relatedTo || null,
      relatedId: body.relatedId || null,
      notes: body.notes || null,
      userId: session.user.id,
      companyId: session.user.companyId,
    }

    const { data: insertMovementData, error: movementError } = await supabase
      .from('StockMovement')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([movementData])
      .select(`
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
        Product (
          id,
          name,
          sku,
          barcode
        ),
        User (
          id,
          name,
          email
        )
      `)
    
    if (movementError) {
      return NextResponse.json({ error: movementError.message }, { status: 500 })
    }
    
    // .single() yerine array'in ilk elemanını al
    const movement = Array.isArray(insertMovementData) && insertMovementData.length > 0 ? insertMovementData[0] : insertMovementData

    // Ürün stokunu güncelle
    const { error: updateError } = await supabase
      .from('Product')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update({ 
        stock: newStock,
        updatedAt: new Date().toISOString()
      })
      .eq('id', body.productId)
      .eq('companyId', session.user.companyId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
        {
          entity: 'StockMovement',
          action: 'CREATE',
          description: `Stok hareketi: ${body.type} - ${quantity} adet`,
          meta: { 
            entity: 'StockMovement', 
            action: 'create', 
            id: (movement as any)?.id,
            productId: body.productId,
            type: body.type,
            quantity: quantity
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    return NextResponse.json(movement, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}

