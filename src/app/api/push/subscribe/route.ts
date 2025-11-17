import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
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

    const body: PushSubscriptionData = await request.json()

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // PushSubscription tablosu var mı kontrol et, yoksa oluştur
    // Önce mevcut subscription'ı kontrol et
    const { data: existingSubscription } = await supabase
      .from('PushSubscription')
      .select('id')
      .eq('userId', session.user.id)
      .eq('endpoint', body.endpoint)
      .maybeSingle()

    if (existingSubscription) {
      // Mevcut subscription'ı güncelle
      const { error } = await supabase
        .from('PushSubscription')
        .update({
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id)

      if (error) {
        console.error('Push subscription update error:', error)
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, updated: true })
    }

    // Yeni subscription oluştur
    const { error } = await supabase
      .from('PushSubscription')
      .insert({
        userId: session.user.id,
        companyId: session.user.companyId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      })

    if (error) {
      // Tablo yoksa oluştur (migration henüz çalıştırılmamış olabilir)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[Push] PushSubscription tablosu bulunamadı. Migration çalıştırılmalı.')
        return NextResponse.json(
          { error: 'PushSubscription table not found. Please run migration.' },
          { status: 503 }
        )
      }

      console.error('Push subscription insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Push subscription error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to subscribe' },
      { status: 500 }
    )
  }
}


