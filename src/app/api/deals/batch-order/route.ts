import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Batch order update endpoint - Kanban sıralama için
 * POST /api/deals/batch-order
 * Body: { orders: [{ id: string, displayOrder: number }] }
 */
export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orders } = body

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: 'Invalid orders array' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId

    // Her bir deal için displayOrder güncelle
    const updatePromises = orders.map(async ({ id, displayOrder }: { id: string; displayOrder: number }) => {
      let updateQuery = supabase
        .from('Deal')
        .update({ 
          displayOrder: displayOrder,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)

      // SuperAdmin değilse companyId filtresi ekle
      if (!isSuperAdmin) {
        updateQuery = updateQuery.eq('companyId', companyId)
      }

      return updateQuery
    })

    const results = await Promise.all(updatePromises)
    
    // Hataları kontrol et
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Batch order update errors:', errors)
      return NextResponse.json(
        { 
          error: 'Some orders failed to update',
          errors: errors.map(e => e.error),
        },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Deal',
          action: 'BATCH_ORDER_UPDATE',
          description: `${orders.length} fırsatın sıralaması güncellendi`,
          meta: { 
            entity: 'Deal', 
            action: 'batch_order_update', 
            count: orders.length,
            orders: orders.map((o: any) => ({ id: o.id, displayOrder: o.displayOrder })),
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (logError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', logError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: orders.length 
    })
  } catch (error: any) {
    console.error('Batch order update error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to update orders' },
      { status: 500 }
    )
  }
}

