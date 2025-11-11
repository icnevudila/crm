import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Agresif cache - 30 dakika cache (aktivite logları için yeterli)
export const revalidate = 1800

export async function GET() {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Recent Activities API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    
    // Güvenlik: companyId yoksa hata döndür
    if (!companyId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized - companyId required' }, { status: 401 })
    }
    
    const supabase = getSupabaseWithServiceRole()

    // Son 20 aktivite logunu çek - OPTİMİZE: JOIN kaldırıldı - çok yavaş
    let activitiesQuery = supabase
      .from('ActivityLog')
      .select('id, entity, action, description, createdAt, userId, companyId')
      .order('createdAt', { ascending: false })
      .limit(20) // Son 20 aktivite
    
    // Normal kullanıcı: kendi companyId'sine göre filtrele
    // SuperAdmin: tüm firmaları göster
    if (!isSuperAdmin) {
      activitiesQuery = activitiesQuery.eq('companyId', companyId)
    }
    
    const { data: activities, error } = await activitiesQuery

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Recent activities API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch recent activities' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { activities: activities || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch recent activities' },
      { status: 500 }
    )
  }
}

