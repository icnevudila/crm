import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getCacheScope, getReportCache, setReportCache } from '@/lib/cache/report-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const scope = getCacheScope(isSuperAdmin, companyId)
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

    const cached = await getReportCache({
      supabase,
      reportType: 'performance',
      scope,
      ttlMinutes: 30,
      forceRefresh,
    })

    if (cached) {
      return NextResponse.json(cached.payload, {
        headers: { 'Cache-Control': 'no-store, must-revalidate', 'x-cache-hit': 'report-cache' },
      })
    }

    // Kullanıcıları çek (monthlyGoal ile)
    let usersQuery = supabase
      .from('User')
      .select('id, name, email, "monthlyGoal", role')
      .order('name', { ascending: true })
      .limit(100)
    
    if (!isSuperAdmin) {
      usersQuery = usersQuery.eq('companyId', companyId)
    }
    
    const { data: users, error: usersError } = await usersQuery

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Son 12 ayın verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Kullanıcı performans metrikleri hesapla
    const userPerformance: Array<{
      userId: string
      userName: string
      totalSales: number
      goalAchievement: number
      averageOrderValue: number
      winRate: number
      dealCount: number
      invoiceCount: number
    }> = []

    for (const user of users || []) {
      // Kullanıcının Deal'larını çek (WON status)
      let dealsQuery = supabase
        .from('Deal')
        .select('id, value, status, stage')
        .eq('assignedTo', user.id)
        .gte('createdAt', twelveMonthsAgo.toISOString())
        .limit(1000)
      
      if (!isSuperAdmin) {
        dealsQuery = dealsQuery.eq('companyId', companyId)
      }
      
      const { data: deals, error: dealsError } = await dealsQuery

      // Kullanıcının Invoice'larını çek (PAID status) - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
      let invoicesQuery = supabase
        .from('Invoice')
        .select('id, totalAmount, status')
        .eq('assignedTo', user.id)
        .eq('status', 'PAID')
        .gte('createdAt', twelveMonthsAgo.toISOString())
        .limit(1000)
      
      if (!isSuperAdmin) {
        invoicesQuery = invoicesQuery.eq('companyId', companyId)
      }
      
      const { data: invoices, error: invoicesError } = await invoicesQuery

      if (dealsError || invoicesError) continue

      // Metrikleri hesapla
      // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
      const totalSales = invoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0
      const wonDeals = deals?.filter(d => d.status === 'WON' || d.stage === 'WON').length || 0
      const totalDeals = deals?.length || 0
      const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0
      const averageOrderValue = invoices && invoices.length > 0 ? totalSales / invoices.length : 0
      const monthlyGoal = user.monthlyGoal || 0
      const goalAchievement = monthlyGoal > 0 ? (totalSales / monthlyGoal) * 100 : 0

      userPerformance.push({
        userId: user.id,
        userName: user.name || user.email || 'Unknown',
        totalSales,
        goalAchievement: Math.min(goalAchievement, 200), // Max %200 göster
        averageOrderValue,
        winRate,
        dealCount: totalDeals,
        invoiceCount: invoices?.length || 0,
      })
    }

    // Aylık hedef vs gerçekleşme trendi
    const monthlyGoalTrend: Record<string, { goal: number; actual: number }> = {}
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Bu ay için toplam hedef ve gerçekleşme
      let totalGoal = 0
      let totalActual = 0

      for (const user of users || []) {
        const monthlyGoal = user.monthlyGoal || 0
        totalGoal += monthlyGoal

        // Bu ay için kullanıcının PAID invoice'larını çek
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

        let monthInvoicesQuery = supabase
          .from('Invoice')
          .select('totalAmount')
          .eq('assignedTo', user.id)
          .eq('status', 'PAID')
          .gte('createdAt', monthStart.toISOString())
          .lte('createdAt', monthEnd.toISOString())
          .limit(1000)
        
        if (!isSuperAdmin) {
          monthInvoicesQuery = monthInvoicesQuery.eq('companyId', companyId)
        }
        
        const { data: monthInvoices } = await monthInvoicesQuery
        // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
        const monthActual = monthInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0
        totalActual += monthActual
      }

      monthlyGoalTrend[monthKey] = {
        goal: totalGoal,
        actual: totalActual,
      }
    }

    // En iyi performans gösteren kullanıcılar (top 5)
    const topPerformers = [...userPerformance]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map((user, index) => ({
        name: user.userName,
        value: user.totalSales,
        rank: index + 1,
      }))

    const payload = {
      userPerformance: userPerformance.map((up) => ({
        name: up.userName,
        totalSales: up.totalSales,
        goalAchievement: Math.round(up.goalAchievement * 100) / 100,
        averageOrderValue: Math.round(up.averageOrderValue * 100) / 100,
        winRate: Math.round(up.winRate * 100) / 100,
        dealCount: up.dealCount,
        invoiceCount: up.invoiceCount,
      })),
      monthlyGoalTrend: Object.keys(monthlyGoalTrend)
        .sort()
        .map((month) => ({
          month,
          goal: monthlyGoalTrend[month].goal,
          actual: monthlyGoalTrend[month].actual,
        })),
      topPerformers,
      teamPerformance: {
        totalSales: userPerformance.reduce((sum, up) => sum + up.totalSales, 0),
        averageGoalAchievement:
          userPerformance.length > 0
            ? userPerformance.reduce((sum, up) => sum + up.goalAchievement, 0) / userPerformance.length
            : 0,
        totalUsers: userPerformance.length,
      },
    }

    await setReportCache({
      supabase,
      reportType: 'performance',
      scope,
      payload,
    })

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store, must-revalidate', 'x-cache-hit': 'miss' },
    })
  } catch (error: any) {
    console.error('Error fetching performance reports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch performance reports' },
      { status: 500 }
    )
  }
}



