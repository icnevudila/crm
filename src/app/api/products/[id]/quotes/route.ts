import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const productId = params.id
    const supabase = getSupabaseWithServiceRole()

    // QuoteItem'dan bu ürünü içeren teklifleri bul
    const { data: quoteItems, error } = await supabase
      .from('QuoteItem')
      .select(`
        id,
        quantity,
        unitPrice,
        total,
        Quote:quoteId (
          id,
          quoteNumber,
          title,
          status,
          totalAmount,
          createdAt,
          Customer:customerId (
            id,
            name
          )
        )
      `)
      .eq('productId', productId)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching quotes for product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Quote bilgilerini düzenle (QuoteItem içindeki Quote'u dışarı al)
    const quotes = quoteItems
      ?.map((item: any) => ({
        ...item.Quote,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
      .filter((q: any) => q.id) // Quote'u olmayan itemları filtrele

    return NextResponse.json(quotes || [])
  } catch (error: any) {
    console.error('GET /api/products/[id]/quotes error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

