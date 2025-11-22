import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createRecord } from '@/lib/crud'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

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

    // Permission check - canRead kontrolü (cache ile optimize edilmiş)
    // ÖNEMLİ: Dev modda log'ları kaldırdık - performans için
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('product', 'read', session.user.id)
    if (!canRead) {
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
    const stockFilter = searchParams.get('stock') || '' // inStock, lowStock, outOfStock
    const categoryFilter = searchParams.get('category') || ''
    const statusFilter = searchParams.get('status') || ''
    const vendorId = searchParams.get('vendorId') || '' // Vendor filtresi
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // ÖNEMLİ: Önce temel kolonları çek, sonra retry ile migration kolonlarını ekle
    // Bu şekilde migration kolonları yoksa hata vermez
    let selectColumns = isSuperAdmin 
      ? 'id, name, price, stock, companyId, createdAt, updatedAt, Company:companyId(id, name)'
      : 'id, name, price, stock, companyId, createdAt, updatedAt'
    
    let query = supabase
      .from('Product')
      .select(selectColumns, { count: 'exact' })
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
      // Sadece name ile arama (migration kolonları yoksa hata vermeden atla)
      query = query.ilike('name', `%${search}%`)
    }

    if (vendorId) {
      // Vendor filtresi - vendorId kolonu varsa filtrele
      query = query.eq('vendorId', vendorId)
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
    // NOT: statusFilter kullanılmıyor çünkü Product tablosunda status kolonu yok!

    let { data, error } = await query

    // Eğer hata varsa ve kolon hatası ise (42703 = column does not exist), temel kolonlarla retry yap
    if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('column'))) {
      // Retry: Sadece temel kolonları çek (migration kolonları yok)
      const basicColumns = isSuperAdmin 
        ? 'id, name, price, stock, companyId, createdAt, updatedAt, Company:companyId(id, name)'
        : 'id, name, price, stock, companyId, createdAt, updatedAt'
      
      let retryQuery = supabase
        .from('Product')
        .select(basicColumns, { count: 'exact' })
        .order('createdAt', { ascending: false })
      
      if (!isSuperAdmin) {
        retryQuery = retryQuery.eq('companyId', companyId)
      } else if (filterCompanyId) {
        retryQuery = retryQuery.eq('companyId', filterCompanyId)
      }
      
      if (search) {
        retryQuery = retryQuery.ilike('name', `%${search}%`)
      }
      
      if (vendorId) {
        retryQuery = retryQuery.eq('vendorId', vendorId)
      }
      
      if (stockFilter === 'inStock') {
        retryQuery = retryQuery.gt('stock', 10)
      } else if (stockFilter === 'lowStock') {
        retryQuery = retryQuery.gte('stock', 1).lte('stock', 10)
      } else if (stockFilter === 'outOfStock') {
        retryQuery = retryQuery.eq('stock', 0)
      }
      
      const retryResult = await retryQuery
      data = retryResult.data
      error = retryResult.error
    }

    if (error) {
      // ÖNEMLİ: Dev modda detaylı log'ları kaldırdık - performans için
      return NextResponse.json(
        { error: error.message || 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Dengeli cache - 60 saniye (performans + veri güncelliği dengesi)
    // stale-while-revalidate: Eski veri gösterilirken arka planda yenilenir (kullanıcı beklemez)
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    // ÖNEMLİ: Dev modda log'ları kaldırdık - performans için
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canCreate = await hasPermission('product', 'create', session.user.id)
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
        console.error('Products POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const { productCreateSchema } = await import('@/lib/validations/products')
    const validationResult = productCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    const supabase = getSupabaseWithServiceRole()

    // Product verilerini oluştur - Zod validated data kullan
    // NOT: imageUrl ve description kolonları veritabanında olmayabilir (migration çalıştırılmamış olabilir)
    const productData: any = {
      name: validatedData.name.trim(),
      price: validatedData.price !== undefined ? validatedData.price : 0,
      stock: validatedData.stock !== undefined ? validatedData.stock : 0,
      companyId: session.user.companyId,
    }

    // Yeni kolonlar (migration 005'te eklendi)
    if (validatedData.category !== undefined && validatedData.category !== null && validatedData.category !== '') {
      productData.category = validatedData.category
    }
    if (validatedData.sku !== undefined && validatedData.sku !== null && validatedData.sku !== '') {
      productData.sku = validatedData.sku
    }
    if (validatedData.barcode !== undefined && validatedData.barcode !== null && validatedData.barcode !== '') {
      productData.barcode = validatedData.barcode
    }
    if (validatedData.status !== undefined && validatedData.status !== null) {
      productData.status = validatedData.status
    }
    // minStock → minimumStock (migration 049)
    if (validatedData.minStock !== undefined && validatedData.minStock !== null) {
      productData.minimumStock = validatedData.minStock
    }
    if (validatedData.maxStock !== undefined && validatedData.maxStock !== null) {
      productData.maxStock = validatedData.maxStock
    }
    if (validatedData.unit !== undefined && validatedData.unit !== null && validatedData.unit !== '') {
      productData.unit = validatedData.unit
    }
    if (validatedData.weight !== undefined && validatedData.weight !== null) {
      productData.weight = validatedData.weight
    }
    if (validatedData.dimensions !== undefined && validatedData.dimensions !== null && validatedData.dimensions !== '') {
      productData.dimensions = validatedData.dimensions
    }
    if (validatedData.description !== undefined && validatedData.description !== null && validatedData.description !== '') {
      productData.description = validatedData.description
    }
    if (validatedData.vendorId !== undefined && validatedData.vendorId !== null && validatedData.vendorId !== '') {
      productData.vendorId = validatedData.vendorId
    }
    if (validatedData.imageUrl !== undefined && validatedData.imageUrl !== null && validatedData.imageUrl !== '') {
      productData.imageUrl = validatedData.imageUrl
    }

    // NOT: companyId ve createdBy createRecord fonksiyonunda otomatik ekleniyor

    // createRecord kullanarak audit trail desteği (createdBy otomatik eklenir)
    const { getActivityMessage, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const data = await createRecord(
      'Product',
      productData,
      getActivityMessage(locale, 'productCreated', { name: validatedData.name })
    )

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



