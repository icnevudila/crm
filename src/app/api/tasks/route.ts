import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecords, createRecord } from '@/lib/crud'
import { notifyTaskAssignment } from '@/lib/notifications'

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
        console.error('Tasks GET API session error:', sessionError)
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
    const canRead = await hasPermission('task', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Görev görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const assignedTo = searchParams.get('assignedTo') || ''
    const filterCompanyId = searchParams.get('filterCompanyId') || '' // SuperAdmin için firma filtresi

    // SuperAdmin için direkt Supabase sorgusu yap (tüm şirketlerin verilerini görebilir)
    if (isSuperAdmin) {
      const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
      const supabase = getSupabaseWithServiceRole()
      
      let query = supabase
        .from('Task')
        .select('*, User(name, email), Company:companyId(id, name)')
        .order('createdAt', { ascending: false })
        .limit(500)
      
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
      
      const { data, error } = await query
      
      if (error) {
        return NextResponse.json(
          { error: error.message || 'Failed to fetch tasks' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(data || [], {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30, max-age=5', // Kısa cache - yeni task'ları görmek için
          'CDN-Cache-Control': 'public, s-maxage=10',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=10',
        },
      })
    }

    // Normal kullanıcılar için getRecords kullan (companyId filtresi ile)
    const filters: any = {}
    if (status) filters.status = status
    if (assignedTo) filters.assignedTo = assignedTo

    const data = await getRecords({
      table: 'Task',
      filters,
      orderBy: 'createdAt',
      orderDirection: 'desc',
      select: '*, User(name, email), Company:companyId(id, name)',
    })

    // Kısa cache headers - yeni task'ları görmek için
    return NextResponse.json(data || [], {
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tasks POST API session error:', sessionError)
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
    const canCreate = await hasPermission('task', 'create', session.user.id)
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Görev oluşturma yetkiniz yok' },
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

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Görev başlığı gereklidir' },
        { status: 400 }
      )
    }

    // Task verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, assignedTo, companyId
    // schema-extension.sql: description, dueDate, priority (migration çalıştırılmamış olabilir - GÖNDERME!)
    const taskData: any = {
      title: body.title,
      status: body.status || 'TODO',
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.assignedTo) taskData.assignedTo = body.assignedTo
    // NOT: description, dueDate, priority schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await createRecord(
      'Task',
      taskData,
      `Yeni görev oluşturuldu: ${body.title}`
    )

    // Eğer görev bir kullanıcıya atandıysa bildirim gönder
    if (body.assignedTo && body.assignedTo !== session.user.id) {
      try {
        await notifyTaskAssignment(
          body.assignedTo,
          session.user.companyId,
          (data as any).id,
          body.title,
          session.user.name || 'Sistem'
        )
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
