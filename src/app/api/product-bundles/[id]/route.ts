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
      .from('ProductBundle')
      .select(`
        *,
        items:ProductBundleItem(
          id,
          quantity,
          product:Product!ProductBundleItem_productId_fkey(
            id,
            name,
            sku,
            price,
            stock,
            unit
          )
        )
      `)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      console.error('ProductBundle fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('ProductBundle GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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
    const { name, description, totalPrice, discount, finalPrice, status, items } = body

    const supabase = getSupabaseWithServiceRole()
    const locale = request.headers.get('x-locale') || 'tr'

    // Bundle güncelle
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (totalPrice !== undefined) updateData.totalPrice = parseFloat(totalPrice) || 0
    if (discount !== undefined) updateData.discount = parseFloat(discount) || 0
    if (finalPrice !== undefined) updateData.finalPrice = parseFloat(finalPrice) || totalPrice
    if (status !== undefined) updateData.status = status
    updateData.updatedAt = new Date().toISOString()

    const { data: bundle, error: bundleError } = await supabase
      .from('ProductBundle')
      .update(updateData)
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (bundleError) {
      console.error('ProductBundle update error:', bundleError)
      return NextResponse.json({ error: bundleError.message }, { status: 500 })
    }

    // Items güncelle (varsa)
    if (items && Array.isArray(items)) {
      // Eski items'ları sil
      await supabase
        .from('ProductBundleItem')
        .delete()
        .eq('bundleId', params.id)
        .eq('companyId', session.user.companyId)

      // Yeni items'ları ekle
      if (items.length > 0) {
        const bundleItems = items.map((item: any) => ({
          bundleId: params.id,
          productId: item.productId,
          quantity: parseInt(item.quantity) || 1,
          companyId: session.user.companyId,
        }))

        const { error: itemsError } = await supabase
          .from('ProductBundleItem')
          .insert(bundleItems)

        if (itemsError) {
          console.error('ProductBundleItem update error:', itemsError)
          return NextResponse.json({ error: itemsError.message }, { status: 500 })
        }
      }
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'ProductBundle',
          action: 'UPDATE',
          description: getActivityMessage(locale, 'productBundleUpdated', { name: bundle.name }),
          meta: {
            entity: 'ProductBundle',
            action: 'update',
            bundleId: bundle.id,
            name: bundle.name,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog creation error:', activityError)
    }

    // Bundle'ı items ile birlikte döndür
    const { data: bundleWithItems } = await supabase
      .from('ProductBundle')
      .select(`
        *,
        items:ProductBundleItem(
          id,
          quantity,
          product:Product!ProductBundleItem_productId_fkey(
            id,
            name,
            sku,
            price,
            stock,
            unit
          )
        )
      `)
      .eq('id', params.id)
      .single()

    return NextResponse.json(bundleWithItems)
  } catch (error: any) {
    console.error('ProductBundle PUT error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
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
    const locale = request.headers.get('x-locale') || 'tr'

    // Bundle bilgilerini al (ActivityLog için)
    const { data: bundle } = await supabase
      .from('ProductBundle')
      .select('name')
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)
      .single()

    // Items'ları sil (CASCADE ile otomatik silinir ama manuel de silebiliriz)
    await supabase
      .from('ProductBundleItem')
      .delete()
      .eq('bundleId', params.id)
      .eq('companyId', session.user.companyId)

    // Bundle'ı sil
    const { error } = await supabase
      .from('ProductBundle')
      .delete()
      .eq('id', params.id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('ProductBundle delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'ProductBundle',
          action: 'DELETE',
          description: getActivityMessage(locale, 'productBundleDeleted', { name: bundle?.name || params.id }),
          meta: {
            entity: 'ProductBundle',
            action: 'delete',
            bundleId: params.id,
            name: bundle?.name,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      console.error('ActivityLog creation error:', activityError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('ProductBundle DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}


