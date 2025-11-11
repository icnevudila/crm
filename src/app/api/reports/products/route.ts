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

    // Son 12 ayın verilerini çek
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    // Ürünleri çek
    let productsQuery = supabase
      .from('Product')
      .select('id, name, price, stock')
      .order('price', { ascending: false })
      .limit(100)
    
    if (!isSuperAdmin) {
      productsQuery = productsQuery.eq('companyId', companyId)
    }
    
    const { data: products, error: productsError } = await productsQuery

    // Gerçek satış verilerini çek (InvoiceItem'dan)
    // InvoiceItem'dan satış verilerini çek (PAID invoice'lar)
    let invoiceItemsQuery = supabase
      .from('InvoiceItem')
      .select('productId, quantity, unitPrice, total, Invoice!inner(status, createdAt, companyId)')
      .eq('Invoice.status', 'PAID')
      .gte('Invoice.createdAt', twelveMonthsAgo.toISOString())
      .limit(5000)
    
    if (!isSuperAdmin) {
      invoiceItemsQuery = invoiceItemsQuery.eq('Invoice.companyId', companyId)
    }
    
    const { data: invoiceItems, error: invoiceItemsError } = await invoiceItemsQuery

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    // Ürün bazlı satış toplamı hesapla
    const productSales: Record<string, { quantity: number; revenue: number; productName: string; price: number; stock: number }> = {}
    
    products?.forEach((product: any) => {
      productSales[product.id] = {
        quantity: 0,
        revenue: 0,
        productName: product.name,
        price: product.price || 0,
        stock: product.stock || 0,
      }
    })

    invoiceItems?.forEach((item: any) => {
      const productId = item.productId
      if (productSales[productId]) {
        const quantity = parseFloat(item.quantity) || 0
        // total varsa kullan, yoksa quantity * unitPrice hesapla
        // DÜZELTME: InvoiceItem.total kullan (bu kolon hala var, sadece Invoice ve Quote'da totalAmount var)
        const revenue = parseFloat(item.total) || (quantity * (parseFloat(item.unitPrice) || 0))
        productSales[productId].quantity += quantity
        productSales[productId].revenue += revenue
      }
    })

    // En çok satan ürünler (gerçek satış verisi - quantity bazlı)
    const topSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((product) => ({
        name: product.productName,
        value: product.quantity, // Satılan adet
        revenue: product.revenue, // Toplam gelir
        stock: product.stock,
      }))

    // Fiyat-performans analizi (fiyat ve satış ilişkisi)
    const pricePerformance = Object.values(productSales)
      .filter((p) => p.price > 0 && p.quantity > 0)
      .slice(0, 20)
      .map((product) => ({
        price: product.price,
        quantity: product.quantity, // Satılan adet
        revenue: product.revenue, // Toplam gelir
        name: product.productName,
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



