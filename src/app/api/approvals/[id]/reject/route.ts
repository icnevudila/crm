import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Red sebebi zorunludur' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()
    const { id: approvalId } = await params

    // Approval bilgisini getir
    const { data: approval, error: fetchError } = await supabase
      .from('ApprovalRequest')
      .select('*')
      .eq('id', approvalId)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !approval) {
      return NextResponse.json(
        { error: 'Onay talebi bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      )
    }

    // Zaten onaylanmış/reddedilmişse hata döndür
    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Bu onay talebi zaten ${approval.status} durumunda` },
        { status: 400 }
      )
    }

    // Onaylayıcı kontrolü (eğer approverIds varsa)
    if (approval.approverIds && Array.isArray(approval.approverIds)) {
      if (!approval.approverIds.includes(session.user.id)) {
        return NextResponse.json(
          { error: 'Bu onay talebini reddetme yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    // Onay talebini güncelle
    const { error: updateError } = await supabase
      .from('ApprovalRequest')
      .update({
        status: 'REJECTED',
        approvedBy: session.user.id,
        rejectionReason: reason,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', approvalId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // ActivityLog kaydı oluştur
    try {
      await supabase.from('ActivityLog').insert({
        entity: 'ApprovalRequest',
        action: 'UPDATE',
        description: `Onay talebi reddedildi: ${approval.relatedTo} #${approval.relatedId}`,
        meta: {
          approvalId: approvalId,
          relatedTo: approval.relatedTo,
          relatedId: approval.relatedId,
          approvedBy: session.user.id,
          rejectionReason: reason,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      })
    } catch (logError) {
      console.error('ActivityLog error:', logError)
    }

    // Notification oluştur (talep edene)
    try {
      await supabase.from('Notification').insert({
        title: '❌ Onay Talebi Reddedildi',
        message: `${approval.relatedTo} için olan onay talebiniz reddedildi. Sebep: ${reason}`,
        type: 'error',
        relatedTo: approval.relatedTo,
        relatedId: approval.relatedId,
        companyId: session.user.companyId,
        userId: approval.requestedBy,
        link: `/${approval.relatedTo.toLowerCase()}s/${approval.relatedId}`,
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({ success: true, message: 'Onay talebi reddedildi' })
  } catch (error: any) {
    console.error('Reject error:', error)
    return NextResponse.json(
      { error: error.message || 'Reddetme işlemi başarısız oldu' },
      { status: 500 }
    )
  }
}
