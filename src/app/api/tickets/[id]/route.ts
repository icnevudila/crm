import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('ticket', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // Ticket'ı ilişkili verilerle çek
    let ticketQuery = supabase
      .from('Ticket')
      .select('*, Customer(id, name, email)')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      ticketQuery = ticketQuery.eq('companyId', companyId)
    }
    
    const { data: ticket, error } = await ticketQuery.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog'ları çek
    let activityQuery = supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('entity', 'Ticket')
      .eq('meta->>id', id)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      activityQuery = activityQuery.eq('companyId', companyId)
    }
    
    const { data: activities } = await activityQuery
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(ticket as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Destek talebi bulunamadı' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Destek talebi getirilemedi' },
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
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('ticket', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Mevcut ticket'ı çek - status değişikliğini kontrol etmek için
    const { data: currentTicket } = await supabase
      .from('Ticket')
      .select('subject, status, customerId, Customer(id, name, email)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    // Ticket verilerini güncelle - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: subject, status, priority, companyId, customerId, updatedAt
    // schema-extension.sql: description, tags (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: any = {
      subject: body.subject,
      status: body.status,
      priority: body.priority,
      updatedAt: new Date().toISOString(),
    }

    // Sadece schema.sql'de olan alanlar
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo || null
    // NOT: description, tags schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await updateRecord(
      'Ticket',
      id,
      updateData,
      `Destek talebi güncellendi: ${body.subject || id}`
    )

    // ÖNEMLİ: Ticket RESOLVED veya CLOSED olduğunda özel ActivityLog ve bildirim
    if ((body.status === 'RESOLVED' || body.status === 'CLOSED') 
        && currentTicket && (currentTicket as any).status !== 'RESOLVED' && (currentTicket as any).status !== 'CLOSED') {
      try {
        const ticketSubject = body.subject || (currentTicket as any)?.subject || 'Destek Talebi'
        const statusText = body.status === 'RESOLVED' ? 'çözüldü' : 'kapatıldı'
        
        // ActivityLog kaydı
        // @ts-expect-error - Supabase database type tanımları eksik
        await supabase.from('ActivityLog').insert([
          {
            entity: 'Ticket',
            action: 'UPDATE',
            description: `Destek talebi ${statusText}: ${ticketSubject}`,
            meta: { 
              entity: 'Ticket', 
              action: body.status.toLowerCase(), 
              id, 
              ticketId: id,
              resolvedAt: new Date().toISOString()
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])

        // Bildirim: Destek talebi çözüldü/kapatıldı → Destek ekibine
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SUPER_ADMIN'],
          title: `Destek Talebi ${body.status === 'RESOLVED' ? 'Çözüldü' : 'Kapatıldı'}`,
          message: `${ticketSubject} destek talebi ${statusText}. Detayları görmek ister misiniz?`,
          type: 'success',
          relatedTo: 'Ticket',
          relatedId: id,
        })

        // ÖNEMLİ: Destek talebi çözüldü/kapatıldı → Müşteriye bildirim
        if ((currentTicket as any)?.Customer) {
          try {
            const customer = (currentTicket as any).Customer
            if (customer.email) {
              // Müşteri User tablosunda kayıtlı mı kontrol et
              const { data: customerUser } = await supabase
                .from('User')
                .select('id')
                .eq('email', customer.email)
                .eq('companyId', session.user.companyId)
                .maybeSingle()

              if (customerUser && (customerUser as any).id) {
                // Müşteri User tablosunda kayıtlıysa bildirim gönder
                const { createNotification } = await import('@/lib/notification-helper')
                await createNotification({
                  userId: (customerUser as any).id,
                  companyId: session.user.companyId,
                  title: `Talebiniz ${body.status === 'RESOLVED' ? 'Çözüldü' : 'Kapatıldı'}`,
                  message: `${ticketSubject} destek talebiniz ${statusText}. Teşekkür ederiz!`,
                  type: 'success',
                  relatedTo: 'Ticket',
                  relatedId: id,
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
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Ticket RESOLVED/CLOSED ActivityLog error:', activityError)
        }
      }
    }

    // ÖNEMLİ: Ticket atandı → Bildirim
    if (body.assignedTo !== undefined && currentTicket && body.assignedTo !== (currentTicket as any)?.assignedTo) {
      try {
        const ticketSubject = body.subject || (currentTicket as any)?.subject || 'Destek Talebi'
        
        // Atanan kullanıcıya bildirim gönder
        if (body.assignedTo) {
          const { createNotification } = await import('@/lib/notification-helper')
          await createNotification({
            userId: body.assignedTo,
            companyId: session.user.companyId,
            title: 'Yeni Destek Talebi Atandı',
            message: `${ticketSubject} destek talebi size atandı. Detayları görmek ister misiniz?`,
            type: 'info',
            relatedTo: 'Ticket',
            relatedId: id,
          })
        }
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Ticket assignment notification error:', notificationError)
        }
      }
    }

    // ÖNEMLİ: Ticket geç kaldı → Bildirim (7 günden uzun süredir açıksa)
    if (currentTicket && (currentTicket as any)?.createdAt) {
      try {
        const createdAt = new Date((currentTicket as any).createdAt)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const ticketStatus = body.status !== undefined ? body.status : (currentTicket as any)?.status
        
        if (createdAt < sevenDaysAgo && ticketStatus !== 'RESOLVED' && ticketStatus !== 'CLOSED') {
          const ticketSubject = body.subject || (currentTicket as any)?.subject || 'Destek Talebi'
          const daysOpen = Math.floor((new Date().getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
          
          const { createNotificationForRole } = await import('@/lib/notification-helper')
          await createNotificationForRole({
            companyId: session.user.companyId,
            role: ['ADMIN', 'SUPER_ADMIN'],
            title: 'Destek Talebi Geç Kaldı',
            message: `${ticketSubject} destek talebi ${daysOpen} gündür açık. Acil çözülmesi gerekiyor.`,
            type: 'error',
            priority: 'high',
            relatedTo: 'Ticket',
            relatedId: id,
          })
        }
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Ticket overdue notification error:', notificationError)
        }
      }
    }

    // ActivityLog kaydı - genel güncelleme (hata olsa bile devam et)
    try {
      const ticketSubject = body.subject || (currentTicket as any)?.subject || 'Destek Talebi'
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Ticket',
          action: 'UPDATE',
          description: `Destek talebi güncellendi: ${ticketSubject}`,
          meta: { 
            entity: 'Ticket', 
            action: 'update', 
            id,
            changes: body,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Destek talebi güncellenemedi' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canDelete = await hasPermission('ticket', 'delete', session.user.id)
    if (!canDelete) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Ticket RESOLVED/CLOSED durumunda silinemez (veri bütünlüğü için)
    const { data: ticket, error: ticketError } = await supabase
      .from('Ticket')
      .select('id, subject, status')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()
    
    if (ticketError && process.env.NODE_ENV === 'development') {
      console.error('Ticket DELETE - Ticket check error:', ticketError)
    }
    
    if (ticket && ((ticket as any).status === 'RESOLVED' || (ticket as any).status === 'CLOSED')) {
      return NextResponse.json(
        { 
          error: 'Çözülmüş/Kapatılmış destek talepleri silinemez',
          message: 'Bu destek talebi çözüldü veya kapatıldı. Çözülmüş/kapatılmış destek taleplerini silmek mümkün değildir.',
          reason: 'RESOLVED_TICKET_CANNOT_BE_DELETED',
          ticket: {
            id: (ticket as any).id,
            subject: (ticket as any).subject,
            status: (ticket as any).status
          }
        },
        { status: 403 }
      )
    }

    await deleteRecord('Ticket', id, `Destek talebi silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Destek talebi silinemedi' },
      { status: 500 }
    )
  }
}



