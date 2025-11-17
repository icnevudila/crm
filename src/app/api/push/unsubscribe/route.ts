import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()

    // Kullanıcının tüm push subscription'larını sil
    const { error } = await supabase
      .from('PushSubscription')
      .delete()
      .eq('userId', session.user.id)

    if (error) {
      console.error('Push subscription delete error:', error)
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}


