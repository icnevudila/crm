import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = getSupabaseWithServiceRole()

    let query = supabase
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
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (invoiceId) {
      query = query.eq('invoiceId', invoiceId)
    }

    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('PaymentPlan fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('PaymentPlan GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, invoiceId, customerId, totalAmount, installmentCount, installmentFrequency, startDate } = body

    if (!name || !invoiceId || !totalAmount || !installmentCount) {
      return NextResponse.json(
        { error: 'Name, invoiceId, totalAmount, and installmentCount are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const locale = request.headers.get('x-locale') || 'tr'

    // Invoice'ı kontrol et
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select('id, total, customerId')
      .eq('id', invoiceId)
      .eq('companyId', session.user.companyId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Customer ID'yi invoice'dan al (eğer verilmemişse)
    const finalCustomerId = customerId || invoice.customerId

    // Taksit tutarını hesapla
    const installmentAmount = parseFloat((totalAmount / installmentCount).toFixed(2))
    const frequency = installmentFrequency || 'MONTHLY'

    // PaymentPlan oluştur
    const { data: paymentPlan, error: planError } = await supabase
      .from('PaymentPlan')
      .insert({
        name,
        invoiceId,
        customerId: finalCustomerId,
        totalAmount: parseFloat(totalAmount),
        paidAmount: 0,
        remainingAmount: parseFloat(totalAmount),
        installmentCount: parseInt(installmentCount),
        installmentFrequency: frequency,
        status: 'ACTIVE',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (planError) {
      console.error('PaymentPlan creation error:', planError)
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    // PaymentInstallment'ları oluştur
    const installments = []
    const start = startDate ? new Date(startDate) : new Date()
    
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(start)
      
      // Frequency'a göre tarih ekle
      if (frequency === 'WEEKLY') {
        dueDate.setDate(dueDate.getDate() + (i * 7))
      } else if (frequency === 'MONTHLY') {
        dueDate.setMonth(dueDate.getMonth() + i)
      } else if (frequency === 'QUARTERLY') {
        dueDate.setMonth(dueDate.getMonth() + (i * 3))
      }

      // Son taksit için kalan tutarı hesapla (yuvarlama hatalarını önlemek için)
      const amount = i === installmentCount - 1
        ? parseFloat((parseFloat(totalAmount) - (installmentAmount * (installmentCount - 1))).toFixed(2))
        : installmentAmount

      installments.push({
        paymentPlanId: paymentPlan.id,
        installmentNumber: i + 1,
        amount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'PENDING',
        companyId: session.user.companyId,
      })
    }

    const { error: installmentsError } = await supabase
      .from('PaymentInstallment')
      .insert(installments)

    if (installmentsError) {
      // PaymentPlan'ı sil (rollback)
      await supabase.from('PaymentPlan').delete().eq('id', paymentPlan.id)
      console.error('PaymentInstallment creation error:', installmentsError)
      return NextResponse.json({ error: installmentsError.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'PaymentPlan',
          action: 'CREATE',
          description: getActivityMessage(locale, 'paymentPlanCreated', { name }),
          meta: {
            entity: 'PaymentPlan',
            action: 'create',
            paymentPlanId: paymentPlan.id,
            name,
            invoiceId,
            installmentCount,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog creation error:', activityError)
    }

    // Notification - Admin/Sales rollere bildirim
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '💳 Yeni Ödeme Planı Oluşturuldu',
        message: `${name} ödeme planı oluşturuldu. ${installmentCount} taksit.`,
        type: 'info',
        relatedTo: 'PaymentPlan',
        relatedId: paymentPlan.id,
        link: `/tr/payment-plans/${paymentPlan.id}`,
      }).catch(() => {})
    } catch (notificationError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Payment plan notification error (non-critical):', notificationError)
      }
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
      .eq('id', paymentPlan.id)
      .single()

    return NextResponse.json(planWithInstallments, { status: 201 })
  } catch (error: any) {
    console.error('PaymentPlan POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

