import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getSafeSession } from '@/lib/safe-session'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { approvalRejectSchema } from '@/lib/validations/approvals'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canUpdate = await hasPermission('approvals', 'update', session.user.id)
    if (!canUpdate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()

    // Zod validation
    const validationResult = approvalRejectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const { reason } = validationResult.data

    const supabase = getSupabaseWithServiceRole()
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
        rejectedBy: session.user.id,
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
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

    // Entity güncellemesi (trigger'a ek olarak manuel güncelleme - güvenlik için)
    try {
      if (approval.relatedTo === 'Quote') {
        await supabase
          .from('Quote')
          .update({ status: 'REJECTED' })
          .eq('id', approval.relatedId)
          .eq('companyId', session.user.companyId)
      } else if (approval.relatedTo === 'Deal') {
        await supabase
          .from('Deal')
          .update({ 
            stage: 'LOST',
            lostReason: `Onay reddedildi: ${reason}`,
          })
          .eq('id', approval.relatedId)
          .eq('companyId', session.user.companyId)
      }
    } catch (entityUpdateError) {
      console.error('Entity update error:', entityUpdateError)
      // Hata olsa bile devam et - trigger zaten güncellemiş olabilir
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

    // Email bildirimi gönder (talep edene)
    try {
      const { sendApprovalDecisionEmail } = await import('@/lib/email-helper')
      
      // Talep edenin bilgilerini al
      const { data: requester } = await supabase
        .from('User')
        .select('name, email')
        .eq('id', approval.requestedBy)
        .maybeSingle()

      // Reddedenin bilgilerini al
      const { data: rejecter } = await supabase
        .from('User')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (requester?.email) {
        await sendApprovalDecisionEmail({
          requesterEmail: requester.email,
          requesterName: requester.name || 'Kullanıcı',
          approverName: rejecter?.name || session.user.name || 'Kullanıcı',
          approvalTitle: approval.title,
          decision: 'REJECTED',
          reason,
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

    return NextResponse.json({ success: true, message: 'Onay talebi reddedildi' })
  } catch (error: any) {
    console.error('Reject error:', error)
    return NextResponse.json(
      { error: error.message || 'Reddetme işlemi başarısız oldu' },
      { status: 500 }
    )
  }
}
