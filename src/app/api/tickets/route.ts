import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecords, createRecord } from '@/lib/crud'

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
        console.error('Tickets GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('ticket', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Destek talebi görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const priority = searchParams.get('priority') || ''
    const customerId = searchParams.get('customerId') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

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
      { error: error.message || 'Failed to fetch tickets' },
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
        console.error('Tickets POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission } = await import('@/lib/permissions')
    const canCreate = await hasPermission('ticket', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Destek talebi oluşturma yetkiniz yok' },
        { status: 403 }
      )
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
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
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
      { error: error?.message || 'Failed to create ticket' },
      { status: 500 }
    )
  }
}

