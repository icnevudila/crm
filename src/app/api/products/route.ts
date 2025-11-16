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

    // DEBUG: Session ve permission bilgisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Products API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('product', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Products API] ❌ Permission Denied:', {
          module: 'product',
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
    const stockFilter = searchParams.get('stock') || '' // inStock, lowStock, outOfStock
    const categoryFilter = searchParams.get('category') || ''
    const statusFilter = searchParams.get('status') || ''
    const vendorId = searchParams.get('vendorId') || '' // Vendor filtresi
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // OPTİMİZE: Sadece gerekli kolonları seç - performans için
    // SuperAdmin için Company bilgisi ekle
    // ÖNEMLİ: Migration kolonları yoksa hata vermeden atla
    // EN GÜVENLİ YAKLAŞIM: Sadece kesinlikle var olan temel kolonları kullan
    // Migration kolonları yoksa hata vermeden atlanır
    // NOT: Migration kolonları (category, sku, barcode, status, minStock, maxStock, unit, reservedQuantity, incomingQuantity)
    // migration dosyaları çalıştırılmadıysa olmayabilir, bu yüzden sadece temel kolonları kullanıyoruz
    const selectColumns = 'id, name, price, stock, companyId, createdAt, updatedAt, Company:companyId(id, name)'
    
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

    // Zorunlu alanları kontrol et
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: (await import('@/lib/api-locale')).getErrorMessage('errors.api.productNameRequired', request) },
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
    // NOT: companyId ve createdBy createRecord fonksiyonunda otomatik ekleniyor

    // createRecord kullanarak audit trail desteği (createdBy otomatik eklenir)
    const data = await createRecord(
      'Product',
      productData,
      (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.productCreated.replace('{name}', body.name)
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



