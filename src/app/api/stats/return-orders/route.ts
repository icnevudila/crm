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
      .from('ReturnOrder')
      .select('id, status, totalAmount, refundAmount, createdAt, companyId')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: returnOrders, error } = await query
    
    if (error) {
      console.error('[Stats Return Orders API] Error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch return order stats' },
        { status: 500 }
      )
    }
    
    if (!returnOrders || !Array.isArray(returnOrders)) {
      return NextResponse.json(
        { error: 'Invalid return orders data' },
        { status: 500 }
      )
    }
    
    const totalCount = returnOrders.length
    const pendingCount = returnOrders.filter((ro: any) => ro.status === 'PENDING').length
    const approvedCount = returnOrders.filter((ro: any) => ro.status === 'APPROVED').length
    const rejectedCount = returnOrders.filter((ro: any) => ro.status === 'REJECTED').length
    const completedCount = returnOrders.filter((ro: any) => ro.status === 'COMPLETED').length
    
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = returnOrders.filter((ro: any) => {
      if (!ro.createdAt) return false
      const orderDate = new Date(ro.createdAt)
      return orderDate >= new Date(firstDayOfMonth)
    }).length
    
    const totalAmount = returnOrders.reduce((sum: number, ro: any) => {
      const amount = ro.totalAmount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0
    
    const totalRefundAmount = returnOrders.reduce((sum: number, ro: any) => {
      const amount = ro.refundAmount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0

    return NextResponse.json(
      {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        completed: completedCount,
        totalAmount,
        totalRefundAmount,
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
      { error: error.message || 'Failed to fetch return order stats' },
      { status: 500 }
    )
  }
}


