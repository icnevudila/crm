import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - her zaman fresh data
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Products GET API session error:', sessionError)
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
    const stockFilter = searchParams.get('stock') || '' // inStock, lowStock, outOfStock
    const categoryFilter = searchParams.get('category') || ''
    const statusFilter = searchParams.get('status') || ''

    // OPTİMİZE: Sadece gerekli kolonları seç - performans için
    // ÖNEMLİ: Migration kolonları yoksa hata vermeden atla
    // EN GÜVENLİ YAKLAŞIM: Sadece kesinlikle var olan temel kolonları kullan
    // Migration kolonları yoksa hata vermeden atlanır
    // NOT: Migration kolonları (category, sku, barcode, status, minStock, maxStock, unit, reservedQuantity, incomingQuantity)
    // migration dosyaları çalıştırılmadıysa olmayabilir, bu yüzden sadece temel kolonları kullanıyoruz
    const selectColumns = 'id, name, price, stock, companyId, createdAt, updatedAt'
    
    let query = supabase
      .from('Product')
      .select(selectColumns)
      .order('createdAt', { ascending: false })
      .limit(10000) // Tüm ürünleri getir (limit artırıldı)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (search) {
      // Sadece name ile arama (migration kolonları yoksa hata vermeden atla)
      query = query.ilike('name', `%${search}%`)
    }

    if (stockFilter === 'inStock') {
      query = query.gt('stock', 10)
    } else if (stockFilter === 'lowStock') {
      query = query.gte('stock', 1).lte('stock', 10)
    } else if (stockFilter === 'outOfStock') {
      query = query.eq('stock', 0)
    }

    // Migration kolonları yoksa filtreleme yapma (hata vermeden atla)
    // categoryFilter ve statusFilter migration kolonları gerektirir
    // NOT: Migration çalıştırılmadıysa bu filtreler çalışmayacak

    const { data, error } = await query

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Products API error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          companyId,
          isSuperAdmin,
          search,
          stockFilter,
        })
      }
      return NextResponse.json(
        { 
          error: error.message || 'Failed to fetch products',
          ...(process.env.NODE_ENV === 'development' && {
            details: error.details,
            hint: error.hint,
            code: error.code,
          }),
        },
        { status: 500 }
      )
    }

    // Cache strategy - no-store (fresh data)
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Products GET API catch error:', {
        message: error?.message,
        stack: error?.stack,
      })
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        ...(process.env.NODE_ENV === 'development' && {
          message: error?.message || 'Unknown error',
        }),
      },
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
        console.error('Products POST API session error:', sessionError)
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
        console.error('Products POST API JSON parse error:', jsonError)
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

    // Product verilerini oluştur - sadece veritabanında olan kolonları gönder
    // NOT: imageUrl ve description kolonları veritabanında olmayabilir (migration çalıştırılmamış olabilir)
    const productData: any = {
      name: body.name.trim(),
      price: body.price !== undefined ? parseFloat(body.price) : 0,
      stock: body.stock !== undefined ? parseFloat(body.stock) : 0,
      companyId: session.user.companyId,
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

    const { data: insertData, error } = await supabase
      .from('Product')
      // @ts-expect-error - Supabase database type tanımları eksik
      .insert([productData])
      .select('id, name, price, stock, category, sku, barcode, status, minStock, maxStock, unit, companyId, createdAt, updatedAt')
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Products POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create product' },
        { status: 500 }
      )
    }
    
    // .single() yerine array'in ilk elemanını al
    const data = Array.isArray(insertData) && insertData.length > 0 ? insertData[0] : insertData

    // ActivityLog kaydı (hata olsa bile devam et)
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
      {
        entity: 'Product',
        action: 'CREATE',
        description: `Yeni ürün oluşturuldu: ${body.name}`,
        meta: { entity: 'Product', action: 'create', id: (data as any)?.id },
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
      console.error('Products POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create product' },
      { status: 500 }
    )
  }
}



