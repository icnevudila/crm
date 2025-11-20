import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'
import { isInvoiceImmutable, canDeleteInvoice } from '@/lib/stageValidation'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()
    const companyId = session.user.companyId

    // Önce silinecek invoice'ları kontrol et (immutable status kontrolü)
    const { data: invoicesToDelete, error: fetchError } = await supabase
      .from('Invoice')
      .select('id, title, invoiceNumber, status')
      .in('id', ids)
      .eq('companyId', companyId)

    if (fetchError) {
      throw fetchError
    }

    // Immutable status kontrolü
    const immutableInvoices = invoicesToDelete?.filter((inv: any) => 
      !canDeleteInvoice(inv.status)
    ) || []
    
    if (immutableInvoices.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some invoices cannot be deleted',
          details: immutableInvoices.map((inv: any) => `${inv.invoiceNumber || inv.title} (${inv.status})`)
        },
        { status: 400 }
      )
    }

    // Invoice'ları sil
    const { error: deleteError } = await supabase
      .from('Invoice')
      .delete()
      .in('id', ids)
      .eq('companyId', companyId)

    if (deleteError) {
      throw deleteError
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'invoicesBulkDeleted', {
      count: ids.length.toString(),
    })

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: ids.join(','),
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        invoiceIds: ids,
        count: ids.length,
        bulkOperation: true,
      },
    })

    return NextResponse.json({ success: true, deletedCount: ids.length })
  } catch (error: any) {
    console.error('Bulk delete invoices error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to bulk delete invoices' },
      { status: 500 }
    )
  }
}

