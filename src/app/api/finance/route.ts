import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecords, createRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Oturum bilgisi alınamadı' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('finance', 'read', session.user.id)
    if (!canRead) {
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

    const supabase = getSupabaseWithServiceRole()
    
    // Tüm kolonlar (033 migration çalıştırıldıysa hepsi mevcut)
    // Mevcut kolonlar: id, type, amount, relatedTo, companyId, createdAt, updatedAt, relatedId, category, description, customerCompanyId, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring
    // SuperAdmin için Company bilgisi ekle
    // Tüm kolonları seç (033 migration sonrası)
    const selectFields = 'id, type, amount, relatedTo, companyId, createdAt, updatedAt, relatedId, category, description, customerCompanyId, relatedEntityType, relatedEntityId, paymentMethod, paymentDate, isRecurring, CustomerCompany:customerCompanyId(id, name), Company:companyId(id, name)'
    
    // Query oluştur
    let query = supabase
      .from('Finance')
      .select(selectFields)
      .order('createdAt', { ascending: false })
      .limit(1000)
    
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

    const { data, error } = await query

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
    return NextResponse.json(data || [], {
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Oturum bilgisi alınamadı' },
        { status: 500 }
      )
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

    const body = await request.json()

    const description = `${body.type === 'INCOME' ? 'Gelir' : 'Gider'} kaydı oluşturuldu`
    const financeData: any = {
      ...body,
      amount: body.amount || 0,
      companyId: session.user.companyId,
    }
    // Firma bazlı ilişki (customerCompanyId)
    if (body.customerCompanyId) financeData.customerCompanyId = body.customerCompanyId
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

