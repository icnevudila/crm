import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'
import { approvalCreateSchema } from '@/lib/validations/approvals'

// Build-time'da çalışmasın - sadece runtime'da çalışsın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canRead = await hasPermission('approvals', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const relatedTo = searchParams.get('relatedTo')
    const myApprovals = searchParams.get('myApprovals') === 'true'
    const companyFilter = searchParams.get('companyId')
    const targetCompanyId = companyFilter ?? session.user.companyId
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    const supabase = getSupabaseWithServiceRole()
    let query = supabase
      .from('ApprovalRequest')
      .select(`
        id, title, description, relatedTo, relatedId, status, priority,
        approvedAt, rejectedAt, rejectionReason, createdAt,
        companyId,
        requestedBy:User!ApprovalRequest_requestedBy_fkey(id, name, email),
        approvedBy:User!ApprovalRequest_approvedBy_fkey(id, name, email),
        rejectedBy:User!ApprovalRequest_rejectedBy_fkey(id, name, email)
      `)
      .order('createdAt', { ascending: false })

    // SUPER_ADMIN değilse veya companyId parametresi verilmişse kendi şirketine kısıtla
    if (!isSuperAdmin || companyFilter !== null) {
      query = query.eq('companyId', targetCompanyId)
    }

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
      { error: error.message || 'Onay talepleri getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canCreate = await hasPermission('approvals', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const body = await request.json()

    // Zod validation
    const validationResult = approvalCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    const supabase = getSupabaseWithServiceRole()

    const { data, error } = await supabase
      .from('ApprovalRequest')
      .insert({
        ...validatedData,
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
      description: `Onay talebi oluşturuldu: ${data.title}`,
      meta: { 
        approvalId: data.id, 
        relatedTo: data.relatedTo, 
        relatedId: data.relatedId 
      },
    })

    // Notification oluştur (onaylayıcılara)
    try {
      const { createNotification } = await import('@/lib/notification-helper')
      
      for (const approverId of validatedData.approverIds) {
        await createNotification({
          userId: approverId,
          companyId: session.user.companyId,
          title: '⏰ Yeni Onay Talebi',
          message: `${data.title} için onayınız bekleniyor.`,
          type: 'info',
          relatedTo: 'ApprovalRequest',
          relatedId: data.id,
          link: `/tr/approvals/${data.id}`,
          priority: validatedData.priority === 'HIGH' ? 'high' : 'normal',
        })
      }
    } catch (notifError) {
      console.error('Notification creation error:', notifError)
      // Bildirim hatası ana işlemi engellemez
    }

    // Email bildirimi gönder (onaylayıcılara)
    try {
      const { sendApprovalRequestEmail } = await import('@/lib/email-helper')
      
      // Onaylayıcıların email adreslerini al
      const { data: approvers } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', validatedData.approverIds)
        .eq('companyId', session.user.companyId)

      if (approvers) {
        // Talep edenin bilgilerini al
        const { data: requester } = await supabase
          .from('User')
          .select('name')
          .eq('id', session.user.id)
          .maybeSingle()

        for (const approver of approvers) {
          if (approver.email) {
            await sendApprovalRequestEmail({
              approverEmail: approver.email,
              approverName: approver.name || 'Kullanıcı',
              requesterName: requester?.name || session.user.name || 'Kullanıcı',
              approvalTitle: data.title,
              approvalId: data.id,
              relatedTo: validatedData.relatedTo,
              relatedId: validatedData.relatedId,
              priority: validatedData.priority,
            }).catch((emailError) => {
              console.error(`Email gönderilemedi (${approver.email}):`, emailError)
              // Email hatası ana işlemi engellemez
            })
          }
        }
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Email hatası ana işlemi engellemez
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Approval create error:', error)
    return NextResponse.json(
      { error: error.message || 'Onay talebi oluşturulamadı' },
      { status: 500 }
    )
  }
}



