import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { createNotificationForRole } from '@/lib/notification-helper'

// Bütçe aşımı kontrolü ve uyarı
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Bu ayın giderlerini hesapla
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    let expenseQuery = supabase
      .from('Finance')
      .select('amount, category')
      .eq('type', 'EXPENSE')
      .gte('createdAt', firstDayOfMonth.toISOString())
      .lte('createdAt', lastDayOfMonth.toISOString())
    
    if (!isSuperAdmin) {
      expenseQuery = expenseQuery.eq('companyId', companyId)
    }

    const { data: expenses, error: expenseError } = await expenseQuery

    if (expenseError) {
      return NextResponse.json(
        { error: expenseError.message || 'Failed to fetch expenses' },
        { status: 500 }
      )
    }

    // Toplam gider hesapla
    const totalExpense = (expenses || []).reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)

    // Kategori bazlı gider hesapla
    const categoryExpenses: Record<string, number> = {}
    expenses?.forEach((exp: any) => {
      const category = exp.category || 'OTHER'
      categoryExpenses[category] = (categoryExpenses[category] || 0) + (exp.amount || 0)
    })

    // Bütçe limitleri (şu an hardcoded, gelecekte Company veya User tablosuna eklenebilir)
    const budgetLimits: Record<string, number> = {
      FUEL: 5000, // Aylık yakıt bütçesi
      ACCOMMODATION: 10000, // Aylık konaklama bütçesi
      FOOD: 3000, // Aylık yemek bütçesi
      TRANSPORT: 2000, // Aylık ulaşım bütçesi
      OFFICE: 5000, // Aylık ofis giderleri bütçesi
      MARKETING: 15000, // Aylık pazarlama bütçesi
      TOTAL: 50000, // Toplam aylık bütçe
    }

    // Bütçe aşımı kontrolü
    const alerts: any[] = []
    
    // Toplam bütçe kontrolü
    if (totalExpense > budgetLimits.TOTAL) {
      const overAmount = totalExpense - budgetLimits.TOTAL
      const percentage = ((totalExpense / budgetLimits.TOTAL) * 100).toFixed(1)
      
      alerts.push({
        type: 'TOTAL_BUDGET',
        severity: overAmount > budgetLimits.TOTAL * 0.2 ? 'critical' : 'warning',
        message: `Toplam aylık bütçe aşıldı! ${formatCurrency(totalExpense)} / ${formatCurrency(budgetLimits.TOTAL)} (${percentage}%)`,
        overAmount,
        percentage: parseFloat(percentage),
      })
    }

    // Kategori bazlı bütçe kontrolü
    Object.entries(categoryExpenses).forEach(([category, amount]) => {
      const limit = budgetLimits[category]
      if (limit && amount > limit) {
        const overAmount = amount - limit
        const percentage = ((amount / limit) * 100).toFixed(1)
        
        alerts.push({
          type: 'CATEGORY_BUDGET',
          category,
          severity: overAmount > limit * 0.2 ? 'critical' : 'warning',
          message: `${getCategoryLabel(category)} bütçesi aşıldı! ${formatCurrency(amount)} / ${formatCurrency(limit)} (${percentage}%)`,
          overAmount,
          percentage: parseFloat(percentage),
        })
      }
    })

    // Bütçe aşımı bildirimleri gönder
    if (alerts.length > 0) {
      for (const alert of alerts) {
        try {
          await createNotificationForRole({
            companyId: session.user.companyId,
            role: ['ADMIN', 'SUPER_ADMIN'],
            title: alert.severity === 'critical' ? 'Bütçe Aşımı - Kritik' : 'Bütçe Aşımı',
            message: alert.message,
            type: alert.severity === 'critical' ? 'error' : 'warning',
            priority: alert.severity === 'critical' ? 'critical' : 'high',
            relatedTo: 'Finance',
          })
        } catch (notifError) {
          // Bildirim hatası ana işlemi engellemez
          if (process.env.NODE_ENV === 'development') {
            console.error('Budget alert notification error:', notifError)
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Budget check completed',
      totalExpense,
      budgetLimit: budgetLimits.TOTAL,
      percentage: ((totalExpense / budgetLimits.TOTAL) * 100).toFixed(1),
      categoryExpenses,
      alerts,
      alertCount: alerts.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check budget' },
      { status: 500 }
    )
  }
}

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount)
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    FUEL: 'Araç Yakıtı',
    ACCOMMODATION: 'Konaklama',
    FOOD: 'Yemek',
    TRANSPORT: 'Ulaşım',
    OFFICE: 'Ofis Giderleri',
    MARKETING: 'Pazarlama',
    OTHER: 'Diğer',
  }
  return labels[category] || category
}











