import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { customerUpdateSchema } from '@/lib/validations/customers'

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
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let customerQuery = supabase
      .from('Customer')
      .select(`
        id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, notes, createdAt, updatedAt
      `)
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      customerQuery = customerQuery.eq('companyId', companyId)
    }
    
    let { data, error } = await customerQuery.single()

    // Hata varsa (kolon bulunamadı veya foreign key hatası), tekrar dene
    if (error && (error.code === 'PGRST200' || error.message?.includes('Could not find a relationship') || error.message?.includes('does not exist'))) {
      console.warn('Customer GET API: Hata oluştu, tekrar deneniyor...', error.message)
      let customerQueryWithoutJoin = supabase
        .from('Customer')
        .select(`
          id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, notes, createdAt, updatedAt
        `)
        .eq('id', id)
      
      if (!isSuperAdmin) {
        customerQueryWithoutJoin = customerQueryWithoutJoin.eq('companyId', companyId)
      }
      
      const retryResult = await customerQueryWithoutJoin.single()
      const retryData: any = retryResult.data
      error = retryResult.error
      
      // createdBy/updatedBy kolonları kaldırıldı, User bilgileri çekilmiyor
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
    
    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Customers PUT API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const validationResult = customerUpdateSchema.safeParse(body)
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
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // ÖNCE: Mevcut kaydı kontrol et (SuperAdmin için companyId kontrolü yapma)
    let existingQuery = supabase
      .from('Customer')
      .select('id, companyId')
      .eq('id', id)
    
    if (!isSuperAdmin) {
      existingQuery = existingQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: existing, error: existingError } = await existingQuery.single()
    
    if (existingError || !existing) {
      const { getErrorMessage } = await import('@/lib/api-locale')
      return NextResponse.json(
        { error: getErrorMessage('errors.api.customerNotFound', request) },
        { status: 404 }
      )
    }

    // Sadece schema.sql'de olan kolonları gönder
    // schema.sql: name, email, phone, city, status, companyId, updatedAt
    // schema-extension.sql: address, sector, website, taxNumber, fax, notes (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 004: customerCompanyId (müşteri hangi firmada çalışıyor)
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id: bodyId, companyId, createdAt, updatedAt, createdBy, updatedBy, ...cleanBody } = validatedData
    
    const customerData: any = {
      updatedAt: new Date().toISOString(),
      // NOT: updatedBy kolonu migration'da yok, bu yüzden eklenmiyor
    }

    // Sadece gönderilen alanları güncelle (partial update)
    if (cleanBody.name !== undefined) {
      customerData.name = cleanBody.name.trim()
    }
    if (cleanBody.email !== undefined) {
      customerData.email = cleanBody.email || null
    }
    if (cleanBody.phone !== undefined) {
      customerData.phone = cleanBody.phone || null
    }
    if (cleanBody.city !== undefined) {
      customerData.city = cleanBody.city || null
    }
    if (cleanBody.status !== undefined) {
      customerData.status = cleanBody.status || 'ACTIVE'
    }
    // customerCompanyId - müşteri hangi firmada çalışıyor (migration 004'te eklendi)
    if (cleanBody.customerCompanyId !== undefined) {
      customerData.customerCompanyId = cleanBody.customerCompanyId || null
    }
    // logoUrl - müşteri logosu (migration 070'te eklendi)
    if (cleanBody.logoUrl !== undefined) {
      customerData.logoUrl = cleanBody.logoUrl || null
    }
    // NOT: address, sector, website, taxNumber, fax, notes schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // Update işlemi - SuperAdmin için companyId filtresi yok
    let updateQuery = (supabase
      .from('Customer') as any)
      .update(customerData)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', session.user.companyId)
    }
    
    const { error: updateError } = await updateQuery
    
    if (updateError) {
      // Update hatası
      const { getErrorMessage } = await import('@/lib/api-locale')
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      if (updateError.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(updateError.code)) {
        return createErrorResponse(updateError)
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Customer PUT API update error:', {
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          customerId: id,
          customerData,
        })
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || getErrorMessage('errors.api.customerCannotBeUpdated', request),
          code: updateError.code || 'UPDATE_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: updateError,
          }),
        },
        { status: 500 }
      )
    }
    
    // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
    let selectQuery = supabase
      .from('Customer')
      .select(`
        id, name, email, phone, city, status, customerCompanyId, companyId, logoUrl, notes, createdAt, updatedAt
      `)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      selectQuery = selectQuery.eq('companyId', session.user.companyId)
    }
    
    const { data, error } = await selectQuery.single()

    if (error) {
      // Daha detaylı hata mesajı
      const { getErrorMessage } = await import('@/lib/api-locale')
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      // Database constraint hatası ise createErrorResponse kullan
      if (error.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(error.code)) {
        return createErrorResponse(error)
      }
      
      // Diğer hatalar için detaylı mesaj
      if (process.env.NODE_ENV === 'development') {
        console.error('Customer PUT API error:', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          customerId: id,
          customerData,
        })
      }
      
      return NextResponse.json(
        { 
          error: error.message || getErrorMessage('errors.api.customerCannotBeUpdated', request),
          code: error.code || 'UPDATE_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: error,
          }),
        },
        { status: 500 }
      )
    }

    // ActivityLog KALDIRILDI - Sadece kritik işlemler için ActivityLog tutulacak
    // (Performans optimizasyonu: Gereksiz log'lar veritabanını yavaşlatıyor)

    // Cache'i kapat - PUT işleminden sonra fresh data gelsin
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    // Daha detaylı hata yakalama
    const { getErrorMessage } = await import('@/lib/api-locale')
    const { createErrorResponse } = await import('@/lib/error-handling')
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Customer PUT API exception:', {
        error: error?.message,
        stack: error?.stack,
        name: error?.name,
      })
    }
    
    // Database constraint hatası ise createErrorResponse kullan
    if (error?.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(error.code)) {
      return createErrorResponse(error)
    }
    
    return NextResponse.json(
      { 
        error: error?.message || getErrorMessage('errors.api.customerCannotBeUpdated', request),
        code: error?.code || 'UNKNOWN_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error,
        }),
      },
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



