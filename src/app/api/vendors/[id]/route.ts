import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Vendor'ı ilişkili verilerle çek (RLS bypass ile)
    const { data, error } = await supabase
      .from('Vendor')
      .select(
        `
        *,
        Quote (
          id,
          title,
          status,
          total,
          createdAt
        ),
        Product (
          id,
          name,
          price,
          stock,
          createdAt
        ),
        Invoice (
          id,
          title,
          status,
          total,
          createdAt
        ),
        Shipment (
          id,
          trackingNumber,
          status,
          createdAt
        )
      `
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId) // API seviyesinde kontrol
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    const { data, error } = await supabase
      .from('Vendor')
      // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
      .update({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        city: body.city || null,
        sector: body.sector || null,
        address: body.address || null,
        website: body.website || null,
        taxNumber: body.taxNumber || null,
        taxOffice: body.taxOffice || null,
        description: body.description || null,
        status: body.status || 'ACTIVE',
      })
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    try {
      // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Vendor',
          action: 'UPDATE',
          description: `Tedarikçi güncellendi: ${body.name || (data as any)?.name || 'N/A'}`,
          meta: { entity: 'Vendor', action: 'update', id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (logError) {
      // ActivityLog hatası ana işlemi etkilemez
      console.error('ActivityLog error:', logError)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    const { error } = await supabase
      .from('Vendor')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı
    if (id) {
      try {
        // Önce vendor'ı al (name için)
        const { data: vendor } = await supabase
          .from('Vendor')
          .select('name')
          .eq('id', id)
          .eq('companyId', session.user.companyId)
          .single()

        if (vendor) {
          // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
          await supabase.from('ActivityLog').insert([
            {
              entity: 'Vendor',
              action: 'DELETE',
              description: `Tedarikçi silindi: ${(vendor as any)?.name || 'N/A'}`,
              meta: { entity: 'Vendor', action: 'delete', id },
              userId: session.user.id,
              companyId: session.user.companyId,
            },
          ])
        }
      } catch (logError) {
        // ActivityLog hatası ana işlemi etkilemez
        console.error('ActivityLog error:', logError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}




