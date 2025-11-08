import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'

// Cache'i kapat - PUT/DELETE işlemlerinden sonra fresh data gelsin
export const dynamic = 'force-dynamic'

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
        console.error('Customers [id] GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const canRead = await hasPermission('customer', 'read', session.user.id)
    if (!canRead) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Müşteri görüntüleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Customer'ı ilişkili verilerle çek
    const { data, error } = await supabase
      .from('Customer')
      .select(
        `
        *,
        Deal (
          id,
          title,
          stage,
          value,
          status,
          createdAt
        ),
        Quote (
          id,
          title,
          status,
          total,
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
          tracking,
          status,
          createdAt
        )
      `
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
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
      .eq('entity', 'Customer')
      .eq('meta->>id', id)
      .order('createdAt', { ascending: false })
      .limit(20)

    return NextResponse.json(
      {
        ...(data as any),
        activities: activities || [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
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
        console.error('Customers [id] PUT API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canUpdate kontrolü
    const canUpdate = await hasPermission('customer', 'update', session.user.id)
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Müşteri güncelleme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Sadece schema.sql'de olan kolonları gönder
    // schema.sql: name, email, phone, city, status, companyId, updatedAt
    // schema-extension.sql: address, sector, website, taxNumber, fax, notes (migration çalıştırılmamış olabilir - GÖNDERME!)
    // migration 004: customerCompanyId (müşteri hangi firmada çalışıyor)
    const customerData: any = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      city: body.city || null,
      status: body.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
    }
    // customerCompanyId - müşteri hangi firmada çalışıyor (migration 004'te eklendi)
    if (body.customerCompanyId !== undefined && body.customerCompanyId !== null && body.customerCompanyId !== '') {
      customerData.customerCompanyId = body.customerCompanyId
    } else if (body.customerCompanyId === null || body.customerCompanyId === '') {
      // Boş string veya null ise NULL yap (ilişkiyi kaldır)
      customerData.customerCompanyId = null
    }
    // NOT: address, sector, website, taxNumber, fax, notes schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase database type tanımları eksik, update metodu dinamik tip bekliyor
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data, error } = await (supabase
      .from('Customer') as any)
      .update(customerData)
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı ekle
    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Customer',
        action: 'UPDATE',
        description: `Müşteri güncellendi: ${body.name}`,
        meta: { entity: 'Customer', action: 'update', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    // Cache'i kapat - PUT işleminden sonra fresh data gelsin
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update customer' },
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
        console.error('Customers [id] DELETE API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canDelete kontrolü
    const canDelete = await hasPermission('customer', 'delete', session.user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Müşteri silme yetkiniz yok' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    // Service role key ile RLS bypass - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Önce customer'ı al (ActivityLog için)
    const { data: customer } = await supabase
      .from('Customer')
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    // Silme işlemi - companyId kontrolü API seviyesinde yapılıyor (güvenlik)
    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog kaydı ekle
    if (customer) {
      // @ts-ignore - Supabase type inference issue with dynamic table names
      await (supabase.from('ActivityLog') as any).insert([
        {
          entity: 'Customer',
          action: 'DELETE',
          description: `Müşteri silindi: ${(customer as any).name}`,
          meta: { entity: 'Customer', action: 'delete', id },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    }

    // Cache'i kapat - DELETE işleminden sonra fresh data gelsin
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete customer' },
      { status: 500 }
    )
  }
}



