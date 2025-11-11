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

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID required' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // ActivityLog'dan comment'leri çek (action = 'COMMENT')
    let commentQuery = supabase
      .from('ActivityLog')
      .select(`
        *,
        User (
          id,
          name,
          email
        )
      `)
      .eq('entity', entityType)
      .eq('action', 'COMMENT')
      .eq('meta->>entityId', entityId)
      .order('createdAt', { ascending: false })
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      commentQuery = commentQuery.eq('companyId', companyId)
    }
    
    const { data: comments, error } = await commentQuery

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

    // ÖNEMLİ: Ticket'a yorum eklendiğinde müşteriye ve destek ekibine bildirim gönder
    if (entityType === 'Ticket') {
      try {
        // Ticket bilgilerini çek
        const { data: ticket } = await supabase
          .from('Ticket')
          .select('*, Customer(id, name, email)')
          .eq('id', entityId)
          .single()

        if (ticket) {
          const ticketSubject = (ticket as any).subject || 'Destek Talebi'
          const commentPreview = comment.length > 100 ? comment.substring(0, 100) + '...' : comment
          
          // Yorumu ekleyen kullanıcı bilgisini çek
          const { data: commentUser } = await supabase
            .from('User')
            .select('id, role')
            .eq('id', session.user.id)
            .single()

          const isSupportTeam = commentUser?.role && ['ADMIN', 'SALES', 'SUPER_ADMIN'].includes(commentUser.role)

          // Eğer destek ekibi yorum eklediyse → Müşteriye bildirim
          if (isSupportTeam && (ticket as any).Customer) {
            // Müşteri User tablosunda kayıtlı mı kontrol et
            const { data: customerUser } = await supabase
              .from('User')
              .select('id')
              .eq('email', (ticket as any).Customer.email)
              .eq('companyId', session.user.companyId)
              .maybeSingle()

            if (customerUser) {
              // Müşteri User tablosunda kayıtlıysa bildirim gönder
              const { createNotification } = await import('@/lib/notification-helper')
              await createNotification({
                userId: customerUser.id,
                companyId: session.user.companyId,
                title: 'Talebinize Yeni Yanıt Eklendi',
                message: `${ticketSubject} talebinize yeni bir yanıt eklendi: "${commentPreview}"`,
                type: 'info',
                relatedTo: 'Ticket',
                relatedId: entityId,
              })
            }
            // TODO: E-posta bildirimi eklenebilir (müşteri User tablosunda kayıtlı değilse)
          }
          // Eğer müşteri yorum eklediyse → Destek ekibine bildirim
          else if (!isSupportTeam) {
            const { createNotificationForRole } = await import('@/lib/notification-helper')
            await createNotificationForRole({
              companyId: session.user.companyId,
              role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
              title: 'Müşteri Talebinize Yanıt Verdi',
              message: `${ticketSubject} talebine müşteri yanıt verdi: "${commentPreview}"`,
              type: 'info',
              relatedTo: 'Ticket',
              relatedId: entityId,
            })
          }
        }
      } catch (notificationError) {
        // Bildirim hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Comment notification error:', notificationError)
        }
      }
    }

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}

