import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    if (!session?.user || (!session?.user?.companyId && !isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('PaymentPlan')
      .select('id, status, totalAmount, paidAmount, remainingAmount, createdAt, companyId')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: plans, error } = await query
    
    if (error) {
      console.error('[Stats Payment Plans API] Error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch payment plan stats' },
        { status: 500 }
      )
    }
    
    if (!plans || !Array.isArray(plans)) {
      return NextResponse.json(
        { error: 'Invalid payment plans data' },
        { status: 500 }
      )
    }
    
    const totalCount = plans.length
    const activeCount = plans.filter((p: any) => p.status === 'ACTIVE').length
    const completedCount = plans.filter((p: any) => p.status === 'COMPLETED').length
    const defaultedCount = plans.filter((p: any) => p.status === 'DEFAULTED').length
    const cancelledCount = plans.filter((p: any) => p.status === 'CANCELLED').length
    
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = plans.filter((p: any) => {
      if (!p.createdAt) return false
      const planDate = new Date(p.createdAt)
      return planDate >= new Date(firstDayOfMonth)
    }).length
    
    const totalAmount = plans.reduce((sum: number, p: any) => {
      const amount = p.totalAmount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0
    
    const totalPaidAmount = plans.reduce((sum: number, p: any) => {
      const amount = p.paidAmount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0
    
    const totalRemainingAmount = plans.reduce((sum: number, p: any) => {
      const amount = p.remainingAmount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0

    return NextResponse.json(
      {
        total: totalCount,
        active: activeCount,
        completed: completedCount,
        defaulted: defaultedCount,
        cancelled: cancelledCount,
        totalAmount,
        totalPaidAmount,
        totalRemainingAmount,
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
      { error: error.message || 'Failed to fetch payment plan stats' },
      { status: 500 }
    )
  }
}


