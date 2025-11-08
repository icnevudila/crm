import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Cache 30 dakika
export const revalidate = 1800

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Tüm istatistikleri paralel çek
    const [
      { count: total },
      { count: active },
      { count: inactive },
      { count: thisMonth },
    ] = await Promise.all([
      // Toplam müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Aktif müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Pasif müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVE')
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
      // Bu ay oluşturulan müşteriler
      (() => {
        let query = supabase
          .from('Customer')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', new Date(new Date().setDate(1)).toISOString())
        if (!isSuperAdmin) query = query.eq('companyId', companyId)
        return query
      })(),
    ])

    return NextResponse.json(
      {
        total: total || 0,
        active: active || 0,
        inactive: inactive || 0,
        thisMonth: thisMonth || 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600, max-age=900',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
}



