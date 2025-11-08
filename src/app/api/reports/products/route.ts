import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()

    let productsQuery = supabase
      .from('Product')
      .select('id, name, price, stock')
      .order('price', { ascending: false })
      .limit(100)
    
    if (!isSuperAdmin) {
      productsQuery = productsQuery.eq('companyId', companyId)
    }
    
    const { data: products, error } = await productsQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // En çok satan ürünler (fiyat bazlı - gerçek satış verisi yoksa fiyat kullan)
    const topSellers = (products || [])
      .sort((a: any, b: any) => (b.price || 0) - (a.price || 0))
      .slice(0, 10)
      .map((product: any) => ({
        name: product.name,
        value: product.price || 0,
        stock: product.stock || 0,
      }))

    // Fiyat-performans analizi (fiyat ve stok ilişkisi)
    const pricePerformance = (products || [])
      .filter((p: any) => p.price && p.price > 0)
      .slice(0, 20)
      .map((product: any) => ({
        price: product.price || 0,
        stock: product.stock || 0,
        name: product.name,
      }))

    return NextResponse.json({
      topSellers,
      pricePerformance,
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch product reports' },
      { status: 500 }
    )
  }
}



