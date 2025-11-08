import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

// QuoteItem'ları getir (Quote ID ile)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const quoteId = searchParams.get('quoteId')

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('QuoteItem')
      .select('*, Product(id, name, price, stock)')
      .eq('quoteId', quoteId)
      .eq('companyId', session.user.companyId)
      .order('createdAt', { ascending: true })

    if (error) {
      console.error('QuoteItems API error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quote items' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('QuoteItems API exception:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch quote items',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
      },
      { status: 500 }
    )
  }
}

// QuoteItem oluştur
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = getSupabase()

    // QuoteItem verilerini oluştur
    const quoteItemData: any = {
      quoteId: body.quoteId,
      productId: body.productId,
      quantity: body.quantity || 1,
      unitPrice: body.unitPrice || 0,
      total: (body.quantity || 1) * (body.unitPrice || 0),
      companyId: session.user.companyId,
    }

    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    const { data, error } = await supabase
      .from('QuoteItem')
      // @ts-ignore - Supabase type inference issue with QuoteItem table
      .insert([quoteItemData])
      .select('*, Product(id, name, price, stock)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create quote item' },
      { status: 500 }
    )
  }
}

