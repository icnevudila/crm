import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from '@/lib/auth-supabase'
import { z } from 'zod'

// Payment schema validation
const paymentSchema = z.object({
  invoiceId: z.string().uuid('Geçersiz fatura ID'),
  amount: z.number().positive('Ödeme tutarı pozitif olmalıdır'),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHECK', 'OTHER']).optional().default('CASH'),
  notes: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Permission check
    const { hasPermission } = await import('@/lib/permissions')
    const canRead = await hasPermission('invoice', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden', message: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    let query = supabase
      .from('Payment')
      .select('*, Invoice:invoiceId(id, title, total, status), User:createdBy(id, name, email)', { count: 'exact' })
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (invoiceId) {
      query = query.eq('invoiceId', invoiceId)
    }

    // Pagination
    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) {
      // Error handling helper kullan
      const { createErrorResponse } = await import('@/lib/error-handling')
      return createErrorResponse(error)
    }

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    })
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const { hasPermission } = await import('@/lib/permissions')
    const canCreate = await hasPermission('invoice', 'update', session.user.id) // Payment oluşturmak için invoice update yetkisi gerekli
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden', message: 'Bu işlem için yetkiniz yok' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Invoice'ın mevcut olduğunu ve kullanıcının companyId'sine ait olduğunu kontrol et
    const supabase = getSupabase()
    const { data: invoice, error: invoiceError } = await supabase
      .from('Invoice')
      .select('id, total, paidAmount, companyId')
      .eq('id', validatedData.invoiceId)
      .eq('companyId', session.user.companyId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
    }

    // Ödeme tutarı kontrolü
    const newPaidAmount = (invoice.paidAmount || 0) + validatedData.amount
    if (newPaidAmount > invoice.total) {
      return NextResponse.json(
        { error: 'Ödeme tutarı fatura toplamını aşamaz', field: 'amount' },
        { status: 400 }
      )
    }

    // Payment oluştur
    const { data: payment, error: paymentError } = await supabase
      .from('Payment')
      .insert({
        invoiceId: validatedData.invoiceId,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: validatedData.paymentMethod || 'CASH',
        notes: validatedData.notes,
        companyId: session.user.companyId,
        createdBy: session.user.id,
      })
      .select()
      .single()

    if (paymentError) {
      // Error handling helper kullan
      const { createErrorResponse } = await import('@/lib/error-handling')
      return createErrorResponse(paymentError)
    }

    // ActivityLog (asenkron - performans için)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Payment',
        action: 'CREATE',
        description: `Ödeme kaydı oluşturuldu: ${validatedData.amount} TRY`,
        meta: {
          paymentId: payment.id,
          invoiceId: validatedData.invoiceId,
          amount: validatedData.amount,
          paymentMethod: validatedData.paymentMethod,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {}) // Hata olsa bile ana işlemi engelleme
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    // Error handling helper kullan
    const { createErrorResponse } = await import('@/lib/error-handling')
    return createErrorResponse(error)
  }
}

