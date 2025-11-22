import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getActivityMessage } from '@/lib/api-locale'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const supabase = getSupabaseWithServiceRole()

    let query = supabase
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
            stock
          )
        )
      `)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('ProductBundle fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('ProductBundle GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!name || !totalPrice || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Name, totalPrice, and items are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()
    const locale = request.headers.get('x-locale') || 'tr'

    // Bundle oluştur
    const { data: bundle, error: bundleError } = await supabase
      .from('ProductBundle')
      .insert({
        name,
        description: description || null,
        totalPrice: parseFloat(totalPrice) || 0,
        discount: parseFloat(discount) || 0,
        finalPrice: parseFloat(finalPrice) || totalPrice,
        status: status || 'ACTIVE',
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (bundleError) {
      console.error('ProductBundle creation error:', bundleError)
      return NextResponse.json({ error: bundleError.message }, { status: 500 })
    }

    // Bundle items oluştur
    const bundleItems = items.map((item: any) => ({
      bundleId: bundle.id,
      productId: item.productId,
      quantity: parseInt(item.quantity) || 1,
      companyId: session.user.companyId,
    }))

    const { error: itemsError } = await supabase
      .from('ProductBundleItem')
      .insert(bundleItems)

    if (itemsError) {
      // Bundle'ı sil (rollback)
      await supabase.from('ProductBundle').delete().eq('id', bundle.id)
      console.error('ProductBundleItem creation error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // ActivityLog
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'ProductBundle',
          action: 'CREATE',
          description: getActivityMessage(locale as 'tr' | 'en', 'productBundleCreated', { name }),
          meta: {
            entity: 'ProductBundle',
            action: 'create',
            bundleId: bundle.id,
            name,
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      console.error('ActivityLog creation error:', activityError)
    }

    // Notification - Admin/Sales rollere bildirim
    try {
      const { createNotificationForRole } = await import('@/lib/notification-helper')
      await createNotificationForRole({
        companyId: session.user.companyId,
        role: ['ADMIN', 'SALES', 'SUPER_ADMIN'],
        title: '📦 Yeni Ürün Paketi Oluşturuldu',
        message: `${name} paketi oluşturuldu. Final fiyat: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(bundleWithItems.finalPrice || bundleWithItems.totalPrice || 0)}`,
        type: 'info',
        relatedTo: 'ProductBundle',
        relatedId: bundle.id,
        link: `/tr/product-bundles/${bundle.id}`,
      }).catch(() => {}) // Notification hatası ana işlemi engellemez
    } catch (notificationError) {
      // Notification hatası ana işlemi engellemez
      if (process.env.NODE_ENV === 'development') {
        console.error('Product bundle notification error (non-critical):', notificationError)
      }
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
            stock
          )
        )
      `)
      .eq('id', bundle.id)
      .single()

    return NextResponse.json(bundleWithItems, { status: 201 })
  } catch (error: any) {
    console.error('ProductBundle POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
