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
    // ÖNEMLİ: customerCompanyId ile ilişkili verileri ayrı query'lerle çek (performans için)
    // NOT: district kolonu veritabanında yok, bu yüzden select'te belirtiyoruz
    const { data: company, error } = await supabase
      .from('CustomerCompany')
      .select('id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description, companyId')
      .eq('id', id)
      .eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
      .maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

    if (error || !company) {
      return NextResponse.json(
        { error: error?.message || 'Customer company not found' },
        { status: error ? 500 : 404 }
      )
    }

    // customerCompanyId ile ilişkili verileri ayrı query'lerle çek (performans için)
    // ÖNEMLİ: JOIN yerine ayrı query'ler kullan - Supabase JOIN'ler yavaş
    // Her query'yi try-catch ile sarmalıyoruz - tablo yoksa boş array döndür
    const fetchRelatedData = async () => {
      const results = await Promise.allSettled([
        // Deals
        supabase
          .from('Deal')
          .select('id, title, stage, value, status, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
        // Quotes
        supabase
          .from('Quote')
          .select('id, title, status, total, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
        // Invoices
        supabase
          .from('Invoice')
          .select('id, title, status, total, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
        // Shipments
        supabase
          .from('Shipment')
          .select('id, tracking, status, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
        // Finance
        supabase
          .from('Finance')
          .select('id, type, amount, description, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
        // Meetings
        supabase
          .from('Meeting')
          .select('id, title, meetingDate, status, createdAt')
          .eq('customerCompanyId', id)
          .order('meetingDate', { ascending: false })
          .limit(10),
        // Customers
        supabase
          .from('Customer')
          .select('id, name, email, phone, status, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(10),
      ])

      // Promise.allSettled sonuçlarını parse et
      const [dealsResult, quotesResult, invoicesResult, shipmentsResult, financeResult, meetingsResult, customersResult] = results.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          // Hata durumunda boş array döndür
          return { data: [], error: null }
        }
      })

      return {
        Deal: dealsResult.data || [],
        Quote: quotesResult.data || [],
        Invoice: invoicesResult.data || [],
        Shipment: shipmentsResult.data || [],
        Finance: financeResult.data || [],
        Meeting: meetingsResult.data || [],
        Customer: customersResult.data || [],
      }
    }

    const relatedData = await fetchRelatedData()

    // Response'u oluştur
    const response = {
      ...(company as any),
      ...relatedData,
    }

    return NextResponse.json(response)
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
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        countryCode: body.countryCode || '+90',
        taxOffice: body.taxOffice || null,
        taxNumber: body.taxNumber || null,
        sector: body.sector || null,
        city: body.city || null,
        // district kolonu veritabanında yok, bu yüzden kaldırıldı
        address: body.address || null,
        email: body.email || null,
        website: body.website || null,
        description: body.description || null,
        status: body.status || 'POT',
        logoUrl: body.logoUrl || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
      .select('id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description, companyId')
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
        description: `Müşteri firması bilgileri güncellendi: ${body.name}`,
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

