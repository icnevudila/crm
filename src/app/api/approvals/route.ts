import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Build-time'da çalışmasın - sadece runtime'da çalışsın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const relatedTo = searchParams.get('relatedTo')
    const myApprovals = searchParams.get('myApprovals') === 'true'

    const supabase = getSupabaseWithServiceRole()
    let query = supabase
      .from('ApprovalRequest')
      .select(`
        id, title, description, relatedTo, relatedId, status, priority,
        approvedAt, rejectedAt, rejectionReason, createdAt,
        requestedBy:User!ApprovalRequest_requestedBy_fkey(id, name, email),
        approvedBy:User!ApprovalRequest_approvedBy_fkey(id, name, email),
        rejectedBy:User!ApprovalRequest_rejectedBy_fkey(id, name, email)
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (status) query = query.eq('status', status)
    if (relatedTo) query = query.eq('relatedTo', relatedTo)
    
    // My pending approvals
    if (myApprovals) {
      query = query.contains('approverIds', [session.user.id]).eq('status', 'PENDING')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Approvals fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.title || !body.relatedTo || !body.relatedId || !body.approverIds) {
      return NextResponse.json(
        { error: 'Title, relatedTo, relatedId, and approverIds are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ApprovalRequest')
      .insert({
        ...body,
        requestedBy: session.user.id,
        companyId: session.user.companyId,
        status: 'PENDING',
      })
      .select()
      .single()

    if (error) throw error

    // Activity Log
    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'ApprovalRequest',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Created approval request: ${data.title}`,
      meta: { 
        approvalId: data.id, 
        relatedTo: data.relatedTo, 
        relatedId: data.relatedId 
      },
    })

    // TODO: Create notifications for approvers
    // for (const approverId of body.approverIds) {
    //   await createNotification(approverId, 'APPROVAL_REQUESTED', data.id)
    // }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Approval create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create approval request' },
      { status: 500 }
    )
  }
}



