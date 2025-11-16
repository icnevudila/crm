import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'
import { z } from 'zod'

// Payment update schema validation
const paymentUpdateSchema = z.object({
  amount: z.number().positive('Ödeme tutarı pozitif olmalıdır').optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'OTHER']).optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // Permission check
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden', message: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const { data: payment, error } = await supabase
      .from('Payment')
      .select('*, Invoice:invoiceId(id, title, total, status, paidAmount), User:createdBy(id, name, email)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      // Error handling helper kullan
      const { createErrorResponse } = await import('@/lib/error-handling')
      return createErrorResponse(error)
    }
    
    if (!payment) {
      return NextResponse.json({ error: 'Ödeme kaydı bulunamadı' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = paymentUpdateSchema.parse(body)

    // Permission check
    const { hasPermission } = await import('@/lib/permissions')
    const canUpdate = await hasPermission('invoice', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden', message: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const supabase = getSupabase()

    // Mevcut payment'ı al
    const { data: existingPayment, error: fetchError } = await supabase
      .from('Payment')
      .select('*, Invoice:invoiceId(id, total, paidAmount, companyId)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !existingPayment) {
      return NextResponse.json({ error: 'Ödeme kaydı bulunamadı' }, { status: 404 })
    }

    // Tutar değiştiyse kontrol et
    if (validatedData.amount !== undefined && validatedData.amount !== existingPayment.amount) {
      const invoice = existingPayment.Invoice as any
      const currentPaidAmount = invoice.paidAmount || 0
      const newPaidAmount = currentPaidAmount - existingPayment.amount + validatedData.amount

      if (newPaidAmount > invoice.total) {
        return NextResponse.json(
          { error: 'Ödeme tutarı fatura toplamını aşamaz', field: 'amount' },
          { status: 400 }
        )
      }
    }

    // Payment'ı güncelle
    const updateData: any = {}
    if (validatedData.amount !== undefined) updateData.amount = validatedData.amount
    if (validatedData.paymentDate !== undefined) updateData.paymentDate = validatedData.paymentDate
    if (validatedData.paymentMethod !== undefined) updateData.paymentMethod = validatedData.paymentMethod
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    updateData.updatedAt = new Date().toISOString()

    const { data: payment, error } = await supabase
      .from('Payment')
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      // Error handling helper kullan
      const { createErrorResponse } = await import('@/lib/error-handling')
      return createErrorResponse(error)
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Payment',
        action: 'UPDATE',
        description: `Ödeme kaydı güncellendi: ${payment.amount} TRY`,
        meta: {
          paymentId: payment.id,
          invoiceId: payment.invoiceId,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(payment)
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(request)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Permission check
    const { hasPermission } = await import('@/lib/permissions')
    const canDelete = await hasPermission('invoice', 'update', session.user.id)
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden', message: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const supabase = getSupabase()

    // Payment'ı sil
    const { error } = await supabase
      .from('Payment')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      // Error handling helper kullan
      const { createErrorResponse } = await import('@/lib/error-handling')
      return createErrorResponse(error)
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Payment',
        action: 'DELETE',
        description: 'Ödeme kaydı silindi',
        meta: {
          paymentId: id,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

