import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * GET /api/streaks/leaderboard
 * Streak liderlik tablosunu getirir
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companyId = session.user.companyId
    const supabase = getSupabase()

    // Streak liderlik tablosu - Günlük streak'e göre sırala
    const { data: leaderboard, error } = await supabase
      .from('UserStreak')
      .select(`
        dailyStreak,
        weeklyStreak,
        monthlyStreak,
        User:userId (
          id,
          name,
          email
        )
      `)
      .eq('companyId', companyId)
      .order('dailyStreak', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Leaderboard fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // User bilgilerini düzleştir
    const formattedLeaderboard = leaderboard?.map((item: any) => ({
      userId: item.User?.id,
      userName: item.User?.name || item.User?.email,
      dailyStreak: item.dailyStreak || 0,
      weeklyStreak: item.weeklyStreak || 0,
      monthlyStreak: item.monthlyStreak || 0,
    })) || []

    return NextResponse.json(formattedLeaderboard)
  } catch (error: any) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

