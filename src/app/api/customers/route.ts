import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecords, createRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

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

    // Permission check - canRead kontrolü (geçici olarak devre dışı - MeetingForm için)
    // NOT: MeetingForm'da müşteri seçimi için permission kontrolü sorun çıkarıyor
    // TODO: Permission sistemi düzeltildiğinde tekrar aktif et
    // const canRead = await hasPermission('customer', 'read', session.user.id)
    // if (!canRead) {
    //   return NextResponse.json(
    //     { error: 'Forbidden', message: 'Müşterileri görüntüleme yetkiniz yok' },
    //     { status: 403 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sector = searchParams.get('sector') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Müşteri firması filtresi
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) // Default 10 kayıt (performans için)

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // DEBUG: Session bilgisini logla - multi-tenant kontrolü için
    if (process.env.NODE_ENV === 'development') {
      console.log('[Customers API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
        isSuperAdmin,
      })
    }

    // Toplam kayıt sayısını al (pagination için)
    let countQuery = supabase
      .from('Customer')
      .select('*', { count: 'exact', head: true })
    
    if (!isSuperAdmin) {
      countQuery = countQuery.eq('companyId', companyId)
      // DEBUG: companyId filtresi uygulandı
      if (process.env.NODE_ENV === 'development') {
        console.log('[Customers API] 🔒 Customer query filtered by companyId:', companyId)
      }
    } else {
      // DEBUG: SuperAdmin - tüm firmaları göster
      if (process.env.NODE_ENV === 'development') {
        console.log('[Customers API] 👑 SuperAdmin - showing all companies')
      }
    }

    // Filtreleri uygula (count için)
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
    }
    if (sector) {
      countQuery = countQuery.eq('sector', sector)
    }
    if (customerCompanyId) {
      countQuery = countQuery.eq('customerCompanyId', customerCompanyId)
    }
    // SuperAdmin için firma filtresi
    if (isSuperAdmin && filterCompanyId) {
      countQuery = countQuery.eq('companyId', filterCompanyId)
    }

    const { count } = await countQuery

    // Veri sorgusu (pagination ile) - Müşteri firması bilgisini de çek
    // ÖNEMLİ: Filtreleri ÖNCE uygula, sonra order ve range uygula
    // SuperAdmin için Company bilgisini de çek
    let dataQuery = supabase
      .from('Customer')
      .select(`
        id, 
        name, 
        email, 
        phone, 
        city,
        status, 
        sector, 
        createdAt,
        companyId,
        customerCompanyId,
        logoUrl,
        Company:companyId (
          id,
          name
        ),
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `) // Müşteri firması ve Company bilgisini de çek (SuperAdmin için)
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      dataQuery = dataQuery.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      dataQuery = dataQuery.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    // SONRA diğer filtreleri uygula
    if (search) {
      dataQuery = dataQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    if (status) {
      dataQuery = dataQuery.eq('status', status)
    }
    if (sector) {
      dataQuery = dataQuery.eq('sector', sector)
    }
    if (customerCompanyId) {
      dataQuery = dataQuery.eq('customerCompanyId', customerCompanyId)
    }
    // SuperAdmin için firma filtresi (yukarıda zaten uygulandı ama tekrar kontrol)
    if (isSuperAdmin && filterCompanyId) {
      dataQuery = dataQuery.eq('companyId', filterCompanyId)
    }

    // EN SON order ve range uygula (filtrelerden sonra)
    dataQuery = dataQuery
      .order('createdAt', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error } = await dataQuery

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Customers GET API query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    // Debug log - development'ta
    if (process.env.NODE_ENV === 'development') {
      console.log('Customers GET API:', {
        companyId,
        isSuperAdmin,
        page,
        pageSize,
        totalItems: count || 0,
        returnedItems: data?.length || 0,
        filters: { search, status, sector, customerCompanyId },
        firstCustomer: data?.[0] ? { id: data[0].id, name: data[0].name, createdAt: data[0].createdAt } : null,
        lastCustomer: data?.[data.length - 1] ? { id: data[data.length - 1].id, name: data[data.length - 1].name, createdAt: data[data.length - 1].createdAt } : null,
      })
    }

    // Dengeli cache - 60 saniye (performans + veri güncelliği dengesi)
    // stale-while-revalidate: Eski veri gösterilirken arka planda yenilenir (kullanıcı beklemez)
    return NextResponse.json(
      {
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
        },
      }
    )
  } catch (error: any) {
    // Production'da console.error kaldırıldı - sadece error response döndür
    if (process.env.NODE_ENV === 'development') {
      console.error('Customers API error:', error)
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch customers',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
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
    const canCreate = await hasPermission('customer', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Customers POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: (await import('@/lib/api-locale')).getErrorMessage('errors.api.customerNameRequired', request) },
        { status: 400 }
      )
    }

    // Customer verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: name, email, phone, city, status, companyId
    // schema-extension.sql: address, sector, website, taxNumber, fax, notes (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 004: customerCompanyId (müşteri hangi firmada çalışıyor)
    // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
    const { id, companyId: bodyCompanyId, createdAt, updatedAt, createdBy, updatedBy, ...cleanBody } = body
    
    const customerData: any = {
      name: cleanBody.name.trim(),
      status: cleanBody.status || 'ACTIVE',
      // companyId ve createdBy CRUD fonksiyonunda otomatik ekleniyor
    }

    // Sadece schema.sql'de olan alanlar
    if (body.email !== undefined && body.email !== null && body.email !== '') {
      customerData.email = body.email
    }
    if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
      customerData.phone = body.phone
    }
    if (body.city !== undefined && body.city !== null && body.city !== '') {
      customerData.city = body.city
    }
    // customerCompanyId - müşteri hangi firmada çalışıyor (migration 004'te eklendi)
    if (body.customerCompanyId !== undefined && body.customerCompanyId !== null && body.customerCompanyId !== '') {
      customerData.customerCompanyId = body.customerCompanyId
    }
    // logoUrl - müşteri logosu (migration 070'te eklendi)
    if (body.logoUrl !== undefined && body.logoUrl !== null && body.logoUrl !== '') {
      customerData.logoUrl = body.logoUrl
    }
    // NOT: address, sector, website, taxNumber, fax, notes schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const { getActivityMessage, getLocaleFromRequest } = await import('@/lib/api-locale')
    const locale = getLocaleFromRequest(request)
    const created = await createRecord(
      'Customer',
      customerData,
      getActivityMessage(locale, 'customerCreated', { name: body.name })
    )

    // Oluşturulan kaydı tam bilgileriyle çek (CustomerCompany ilişkisi dahil)
    const supabase = getSupabaseWithServiceRole()
    const { data: fullData, error: fetchError } = await supabase
      .from('Customer')
      .select(`
        id, 
        name, 
        email, 
        phone, 
        city,
        status, 
        sector, 
        createdAt,
        customerCompanyId,
        CustomerCompany (
          id,
          name,
          sector,
          city
        )
      `)
      .eq('id', (created as any)?.id)
      .single()

    // Eğer tam veri çekilemediyse, oluşturulan kaydı döndür
    const responseData = fullData || created

    // Debug log - development'ta
    if (process.env.NODE_ENV === 'development') {
      console.log('Customers POST API - Created:', {
        id: (responseData as any)?.id,
        name: (responseData as any)?.name,
        companyId: (responseData as any)?.companyId,
        customerCompanyId: (responseData as any)?.customerCompanyId,
        customerData,
        fullData: !!fullData,
        fetchError: fetchError?.message,
      })
    }

    // ActivityLog - Kritik modül için CREATE log'u (async, hata olsa bile devam et)
    if (responseData?.id) {
      try {
        const { logAction } = await import('@/lib/logger')
        // Async olarak logla - ana işlemi engellemez
        logAction({
          entity: 'Customer',
          action: 'CREATE',
          description: getActivityMessage(locale, 'customerCreatedDescription', { name: (responseData as any)?.name || getActivityMessage(locale, 'defaultCustomerName') }),
          meta: { 
            entity: 'Customer', 
            action: 'create', 
            id: (responseData as any).id,
            name: (responseData as any)?.name,
            status: (responseData as any)?.status,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        }).catch(() => {
          // ActivityLog hatası ana işlemi engellemez
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
      }
    }

    // Bildirim: Müşteri oluşturuldu
    if (responseData?.id) {
      try {
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
          title: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.customerCreatedTitle,
          message: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.customerCreatedMessage,
          type: 'info',
          relatedTo: 'Customer',
          relatedId: (responseData as any).id,
        })
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
      }
    }

    // Cache'i kapat - POST işleminden sonra fresh data gelsin
    return NextResponse.json(responseData, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

