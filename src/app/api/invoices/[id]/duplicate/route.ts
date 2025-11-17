import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission, buildPermissionDeniedResponse } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check
    const canCreate = await hasPermission('invoice', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Orijinal invoice'u çek
    const { data: originalInvoice, error: fetchError } = await supabase
      .from('Invoice')
      .select('*')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (fetchError || !originalInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Yeni invoice number oluştur (son invoice number'ı bul)
    const { data: lastInvoice } = await supabase
      .from('Invoice')
      .select('invoiceNumber')
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()

    let newInvoiceNumber = 'INV-001'
    if (lastInvoice?.invoiceNumber) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/)
      if (match) {
        const num = parseInt(match[1]) + 1
        newInvoiceNumber = `INV-${num.toString().padStart(3, '0')}`
      }
    }

    // Yeni invoice oluştur (ID ve numaraları temizle)
    const { id: originalId, invoiceNumber, paidAmount, createdAt, updatedAt, ...invoiceData } = originalInvoice

    const { data: newInvoice, error: createError } = await supabase
      .from('Invoice')
      .insert({
        ...invoiceData,
        invoiceNumber: newInvoiceNumber,
        status: 'DRAFT',
        paidAmount: 0,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Invoice duplicate create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    // InvoiceItem'ları kopyala
    const { data: originalItems } = await supabase
      .from('InvoiceItem')
      .select('*')
      .eq('invoiceId', id)
      .eq('companyId', session.user.companyId)

    if (originalItems && originalItems.length > 0) {
      const newItems = originalItems.map((item: any) => {
        const { id: itemId, invoiceId, createdAt: itemCreatedAt, updatedAt: itemUpdatedAt, ...itemData } = item
        return {
          ...itemData,
          invoiceId: newInvoice.id,
          companyId: session.user.companyId,
        }
      })

      const { error: itemsError } = await supabase
        .from('InvoiceItem')
        .insert(newItems)

      if (itemsError) {
        console.error('InvoiceItem duplicate error:', itemsError)
        // InvoiceItem hatası ana işlemi engellemez, sadece log'la
      }
    }

    // ActivityLog (asenkron)
    import('@/lib/logger').then(({ logAction }) => {
      logAction({
        entity: 'Invoice',
        action: 'CREATE',
        description: `Fatura kopyalandı: ${newInvoiceNumber} (Orijinal: ${invoiceNumber})`,
        meta: {
          invoiceId: newInvoice.id,
          invoiceNumber: newInvoiceNumber,
          originalInvoiceId: id,
          originalInvoiceNumber: invoiceNumber,
        },
        companyId: session.user.companyId,
        userId: session.user.id,
      }).catch(() => {})
    })

    return NextResponse.json(newInvoice)
  } catch (error: any) {
    console.error('Invoice duplicate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}













