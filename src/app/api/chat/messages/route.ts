import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * GET /api/chat/messages
 * Kanal mesajlarını getirir
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const supabase = getSupabase()

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from('ChatMessage')
      .select(`
        *,
        User:userId (
          id,
          name,
          email,
          image
        ),
        ReplyTo:replyToId (
          id,
          message,
          User:userId (
            id,
            name
          )
        )
      `)
      .eq('channelId', channelId)
      .eq('companyId', companyId)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('Messages fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(messages || [])
  } catch (error: any) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/chat/messages
 * Yeni mesaj gönderir
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const companyId = session.user.companyId
    const supabase = getSupabase()

    const body = await request.json()
    const { channelId, message, fileUrl, fileName, fileType, replyToId } = body

    if (!channelId || !message) {
      return NextResponse.json({ error: 'channelId and message are required' }, { status: 400 })
    }

    // Kanalın var olduğunu kontrol et
    const { data: channel } = await supabase
      .from('ChatChannel')
      .select('id')
      .eq('id', channelId)
      .eq('companyId', companyId)
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Mesaj oluştur
    const { data: chatMessage, error } = await supabase
      .from('ChatMessage')
      .insert({
        channelId,
        userId,
        message,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        replyToId: replyToId || null,
        companyId,
      })
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
      console.error('Message create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Kanalın updatedAt'ini güncelle
    await supabase
      .from('ChatChannel')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', channelId)

    return NextResponse.json(chatMessage)
  } catch (error: any) {
    console.error('Message create API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

