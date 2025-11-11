import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Cache kaldırıldı - multi-tenant güvenlik için fresh data gerekli
export const revalidate = 0
export const dynamic = 'force-dynamic'

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

    // CRITICAL: Her zaman log ekle - 403 hatasını debug etmek için
    console.log('Customer Stats API - Request:', {
      companyId,
      isSuperAdmin,
      timestamp: new Date().toISOString(),
    })

    // CRITICAL: Önce test query yap - müşteri var mı kontrol et
    let testQuery = supabase.from('Customer').select('id, name, status, companyId', { count: 'exact' }).limit(5)
    if (!isSuperAdmin) {
      testQuery = testQuery.eq('companyId', companyId)
    }
    const { data: testCustomers, count: testCount, error: testError } = await testQuery
    
    // CRITICAL: Multi-tenant güvenlik kontrolü - test query'deki müşterilerin companyId'lerini kontrol et
    if (!isSuperAdmin && testCustomers && testCustomers.length > 0) {
      const wrongCompanyCustomers = testCustomers.filter((c: any) => c.companyId !== companyId)
      if (wrongCompanyCustomers.length > 0) {
        console.error('Customer Stats API - SECURITY ERROR: Found customers from different company!', {
          wrongCompanyCustomers: wrongCompanyCustomers.map((c: any) => ({ id: c.id, name: c.name, companyId: c.companyId })),
          expectedCompanyId: companyId,
        })
        // Güvenlik hatası - yanlış companyId'ye sahip müşterileri filtrele
        // Bu durumda query'ler yanlış çalışıyor demektir
      }
    }
    
    console.log('Customer Stats API - Test query:', {
      testCount,
      testCustomers: testCustomers?.map((c: any) => ({ id: c.id, name: c.name, status: c.status, companyId: c.companyId })),
      testError,
      companyId,
      isSuperAdmin,
    })

    // Tüm istatistikleri paralel çek
    const [
      totalResult,
      activeResult,
      inactiveResult,
      thisMonthResult,
    ] = await Promise.all([
      // Toplam müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true })
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Aktif müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Pasif müşteri sayısı
      (() => {
        let query = supabase.from('Customer').select('*', { count: 'exact', head: true }).eq('status', 'INACTIVE')
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
      // Bu ay oluşturulan müşteriler
      (() => {
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        let query = supabase
          .from('Customer')
          .select('*', { count: 'exact', head: true })
          .gte('createdAt', firstDayOfMonth)
        if (!isSuperAdmin) {
          query = query.eq('companyId', companyId)
        }
        return query
      })(),
    ])

    // Hata kontrolü
    if (totalResult.error) {
      console.error('Customer Stats API - Total query error:', totalResult.error)
    }
    if (activeResult.error) {
      console.error('Customer Stats API - Active query error:', activeResult.error)
    }
    if (inactiveResult.error) {
      console.error('Customer Stats API - Inactive query error:', inactiveResult.error)
    }
    if (thisMonthResult.error) {
      console.error('Customer Stats API - ThisMonth query error:', thisMonthResult.error)
    }

    const total = totalResult.count || 0
    const active = activeResult.count || 0
    const inactive = inactiveResult.count || 0
    const thisMonth = thisMonthResult.count || 0

    // Debug: Query sonuçlarını logla
    console.log('Customer Stats API - Query results:', {
      totalResult: { count: total, error: totalResult.error },
      activeResult: { count: active, error: activeResult.error },
      inactiveResult: { count: inactive, error: inactiveResult.error },
      thisMonthResult: { count: thisMonth, error: thisMonthResult.error },
      companyId,
    })

    const stats = {
      total: total || 0,
      active: active || 0,
      inactive: inactive || 0,
      thisMonth: thisMonth || 0,
    }

    // CRITICAL: Her zaman log ekle - 403 hatasını debug etmek için
    console.log('Customer Stats API - Response:', {
      stats,
      companyId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer stats' },
      { status: 500 }
    )
  }
}



