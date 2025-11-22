import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecords, createRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DEBUG: Session ve permission bilgisini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('[Finance API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('finance', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Finance API] ❌ Permission Denied:', {
          module: 'finance',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || '' // Kategori bazlı filtreleme
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi
    const search = searchParams.get('search') || '' // Arama (description, amount, category)

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    const supabase = getSupabaseWithServiceRole()
    
    // Tüm kolonlar (033 migration çalıştırıldıysa hepsi mevcut)
    // Mevcut kolonlar: id, type, amount, relatedTo, companyId, createdAt, updatedAt, relatedId, category, description, customerCompanyId, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring
    // SuperAdmin için Company bilgisi ekle
    // Tüm kolonları seç (033 migration sonrası)
    const selectFields = 'id, type, amount, relatedTo, companyId, createdAt, updatedAt, relatedId, category, description, customerCompanyId, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring, CustomerCompany:customerCompanyId(id, name), Company:companyId(id, name)'
    
    // Query oluştur
    let query = supabase
      .from('Finance')
      .select(selectFields, { count: 'exact' })
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    if (type) {
      query = query.eq('type', type)
    }

    // category filtresi (kolon var)
    if (category) {
      query = query.eq('category', category)
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    // customerCompanyId filtresi (kolon var - migration çalışmış)
    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    // Arama filtresi (description, category, amount bazlı)
    if (search) {
      // Supabase'de OR ile arama yapmak için ilike kullanıyoruz
      // description, category veya amount'u kontrol ediyoruz
      query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`)
      
      // Eğer search bir sayı ise amount ile de eşleştirmeyi dene
      const searchNumber = parseFloat(search)
      if (!isNaN(searchNumber)) {
        // Amount bazlı arama için ayrı bir query gerekebilir
        // Şimdilik description ve category ile yeterli
      }
    }

    // Pagination uygula - EN SON (filtrelerden sonra)
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query
    
    const totalPages = Math.ceil((count || 0) / pageSize)

    // Eğer hata varsa, direkt hata döndür
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Finans kayıtları getirilemedi' },
        { status: 500 }
      )
    }

    // ULTRA AGRESİF cache headers - 30 dakika cache (tek tıkla açılmalı)
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Finans kayıtları getirilemedi' },
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
    const canCreate = await hasPermission('finance', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const { financeCreateSchema } = await import('@/lib/validations/finance')
    const validationResult = financeCreateSchema.safeParse(body)
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

    const description = `${validatedData.type === 'INCOME' ? 'Gelir' : 'Gider'} kaydı oluşturuldu`
    const financeData: any = {
      type: validatedData.type,
      amount: validatedData.amount || 0,
      companyId: session.user.companyId,
    }
    // Firma bazlı ilişki (customerCompanyId)
    if (validatedData.customerCompanyId) financeData.customerCompanyId = validatedData.customerCompanyId
    if (validatedData.category) financeData.category = validatedData.category
    if (validatedData.description) financeData.description = validatedData.description
    if (validatedData.relatedTo) financeData.relatedTo = validatedData.relatedTo
    if (validatedData.relatedEntityType) financeData.relatedEntityType = validatedData.relatedEntityType
    if (validatedData.relatedEntityId) financeData.relatedEntityId = validatedData.relatedEntityId
    if (validatedData.paymentMethod) financeData.paymentMethod = validatedData.paymentMethod
    if (validatedData.paymentDate) financeData.paymentDate = validatedData.paymentDate
    if (validatedData.isRecurring !== undefined) financeData.isRecurring = validatedData.isRecurring
    const data = await createRecord(
      'Finance',
      financeData,
      description
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Finans kaydı oluşturulamadı' },
      { status: 500 }
    )
  }
}

