import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * GET /api/streaks
 * Kullanıcının streak bilgilerini getirir
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const companyId = session.user.companyId
    const supabase = getSupabase()

    // Kullanıcının streak bilgilerini getir veya oluştur
    let { data: streak, error } = await supabase
      .from('UserStreak')
      .select('*')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .single()

    // Streak kaydı yoksa oluştur
    if (error && error.code === 'PGRST116') {
      const { data: newStreak, error: insertError } = await supabase
        .from('UserStreak')
        .insert({
          userId,
          companyId,
          dailyStreak: 0,
          weeklyStreak: 0,
          monthlyStreak: 0,
          lastActivityDate: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (insertError) {
        console.error('Streak create error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      streak = newStreak
    } else if (error) {
      console.error('Streak fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(streak || {
      dailyStreak: 0,
      weeklyStreak: 0,
      monthlyStreak: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
    })
  } catch (error: any) {
    console.error('Streaks API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

