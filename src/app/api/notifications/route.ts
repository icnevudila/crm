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
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Önce tablo var mı kontrol et
    try {
      // Supabase database type tanımları eksik, Notification tablosu için type tanımı yok
      let query = (supabase
        .from('Notification') as any)
        .select('id, title, message, type, link, "relatedTo", "relatedId", "isRead", "createdAt", "userId", "companyId", priority')
        .order('createdAt', { ascending: false })
        .limit(limit)

      // SuperAdmin tüm bildirimleri görebilir, diğer kullanıcılar sadece kendi bildirimlerini
      if (!isSuperAdmin) {
        query = query.eq('userId', session.user.id)
      }

      // isRead kolonunu kullan (yeni migration'da isRead var)
      if (read === 'true') {
        query = query.eq('isRead', true)
      } else if (read === 'false') {
        query = query.eq('isRead', false)
      }

      const { data, error } = await query

      if (error) {
        // Detaylı hata loglama (development için)
        console.error('[Notifications API] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          isSuperAdmin,
          userId: session.user.id,
        })

        // Tablo yoksa veya kolon yoksa boş array döndür (sistem henüz kurulmamış olabilir)
        // PGRST205 = PostgREST table not found error (PostgREST schema cache güncel değil)
        if (
          error.code === 'PGRST205' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist') ||
          error.message?.includes('column') ||
          error.code === '42P01'
        ) {
          console.warn('[Notifications API] PostgREST schema cache outdated. Table exists but PostgREST cannot see it yet. Returning empty array.')
          console.warn('[Notifications API] Solution: Wait a few seconds for PostgREST to refresh its schema cache, or restart Supabase.')
          return NextResponse.json([])
        }
        
        console.error('[Notifications API] Unexpected error:', error)
        return NextResponse.json(
          { 
            error: 'Failed to fetch notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 500 }
        )
      }

      // Veriyi normalize et
      const normalizedData = (data || []).map((notification: any) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        link: notification.link,
        relatedTo: notification.relatedTo,
        relatedId: notification.relatedId,
        isRead: notification.isRead !== undefined ? notification.isRead : false,
        createdAt: notification.createdAt,
        priority: notification.priority || 'normal',
      }))

      // PERFORMANS OPTİMİZASYONU: Cache headers - 30 saniye cache
      // Bildirimler sık güncellenir ama çok fazla request olmamalı
      // stale-while-revalidate ile eski veri gösterilirken arka planda yenilenir
      return NextResponse.json(normalizedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60, max-age=15',
          'CDN-Cache-Control': 'public, s-maxage=30',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
        },
      })
    } catch (tableError: any) {
      // Tablo yoksa boş array döndür
      console.warn('Notification table access error:', tableError)
      return NextResponse.json([])
    }
  } catch (error: any) {
    console.error('Notification API error:', error)
    // Hata durumunda boş array döndür (sistem henüz kurulmamış olabilir)
    return NextResponse.json([])
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


