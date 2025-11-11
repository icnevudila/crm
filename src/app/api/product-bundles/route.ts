import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('ProductBundle')
      .select(`
        id, name, description, bundlePrice, regularPrice, discountPercent,
        isActive, validFrom, validUntil, createdAt,
        items:ProductBundleItem(
          id, quantity,
          product:Product(id, name, price)
        )
      `)
      .eq('companyId', session.user.companyId)
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Product bundles fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product bundles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.name || !body.bundlePrice) {
      return NextResponse.json(
        { error: 'Name and bundlePrice are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ProductBundle')
      .insert({
        name: body.name,
        description: body.description,
        bundlePrice: body.bundlePrice,
        regularPrice: body.regularPrice,
        discountPercent: body.discountPercent,
        isActive: body.isActive ?? true,
        validFrom: body.validFrom,
        validUntil: body.validUntil,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) throw error

    // Add bundle items
    if (body.items && body.items.length > 0) {
      const itemsToInsert = body.items.map((item: any) => ({
        bundleId: data.id,
        productId: item.productId,
        quantity: item.quantity || 1,
        companyId: session.user.companyId,
      }))

      await supabase.from('ProductBundleItem').insert(itemsToInsert)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Product bundle create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create product bundle' },
      { status: 500 }
    )
  }
}


