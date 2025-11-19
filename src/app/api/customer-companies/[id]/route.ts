import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

const DUPLICATE_TAX_MESSAGE =
  'Bu vergi dairesi ve vergi numarası kombinasyonu zaten kayıtlı. Lütfen mevcut kaydı güncelleyin.'

// PERFORMANCE FIX: force-dynamic cache'i tamamen kapatıyor - kaldırıldı
// export const dynamic = 'force-dynamic' // KALDIRILDI - cache performansı için
export const revalidate = 60 // 60 saniye revalidate (performans için)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // PERFORMANCE FIX: getSafeSession kullan (cache var) - getServerSession yerine
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    if (!session?.user?.companyId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Müşteri firmasını ilişkili verilerle çek
    // ÖNEMLİ: customerCompanyId ile ilişkili verileri ayrı query'lerle çek (performans için)
    // NOT: district kolonu veritabanında yok, bu yüzden select'te belirtiyoruz
    let companyQuery = supabase
      .from('CustomerCompany')
      .select(
        'id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description, companyId'
      )
      .eq('id', id)

    if (!isSuperAdmin) {
      companyQuery = companyQuery.eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
    }

    const { data: company, error } = await companyQuery.maybeSingle() // .single() yerine .maybeSingle() kullan - hata vermez, sadece null döner

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
        // Customers (İletişim Kişileri)
        supabase
          .from('Customer')
          .select('id, name, email, phone, status, createdAt')
          .eq('customerCompanyId', id)
          .order('createdAt', { ascending: false })
          .limit(100), // Limit artırıldı - tüm iletişim kişilerini göster
      ])

      // Promise.allSettled sonuçlarını parse et
      const [dealsResult, quotesResult, invoicesResult, shipmentsResult, financeResult, meetingsResult, customersResult] = results.map((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value
          // Hata kontrolü - Supabase error varsa boş array döndür
          if (value.error) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Related data fetch error:', value.error)
            }
            return { data: [], error: null }
          }
          return value
        } else {
          // Hata durumunda boş array döndür
          if (process.env.NODE_ENV === 'development') {
            console.warn('Related data fetch failed:', result.reason)
          }
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

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // PERFORMANCE FIX: Cache headers eklendi
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Müşteri firması getirilemedi', message: error?.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    if (!session?.user?.companyId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = getSupabaseWithServiceRole()

    // Müşteri firmasını güncelle
    // @ts-ignore - Supabase type inference issue with dynamic table names
    let updateQuery = (supabase.from('CustomerCompany') as any)
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

    if (!isSuperAdmin) {
      updateQuery = updateQuery.eq('companyId', session.user.companyId)
    }

    const { data: company, error } = await updateQuery
      .select(
        'id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description, companyId'
      )
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: DUPLICATE_TAX_MESSAGE }, { status: 409 })
      }

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
        companyId: company.companyId,
      },
    ])

    // NOT: revalidateTag API route'larda çalışmaz - dynamic = 'force-dynamic' yeterli
    // Cache zaten kapalı, fresh data dönecek

    return NextResponse.json(company)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Müşteri firması güncellenemedi', message: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    if (!session?.user?.companyId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getSupabaseWithServiceRole()

    // Önce müşteri firmasını çek (ActivityLog için)
    // @ts-ignore - Supabase type inference issue with dynamic table names
    let companyQuery = (supabase.from('CustomerCompany') as any)
      .select('name, companyId')
      .eq('id', id)

    if (!isSuperAdmin) {
      companyQuery = companyQuery.eq('companyId', session.user.companyId)
    }

    const { data: company } = await companyQuery.single()

    if (!company) {
      return NextResponse.json({ error: 'Customer company not found' }, { status: 404 })
    }

    // Müşteri firmasını sil
    let deleteQuery = supabase
      .from('CustomerCompany')
      .delete()
      .eq('id', id)

    if (!isSuperAdmin) {
      deleteQuery = deleteQuery.eq('companyId', session.user.companyId)
    }

    const { error } = await deleteQuery

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
        companyId: company.companyId,
      },
    ])

    // NOT: revalidateTag API route'larda çalışmaz - dynamic = 'force-dynamic' yeterli
    // Cache zaten kapalı, fresh data dönecek

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Müşteri firması silinemedi', message: error?.message },
      { status: 500 }
    )
  }
}

