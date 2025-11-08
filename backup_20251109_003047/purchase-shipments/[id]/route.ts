import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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
    const supabase = getSupabaseWithServiceRole()

    // PurchaseTransaction'ı ilişkili verilerle çek
    const { data, error } = await supabase
      .from('PurchaseTransaction')
      .select(
        `
        *,
        Invoice (
          id,
          title,
          invoiceNumber,
          status,
          total,
          createdAt,
          Vendor (
            id,
            name,
            email
          )
        )
      `
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message || 'Purchase shipment not found' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Purchase shipment not found' }, { status: 404 })
    }

    // InvoiceItem'ları çek (mal kabul içeriği için)
    let invoiceItems = null
    if ((data as any).invoiceId) {
      try {
        const { data: items } = await supabase
          .from('InvoiceItem')
          .select(
            `
            *,
            Product (
              id,
              name,
              sku,
              barcode,
              stock,
              unit,
              incomingQuantity
            )
          `
          )
          .eq('invoiceId', (data as any).invoiceId)
          .eq('companyId', session.user.companyId)
          .order('createdAt', { ascending: true })
        
        invoiceItems = items || []
      } catch (err) {
        // Hata olsa bile devam et
      }
    }

    // StockMovement'ları çek (mal kabul ile ilgili)
    let stockMovements = null
    try {
      const { data: movements } = await supabase
        .from('StockMovement')
        .select(
          `
          *,
          Product (
            id,
            name
          ),
          User (
            id,
            name,
            email
          )
        `
        )
        .eq('relatedTo', 'PurchaseTransaction')
        .eq('relatedId', id)
        .eq('companyId', session.user.companyId)
        .order('createdAt', { ascending: false })
        .limit(50)
      
      stockMovements = movements || []
    } catch (err) {
      // Hata olsa bile devam et
    }

    // ActivityLog'ları çek
    const { data: activities } = await supabase
      .from('ActivityLog')
      .select(
        `
        *,
        User (
          name,
          email
        )
      `
      )
      .eq('companyId', session.user.companyId)
      .eq('entity', 'PurchaseTransaction')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json({
      ...(data as any),
      activities: activities || [],
      invoiceItems: invoiceItems || [],
      stockMovements: stockMovements || [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch purchase shipment' },
      { status: 500 }
    )
  }
}

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
    const supabase = getSupabaseWithServiceRole()

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (body.status) {
      updateData.status = body.status
    }

    const { data, error } = await supabase
      .from('PurchaseTransaction')
      // @ts-expect-error - Supabase database type tanımları eksik
      .update(updateData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      // @ts-expect-error - Supabase database type tanımları eksik
      await supabase.from('ActivityLog').insert([{
        entity: 'PurchaseTransaction',
        action: 'UPDATE',
        description: `Mal kabul güncellendi: ${body.status || 'Durum değiştirildi'}`,
        meta: { entity: 'PurchaseTransaction', action: 'update', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      }])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update purchase shipment' },
      { status: 500 }
    )
  }
}

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
    const supabase = getSupabaseWithServiceRole()

    const { error } = await supabase
      .from('PurchaseTransaction')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete purchase shipment' },
      { status: 500 }
    )
  }
}

