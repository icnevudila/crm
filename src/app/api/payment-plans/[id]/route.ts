import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()

    const { data, error } = await supabase
      .from('PaymentPlan')
      .select(`
        *,
        invoice:Invoice!PaymentPlan_invoiceId_fkey(
          id,
          invoiceNumber,
          title,
          total
        ),
        customer:Customer!PaymentPlan_customerId_fkey(
          id,
          name,
          email
        ),
        installments:PaymentInstallment(
          id,
          installmentNumber,
          amount,
          dueDate,
          status,
          paidAt
        )
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      console.error('PaymentPlan fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('PaymentPlan GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, status } = body

    const supabase = getSupabaseWithServiceRole()
    const locale = request.headers.get('x-locale') || 'tr'

    // PaymentPlan güncelle
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    updateData.updatedAt = new Date().toISOString()

    // Status değişirse remainingAmount'u güncelle
    if (status === 'COMPLETED') {
      const { data: plan } = await supabase
        .from('PaymentPlan')
        .select('totalAmount, paidAmount')
        .eq('id', params.id)
        .single()

      if (plan) {
        updateData.paidAmount = plan.totalAmount
        updateData.remainingAmount = 0
      }
    }

    const { data: paymentPlan, error: planError } = await supabase
      .from('PaymentPlan')
      .update(updateData)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (planError) {
      console.error('PaymentPlan update error:', planError)
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'PaymentPlan',
          action: 'UPDATE',
          description: getActivityMessage(locale, 'paymentPlanUpdated', { name: paymentPlan.name }),
          meta: {
            entity: 'PaymentPlan',
            action: 'update',
            paymentPlanId: paymentPlan.id,
            name: paymentPlan.name,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog creation error:', activityError)
    }

    // PaymentPlan'ı installments ile birlikte döndür
    const { data: planWithInstallments } = await supabase
      .from('PaymentPlan')
      .select(`
        *,
        invoice:Invoice!PaymentPlan_invoiceId_fkey(
          id,
          invoiceNumber,
          title,
          total
        ),
        customer:Customer!PaymentPlan_customerId_fkey(
          id,
          name,
          email
        ),
        installments:PaymentInstallment(
          id,
          installmentNumber,
          amount,
          dueDate,
          status,
          paidAt
        )
      `)
      .eq('id', params.id)
      .single()

    return NextResponse.json(planWithInstallments)
  } catch (error: any) {
    console.error('PaymentPlan PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const locale = request.headers.get('x-locale') || 'tr'

    // PaymentPlan bilgilerini al (ActivityLog için)
    const { data: paymentPlan } = await supabase
      .from('PaymentPlan')
      .select('name')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    // Installments'ları sil (CASCADE ile otomatik silinir ama manuel de silebiliriz)
    await supabase
      .from('PaymentInstallment')
      .delete()
      .eq('paymentPlanId', params.id)
      .eq('companyId', session.user.companyId)

    // PaymentPlan'ı sil
    const { error } = await supabase
      .from('PaymentPlan')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('PaymentPlan delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'PaymentPlan',
          action: 'DELETE',
          description: getActivityMessage(locale, 'paymentPlanDeleted', { name: paymentPlan?.name || params.id }),
          meta: {
            entity: 'PaymentPlan',
            action: 'delete',
            paymentPlanId: params.id,
            name: paymentPlan?.name,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog creation error:', activityError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('PaymentPlan DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

