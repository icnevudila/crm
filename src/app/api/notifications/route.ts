import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const read = searchParams.get('read')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Supabase database type tanımları eksik, Notification tablosu için type tanımı yok
    let query = (supabase
      .from('Notification') as any)
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(limit)

    if (read === 'true') {
      query = query.eq('isRead', true)
    } else if (read === 'false') {
      query = query.eq('isRead', false)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, read } = body

    if (!Array.isArray(notificationIds) || typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Supabase database type tanımları eksik, Notification tablosu için type tanımı yok
    const { data, error } = await (supabase
      .from('Notification') as any)
      .update({ isRead: read })
      .in('id', notificationIds)
      .eq('userId', session.user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}


