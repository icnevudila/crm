import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { notifyTaskAssignment } from '@/lib/notifications'

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
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('task', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // Task'ı ilişkili verilerle çek - User join'i optional (assignedTo null olabilir)
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    let taskQuery = supabase
      .from('Task')
      .select(`
        id, title, description, status, priority, dueDate, assignedTo, relatedTo, relatedId, companyId, createdAt, updatedAt,
        User:assignedTo(id, name, email, role, companyId)
      `)
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      taskQuery = taskQuery.eq('companyId', companyId)
    }
    
    let { data: task, error } = await taskQuery.single()
    
    // Eğer User join hatası varsa, User olmadan tekrar dene
    if (error && (error.message?.includes('foreign key') || error.message?.includes('relation') || error.code === '42703')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Task API - User join hatası, User olmadan retry yapılıyor:', error.message)
      }
      
      // User join'i olmadan tekrar dene
      let retryQuery = supabase
        .from('Task')
        .select(`
          id, title, description, status, priority, dueDate, assignedTo, relatedTo, relatedId, companyId, createdAt, updatedAt
        `)
        .eq('id', id)
      
      if (!isSuperAdmin) {
        retryQuery = retryQuery.eq('companyId', companyId)
      }
      
      const retryResult = await retryQuery.single()
      task = retryResult.data
      error = retryResult.error
      
      // Eğer assignedTo varsa, User bilgisini ayrı çek
      if (task && task.assignedTo) {
        try {
          const { data: userData } = await supabase
            .from('User')
            .select('id, name, email, role, companyId')
            .eq('id', task.assignedTo)
            .single()
          
          if (userData && (!isSuperAdmin && userData.companyId === companyId || isSuperAdmin)) {
            // SuperAdmin kontrolü - sadece aynı companyId'ye sahip kullanıcıları göster
            if (!isSuperAdmin && userData.role !== 'SUPER_ADMIN' && userData.companyId === companyId) {
              task.User = userData
            } else if (isSuperAdmin) {
              task.User = userData
            }
          }
        } catch (userError) {
          // User çekme hatası ana işlemi engellemez
          if (process.env.NODE_ENV === 'development') {
            console.warn('Task API - User bilgisi çekilemedi:', userError)
          }
        }
      }
    }
    
    // Görev bulunamadı hatası kontrolü
    if (error) {
      // Supabase'in "not found" hatalarını kontrol et
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      
      // Detaylı error logging (development'ta)
      if (process.env.NODE_ENV === 'development') {
        console.error('Task API GET error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          taskId: id,
        })
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch task',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Görev yüklenirken bir hata oluştu'
        },
        { status: 500 }
      )
    }

    // Task null ise 404 döndür
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // OPTİMİZE: SuperAdmin'leri filtrele (User bilgisi varsa)
    if (task.User) {
      // SuperAdmin kontrolü + companyId kontrolü
      if (!isSuperAdmin && (task.User.role === 'SUPER_ADMIN' || task.User.companyId !== companyId)) {
        task.User = null // SuperAdmin'leri gizle
      }
    }

    // İlişkili modülleri çek (relatedTo/relatedId ile)
    if (task.relatedTo && task.relatedId) {
      try {
        if (task.relatedTo === 'Deal') {
          const { data: deal } = await supabase
            .from('Deal')
            .select('id, title')
            .eq('id', task.relatedId)
            .eq('companyId', companyId)
            .single()
          if (deal) task.Deal = deal
        } else if (task.relatedTo === 'Quote') {
          const { data: quote } = await supabase
            .from('Quote')
            .select('id, title')
            .eq('id', task.relatedId)
            .eq('companyId', companyId)
            .single()
          if (quote) task.Quote = quote
        } else if (task.relatedTo === 'Invoice') {
          const { data: invoice } = await supabase
            .from('Invoice')
            .select('id, title, invoiceNumber')
            .eq('id', task.relatedId)
            .eq('companyId', companyId)
            .single()
          if (invoice) task.Invoice = invoice
        } else if (task.relatedTo === 'Customer') {
          const { data: customer } = await supabase
            .from('Customer')
            .select('id, name')
            .eq('id', task.relatedId)
            .eq('companyId', companyId)
            .single()
          if (customer) task.Customer = customer
        }
      } catch (relatedError) {
        // İlişkili modül çekme hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.warn('Task API - İlişkili modül çekilemedi:', relatedError)
        }
      }
    }
    
    // ActivityLog'lar KALDIRILDI - Lazy load için ayrı endpoint kullanılacak (/api/activity?entity=Task&id=...)
    // (Performans optimizasyonu: Detay sayfası daha hızlı açılır, ActivityLog'lar gerektiğinde yüklenir)
    
    return NextResponse.json({
      ...(task as any),
      activities: [], // Boş array - lazy load için ayrı endpoint kullanılacak
    })
  } catch (error: any) {
    // Detaylı error logging (development'ta)
    if (process.env.NODE_ENV === 'development') {
      console.error('Task API GET - Unexpected error:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      })
    }
    
    if (error?.message?.includes('not found') || error?.message?.includes('No rows')) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch task',
        message: process.env.NODE_ENV === 'development' ? error?.message : 'Görev yüklenirken bir hata oluştu'
      },
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
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('task', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Mevcut task'ı çek - assignedTo değişikliğini ve status değişikliğini kontrol etmek için
    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    // Supabase database type tanımları eksik, Task tablosu için type tanımı yok
    let taskQuery = (supabase
      .from('Task') as any)
      .select('assignedTo, title, status, companyId')
      .eq('id', id)
    
    // SuperAdmin değilse companyId filtresi ekle
    if (!isSuperAdmin) {
      taskQuery = taskQuery.eq('companyId', session.user.companyId)
    }
    
    const { data: currentTask, error: taskError } = await taskQuery.single()
    
    if (taskError || !currentTask) {
      return NextResponse.json(
        { error: 'Görev bulunamadı' },
        { status: 404 }
      )
    }

    // Task verilerini güncelle - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, assignedTo, companyId, updatedAt
    // schema-extension.sql: description, dueDate, priority (migration çalıştırılmamış olabilir - GÖNDERME!)
    const updateData: any = {
      title: body.title,
      status: body.status,
      updatedAt: new Date().toISOString(),
    }

    // Sadece schema.sql'de olan alanlar
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo || null
    // NOT: description, dueDate, priority schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await updateRecord(
      'Task',
      id,
      updateData,
      `Görev güncellendi: ${body.title || id}`
    )

    // Eğer assignedTo değiştiyse ve yeni atanan kullanıcı farklıysa bildirim gönder
    // SuperAdmin kendi işlemlerini görmek için bildirim alabilir
    if (body.assignedTo && body.assignedTo !== currentTask?.assignedTo) {
      try {
        await notifyTaskAssignment({
          userId: body.assignedTo,
          companyId: session.user.companyId,
          taskId: id,
          taskTitle: body.title || currentTask?.title || 'Görev',
        })
      } catch (notifError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Notification error:', notifError)
        }
      }
    }

    // ÖNEMLİ: Task DONE olduğunda özel ActivityLog ve bildirim
    if (body.status === 'DONE' && currentTask?.status !== 'DONE') {
      try {
        const taskTitle = body.title || currentTask?.title || 'Görev'
        
        // ActivityLog kaydı
        // @ts-expect-error - Supabase database type tanımları eksik
        await supabase.from('ActivityLog').insert([
          {
            entity: 'Task',
            action: 'UPDATE',
            description: `Görev tamamlandı: ${taskTitle}`,
            meta: { 
              entity: 'Task', 
              action: 'completed', 
              id, 
              taskId: id,
              completedAt: new Date().toISOString()
            },
            userId: session.user.id,
            companyId: session.user.companyId,
          },
        ])

        // Bildirim: Görev tamamlandı
        const { createNotificationForRole } = await import('@/lib/notification-helper')
        await createNotificationForRole({
          companyId: session.user.companyId,
          role: ['ADMIN', 'SUPER_ADMIN'],
          title: 'Görev Tamamlandı',
          message: `${taskTitle} görevi tamamlandı. Detayları görmek ister misiniz?`,
          type: 'success',
          relatedTo: 'Task',
          relatedId: id,
        })
      } catch (activityError) {
        // ActivityLog hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Task DONE ActivityLog error:', activityError)
        }
      }
    }

    // ÖNEMLİ: Task geç kaldı veya yaklaşıyor → Bildirim
    if (body.dueDate !== undefined || currentTask?.dueDate) {
      try {
        const taskDueDate = body.dueDate ? new Date(body.dueDate) : currentTask?.dueDate ? new Date(currentTask.dueDate) : null
        const taskStatus = body.status !== undefined ? body.status : currentTask?.status
        
        if (taskDueDate && taskStatus !== 'DONE') {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const dueDate = new Date(taskDueDate)
          dueDate.setHours(0, 0, 0, 0)
          
          const taskTitle = body.title || currentTask?.title || 'Görev'
          
          // Görev geç kaldı
          if (dueDate < today) {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SUPER_ADMIN'],
              title: 'Görev Geç Kaldı',
              message: `${taskTitle} görevinin süresi geçti. Acil tamamlanması gerekiyor.`,
              type: 'error',
              priority: 'high',
              relatedTo: 'Task',
              relatedId: id,
            })
          }
          // Görev yaklaşıyor (1 gün öncesi)
          else if (dueDate > today && dueDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000)) {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SUPER_ADMIN'],
              title: 'Görev Süresi Yaklaşıyor',
              message: `${taskTitle} görevinin süresi yarın doluyor. Tamamlanması gerekiyor.`,
              type: 'warning',
              priority: 'high',
              relatedTo: 'Task',
              relatedId: id,
            })
          }
        }
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Task due date notification error:', notificationError)
        }
      }
    }

    // ActivityLog kaydı - genel güncelleme (hata olsa bile devam et)
    // Not: DONE durumu için özel log zaten var (satır 200-237), bu genel güncelleme için
    try {
      const taskTitle = body.title || currentTask?.title || 'Görev'
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Task',
          action: 'UPDATE',
          description: `Görev güncellendi: ${taskTitle}`,
          meta: { 
            entity: 'Task', 
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
      { error: error.message || 'Failed to update task' },
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
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canDelete = await hasPermission('task', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // ÖNEMLİ: Task DONE durumunda silinemez (veri bütünlüğü için)
    const { data: task, error: taskError } = await supabase
      .from('Task')
      .select('id, title, status')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()
    
    if (taskError && process.env.NODE_ENV === 'development') {
      console.error('Task DELETE - Task check error:', taskError)
    }
    
    if (task && task.status === 'DONE') {
      return NextResponse.json(
        { 
          error: 'Tamamlanmış görevler silinemez',
          message: 'Bu görev tamamlandı. Tamamlanmış görevleri silmek mümkün değildir.',
          reason: 'DONE_TASK_CANNOT_BE_DELETED',
          task: {
            id: task.id,
            title: task.title,
            status: task.status
          }
        },
        { status: 403 }
      )
    }

    await deleteRecord('Task', id, `Görev silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}



