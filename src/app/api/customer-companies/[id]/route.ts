import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN bu sayfayı kullanmaz
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'SuperAdmin bu sayfayı kullanamaz' }, { status: 403 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Müşteri firmasını ilişkili verilerle çek
    const { data: company, error } = await supabase
      .from('CustomerCompany')
      .select(
        `
        *,
        Customer (
          id,
          name,
          email,
          phone,
          status,
          createdAt
        )
      `
      )
      .eq('id', id)
      .eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
      .single()

    if (error || !company) {
      return NextResponse.json(
        { error: error?.message || 'Customer company not found' },
        { status: error ? 500 : 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch customer company', message: error?.message },
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

    // SUPER_ADMIN bu sayfayı kullanmaz
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'SuperAdmin bu sayfayı kullanamaz' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Müşteri firmasını güncelle
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data: company, error } = await (supabase
      .from('CustomerCompany') as any)
      .update({
        name: body.name,
        sector: body.sector || null,
        city: body.city || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        taxNumber: body.taxNumber || null,
        taxOffice: body.taxOffice || null,
        description: body.description || null,
        status: body.status || 'ACTIVE',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    // @ts-ignore
    await supabase.from('ActivityLog').insert([
      {
        entity: 'CustomerCompany',
        action: 'UPDATE',
        description: `Müşteri firması güncellendi: ${body.name}`,
        meta: { entity: 'CustomerCompany', action: 'update', id, ...(body as any) },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    // NOT: revalidateTag API route'larda çalışmaz - dynamic = 'force-dynamic' yeterli
    // Cache zaten kapalı, fresh data dönecek

    return NextResponse.json(company)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update customer company', message: error?.message },
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

    // SUPER_ADMIN bu sayfayı kullanmaz
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'SuperAdmin bu sayfayı kullanamaz' }, { status: 403 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Önce müşteri firmasını çek (ActivityLog için)
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data: company } = await (supabase
      .from('CustomerCompany') as any)
      .select('name')
      .eq('id', id)
      .eq('companyId', session.user.companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Customer company not found' }, { status: 404 })
    }

    // Müşteri firmasını sil
    const { error } = await supabase
      .from('CustomerCompany')
      .delete()
      .eq('id', id)
      .eq('companyId', session.user.companyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ActivityLog
    // @ts-ignore
    await supabase.from('ActivityLog').insert([
      {
        entity: 'CustomerCompany',
        action: 'DELETE',
        description: `Müşteri firması silindi: ${company.name}`,
        meta: { entity: 'CustomerCompany', action: 'delete', id },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    // NOT: revalidateTag API route'larda çalışmaz - dynamic = 'force-dynamic' yeterli
    // Cache zaten kapalı, fresh data dönecek

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete customer company', message: error?.message },
      { status: 500 }
    )
  }
}

