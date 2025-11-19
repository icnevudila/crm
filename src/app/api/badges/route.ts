import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'

/**
 * GET /api/badges
 * Kullanıcının rozetlerini getirir
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

    // Kullanıcının rozetlerini getir
    const { data: badges, error } = await supabase
      .from('UserBadge')
      .select('*')
      .eq('userId', userId)
      .eq('companyId', companyId)
      .order('earnedAt', { ascending: false })

    if (error) {
      console.error('Badges fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(badges || [])
  } catch (error: any) {
    console.error('Badges API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

