import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    const { searchParams } = new URL(request.url)
    const reportModule = searchParams.get('module') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')

    const supabase = getSupabaseWithServiceRole()

    let reports: any[] = []

    // ActivityLog'dan raporları çek - OPTİMİZE: Limit ve sadece gerekli alanlar
    let query = supabase
      .from('ActivityLog')
      .select('id, entity, action, description, createdAt, userId')
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    // SuperAdmin değilse MUTLAKA companyId filtresi uygula
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Tarih filtresi
    if (startDate) {
      query = query.gte('createdAt', startDate)
    }
    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    // Modül filtresi
    if (reportModule && reportModule !== 'all') {
      query = query.eq('entity', reportModule)
    }

    // Kullanıcı filtresi
    if (userId) {
      query = query.eq('userId', userId)
    }

    const { data: activities, error } = await query

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Reports API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    reports = activities || []

    // ULTRA AGRESİF cache headers - 5 dakika cache
    return NextResponse.json(
      { reports },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=180',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}


