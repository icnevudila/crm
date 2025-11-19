import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'
import webpush from 'web-push'

// VAPID keys - Environment variable'lardan al
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@crm.com'

// VAPID keys ayarlanmışsa webpush'u yapılandır
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushNotificationPayload {
  title: string
  message?: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'normal' | 'high' | 'critical'
  relatedTo?: string
  relatedId?: string
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 503 }
      )
    }

    const body: {
      userId?: string
      payload: PushNotificationPayload
    } = await request.json()

    if (!body.payload?.title) {
      return NextResponse.json(
        { error: 'Payload title is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Push subscription'ları al
    let query = supabase
      .from('PushSubscription')
      .select('endpoint, p256dh, auth')

    // Eğer userId belirtilmişse, sadece o kullanıcının subscription'larını al
    if (body.userId) {
      query = query.eq('userId', body.userId)
    } else {
      // Belirtilmemişse, oturum açan kullanıcının subscription'larını al
      query = query.eq('userId', session.user.id)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Push subscription fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found' },
        { status: 404 }
      )
    }

    // Push notification payload'ı hazırla
    const payload = JSON.stringify({
      title: body.payload.title,
      message: body.payload.message || body.payload.title,
      url: body.payload.url || '/',
      icon: body.payload.icon || '/icon-192x192.png',
      badge: body.payload.badge || '/icon-96x96.png',
      tag: body.payload.tag || `notification-${Date.now()}`,
      type: body.payload.type || 'info',
      priority: body.payload.priority || 'normal',
      relatedTo: body.payload.relatedTo,
      relatedId: body.payload.relatedId,
    })

    // Her subscription'a push gönder
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          )
          return { success: true, endpoint: subscription.endpoint }
        } catch (error: any) {
          // Subscription geçersizse (410 Gone), sil
          if (error.statusCode === 410) {
            await supabase
              .from('PushSubscription')
              .delete()
              .eq('endpoint', subscription.endpoint)
            return { success: false, endpoint: subscription.endpoint, error: 'Subscription expired' }
          }
          return { success: false, endpoint: subscription.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    })
  } catch (error: any) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send push notification' },
      { status: 500 }
    )
  }
}


