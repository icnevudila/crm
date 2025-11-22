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
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = getSupabaseWithServiceRole()

    let query = supabase
      .from('ReturnOrder')
      .select(`
        *,
        invoice:Invoice!ReturnOrder_invoiceId_fkey(id, invoiceNumber, title, totalAmount),
        customer:Customer!ReturnOrder_customerId_fkey(id, name, email),
        approvedByUser:User!ReturnOrder_approvedBy_fkey(id, name, email),
        items:ReturnOrderItem(
          id,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          reason,
          product:Product(id, name, sku)
        )
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (invoiceId) query = query.eq('invoiceId', invoiceId)
    if (status) query = query.eq('status', status)
    if (search) {
      query = query.or(`returnNumber.ilike.%${search}%,reason.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Return orders fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return orders' },
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
    if (!body.invoiceId || !body.reason || !body.returnDate) {
      return NextResponse.json(
        { error: 'InvoiceId, reason, and returnDate are required' },
        { status: 400 }
      )
    }

    // Return number oluştur (IADE-YYYY-XXXX formatında)
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('ReturnOrder')
      .select('*', { count: 'exact', head: true })
      .eq('companyId', session.user.companyId)
      .gte('createdAt', `${year}-01-01`)
      .lt('createdAt', `${year + 1}-01-01`)

    const returnNumber = `IADE-${year}-${String((count || 0) + 1).padStart(4, '0')}`

    // Return order oluştur
    const { data: returnOrder, error: returnError } = await supabase
      .from('ReturnOrder')
      .insert({
        returnNumber,
        invoiceId: body.invoiceId,
        customerId: body.customerId,
        reason: body.reason,
        returnDate: body.returnDate,
        totalAmount: body.totalAmount || 0,
        refundAmount: body.refundAmount || 0,
        status: 'PENDING',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (returnError) throw returnError

    // Items ekle
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const items = body.items.map((item: any) => ({
        returnOrderId: returnOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        reason: item.reason,
        companyId: session.user.companyId,
      }))

      const { error: itemsError } = await supabase
        .from('ReturnOrderItem')
        .insert(items)

      if (itemsError) throw itemsError

      // Total amount hesapla
      const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0)
      
      await supabase
        .from('ReturnOrder')
        .update({ totalAmount, refundAmount: totalAmount })
        .eq('id', returnOrder.id)
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'returnOrderCreated', {
      returnNumber: returnOrder.returnNumber,
      invoiceId: body.invoiceId,
    })

    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'ReturnOrder',
      entityId: returnOrder.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        returnOrderId: returnOrder.id,
        returnNumber: returnOrder.returnNumber,
        invoiceId: body.invoiceId,
      },
    })

    // Notification - Admin/Sales rollere bildirim
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '📦 Yeni İade Siparişi Oluşturuldu',
        message: `${returnOrder.returnNumber} iade siparişi oluşturuldu.`,
        type: 'info',
        relatedTo: 'ReturnOrder',
        relatedId: returnOrder.id,
        link: `/tr/return-orders/${returnOrder.id}`,
      }).catch(() => {}) // Notification hatası ana işlemi engellemez
    } catch (notificationError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Return order notification error (non-critical):', notificationError)
      }
    }

    // Return order'ı items ile birlikte döndür
    const { data: returnOrderWithItems } = await supabase
      .from('ReturnOrder')
      .select(`
        *,
        items:ReturnOrderItem(
          id,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          reason,
          product:Product(id, name, sku)
        )
      `)
      .eq('id', returnOrder.id)
      .single()

    return NextResponse.json(returnOrderWithItems, { status: 201 })
  } catch (error: any) {
    console.error('Return order create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create return order' },
      { status: 500 }
    )
  }
}


