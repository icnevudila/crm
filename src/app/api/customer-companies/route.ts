import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // CRITICAL: Her zaman log ekle - 403 hatasını debug etmek için
  console.log('CustomerCompanies GET - Request received:', {
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  })

  try {
    // Session kontrolü - cache ile (30 dakika cache - çok daha hızlı!)
    const { session, error: sessionError } = await getSafeSession(request)
    
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar (SuperAdmin dahil) müşteri firmalarını görebilir
    // SuperAdmin kontrolü kaldırıldı - herkes CustomerCompany görebilir
    // NOT: Permissions kontrolü yapılmıyor - tüm kullanıcılar müşteri firmalarını görebilir

    console.log('CustomerCompanies GET - Session validated:', {
      userId: session.user.id,
      companyId: session.user.companyId,
      role: session.user.role,
    })

    const { searchParams } = new URL(request.url)
    const searchParam = searchParams.get('search')
    const statusParam = searchParams.get('status')

    // CRITICAL: Query başlamadan önce log ekle
    console.log('CustomerCompanies GET - Starting query:', {
      searchParam,
      statusParam,
      companyId: session.user.companyId,
    })

    const supabase = getSupabaseWithServiceRole()

    // Query builder oluştur - önce müşteri firmalarını çek
    // NOT: district kolonu veritabanında yok, bu yüzden select'te kullanmıyoruz
    let query = supabase
      .from('CustomerCompany')
      .select('id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description', { count: 'exact' })
      .eq('companyId', session.user.companyId) // Sadece kendi şirketinin müşteri firmaları
      .order('name', { ascending: true })
      .limit(1000) // Maksimum 1000 kayıt - performans için

    // Search filtresi (name veya city'de arama)
    if (searchParam) {
      query = query.or(`name.ilike.%${searchParam}%,city.ilike.%${searchParam}%`)
    }

    // Status filtresi
    if (statusParam && statusParam !== 'all') {
      query = query.eq('status', statusParam)
    }

    const { data: companiesData, error, count } = await query

    if (error) {
      console.error('CustomerCompanies GET - Supabase query error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        companyId: session.user.companyId,
      })
      return NextResponse.json(
        {
          error: error.message || 'Failed to fetch customer companies',
          ...(process.env.NODE_ENV === 'development' && { 
            details: error,
            code: error.code,
            hint: error.hint,
          }),
        },
        { status: 500 }
      )
    }

    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerCompanies GET - Query result:', {
        companyId: session.user.companyId,
        companiesDataCount: companiesData?.length || 0,
        count: count,
        companiesData: companiesData,
        searchParam,
        statusParam,
      })
    }

    // OPTİMİZE: N+1 query problemini çöz - tüm customer'ları tek seferde çek ve grupla
    // Önceki: Her company için ayrı query (N+1 problem - çok yavaş!)
    // Yeni: Tek query ile tüm customer'ları çek, JavaScript'te grupla (çok daha hızlı!)
    const { data: allCustomers, error: customersError } = await supabase
      .from('Customer')
      .select('id, customerCompanyId')
      .eq('companyId', session.user.companyId)

    if (customersError && process.env.NODE_ENV === 'development') {
      console.warn('CustomerCompanies GET - Customers fetch error:', customersError)
    }

    // Customer sayılarını grupla (companyId bazında)
    const customerCounts = new Map<string, number>()
    if (allCustomers) {
      allCustomers.forEach((customer) => {
        if (customer.customerCompanyId) {
          customerCounts.set(
            customer.customerCompanyId,
            (customerCounts.get(customer.customerCompanyId) || 0) + 1
          )
        }
      })
    }

    // Company'leri map et ve customer sayılarını ekle
    const companies = (companiesData || []).map((company: any) => ({
      id: company.id,
      name: company.name,
      sector: company.sector || null,
      city: company.city || null,
      status: company.status,
      taxOffice: company.taxOffice || null,
      taxNumber: company.taxNumber || null,
      lastMeetingDate: company.lastMeetingDate || null,
      contactPerson: company.contactPerson || null,
      phone: company.phone || null,
      countryCode: company.countryCode || null,
      logoUrl: company.logoUrl || null,
      createdAt: company.createdAt,
      stats: {
        customers: customerCounts.get(company.id) || 0,
      },
    }))

    // CRITICAL: Her zaman log ekle - 403 hatasını debug etmek için
    console.log('CustomerCompanies GET - Success:', {
      count: companies.length,
      companies: companies.map(c => ({ id: c.id, name: c.name, status: c.status })),
      rawDataCount: companiesData?.length || 0,
      companyId: session.user.companyId,
    })

    // Cache headers - POST sonrası fresh data için cache'i kapat
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı
    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // POST sonrası fresh data için cache'i kapat
        'X-Total-Count': String(count || companies.length),
      },
    })
  } catch (error: any) {
    console.error('CustomerCompanies GET exception:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch customer companies',
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // KURUM İÇİ FİRMA YÖNETİMİ: Tüm kullanıcılar (SuperAdmin dahil) müşteri firması ekleyebilir
    // SuperAdmin kontrolü kaldırıldı - herkes CustomerCompany ekleyebilir

    // Request body'yi parse et - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('CustomerCompanies POST API JSON parse error:', parseError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON', message: parseError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }
    
    // Body validation - zorunlu alanlar: name, contactPerson, phone, taxOffice, taxNumber
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Firma adı gereklidir' },
        { status: 400 }
      )
    }
    if (!body.contactPerson || typeof body.contactPerson !== 'string' || body.contactPerson.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Kontak kişi gereklidir' },
        { status: 400 }
      )
    }
    if (!body.phone || typeof body.phone !== 'string' || body.phone.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Telefon gereklidir' },
        { status: 400 }
      )
    }
    if (!body.taxOffice || typeof body.taxOffice !== 'string' || body.taxOffice.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Vergi dairesi gereklidir' },
        { status: 400 }
      )
    }
    if (!body.taxNumber || typeof body.taxNumber !== 'string' || body.taxNumber.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Vergi numarası gereklidir' },
        { status: 400 }
      )
    }
    
    // Müşteri firması oluştur - service role key kullan (RLS bypass) - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // CustomerCompany oluştur
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data: company, error } = await (supabase
      .from('CustomerCompany') as any)
      .insert([
        {
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
          companyId: session.user.companyId, // Multi-tenant: Hangi CRM şirketine ait
        },
      ])
      .select('id, name, sector, city, status, taxOffice, taxNumber, lastMeetingDate, createdAt, updatedAt, contactPerson, phone, countryCode, logoUrl, address, email, website, description, companyId')
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { 
          error: error.message || 'Failed to create customer company',
          ...(process.env.NODE_ENV === 'development' && { details: error }),
        },
        { status: 500 }
      )
    }

    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerCompany POST success:', {
        id: company.id,
        name: company.name,
        companyId: company.companyId,
        sessionCompanyId: session.user.companyId,
      })
    }

    // ActivityLog kaydı
    // @ts-ignore - Supabase type inference issue with dynamic table names
    await (supabase.from('ActivityLog') as any).insert([
      {
        entity: 'CustomerCompany',
        action: 'CREATE',
        description: `Yeni müşteri firması oluşturuldu: ${body.name}`,
        meta: { entity: 'CustomerCompany', action: 'create', id: company.id, ...(body as any) },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    // NOT: revalidateTag API route'larda çalışmaz - dynamic = 'force-dynamic' yeterli
    // Cache zaten kapalı, fresh data dönecek

    return NextResponse.json(company, { status: 201 })
  } catch (error: any) {
    console.error('CustomerCompanies POST exception:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create customer company',
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}

