import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

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

    // Permission check
    const canUpdate = await hasPermission('approvals', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { id: approvalId } = await params
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Approval bilgisini getir
    const { data: approval, error: fetchError } = await supabase
      .from('ApprovalRequest')
      .select('*')
      .eq('id', approvalId)
      .maybeSingle()

    if (fetchError || !approval) {
      return NextResponse.json(
        { error: 'Onay talebi bulunamadı veya erişim izniniz yok' },
        { status: 404 }
      )
    }

    // Şirket kontrolü (SuperAdmin tüm şirketleri görebilir)
    if (!isSuperAdmin && approval.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: 'Bu onay talebini onaylama yetkiniz yok' },
        { status: 403 }
      )
    }

    // SuperAdmin işlemi şirket bağlamında yapabilsin
    const targetCompanyId = approval.companyId ?? session.user.companyId

    // Zaten onaylanmış/reddedilmişse hata döndür
    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Bu onay talebi zaten ${approval.status} durumunda` },
        { status: 400 }
      )
    }

    // Onaylayıcı kontrolü (eğer approverIds varsa)
    if (!isSuperAdmin && approval.approverIds && Array.isArray(approval.approverIds)) {
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
        companyId: targetCompanyId,
        userId: session.user.id,
      })
    } catch (logError) {
      console.error('ActivityLog error:', logError)
    }

    // Entity güncellemesi (trigger'a ek olarak manuel güncelleme - güvenlik için)
    try {
      if (approval.relatedTo === 'Quote') {
        await supabase
          .from('Quote')
          .update({ status: 'ACCEPTED' })
          .eq('id', approval.relatedId)
          .eq('companyId', targetCompanyId)
      } else if (approval.relatedTo === 'Deal') {
        await supabase
          .from('Deal')
          .update({ stage: 'NEGOTIATION' })
          .eq('id', approval.relatedId)
          .eq('companyId', targetCompanyId)
      } else if (approval.relatedTo === 'Contract') {
        await supabase
          .from('Contract')
          .update({ status: 'ACTIVE' })
          .eq('id', approval.relatedId)
          .eq('companyId', targetCompanyId)
      } else if (approval.relatedTo === 'Invoice') {
        await supabase
          .from('Invoice')
          .update({ status: 'APPROVED' })
          .eq('id', approval.relatedId)
          .eq('companyId', targetCompanyId)
      }
    } catch (entityUpdateError) {
      console.error('Entity update error:', entityUpdateError)
      // Hata olsa bile devam et - trigger zaten güncellemiş olabilir
    }

    // Notification oluştur (talep edene)
    try {
      await supabase.from('Notification').insert({
        title: '✅ Onay Talebi Onaylandı',
        message: `${approval.relatedTo} için olan onay talebiniz onaylandı.`,
        type: 'success',
        relatedTo: approval.relatedTo,
        relatedId: approval.relatedId,
        companyId: targetCompanyId,
        userId: approval.requestedBy,
        link: `/${approval.relatedTo.toLowerCase()}s/${approval.relatedId}`,
      })
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    // Email bildirimi gönder (talep edene)
    try {
      const { sendApprovalDecisionEmail } = await import('@/lib/email-helper')
      
      // Talep edenin bilgilerini al
      const { data: requester } = await supabase
        .from('User')
        .select('name, email')
        .eq('id', approval.requestedBy)
        .maybeSingle()

      // Onaylayanın bilgilerini al
      const { data: approver } = await supabase
        .from('User')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (requester?.email) {
        await sendApprovalDecisionEmail({
          requesterEmail: requester.email,
          requesterName: requester.name || 'Kullanıcı',
          approverName: approver?.name || session.user.name || 'Kullanıcı',
          approvalTitle: approval.title,
          decision: 'APPROVED',
          relatedTo: approval.relatedTo,
          relatedId: approval.relatedId,
        }).catch((emailError) => {
          console.error('Email gönderilemedi:', emailError)
          // Email hatası ana işlemi engellemez
        })
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Email hatası ana işlemi engellemez
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
