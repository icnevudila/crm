import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Finance tablosundan veri çek
    let financeQuery = supabase
      .from('Finance')
      .select('id, type, amount, category, createdAt')
      .gte('createdAt', twelveMonthsAgo.toISOString())
      .order('createdAt', { ascending: true })
      .limit(1000)
    
    if (!isSuperAdmin) {
      financeQuery = financeQuery.eq('companyId', companyId)
    }
    
    const { data: finances, error } = await financeQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Gelir-gider karşılaştırması (Composed Chart için)
    const incomeExpense: Record<string, { income: number; expense: number }> = {}
    // Kategori dağılımı (Pie Chart için)
    const categoryDistribution: Record<string, number> = {}

    finances?.forEach((finance: { type?: string; amount?: number; category?: string; createdAt: string }) => {
      const date = new Date(finance.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const amount = finance.amount || 0
      
      // Gelir-gider karşılaştırması
      if (!incomeExpense[monthKey]) {
        incomeExpense[monthKey] = { income: 0, expense: 0 }
      }
      if (finance.type === 'INCOME') {
        incomeExpense[monthKey].income += amount
      } else if (finance.type === 'EXPENSE') {
        incomeExpense[monthKey].expense += amount
      }

      // Kategori dağılımı
      const category = finance.category || 'Diğer'
      categoryDistribution[category] = (categoryDistribution[category] || 0) + amount
    })

    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!incomeExpense[monthKey]) {
        incomeExpense[monthKey] = { income: 0, expense: 0 }
      }
    }

    return NextResponse.json({
      incomeExpense: Object.keys(incomeExpense)
        .sort()
        .map((month) => ({
          month,
          income: incomeExpense[month].income,
          expense: incomeExpense[month].expense,
        })),
      categoryDistribution: Object.keys(categoryDistribution).map((category) => ({
        name: category,
        value: categoryDistribution[category],
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch financial reports' },
      { status: 500 }
    )
  }
}



