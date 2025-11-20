import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dengeli cache - 60 saniye revalidate (performans + veri güncelliği dengesi)
export const revalidate = 60

export async function GET(request: Request) {
  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // DEBUG: Session ve permission bilgisini logla (sadece gerekirse)
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('[Deals API] 🔍 Session Check:', {
    //     userId: session.user.id,
    //     email: session.user.email,
    //     role: session.user.role,
    //     companyId: session.user.companyId,
    //     companyName: session.user.companyName,
    //     isSuperAdmin,
    //   })
    // }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('deal', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Deals API] ❌ Permission Denied:', {
          module: 'deal',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    // ✅ ÇÖZÜM: SuperAdmin'in companyId'si null olabilir
    const companyId = session.user.companyId || null
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') || ''
    const customerId = searchParams.get('customerId') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
    const contactId = searchParams.get('contactId') || '' // Contact bazlı filtreleme (migration 035)
    const competitorId = searchParams.get('competitorId') || '' // Rakip bazlı filtreleme (migration 036)
    const leadSource = searchParams.get('leadSource') || '' // Lead source filtreleme (migration 025)
    const search = searchParams.get('search') || ''
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // SuperAdmin için firma filtresi
    const filterCompanyId = searchParams.get('filterCompanyId') || ''
    
    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa
    
    // OPTİMİZE: Sadece gerekli alanlar ve pagination
    // migration 020: priorityScore, isPriority (lead scoring)
    // migration 025: leadSource (lead source tracking)
    // migration 033: LeadScore JOIN (score, temperature) - OPSIYONEL (tablo yoksa hata vermez)
    // migration 072: status kolonu - OPSIYONEL (kolon yoksa hata vermemesi için fallback)
    // SuperAdmin için Company bilgisi ekle
    
    // Status kolonunu kontrol et (kolon yoksa hata vermemesi için)
    // Önce status olmadan deneyelim
    let query = supabase
      .from('Deal')
      .select(`
        id, title, stage, value, status, customerId, customerCompanyId, contactId, competitorId, priorityScore, isPriority, leadSource, createdAt, companyId,
        Company:companyId (
          id,
          name
        )
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse veya SuperAdmin firma filtresi seçtiyse)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    } else if (filterCompanyId) {
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      query = query.eq('companyId', filterCompanyId)
    }
    // SuperAdmin ve firma filtresi yoksa tüm firmaları göster

    if (stage) {
      query = query.eq('stage', stage)
    }

    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    // Firma bazlı filtreleme (customerCompanyId)
    if (customerCompanyId) {
      query = query.eq('customerCompanyId', customerCompanyId)
    }

    // Contact bazlı filtreleme (contactId) - migration 035
    if (contactId) {
      query = query.eq('contactId', contactId)
    }

    // Rakip bazlı filtreleme (competitorId) - migration 036
    if (competitorId) {
      query = query.eq('competitorId', competitorId)
    }

    // Lead Source filtreleme (migration 025)
    if (leadSource) {
      query = query.eq('leadSource', leadSource)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (minValue) {
      query = query.gte('value', parseFloat(minValue))
    }

    if (maxValue) {
      query = query.lte('value', parseFloat(maxValue))
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    // Pagination uygula - EN SON (filtrelerden sonra)
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    // Status kolonunu kontrol et - önce status olmadan deneyelim
    let deals: any[] = []
    let error: any = null
    let totalCount = 0
    
    const { data: dealsWithoutStatus, error: errorWithoutStatus, count: countWithoutStatus } = await query
    
    if (errorWithoutStatus && (errorWithoutStatus.message?.includes('status') || (errorWithoutStatus.message?.includes('column') && errorWithoutStatus.message?.includes('does not exist')))) {
      // Status kolonu yok, status olmadan kullan
      error = null
      deals = dealsWithoutStatus || []
      totalCount = countWithoutStatus || 0
    } else if (errorWithoutStatus) {
      // Başka bir hata var
      error = errorWithoutStatus
      deals = []
      totalCount = 0
    } else {
      // Status kolonu var, status ile tekrar çek
      let queryWithStatus = supabase
        .from('Deal')
        .select(`
          id, title, stage, value, status, customerId, customerCompanyId, contactId, competitorId, priorityScore, isPriority, leadSource, createdAt, companyId,
          Company:companyId (
            id,
            name
          )
        `, { count: 'exact' })
        .order('createdAt', { ascending: false })
      
      // Filtreleri tekrar uygula
      if (!isSuperAdmin) {
        queryWithStatus = queryWithStatus.eq('companyId', companyId)
      } else if (filterCompanyId) {
        queryWithStatus = queryWithStatus.eq('companyId', filterCompanyId)
      }
      
      if (stage) {
        queryWithStatus = queryWithStatus.eq('stage', stage)
      }
      if (customerId) {
        queryWithStatus = queryWithStatus.eq('customerId', customerId)
      }
      if (customerCompanyId) {
        queryWithStatus = queryWithStatus.eq('customerCompanyId', customerCompanyId)
      }
      if (contactId) {
        queryWithStatus = queryWithStatus.eq('contactId', contactId)
      }
      if (competitorId) {
        queryWithStatus = queryWithStatus.eq('competitorId', competitorId)
      }
      if (leadSource) {
        queryWithStatus = queryWithStatus.eq('leadSource', leadSource)
      }
      if (search) {
        queryWithStatus = queryWithStatus.ilike('title', `%${search}%`)
      }
      if (minValue) {
        queryWithStatus = queryWithStatus.gte('value', parseFloat(minValue))
      }
      if (maxValue) {
        queryWithStatus = queryWithStatus.lte('value', parseFloat(maxValue))
      }
      if (startDate) {
        queryWithStatus = queryWithStatus.gte('createdAt', startDate)
      }
      if (endDate) {
        queryWithStatus = queryWithStatus.lte('createdAt', endDate)
      }
      
      // Pagination uygula
      queryWithStatus = queryWithStatus.range((page - 1) * pageSize, page * pageSize - 1)
      
      const { data: dealsWithStatus, error: errorWithStatus, count: countWithStatus } = await queryWithStatus
      error = errorWithStatus
      deals = dealsWithStatus || []
      totalCount = countWithStatus || 0
    }

    // Eğer hata varsa ve status kolonu hatası değilse, hatayı döndür
    if (error && !(error.message?.includes('status') || (error.message?.includes('column') && error.message?.includes('does not exist')))) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV !== 'production') {
        console.error('Deals API query error:', error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalPages = Math.ceil((totalCount || 0) / pageSize)

    // Dengeli cache - 60 saniye (performans + veri güncelliği dengesi)
    // stale-while-revalidate: Eski veri gösterilirken arka planda yenilenir (kullanıcı beklemez)
    return NextResponse.json(
      {
        data: deals || [],
        pagination: {
          page,
          pageSize,
          totalItems: totalCount || 0,
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
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

    // ✅ ÇÖZÜM: SuperAdmin için companyId kontrolü bypass et
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin && !session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('deal', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
      // Güvenlik: createdBy ve updatedBy otomatik dolduruluyor (CRUD fonksiyonunda), body'den alınmamalı
      const { id, companyId: bodyCompanyId, createdAt, updatedAt, createdBy, updatedBy, ...cleanBody } = body
      body = cleanBody // cleanBody'yi kullan
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: (await import('@/lib/api-locale')).getErrorMessage('errors.api.dealTitleRequired', request) },
        { status: 400 }
      )
    }

    // ÖNEMLİ: LOST stage'inde lostReason zorunlu
    if (body.stage === 'LOST') {
      if (!body.lostReason || typeof body.lostReason !== 'string' || body.lostReason.trim().length === 0) {
        return NextResponse.json(
          {
            error: (await import('@/lib/api-locale')).getErrorMessage('errors.api.lostReasonRequired', request),
            message: (await import('@/lib/api-locale')).getErrorMessage('errors.api.dealLostReasonRequired', request),
            reason: 'LOST_REASON_REQUIRED',
            stage: body.stage
          },
          { status: 400 }
        )
      }
    }

    const supabase = getSupabaseWithServiceRole()

    // ✅ ÇÖZÜM: SuperAdmin body'den companyId gönderebilir, değilse session'dan al
    const companyId = isSuperAdmin && body.companyId 
      ? body.companyId 
      : session.user.companyId
    
    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Deal verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, stage, value, status, companyId, customerId
    // schema-extension.sql: winProbability, expectedCloseDate, description (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 025: leadSource (lead source tracking)
    const dealData: any = {
      title: body.title.trim(),
      stage: body.stage || 'LEAD',
      status: body.status || 'OPEN',
      value: body.value !== undefined ? parseFloat(body.value) : 0,
      companyId: companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.customerId) dealData.customerId = body.customerId
    // Firma bazlı ilişki (customerCompanyId)
    if (body.customerCompanyId) dealData.customerCompanyId = body.customerCompanyId
    // Lead Source (migration 025)
    if (body.leadSource) dealData.leadSource = body.leadSource
    // Lost Reason (LOST stage'inde zorunlu)
    if (body.lostReason) dealData.lostReason = body.lostReason.trim()
    // NOT: description, winProbability, expectedCloseDate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    const { data, error } = await supabase
      .from('Deal')
      .insert([dealData])
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create deal' },
        { status: 500 }
      )
    }

    // ActivityLog - Kritik modül için CREATE log'u (async, hata olsa bile devam et)
    if (data?.id) {
      try {
        const { logAction } = await import('@/lib/logger')
        const { getActivityMessage, getLocaleFromRequest } = await import('@/lib/api-locale')
        const locale = getLocaleFromRequest(request)
        // Async olarak logla - ana işlemi engellemez
        logAction({
          entity: 'Deal',
          action: 'CREATE',
          description: getActivityMessage(locale, 'dealCreated', { title: (data as any)?.title || getActivityMessage(locale, 'defaultDealTitle') }),
          meta: { 
            entity: 'Deal', 
            action: 'create', 
            id: (data as any).id,
            title: (data as any)?.title,
            stage: (data as any)?.stage,
            value: (data as any)?.value,
          },
          userId: session.user.id,
          companyId: companyId, // ✅ SuperAdmin için doğru companyId kullan
        }).catch(() => {
          // ActivityLog hatası ana işlemi engellemez
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
      }
    }

    // Bildirim: Fırsat oluşturuldu
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: companyId, // ✅ ÇÖZÜM: SuperAdmin için doğru companyId kullan
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.dealCreatedTitle,
        message: (await import('@/lib/api-locale')).getMessages((await import('@/lib/api-locale')).getLocaleFromRequest(request)).activity.dealCreatedMessage,
        type: 'info',
        relatedTo: 'Deal',
        relatedId: (data as any).id,
      })
    } catch (notificationError) {
      // Bildirim hatası ana işlemi engellemez
    }

    // ✅ Otomasyon: Deal oluşturulduğunda email gönder (kullanıcı tercihine göre)
    try {
      const automationRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automations/deal-created-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal: data,
        }),
      })
      // Automation hatası ana işlemi engellemez (sadece log)
      if (!automationRes.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Deal Automation] Email gönderimi başarısız veya kullanıcı tercihi ASK')
        }
      }
    } catch (automationError) {
      // Automation hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('[Deal Automation] Error:', automationError)
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Deals POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create deal' },
      { status: 500 }
    )
  }
}


