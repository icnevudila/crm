import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'monthly' // daily, weekly, monthly, yearly

    // Günlük trend (son 30 gün)
    const dailyTrend: Record<string, { sales: number; customers: number; deals: number }> = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Haftalık karşılaştırma (son 12 hafta)
    const weeklyComparison: Record<string, { sales: number; customers: number; deals: number }> = {}
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84) // 12 hafta = 84 gün

    // Aylık büyüme (son 12 ay)
    const monthlyGrowth: Record<string, { sales: number; customers: number; deals: number; growth: number }> = {}
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Yıllık özet (son 3 yıl)
    const yearlySummary: Record<string, { sales: number; customers: number; deals: number; invoices: number }> = {}
    const threeYearsAgo = new Date()
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

    // Invoice'ları çek (PAID status) - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
    // DÜZELTME: Pagination ekle - tüm invoice'ları çekmek için
    let allInvoices: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      let invoicesQuery = supabase
        .from('Invoice')
        .select('totalAmount, status, createdAt, companyId')
        .eq('status', 'PAID')
        .gte('createdAt', threeYearsAgo.toISOString())
        .order('createdAt', { ascending: true })
        .range(from, from + pageSize - 1)
      
      if (!isSuperAdmin) {
        invoicesQuery = invoicesQuery.eq('companyId', companyId)
      }
      
      const { data: invoices, error: invoicesError } = await invoicesQuery

      if (invoicesError) {
        return NextResponse.json({ error: invoicesError.message }, { status: 500 })
      }

      if (invoices && invoices.length > 0) {
        allInvoices = [...allInvoices, ...invoices]
        from += pageSize
        hasMore = invoices.length === pageSize // Eğer tam sayfa geldiyse devam et
      } else {
        hasMore = false
      }
    }

    const invoices = allInvoices

    // Customer'ları çek
    let customersQuery = supabase
      .from('Customer')
      .select('id, createdAt, companyId')
      .gte('createdAt', threeYearsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(5000)
    
    if (!isSuperAdmin) {
      customersQuery = customersQuery.eq('companyId', companyId)
    }
    
    const { data: customers, error: customersError } = await customersQuery

    // Deal'ları çek
    let dealsQuery = supabase
      .from('Deal')
      .select('id, value, createdAt')
      .gte('createdAt', threeYearsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(5000)
    
    if (!isSuperAdmin) {
      dealsQuery = dealsQuery.eq('companyId', companyId)
    }
    
    const { data: deals, error: dealsError } = await dealsQuery

    if (customersError || dealsError) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    // Günlük trend hesapla (son 30 gün)
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)

      const dayInvoices = invoices?.filter(
        (inv) => {
          const invDate = new Date(inv.createdAt)
          return invDate >= dayStart && invDate <= dayEnd
        }
      ) || []
      
      const dayCustomers = customers?.filter(
        (cust) => {
          const custDate = new Date(cust.createdAt)
          return custDate >= dayStart && custDate <= dayEnd
        }
      ) || []
      
      const dayDeals = deals?.filter(
        (deal) => {
          const dealDate = new Date(deal.createdAt)
          return dealDate >= dayStart && dealDate <= dayEnd
        }
      ) || []

      dailyTrend[dayKey] = {
        // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
        sales: dayInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        customers: dayCustomers.length,
        deals: dayDeals.length,
      }
    }

    // Haftalık karşılaştırma hesapla (son 12 hafta)
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - (i * 7))
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Haftanın başı (Pazar)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59)

      const weekKey = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)) / 7)).padStart(2, '0')}`

      const weekInvoices = invoices?.filter(
        (inv) => {
          const invDate = new Date(inv.createdAt)
          return invDate >= weekStart && invDate <= weekEnd
        }
      ) || []
      
      const weekCustomers = customers?.filter(
        (cust) => {
          const custDate = new Date(cust.createdAt)
          return custDate >= weekStart && custDate <= weekEnd
        }
      ) || []
      
      const weekDeals = deals?.filter(
        (deal) => {
          const dealDate = new Date(deal.createdAt)
          return dealDate >= weekStart && dealDate <= weekEnd
        }
      ) || []

      weeklyComparison[weekKey] = {
        // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
        sales: weekInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        customers: weekCustomers.length,
        deals: weekDeals.length,
      }
    }

    // Aylık büyüme hesapla (son 12 ay)
    let previousMonthSales = 0
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthInvoices = invoices?.filter(
        (inv) => {
          const invDate = new Date(inv.createdAt)
          return invDate >= monthStart && invDate <= monthEnd
        }
      ) || []
      
      const monthCustomers = customers?.filter(
        (cust) => {
          const custDate = new Date(cust.createdAt)
          return custDate >= monthStart && custDate <= monthEnd
        }
      ) || []
      
      const monthDeals = deals?.filter(
        (deal) => {
          const dealDate = new Date(deal.createdAt)
          return dealDate >= monthStart && dealDate <= monthEnd
        }
      ) || []

      // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
      const monthSales = monthInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
      const growth = previousMonthSales > 0 ? ((monthSales - previousMonthSales) / previousMonthSales) * 100 : 0

      monthlyGrowth[monthKey] = {
        sales: monthSales,
        customers: monthCustomers.length,
        deals: monthDeals.length,
        growth: Math.round(growth * 100) / 100,
      }

      previousMonthSales = monthSales
    }

    // Yıllık özet hesapla (son 3 yıl)
    for (let i = 2; i >= 0; i--) {
      const date = new Date()
      date.setFullYear(date.getFullYear() - i)
      const yearKey = `${date.getFullYear()}`

      const yearStart = new Date(date.getFullYear(), 0, 1)
      const yearEnd = new Date(date.getFullYear(), 11, 31, 23, 59, 59)

      const yearInvoices = invoices?.filter(
        (inv) => {
          const invDate = new Date(inv.createdAt)
          return invDate >= yearStart && invDate <= yearEnd
        }
      ) || []
      
      const yearCustomers = customers?.filter(
        (cust) => {
          const custDate = new Date(cust.createdAt)
          return custDate >= yearStart && custDate <= yearEnd
        }
      ) || []
      
      const yearDeals = deals?.filter(
        (deal) => {
          const dealDate = new Date(deal.createdAt)
          return dealDate >= yearStart && dealDate <= yearEnd
        }
      ) || []

      yearlySummary[yearKey] = {
        // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
        sales: yearInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        customers: yearCustomers.length,
        deals: yearDeals.length,
        invoices: yearInvoices.length,
      }
    }

    return NextResponse.json(
      {
        dailyTrend: Object.keys(dailyTrend)
          .sort()
          .map((day) => ({
            day,
            sales: dailyTrend[day].sales,
            customers: dailyTrend[day].customers,
            deals: dailyTrend[day].deals,
          })),
        weeklyComparison: Object.keys(weeklyComparison)
          .sort()
          .map((week) => ({
            week,
            sales: weeklyComparison[week].sales,
            customers: weeklyComparison[week].customers,
            deals: weeklyComparison[week].deals,
          })),
        monthlyGrowth: Object.keys(monthlyGrowth)
          .sort()
          .map((month) => ({
            month,
            sales: monthlyGrowth[month].sales,
            customers: monthlyGrowth[month].customers,
            deals: monthlyGrowth[month].deals,
            growth: monthlyGrowth[month].growth,
          })),
        yearlySummary: Object.keys(yearlySummary)
          .sort()
          .map((year) => ({
            year,
            sales: yearlySummary[year].sales,
            customers: yearlySummary[year].customers,
            deals: yearlySummary[year].deals,
            invoices: yearlySummary[year].invoices,
          })),
      },
      {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      }
    )
  } catch (error: any) {
    console.error('Error fetching time-based reports:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time-based reports' },
      { status: 500 }
    )
  }
}



