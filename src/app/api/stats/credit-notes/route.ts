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
      .from('CreditNote')
      .select('id, status, amount, createdAt, companyId')
      .order('createdAt', { ascending: false })
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }
    
    const { data: creditNotes, error } = await query
    
    if (error) {
      console.error('[Stats Credit Notes API] Error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch credit note stats' },
        { status: 500 }
      )
    }
    
    if (!creditNotes || !Array.isArray(creditNotes)) {
      return NextResponse.json(
        { error: 'Invalid credit notes data' },
        { status: 500 }
      )
    }
    
    const totalCount = creditNotes.length
    const draftCount = creditNotes.filter((cn: any) => cn.status === 'DRAFT').length
    const issuedCount = creditNotes.filter((cn: any) => cn.status === 'ISSUED').length
    const appliedCount = creditNotes.filter((cn: any) => cn.status === 'APPLIED').length
    
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const thisMonthCount = creditNotes.filter((cn: any) => {
      if (!cn.createdAt) return false
      const noteDate = new Date(cn.createdAt)
      return noteDate >= new Date(firstDayOfMonth)
    }).length
    
    const totalAmount = creditNotes.reduce((sum: number, cn: any) => {
      const amount = cn.amount || 0
      return sum + (typeof amount === 'string' ? parseFloat(amount) || 0 : amount)
    }, 0) || 0

    return NextResponse.json(
      {
        total: totalCount,
        draft: draftCount,
        issued: issuedCount,
        applied: appliedCount,
        totalAmount,
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
      { error: error.message || 'Failed to fetch credit note stats' },
      { status: 500 }
    )
  }
}


