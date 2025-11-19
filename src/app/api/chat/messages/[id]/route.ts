import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * PUT /api/chat/messages/[id]
 * Mesajı günceller
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const companyId = session.user.companyId
    const supabase = getSupabase()

    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Mesajı güncelle (sadece kendi mesajını)
    const { data: updatedMessage, error } = await supabase
      .from('ChatMessage')
      .update({ message, updatedAt: new Date().toISOString() })
      .eq('id', params.id)
      .eq('userId', userId)
      .eq('companyId', companyId)
      .select(`
        *,
        User:userId (
          id,
          name,
          email,
          image
        )
      `)
      .single()

    if (error) {
      console.error('Message update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updatedMessage) {
      return NextResponse.json({ error: 'Message not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json(updatedMessage)
  } catch (error: any) {
    console.error('Message update API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/chat/messages/[id]
 * Mesajı siler
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const companyId = session.user.companyId
    const supabase = getSupabase()

    // Mesajı sil (sadece kendi mesajını)
    const { error } = await supabase
      .from('ChatMessage')
      .delete()
      .eq('id', params.id)
      .eq('userId', userId)
      .eq('companyId', companyId)

    if (error) {
      console.error('Message delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Message delete API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

