import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
          { error: 'Bu onay talebini onaylama yetkiniz yok' },
          { status: 403 }
        )
      }
    }

    // Onay talebini güncelle
    const { error: updateError } = await supabase
      .from('ApprovalRequest')
      .update({
        status: 'APPROVED',
        approvedBy: session.user.id,
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
        description: `Onay talebi onaylandı: ${approval.relatedTo} #${approval.relatedId}`,
        meta: {
          approvalId: approvalId,
          relatedTo: approval.relatedTo,
          relatedId: approval.relatedId,
          approvedBy: session.user.id,
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
        title: '✅ Onay Talebi Onaylandı',
        message: `${approval.relatedTo} için olan onay talebiniz onaylandı.`,
        type: 'success',
        relatedTo: approval.relatedTo,
        relatedId: approval.relatedId,
        companyId: session.user.companyId,
        userId: approval.requestedBy,
        link: `/${approval.relatedTo.toLowerCase()}s/${approval.relatedId}`,
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({ success: true, message: 'Onay talebi başarıyla onaylandı' })
  } catch (error: any) {
    console.error('Approve error:', error)
    return NextResponse.json(
      { error: error.message || 'Onaylama işlemi başarısız oldu' },
      { status: 500 }
    )
  }
}
