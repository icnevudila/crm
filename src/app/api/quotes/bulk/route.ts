import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'

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

    // Önce silinecek quote'ları kontrol et (immutable status kontrolü)
    const { data: quotesToDelete, error: fetchError } = await supabase
      .from('Quote')
      .select('id, title, quoteNumber, status')
      .in('id', ids)
      .eq('companyId', companyId)

    if (fetchError) {
      throw fetchError
    }

    // Immutable status kontrolü - ACCEPTED quote'lar silinemez
    const immutableQuotes = quotesToDelete?.filter((q: any) => q.status === 'ACCEPTED') || []
    if (immutableQuotes.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some quotes cannot be deleted',
          details: immutableQuotes.map((q: any) => `${q.quoteNumber || q.title} (ACCEPTED)`)
        },
        { status: 400 }
      )
    }

    // Quote'ları sil
    const { error: deleteError } = await supabase
      .from('Quote')
      .delete()
      .in('id', ids)
      .eq('companyId', companyId)

    if (deleteError) {
      throw deleteError
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'quotesBulkDeleted', {
      count: ids.length.toString(),
    })

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Quote',
      entityId: ids.join(','),
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        quoteIds: ids,
        count: ids.length,
        bulkOperation: true,
      },
    })

    return NextResponse.json({ success: true, deletedCount: ids.length })
  } catch (error: any) {
    console.error('Bulk delete quotes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to bulk delete quotes' },
      { status: 500 }
    )
  }
}

