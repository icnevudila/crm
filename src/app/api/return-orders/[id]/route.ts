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
      .from('ReturnOrder')
      .select(`
        *,
        invoice:Invoice!ReturnOrder_invoiceId_fkey(id, invoiceNumber, title, totalAmount, status),
        customer:Customer!ReturnOrder_customerId_fkey(id, name, email, phone),
        approvedByUser:User!ReturnOrder_approvedBy_fkey(id, name, email),
        items:ReturnOrderItem(
          id,
          productId,
          quantity,
          unitPrice,
          totalPrice,
          reason,
          product:Product(id, name, sku, price)
        )
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Return order not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Return order fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return order' },
      { status: 500 }
    )
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
    const supabase = getSupabaseWithServiceRole()

    // Check if return order exists
    const { data: existing } = await supabase
      .from('ReturnOrder')
      .select('id, status')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Return order not found' }, { status: 404 })
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Status güncelleme
    if (body.status) {
      updateData.status = body.status
      
      // APPROVED durumunda approvedBy ve approvedAt set et
      if (body.status === 'APPROVED' && !(existing as any).approvedBy) {
        updateData.approvedBy = session.user.id
        updateData.approvedAt = new Date().toISOString()
      }
      
      // COMPLETED durumunda completedAt set et
      if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString()
      }
    }

    if (body.reason) updateData.reason = body.reason
    if (body.returnDate) updateData.returnDate = body.returnDate
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount
    if (body.refundAmount !== undefined) updateData.refundAmount = body.refundAmount

    const { data, error } = await supabase
      .from('ReturnOrder')
      .update(updateData)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) throw error

    // Items güncelle (varsa)
    if (body.items && Array.isArray(body.items)) {
      // Önce mevcut items'ları sil
      await supabase
        .from('ReturnOrderItem')
        .delete()
        .eq('returnOrderId', params.id)
        .eq('companyId', session.user.companyId)

      // Yeni items'ları ekle
      if (body.items.length > 0) {
        const items = body.items.map((item: any) => ({
          returnOrderId: params.id,
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
          .eq('id', params.id)
      }
    }

    // Otomasyon bilgilerini sakla
    const automationInfo: any = {
      stockUpdated: false,
      stockItems: [],
    }

    // Return Order APPROVED olduğunda stock artışı (trigger COMPLETED'da çalışıyor, APPROVED'da da yapalım)
    if (body.status === 'APPROVED' && existing.status !== 'APPROVED') {
      try {
        // Return Order items'larını çek
        const { data: items } = await supabase
          .from('ReturnOrderItem')
          .select('productId, quantity, product:Product(id, name, stock)')
          .eq('returnOrderId', params.id)
          .eq('companyId', session.user.companyId)

        if (items && items.length > 0) {
          // Her item için stock artır
          for (const item of items) {
            if (item.productId) {
              const { data: product } = await supabase
                .from('Product')
                .select('id, stock, name')
                .eq('id', item.productId)
                .eq('companyId', session.user.companyId)
                .single()

              if (product) {
                const newStock = (product.stock || 0) + (item.quantity || 0)
                await supabase
                  .from('Product')
                  .update({ stock: newStock, updatedAt: new Date().toISOString() })
                  .eq('id', item.productId)
                  .eq('companyId', session.user.companyId)

                automationInfo.stockUpdated = true
                automationInfo.stockItems.push({
                  productId: item.productId,
                  productName: (item.product as any)?.name || 'N/A',
                  quantity: item.quantity,
                  oldStock: product.stock || 0,
                  newStock,
                })
              }
            }
          }
        }
      } catch (stockError) {
        // Stock hatası ana işlemi engellemez
        if (process.env.NODE_ENV === 'development') {
          console.error('Return Order APPROVED stock update error:', stockError)
        }
      }
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'returnOrderUpdated', {
      returnNumber: data.returnNumber,
      status: body.status || existing.status,
    })

    await supabase.from('ActivityLog').insert({
      action: 'UPDATE',
      entityType: 'ReturnOrder',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        returnOrderId: data.id,
        returnNumber: data.returnNumber,
        oldStatus: existing.status,
        newStatus: body.status,
        changes: body,
        automation: automationInfo,
      },
    })

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
      .eq('id', params.id)
      .single()

    return NextResponse.json({
      ...returnOrderWithItems,
      automation: automationInfo,
    })
  } catch (error: any) {
    console.error('Return order update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update return order' },
      { status: 500 }
    )
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

    // Check if return order exists
    const { data: existing } = await supabase
      .from('ReturnOrder')
      .select('id, returnNumber, status')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Return order not found' }, { status: 404 })
    }

    // COMPLETED durumunda silinemez (stok güncellemesi yapılmış olabilir)
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Completed return orders cannot be deleted' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ReturnOrder')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) throw error

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'returnOrderDeleted', {
      returnNumber: existing.returnNumber,
    })

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'ReturnOrder',
      entityId: params.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: { returnOrderId: params.id, returnNumber: existing.returnNumber },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Return order delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete return order' },
      { status: 500 }
    )
  }
}


