import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID required' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // ActivityLog'dan comment'leri çek (action = 'COMMENT')
    const { data: comments, error } = await supabase
      .from('ActivityLog')
      .select(`
        *,
        User (
          id,
          name,
          email
        )
      `)
      .eq('companyId', session.user.companyId)
      .eq('entity', entityType)
      .eq('action', 'COMMENT')
      .eq('meta->>entityId', entityId)
      .order('createdAt', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, comment } = body

    if (!entityType || !entityId || !comment) {
      return NextResponse.json(
        { error: 'Entity type, ID and comment required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // ActivityLog'a comment olarak kaydet
    const { data, error } = await supabase
      .from('ActivityLog')
      .insert([
        {
          entity: entityType,
          action: 'COMMENT',
          description: comment,
          meta: {
            entity: entityType,
            action: 'comment',
            entityId,
            comment,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
      .select(`
        *,
        User (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}

