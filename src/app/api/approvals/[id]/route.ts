import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const { id: approvalId } = await params

    // Approval bilgisini getir (ilişkilerle)
    const { data: approval, error: approvalError } = await supabase
      .from('ApprovalRequest')
      .select(`
        *,
        requester:User!ApprovalRequest_requestedBy_fkey(name, email),
        approver:User!ApprovalRequest_approvedBy_fkey(name, email)
      `)
      .eq('id', approvalId)
      .eq('companyId', session.user.companyId)
      .single()

    if (approvalError) {
      console.error('Approval fetch error:', approvalError)
      return NextResponse.json({ error: 'Onay talebi bulunamadı' }, { status: 404 })
    }

    // Onaylayıcıları getir
    if (approval.approverIds && Array.isArray(approval.approverIds)) {
      const { data: approvers } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', approval.approverIds)

      approval.approvers = approvers || []
    }

    return NextResponse.json(approval)
  } catch (error: any) {
    console.error('GET /api/approvals/[id] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
