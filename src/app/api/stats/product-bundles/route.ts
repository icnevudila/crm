import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST/PUT sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    // SuperAdmin kontrolü - SuperAdmin companyId olmadan da erişebilir
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    if (!session?.user || (!session?.user?.companyId && !isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    // Tüm product bundle'ları çek
    let query = supabase
      .from('ProductBundle')
      .select('id, status, totalPrice, finalPrice, discount, createdAt, companyId')
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse MUTLAKA filtrele)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: bundles, error } = await query
    
    if (error) {
      console.error('[Stats Product Bundles API] Bundle data fetch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch product bundle stats' },
        { status: 500 }
      )
    }
    
    // Null check
    if (!bundles || !Array.isArray(bundles)) {
      console.error('[Stats Product Bundles API] Bundles is not an array:', bundles)
      return NextResponse.json(
        { error: 'Invalid bundles data' },
        { status: 500 }
      )
    }
    
    // JavaScript'te say
    const totalCount = bundles.length
    const activeCount = bundles.filter((b: any) => b.status === 'ACTIVE').length
    const inactiveCount = bundles.filter((b: any) => b.status === 'INACTIVE').length
    
    // Toplam değerler
    const totalValue = bundles.reduce((sum: number, bundle: any) => {
      const value = bundle.totalPrice || 0
      return sum + (typeof value === 'string' ? parseFloat(value) || 0 : value)
    }, 0) || 0
    
    const finalValue = bundles.reduce((sum: number, bundle: any) => {
      const value = bundle.finalPrice || bundle.totalPrice || 0
      return sum + (typeof value === 'string' ? parseFloat(value) || 0 : value)
    }, 0) || 0
    
    const totalDiscount = bundles.reduce((sum: number, bundle: any) => {
      const discount = bundle.discount || 0
      return sum + (typeof discount === 'string' ? parseFloat(discount) || 0 : discount)
    }, 0) || 0
    
    // Ortalama değerler
    const avgTotalPrice = totalCount > 0 ? totalValue / totalCount : 0
    const avgFinalPrice = totalCount > 0 ? finalValue / totalCount : 0
    const avgDiscount = totalCount > 0 ? totalDiscount / totalCount : 0
    
    // Bu ay oluşturulan bundle'lar
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = bundles.filter((b: any) => {
      if (!b.createdAt) return false
      const bundleDate = new Date(b.createdAt)
      return bundleDate >= new Date(firstDayOfMonth)
    }).length

    return NextResponse.json(
      {
        total: totalCount,
        active: activeCount,
        inactive: inactiveCount,
        totalValue,
        finalValue,
        totalDiscount,
        avgTotalPrice: Math.round(avgTotalPrice * 100) / 100,
        avgFinalPrice: Math.round(avgFinalPrice * 100) / 100,
        avgDiscount: Math.round(avgDiscount * 100) / 100,
        thisMonth: thisMonthCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product bundle stats' },
      { status: 500 }
    )
  }
}




