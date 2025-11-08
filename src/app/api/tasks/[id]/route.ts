import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { notifyTaskAssignment } from '@/lib/notifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tasks [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    const supabase = getSupabaseWithServiceRole()

    // Task'ı ilişkili verilerle çek
    const { data: task, error } = await supabase
      .from('Task')
      .select('*, User(name, email)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog'ları çek
    const { data: activities } = await supabase
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
      .eq('companyId', session.user.companyId)
      .eq('entity', 'Task')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(task as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task' },
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tasks [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Mevcut task'ı çek - assignedTo değişikliğini kontrol etmek için
    const supabase = getSupabaseWithServiceRole()
    // Supabase database type tanımları eksik, Task tablosu için type tanımı yok
    const { data: currentTask } = await (supabase
      .from('Task') as any)
      .select('assignedTo, title')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

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
    if (body.assignedTo && body.assignedTo !== currentTask?.assignedTo && body.assignedTo !== session.user.id) {
      try {
        await notifyTaskAssignment(
          body.assignedTo,
          session.user.companyId,
          id,
          body.title || currentTask?.title || 'Görev',
          session.user.name || 'Sistem'
        )
      } catch (notifError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Notification error:', notifError)
        }
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Tasks [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await deleteRecord('Task', id, `Görev silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}



