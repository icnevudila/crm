import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabase } from '@/lib/supabase'

// QuoteItem getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // @ts-ignore - Supabase type inference issue with QuoteItem table
    const { data, error } = await supabase
      .from('QuoteItem')
      .select('*, Product(id, name, price, stock)')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'QuoteItem not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch quote item' },
      { status: 500 }
    )
  }
}

// QuoteItem güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabase()

    // Güncellenecek veriler
    const updateData: any = {}
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice
    if (body.quantity !== undefined || body.unitPrice !== undefined) {
      updateData.total = (body.quantity || 1) * (body.unitPrice || 0)
    }
    updateData.updatedAt = new Date().toISOString()

    // @ts-ignore - Supabase type inference issue with QuoteItem table
    const { data, error } = await supabase
      .from('QuoteItem')
      // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select('*, Product(id, name, price, stock)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update quote item' },
      { status: 500 }
    )
  }
}

// QuoteItem sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabase()

    // @ts-ignore - Supabase type inference issue with QuoteItem table
    const { error } = await supabase
      .from('QuoteItem')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete quote item' },
      { status: 500 }
    )
  }
}

