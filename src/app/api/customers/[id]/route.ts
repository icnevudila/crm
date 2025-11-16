import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Permission check - canRead kontrolü
    const canRead = await hasPermission('customer', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Customer'ı sadece gerekli kolonlarla çek (performans için)
    // createdBy ve updatedBy bilgilerini User join ile çekiyoruz (audit trail için)
    // NOT: Foreign key yoksa (migration çalıştırılmamışsa) join'leri kaldırıp tekrar deniyoruz
    let customerQuery = supabase
      .from('Customer')
      .select(`
        id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, notes, createdAt, updatedAt,
        createdBy, updatedBy,
        CreatedByUser:User!Customer_createdBy_fkey(id, name, email),
        UpdatedByUser:User!Customer_updatedBy_fkey(id, name, email)
      `)
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      customerQuery = customerQuery.eq('companyId', companyId)
    }
    
    let { data, error } = await customerQuery.single()

    // Foreign key hatası varsa (PGRST200), join'leri kaldırıp tekrar dene
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship'))) {
      console.warn('Customer GET API: Foreign key bulunamadı, join olmadan tekrar deneniyor...')
      let customerQueryWithoutJoin = supabase
        .from('Customer')
        .select(`
          id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, notes, createdAt, updatedAt,
          createdBy, updatedBy
        `)
        .eq('id', id)
      
      if (!isSuperAdmin) {
        customerQueryWithoutJoin = customerQueryWithoutJoin.eq('companyId', companyId)
      }
      
      const retryResult = await customerQueryWithoutJoin.single()
      const retryData: any = retryResult.data
      error = retryResult.error
      
      // createdBy/updatedBy varsa User bilgilerini ayrı query ile çek
      if (retryData && (retryData.createdBy || retryData.updatedBy)) {
        const userIds = [retryData.createdBy, retryData.updatedBy].filter(Boolean) as string[]
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('User')
            .select('id, name, email')
            .in('id', userIds)
          
          if (users) {
            const userMap = new Map(users.map((u: any) => [u.id, u]))
            if (retryData.createdBy && userMap.has(retryData.createdBy)) {
              retryData.CreatedByUser = userMap.get(retryData.createdBy)
            }
            if (retryData.updatedBy && userMap.has(retryData.updatedBy)) {
              retryData.UpdatedByUser = userMap.get(retryData.updatedBy)
            }
          }
        }
      }
      data = retryData
    }

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Customer GET API error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          customerId: id,
        })
      }
      
      const { getErrorMessage } = await import('@/lib/api-locale')
      // 404 hatası için özel mesaj
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return NextResponse.json(
          { error: getErrorMessage('errors.api.customerNotFound', request), message: getErrorMessage('errors.api.customerNotFoundMessage', request) },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.customerCannotBeFetched', request),
          message: error.message || getErrorMessage('errors.api.customerCannotBeFetchedMessage', request),
          ...(process.env.NODE_ENV === 'development' && {
            details: error,
            code: error.code,
          }),
        },
        { status: 500 }
      )
    }

    if (!data) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: getErrorMessage('errors.api.customerNotFound', request), message: getErrorMessage('errors.api.customerNotFoundMessage', request) },
        { status: 404 }
      )
    }

    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Customer&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json(
      {
        ...(data as any),
        activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  } catch (error) {
    const { getErrorMessage } = await import('@/lib/api-locale')
    return NextResponse.json(
      { error: getErrorMessage('errors.api.customerCannotBeFetched', request) },
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const canUpdate = await hasPermission('customer', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Sadece schema.sql'de olan kolonları gönder
    // schema.sql: name, email, phone, city, status, companyId, updatedAt
    // schema-extension.sql: address, sector, website, taxNumber, fax, notes (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 004: customerCompanyId (müşteri hangi firmada çalışıyor)
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id: bodyId, companyId, createdAt, updatedAt, createdBy, updatedBy, ...cleanBody } = body
    
    const customerData: any = {
      name: cleanBody.name,
      email: cleanBody.email || null,
      phone: cleanBody.phone || null,
      city: cleanBody.city || null,
      status: cleanBody.status || 'ACTIVE',
      // updatedAt ve updatedBy CRUD fonksiyonunda otomatik ekleniyor
    }
    // customerCompanyId - müşteri hangi firmada çalışıyor (migration 004'te eklendi)
    if (body.customerCompanyId !== undefined && body.customerCompanyId !== null && body.customerCompanyId !== '') {
      customerData.customerCompanyId = body.customerCompanyId
    } else if (body.customerCompanyId === null || body.customerCompanyId === '') {
      // Boş string veya null ise NULL yap (ilişkiyi kaldır)
      customerData.customerCompanyId = null
    }
    // logoUrl - müşteri logosu (migration 070'te eklendi)
    if (body.logoUrl !== undefined && body.logoUrl !== null && body.logoUrl !== '') {
      customerData.logoUrl = body.logoUrl
    } else if (body.logoUrl === null || body.logoUrl === '') {
      // Boş string veya null ise NULL yap
      customerData.logoUrl = null
    }
    // NOT: address, sector, website, taxNumber, fax, notes schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data, error } = await (supabase
      .from('Customer') as any)
      .update(customerData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: error.message || getErrorMessage('errors.api.customerCannotBeUpdated', request) }, { status: 500 })
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

    // Cache'i kapat - PUT işleminden sonra fresh data gelsin
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    const { getErrorMessage } = await import('@/lib/api-locale')
    return NextResponse.json(
      { error: getErrorMessage('errors.api.customerCannotBeUpdated', request) },
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: getErrorMessage('errors.unauthorized', request) }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const canDelete = await hasPermission('customer', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Customer silinmeden önce ilişkili Deal/Quote/Invoice kontrolü
    // İlişkili Deal kontrolü
    const { data: deals, error: dealsError } = await supabase
      .from('Deal')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (dealsError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Deal check error:', dealsError)
    }
    
    const { getErrorMessage } = await import('@/lib/api-locale')
    if (deals && deals.length > 0) {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.customerCannotBeDeleted', request),
          message: getErrorMessage('errors.api.customerHasDeals', request),
          reason: 'CUSTOMER_HAS_DEALS',
          relatedItems: {
            deals: deals.length,
            exampleDeal: {
              id: deals[0]?.id,
              title: deals[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }
    
    // İlişkili Quote kontrolü
    const { data: quotes, error: quotesError } = await supabase
      .from('Quote')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (quotesError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Quote check error:', quotesError)
    }
    
    if (quotes && quotes.length > 0) {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.customerCannotBeDeleted', request),
          message: getErrorMessage('errors.api.customerHasQuotes', request),
          reason: 'CUSTOMER_HAS_QUOTES',
          relatedItems: {
            quotes: quotes.length,
            exampleQuote: {
              id: quotes[0]?.id,
              title: quotes[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }
    
    // İlişkili Invoice kontrolü
    const { data: invoices, error: invoicesError } = await supabase
      .from('Invoice')
      .select('id, title')
      .eq('customerId', id)
      .eq('companyId', session.user.companyId)
      .limit(1)
    
    if (invoicesError && process.env.NODE_ENV === 'development') {
      console.error('Customer DELETE - Invoice check error:', invoicesError)
    }
    
    if (invoices && invoices.length > 0) {
      return NextResponse.json(
        { 
          error: getErrorMessage('errors.api.customerCannotBeDeleted', request),
          message: getErrorMessage('errors.api.customerHasInvoices', request),
          reason: 'CUSTOMER_HAS_INVOICES',
          relatedItems: {
            invoices: invoices.length,
            exampleInvoice: {
              id: invoices[0]?.id,
              title: invoices[0]?.title
            }
          }
        },
        { status: 403 }
      )
    }

    // Önce customer'ı al (ActivityLog için)
    const { data: customer } = await supabase
      .from('Customer')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    // Silme işlemi - companyId kontrolü API seviyesinde yapılıyor (güvenlik)
    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('Delete error:', error)
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json({ error: error.message || getErrorMessage('errors.api.customerCannotBeDeleted', request) }, { status: 500 })
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

    // Cache'i kapat - DELETE işleminden sonra fresh data gelsin
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('Delete error:', error)
    const { getErrorMessage } = await import('@/lib/api-locale')
    return NextResponse.json(
      { error: error?.message || getErrorMessage('errors.api.customerCannotBeDeleted', request) },
      { status: 500 }
    )
  }
}



