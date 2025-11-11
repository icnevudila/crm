import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('deal', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') || ''
    const customerId = searchParams.get('customerId') || ''
    const customerCompanyId = searchParams.get('customerCompanyId') || '' // Firma bazlı filtreleme
    const leadSource = searchParams.get('leadSource') || '' // Lead source filtreleme (migration 025)
    const search = searchParams.get('search') || ''
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // SuperAdmin için firma filtresi
    const filterCompanyId = searchParams.get('filterCompanyId') || ''
    
    // OPTİMİZE: Sadece gerekli alanlar ve limit
    // migration 020: priorityScore, isPriority (lead scoring)
    // migration 025: leadSource (lead source tracking)
    // migration 033: LeadScore JOIN (score, temperature) - OPSIYONEL (tablo yoksa hata vermez)
    // SuperAdmin için Company bilgisi ekle
    let query = supabase
      .from('Deal')
      .select(`
        id, title, stage, value, status, customerId, priorityScore, isPriority, leadSource, createdAt, companyId,
        Company:companyId (
          id,
          name
        )
      `, { count: 'exact' })
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
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

    const { data, error, count } = await query

    if (error) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Deals API query error:', error)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Cache headers - POST sonrası fresh data için cache'i kapat
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // POST sonrası fresh data için cache'i kapat
        'X-Total-Count': String(count || (data?.length || 0)),
      },
    })
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

    if (!session?.user?.companyId) {
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
        { error: 'Fırsat başlığı gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Deal verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, stage, value, status, companyId, customerId
    // schema-extension.sql: winProbability, expectedCloseDate, description (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 025: leadSource (lead source tracking)
    const dealData: any = {
      title: body.title.trim(),
      stage: body.stage || 'LEAD',
      status: body.status || 'OPEN',
      value: body.value !== undefined ? parseFloat(body.value) : 0,
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.customerId) dealData.customerId = body.customerId
    // Firma bazlı ilişki (customerCompanyId)
    if (body.customerCompanyId) dealData.customerCompanyId = body.customerCompanyId
    // Lead Source (migration 025)
    if (body.leadSource) dealData.leadSource = body.leadSource
    // NOT: description, winProbability, expectedCloseDate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    const { data, error } = await supabase
      .from('Deal')
      // @ts-expect-error - Supabase database type tanımları eksik
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

    // ActivityLog kaydı - hata olsa bile ana işlem başarılı
    try {
      // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Deal',
          action: 'CREATE',
          description: `Yeni fırsat oluşturuldu: ${body.title}`,
          meta: { entity: 'Deal', action: 'create', id: (data as any)?.id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog insert error:', logError)
      }
    }

    // Bildirim: Fırsat oluşturuldu
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: 'Yeni Fırsat Oluşturuldu',
        message: `Yeni bir fırsat oluşturuldu. Detayları görmek ister misiniz?`,
        type: 'info',
        relatedTo: 'Deal',
        relatedId: (data as any).id,
      })
    } catch (notificationError) {
      // Bildirim hatası ana işlemi engellemez
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

