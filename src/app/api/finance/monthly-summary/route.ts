import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Aylık gelir/gider özeti
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM formatında (örn: 2024-01)
    const year = searchParams.get('year') // YYYY formatında

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Tarih aralığını belirle
    let startDate: Date
    let endDate: Date

    if (month) {
      // Belirli bir ay
      const [yearStr, monthStr] = month.split('-')
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
      endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0)
    } else if (year) {
      // Belirli bir yıl
      startDate = new Date(parseInt(year), 0, 1)
      endDate = new Date(parseInt(year), 11, 31)
    } else {
      // Bu ay (varsayılan)
      const today = new Date()
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }

    // Gelir ve gider kayıtlarını çek
    let financeQuery = supabase
      .from('Finance')
      .select('type, amount, category, createdAt')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
    
    if (!isSuperAdmin) {
      financeQuery = financeQuery.eq('companyId', companyId)
    }

    const { data: financeRecords, error: financeError } = await financeQuery

    if (financeError) {
      return NextResponse.json(
        { error: financeError.message || 'Finans kayıtları getirilemedi' },
        { status: 500 }
      )
    }

    // Hesaplamalar
    const totalIncome = (financeRecords || [])
      .filter((f: any) => f.type === 'INCOME')
      .reduce((sum: number, f: any) => sum + (f.amount || 0), 0)

    const totalExpense = (financeRecords || [])
      .filter((f: any) => f.type === 'EXPENSE')
      .reduce((sum: number, f: any) => sum + (f.amount || 0), 0)

    const netProfit = totalIncome - totalExpense

    // Kategori bazlı gelir/gider
    const incomeByCategory: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}

    financeRecords?.forEach((f: any) => {
      const category = f.category || 'OTHER'
      if (f.type === 'INCOME') {
        incomeByCategory[category] = (incomeByCategory[category] || 0) + (f.amount || 0)
      } else {
        expenseByCategory[category] = (expenseByCategory[category] || 0) + (f.amount || 0)
      }
    })

    // Günlük gelir/gider (tarih bazlı)
    const dailyIncome: Record<string, number> = {}
    const dailyExpense: Record<string, number> = {}

    financeRecords?.forEach((f: any) => {
      const date = new Date(f.createdAt).toISOString().split('T')[0]
      if (f.type === 'INCOME') {
        dailyIncome[date] = (dailyIncome[date] || 0) + (f.amount || 0)
      } else {
        dailyExpense[date] = (dailyExpense[date] || 0) + (f.amount || 0)
      }
    })

    return NextResponse.json({
      message: 'Aylık finans özeti oluşturuldu',
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      totals: {
        income: totalIncome,
        expense: totalExpense,
        netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00',
      },
      byCategory: {
        income: incomeByCategory,
        expense: expenseByCategory,
      },
      daily: {
        income: dailyIncome,
        expense: dailyExpense,
      },
      recordCount: financeRecords?.length || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Aylık finans özeti oluşturulamadı' },
      { status: 500 }
    )
  }
}












