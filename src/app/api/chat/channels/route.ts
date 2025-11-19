import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * GET /api/chat/channels
 * Kullanıcının erişebileceği kanalları getirir
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
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    let query = supabase
      .from('ChatChannel')
      .select(`
        *,
        User:createdBy (
          id,
          name,
          email
        ),
        ChatMessage (
          id,
          message,
          userId,
          createdAt
        )
      `)
      .eq('companyId', companyId)
      .order('updatedAt', { ascending: false })

    // Entity filtresi varsa uygula
    if (entityType) {
      query = query.eq('entityType', entityType)
    }
    if (entityId) {
      query = query.eq('entityId', entityId)
    }

    const { data: channels, error } = await query

    if (error) {
      console.error('Channels fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Son mesajı ve mesaj sayısını ekle
    const formattedChannels = channels?.map((channel: any) => {
      const messages = channel.ChatMessage || []
      const lastMessage = messages.length > 0 
        ? messages.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]
        : null

      return {
        ...channel,
        messageCount: messages.length,
        lastMessage,
        ChatMessage: undefined, // Gereksiz veriyi kaldır
      }
    }) || []

    return NextResponse.json(formattedChannels)
  } catch (error: any) {
    console.error('Channels API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/chat/channels
 * Yeni kanal oluşturur
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
    const { entityType, entityId } = body

    if (!entityType) {
      return NextResponse.json({ error: 'entityType is required' }, { status: 400 })
    }

    // Kanal zaten var mı kontrol et
    let query = supabase
      .from('ChatChannel')
      .select('id')
      .eq('companyId', companyId)
      .eq('entityType', entityType)

    if (entityId) {
      query = query.eq('entityId', entityId)
    } else {
      query = query.is('entityId', null)
    }

    const { data: existingChannel } = await query.single()

    if (existingChannel) {
      // Kanal zaten varsa mevcut kanalı döndür
      const { data: channel } = await supabase
        .from('ChatChannel')
        .select('*')
        .eq('id', existingChannel.id)
        .single()

      return NextResponse.json(channel)
    }

    // Yeni kanal oluştur
    const { data: channel, error } = await supabase
      .from('ChatChannel')
      .insert({
        entityType,
        entityId: entityId || null,
        companyId,
        createdBy: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Channel create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(channel)
  } catch (error: any) {
    console.error('Channel create API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

