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
        console.error('Finance [id] GET API session error:', sessionError)
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

    // Finance kaydını çek
    const { data: finance, error } = await supabase
      .from('Finance')
      .select('*')
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
      .eq('entity', 'Finance')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(finance as any),
      activities: activities || [],
    })
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('No rows')) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || 'Failed to fetch finance record' },
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
        console.error('Finance [id] PUT API session error:', sessionError)
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

    const description = `Finans kaydı güncellendi: ${body.type === 'INCOME' ? 'Gelir' : 'Gider'} - ${body.amount} ₺`
    const data = await updateRecord('Finance', id, body, description)

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update finance record' },
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
        console.error('Finance [id] DELETE API session error:', sessionError)
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

    await deleteRecord('Finance', id, `Finans kaydı silindi: ${id}`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete finance record' },
      { status: 500 }
    )
  }
}
