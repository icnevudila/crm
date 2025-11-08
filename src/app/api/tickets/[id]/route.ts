import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecordById, updateRecord, deleteRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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
        console.error('Tickets [id] GET API session error:', sessionError)
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

    // Ticket'ı ilişkili verilerle çek
    const { data: ticket, error } = await supabase
      .from('Ticket')
      .select('*, Customer(id, name, email)')
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
      .eq('entity', 'Ticket')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(ticket as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
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
        console.error('Tickets [id] PUT API session error:', sessionError)
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
    // NOT: description, tags schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    const data = await updateRecord(
      'Ticket',
      id,
      updateData,
      `Destek talebi güncellendi: ${body.subject || id}`
    )

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
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
        console.error('Tickets [id] DELETE API session error:', sessionError)
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

    await deleteRecord('Ticket', id, `Destek talebi silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}



