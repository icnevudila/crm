import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function DELETE(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Toplu silme - companyId kontrolü ile
    const { error } = await supabase
      .from('Customer')
      .delete()
      .in('id', ids)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Customer',
          action: 'BULK_DELETE',
          description: `${ids.length} müşteri toplu olarak silindi`,
          meta: { entity: 'Customer', action: 'bulk_delete', ids, count: ids.length },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json({ success: true, deletedCount: ids.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to bulk delete customers' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids, data } = await request.json()
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 })
    }

    const supabase = getSupabaseWithServiceRole()

    // Toplu güncelleme - companyId kontrolü ile
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('Customer')
      // @ts-expect-error - Supabase type system is too strict for dynamic updates
      .update(updateData)
      .in('id', ids)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Customer',
          action: 'BULK_UPDATE',
          description: `${ids.length} müşteri toplu olarak güncellendi`,
          meta: { entity: 'Customer', action: 'bulk_update', ids, data, count: ids.length },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ] as any)
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('ActivityLog error:', activityError)
      }
    }

    return NextResponse.json({ success: true, updatedCount: ids.length })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to bulk update customers' },
      { status: 500 }
    )
  }
}

