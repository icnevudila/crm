import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canCreate = await hasPermission('product', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Orijinal product'ı çek
    const { data: originalProduct, error: fetchError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !originalProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Yeni product oluştur (ID'yi temizle)
    const { id: originalId, sku, createdAt, updatedAt, ...productData } = originalProduct

    // SKU varsa duplicate kontrolü yap
    let newSku = sku
    if (sku) {
      const { data: existingProduct } = await supabase
        .from('Product')
        .select('id')
        .eq('sku', sku)
        .eq('companyId', session.user.companyId)
        .single()

      if (existingProduct) {
        // SKU zaten varsa, SKU'ya "-COPY" ekle
        newSku = `${sku}-COPY`
      }
    }

    const { data: newProduct, error: createError } = await supabase
      .from('Product')
      .insert({
        ...productData,
        name: `${productData.name} (Kopya)`,
        sku: newSku,
        stock: 0, // Kopyalanan ürünün stoku 0'dan başlar
        reservedQuantity: 0,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Product duplicate create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Product',
        action: 'CREATE',
        description: `Ürün kopyalandı: ${newProduct.name} (Orijinal: ${originalProduct.name})`,
        meta: {
          productId: newProduct.id,
          originalProductId: id,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(newProduct)
  } catch (error: any) {
    console.error('Product duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}













