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

    // Tüm sales quota'ları çek - veritabanı alan adlarını kullan
    let query = supabase
      .from('SalesQuota')
      .select('id, period, targetAmount, achievedAmount, createdAt, companyId')
      .order('createdAt', { ascending: false })
    
    // ÖNCE companyId filtresi (SuperAdmin değilse MUTLAKA filtrele)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: quotas, error } = await query
    
    if (error) {
      console.error('[Stats Sales Quotas API] Quota data fetch error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch sales quota stats' },
        { status: 500 }
      )
    }
    
    // Null check
    if (!quotas || !Array.isArray(quotas)) {
      console.error('[Stats Sales Quotas API] Quotas is not an array:', quotas)
      return NextResponse.json(
        { error: 'Invalid quotas data' },
        { status: 500 }
      )
    }
    
    // JavaScript'te say
    const monthlyCount = quotas.filter((q: any) => q.period === 'MONTHLY').length
    const quarterlyCount = quotas.filter((q: any) => q.period === 'QUARTERLY').length
    const yearlyCount = quotas.filter((q: any) => q.period === 'YEARLY').length
    const totalCount = quotas.length
    
    // Başarı oranları - hesaplanacak
    const achievedCount = quotas.filter((q: any) => {
      const target = q.targetAmount || 0
      const achieved = q.achievedAmount || 0
      const achievement = target > 0 ? (achieved / target) * 100 : 0
      return achievement >= 100
    }).length
    const nearTargetCount = quotas.filter((q: any) => {
      const target = q.targetAmount || 0
      const achieved = q.achievedAmount || 0
      const achievement = target > 0 ? (achieved / target) * 100 : 0
      return achievement >= 80 && achievement < 100
    }).length
    const atRiskCount = quotas.filter((q: any) => {
      const target = q.targetAmount || 0
      const achieved = q.achievedAmount || 0
      const achievement = target > 0 ? (achieved / target) * 100 : 0
      return achievement < 80
    }).length
    
    // Bu ay oluşturulan kotalar
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = quotas.filter((q: any) => {
      if (!q.createdAt) return false
      const quotaDate = new Date(q.createdAt)
      return quotaDate >= new Date(firstDayOfMonth)
    }).length
    
    // Toplam hedef ve gerçekleşen gelir - veritabanı alan adlarını kullan
    const totalTargetRevenue = quotas.reduce((sum: number, quota: any) => {
      const target = quota.targetAmount || 0
      return sum + (typeof target === 'string' ? parseFloat(target) || 0 : target)
    }, 0) || 0
    
    const totalActualRevenue = quotas.reduce((sum: number, quota: any) => {
      const actual = quota.achievedAmount || 0
      return sum + (typeof actual === 'string' ? parseFloat(actual) || 0 : actual)
    }, 0) || 0
    
    // Ortalama başarı oranı - hesaplanacak
    const avgAchievement = totalCount > 0
      ? quotas.reduce((sum: number, quota: any) => {
          const target = quota.targetAmount || 0
          const achieved = quota.achievedAmount || 0
          const achievement = target > 0 ? (achieved / target) * 100 : 0
          return sum + achievement
        }, 0) / totalCount
      : 0

    return NextResponse.json(
      {
        total: totalCount,
        monthly: monthlyCount,
        quarterly: quarterlyCount,
        yearly: yearlyCount,
        achieved: achievedCount,
        nearTarget: nearTargetCount,
        atRisk: atRiskCount,
        totalTargetRevenue,
        totalActualRevenue,
        avgAchievement: Math.round(avgAchievement * 10) / 10, // 1 ondalık basamak
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
      { error: error.message || 'Failed to fetch sales quota stats' },
      { status: 500 }
    )
  }
}

