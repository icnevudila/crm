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
    const returnOrderId = searchParams.get('returnOrderId')
    const invoiceId = searchParams.get('invoiceId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('CreditNote')
      .select(`
        *,
        returnOrder:ReturnOrder!CreditNote_returnOrderId_fkey(id, returnNumber, status),
        invoice:Invoice!CreditNote_invoiceId_fkey(id, invoiceNumber, title),
        customer:Customer!CreditNote_customerId_fkey(id, name, email)
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (returnOrderId) query = query.eq('returnOrderId', returnOrderId)
    if (invoiceId) query = query.eq('invoiceId', invoiceId)
    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(`creditNoteNumber.ilike.%${search}%,reason.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Credit notes fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credit notes' },
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
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Validation
    if (!body.amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400 }
      )
    }

    // Credit note number oluştur (CN-YYYY-XXXX formatında)
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('CreditNote')
      .select('*', { count: 'exact', head: true })
      .eq('companyId', session.user.companyId)
      .gte('createdAt', `${year}-01-01`)
      .lt('createdAt', `${year + 1}-01-01`)

    const creditNoteNumber = `CN-${year}-${String((count || 0) + 1).padStart(4, '0')}`

    // Credit note oluştur
    const { data: creditNote, error: creditError } = await supabase
      .from('CreditNote')
      .insert({
        creditNoteNumber,
        returnOrderId: body.returnOrderId,
        invoiceId: body.invoiceId,
        customerId: body.customerId,
        amount: body.amount,
        reason: body.reason,
        status: body.status || 'DRAFT',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (creditError) throw creditError

    // ISSUED durumunda issuedAt set et
    if (creditNote.status === 'ISSUED') {
      await supabase
        .from('CreditNote')
        .update({ issuedAt: new Date().toISOString() })
        .eq('id', creditNote.id)
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'creditNoteCreated', {
      creditNoteNumber: creditNote.creditNoteNumber,
      amount: body.amount,
    })

    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'CreditNote',
      entityId: creditNote.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
        amount: body.amount,
        returnOrderId: body.returnOrderId,
        invoiceId: body.invoiceId,
      },
    })

    // Notification - Admin/Sales rollere bildirim
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '📄 Yeni Alacak Dekontu Oluşturuldu',
        message: `${creditNote.creditNoteNumber} alacak dekontu oluşturuldu.`,
        type: 'info',
        relatedTo: 'CreditNote',
        relatedId: creditNote.id,
        link: `/tr/credit-notes/${creditNote.id}`,
      }).catch(() => {})
    } catch (notificationError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Credit note notification error (non-critical):', notificationError)
      }
    }

    return NextResponse.json(creditNote, { status: 201 })
  } catch (error: any) {
    console.error('Credit note create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create credit note' },
      { status: 500 }
    )
  }
}


