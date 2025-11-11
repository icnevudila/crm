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

    // InvoiceItem'dan bu ürünü içeren faturaları bul
    const { data: invoiceItems, error } = await supabase
      .from('InvoiceItem')
      .select(`
        id,
        quantity,
        unitPrice,
        total,
        Invoice:invoiceId (
          id,
          invoiceNumber,
          title,
          status,
          grandTotal,
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
      console.error('Error fetching invoices for product:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invoice bilgilerini düzenle (InvoiceItem içindeki Invoice'u dışarı al)
    const invoices = invoiceItems
      ?.map((item: any) => ({
        ...item.Invoice,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
      .filter((inv: any) => inv.id) // Invoice'u olmayan itemları filtrele

    return NextResponse.json(invoices || [])
  } catch (error: any) {
    console.error('GET /api/products/[id]/invoices error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

