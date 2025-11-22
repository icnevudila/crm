import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecords, createRecord } from '@/lib/crud'
import { notifyTaskAssignment } from '@/lib/notifications'

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
      console.log('[Tasks API] 🔍 Session Check:', {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        companyName: session.user.companyName,
      })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canRead = await hasPermission('task', 'read', session.user.id)
    if (!canRead) {
      // DEBUG: Permission denied logla
      if (process.env.NODE_ENV === 'development') {
        console.log('[Tasks API] ❌ Permission Denied:', {
          module: 'task',
          action: 'read',
          userId: session.user.id,
          role: session.user.role,
        })
      }
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // SuperAdmin için direkt Supabase sorgusu yap (tüm şirketlerin verilerini görebilir)
    if (isSuperAdmin) {
      const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
      const supabase = getSupabaseWithServiceRole()
      
      let query = supabase
        .from('Task')
        .select('*, User:assignedTo(id, name, email), Company:companyId(id, name)', { count: 'exact' })
        .order('createdAt', { ascending: false })
      
      // SuperAdmin firma filtresi seçtiyse sadece o firmayı göster
      if (filterCompanyId) {
        query = query.eq('companyId', filterCompanyId)
      }
      
      // Status filtresi
      if (status) {
        query = query.eq('status', status)
      }
      
      // AssignedTo filtresi
      if (assignedTo) {
        query = query.eq('assignedTo', assignedTo)
      }
      
      // Pagination uygula
      query = query.range((page - 1) * pageSize, page * pageSize - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to fetch tasks' },
          { status: 500 }
        )
      }
      
      const totalPages = Math.ceil((count || 0) / pageSize)
      
      return NextResponse.json({
        data: data || [],
        pagination: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages,
        },
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=5', // Kısa cache - yeni task'ları görmek için
          'CDN-Cache-Control': 'public, s-maxage=10',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=10',
        },
      })
    }

    // Normal kullanıcılar için direkt Supabase query (pagination için)
    const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
    const supabase = getSupabaseWithServiceRole()
    
    let query = supabase
      .from('Task')
      .select('*, User:assignedTo(id, name, email), Company:companyId(id, name)', { count: 'exact' })
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
    
    if (status) query = query.eq('status', status)
    if (assignedTo) query = query.eq('assignedTo', assignedTo)
    
    // Pagination uygula
    query = query.range((page - 1) * pageSize, page * pageSize - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to fetch tasks' },
        { status: 500 }
      )
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize)

    // Kısa cache headers - yeni task'ları görmek için
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=5', // Kısa cache - yeni task'ları görmek için
        'CDN-Cache-Control': 'public, s-maxage=10',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=10',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
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
    const { hasPermission, PERMISSION_DENIED_MESSAGE } = await import('@/lib/permissions')
    const canCreate = await hasPermission('task', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: PERMISSION_DENIED_MESSAGE },
        { status: 403 }
      )
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tasks POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const { taskCreateSchema } = await import('@/lib/validations/tasks')
    const validationResult = taskCreateSchema.safeParse(body)
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

    // Task verilerini oluştur - Zod validated data kullan
    const taskData: any = {
      title: validatedData.title,
      status: validatedData.status || 'TODO',
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (validatedData.assignedTo) taskData.assignedTo = validatedData.assignedTo
    if (validatedData.description) taskData.description = validatedData.description
    if (validatedData.dueDate) taskData.dueDate = validatedData.dueDate
    if (validatedData.priority) taskData.priority = validatedData.priority
    // NOT: description, dueDate, priority schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await createRecord(
      'Task',
      taskData,
      `Yeni görev oluşturuldu: ${validatedData.title}`
    )

    // Eğer görev bir kullanıcıya atandıysa bildirim gönder
    // SuperAdmin kendi işlemlerini görmek için bildirim alabilir
    if (body.assignedTo) {
      try {
        await notifyTaskAssignment({
          userId: body.assignedTo,
          companyId: session.user.companyId,
          taskId: (data as any).id,
          taskTitle: validatedData.title,
        })
      } catch (notifError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Notification error:', notifError)
        }
      }
    }

    // Bildirim: Görev oluşturuldu (atama bildirimi yoksa)
    if (!body.assignedTo || body.assignedTo === session.user.id) {
      try {
        const { createNotification } = await import('@/lib/notification-helper')
        await createNotification({
          userId: session.user.id,
          companyId: session.user.companyId,
          title: 'Yeni Görev Oluşturuldu',
          message: `Yeni bir görev oluşturuldu. Detayları görmek ister misiniz?`,
          type: 'info',
          relatedTo: 'Task',
          relatedId: (data as any).id,
        })
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}
