import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'
import { isDealImmutable, canDeleteDeal } from '@/lib/stageValidation'

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

    // Önce silinecek deal'ları kontrol et (immutable status kontrolü)
    const { data: dealsToDelete, error: fetchError } = await supabase
      .from('Deal')
      .select('id, title, stage, status')
      .in('id', ids)
      .eq('companyId', companyId)

    if (fetchError) {
      throw fetchError
    }

    // Immutable status kontrolü
    const immutableDeals = dealsToDelete?.filter((deal: any) => 
      !canDeleteDeal(deal.stage)
    ) || []
    
    if (immutableDeals.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some deals cannot be deleted',
          details: immutableDeals.map((deal: any) => `${deal.title} (${deal.stage})`)
        },
        { status: 400 }
      )
    }

    // Deal'ları sil
    const { error: deleteError } = await supabase
      .from('Deal')
      .delete()
      .in('id', ids)
      .eq('companyId', companyId)

    if (deleteError) {
      throw deleteError
    }

    // Activity Log
    const locale = (request.headers.get('x-locale') || 'tr') as 'tr' | 'en'
    const activityMessage = getActivityMessage(locale, 'dealsBulkDeleted', {
      count: ids.length.toString(),
    })

    await supabase.from('ActivityLog').insert({
      action: 'DELETE',
      entityType: 'Deal',
      entityId: ids.join(','),
      userId: session.user.id,
      companyId: session.user.companyId,
      description: activityMessage,
      meta: {
        dealIds: ids,
        count: ids.length,
        bulkOperation: true,
      },
    })

    return NextResponse.json({ success: true, deletedCount: ids.length })
  } catch (error: any) {
    console.error('Bulk delete deals error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to bulk delete deals' },
      { status: 500 }
    )
  }
}

