import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Vendor'ı ilişkili verilerle çek (RLS bypass ile)
    // NOT: createdBy/updatedBy kolonları migration'da yoksa hata verir, bu yüzden kaldırıldı
    const { data, error } = await supabase
      .from('Vendor')
      .select(
        `
        id, name, email, phone, address, status, companyId, createdAt, updatedAt,
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()
    
    // SuperAdmin kontrolü
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Update işlemi - SuperAdmin için companyId filtresi yok
    let updateQuery = supabase
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
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
    
    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', session.user.companyId)
    }
    
    const { error: updateError } = await updateQuery

    if (updateError) {
      const { createErrorResponse } = await import('@/lib/error-handling')
      
      if (updateError.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(updateError.code)) {
        return createErrorResponse(updateError)
      }
      
      return NextResponse.json(
        { 
          error: updateError.message || 'Tedarikçi güncellenemedi',
          code: updateError.code || 'UPDATE_ERROR',
        },
        { status: 500 }
      )
    }
    
    // Update başarılı - güncellenmiş veriyi çek (SuperAdmin için companyId filtresi yok)
    let selectQuery = supabase
      .from('Vendor')
      .select(`
        id, name, email, phone, address, status, companyId, createdAt, updatedAt
      `)
      .eq('id', id)
    
    if (!isSuperAdmin) {
      selectQuery = selectQuery.eq('companyId', session.user.companyId)
    }
    
    const { data, error } = await selectQuery.single()

    if (error) {
      return NextResponse.json(
        { 
          error: error.message || 'Güncellenmiş tedarikçi bulunamadı',
          code: error.code || 'SELECT_ERROR',
        },
        { status: 500 }
      )
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
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
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




