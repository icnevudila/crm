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
      console.log('[Tickets API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('ticket', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Tickets API] ❌ Permission Denied:', {
          module: 'ticket',
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
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const customerId = searchParams.get('customerId') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // SuperAdmin için direkt Supabase query (getRecords companyId filtresi uygular)
    if (isSuperAdmin) {
      const supabase = getSupabaseWithServiceRole()
      let query = supabase
        .from('Ticket')
        .select('*, Customer(name, email), Company:companyId(id, name)', { count: 'exact' })
        .order('createdAt', { ascending: false })
      
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      if (filterCompanyId) {
        query = query.eq('companyId', filterCompanyId)
      }
      // SuperAdmin ve firma filtresi yoksa tüm firmaları göster
      
      if (status) query = query.eq('status', status)
      if (priority) query = query.eq('priority', priority)
      if (customerId) query = query.eq('customerId', customerId)
      
      const { data, error } = await query
      
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to fetch tickets' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(data || [], {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
          'CDN-Cache-Control': 'public, s-maxage=3600',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
        },
      })
    }

    // Normal kullanıcılar için getRecords kullan (companyId filtresi ile)
    const filters: any = {}
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (customerId) filters.customerId = customerId

    const data = await getRecords({
      table: 'Ticket',
      filters,
      orderBy: 'createdAt',
      orderDirection: 'desc',
      select: '*, Customer(name, email), Company:companyId(id, name)',
    })

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
      { error: error.message || (await import('@/lib/api-locale')).getErrorMessage('errors.api.ticketsCannotBeFetched', request) },
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
    const canCreate = await hasPermission('ticket', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tickets POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Geçersiz JSON', message: jsonError?.message || 'İstek gövdesi çözümlenemedi' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.subject || body.subject.trim() === '') {
      return NextResponse.json(
        { error: 'Destek talebi konusu gereklidir' },
        { status: 400 }
      )
    }

    // Ticket verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: subject, status, priority, companyId, customerId
    // schema-extension.sql: description, tags (migration çalıştırılmamış olabilir - GÖNDERME!)
    const ticketData: any = {
      subject: body.subject,
      status: body.status || 'OPEN',
      priority: body.priority || 'MEDIUM',
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.customerId) ticketData.customerId = body.customerId
    if (body.assignedTo) ticketData.assignedTo = body.assignedTo
    // NOT: description, tags schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await createRecord(
      'Ticket',
      ticketData,
      `Yeni destek talebi oluşturuldu: ${body.subject}`
    )

    // ÖNEMLİ: Ticket oluşturulduğunda destek ekibine bildirim gönder
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: 'Yeni Destek Talebi Oluşturuldu',
        message: `Yeni bir destek talebi oluşturuldu: ${body.subject}. Detayları görmek ister misiniz?`,
        type: 'info',
        relatedTo: 'Ticket',
        relatedId: (data as any).id,
      })
    } catch (notificationError) {
      // Bildirim hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('Ticket creation notification error:', notificationError)
      }
    }

    // ÖNEMLİ: Ticket oluşturulduğunda müşteriye bildirim gönder (eğer müşteri User tablosunda kayıtlıysa)
    if (body.customerId) {
      try {
        const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
        const supabase = getSupabaseWithServiceRole()
        
        // Customer bilgilerini çek
        const { data: customer } = await supabase
          .from('Customer')
          .select('id, name, email')
          .eq('id', body.customerId)
          .single()

        if (customer && customer.email) {
          // Müşteri User tablosunda kayıtlı mı kontrol et
          const { data: customerUser } = await supabase
            .from('User')
            .select('id')
            .eq('email', customer.email)
            .eq('companyId', session.user.companyId)
            .maybeSingle()

          if (customerUser) {
            // Müşteri User tablosunda kayıtlıysa bildirim gönder
            const { createNotification } = await import('@/lib/notification-helper')
            await createNotification({
              userId: customerUser.id,
              companyId: session.user.companyId,
              title: 'Talebiniz Başarıyla Oluşturuldu',
              message: `Destek talebiniz başarıyla oluşturuldu: "${body.subject}". Talep ID: #${(data as any).id.substring(0, 8)}`,
              type: 'success',
              relatedTo: 'Ticket',
              relatedId: (data as any).id,
            })
          }
          // TODO: E-posta bildirimi eklenebilir (müşteri User tablosunda kayıtlı değilse)
        }
      } catch (customerNotificationError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Customer notification error:', customerNotificationError)
        }
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Tickets POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Destek talebi oluşturulamadı' },
      { status: 500 }
    )
  }
}

