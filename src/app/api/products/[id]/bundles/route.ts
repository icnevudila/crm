import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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

    // Bu ürünü içeren paketleri bul
    const { data: bundles, error } = await supabase
      .from('ProductBundle')
      .select(`
        id,
        name,
        description,
        totalPrice,
        discount,
        finalPrice,
        status,
        createdAt,
        items:ProductBundleItem!inner(
          id,
          quantity,
          bundleId
        )
      `)
      .eq('companyId', session.user.companyId)
      .eq('items.productId', params.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('[Products Bundles API] Bundle fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(bundles || [])
  } catch (error: any) {
    console.error('[Products Bundles API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}




