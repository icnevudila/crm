import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - cache'i kapat (POST sonrası fresh data için)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('CustomerCompanies GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('CustomerCompanies GET - No session or companyId:', { session: !!session, companyId: session?.user?.companyId })
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN bu sayfayı kullanmaz (kendi sayfası var)
    // Sadece ADMIN ve normal kullanıcılar müşteri firmalarını görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (isSuperAdmin) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('CustomerCompanies GET - SuperAdmin tried to access:', { role: session.user.role })
      }
      return NextResponse.json({ error: 'Forbidden', message: 'SuperAdmin bu sayfayı kullanamaz' }, { status: 403 })
    }

    // Debug: Development'ta session bilgilerini logla
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerCompanies GET - Session info:', {
        userId: session.user.id,
        companyId: session.user.companyId,
        role: session.user.role,
      })
    }

    const { searchParams } = new URL(request.url)
    const searchParam = searchParams.get('search')
    const statusParam = searchParams.get('status')

    const supabase = getSupabaseWithServiceRole()

    // Query builder oluştur - önce müşteri firmalarını çek
    let query = supabase
      .from('CustomerCompany')
      .select('id, name, sector, city, status, createdAt', { count: 'exact' })
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

    // Her müşteri firması için müşteri sayısını çek (paralel)
    const companies = await Promise.all(
      (companiesData || []).map(async (company: any) => {
        // Bu firmada çalışan müşteri sayısı
        const { count: customersCount, error: customerCountError } = await supabase
          .from('Customer')
          .select('*', { count: 'exact', head: true })
          .eq('customerCompanyId', company.id)
          .eq('companyId', session.user.companyId)

        if (customerCountError && process.env.NODE_ENV === 'development') {
          console.warn('CustomerCompanies GET - Customer count error:', customerCountError)
        }

        return {
          id: company.id,
          name: company.name,
          sector: company.sector,
          city: company.city,
          status: company.status,
          createdAt: company.createdAt,
          stats: {
            customers: customersCount || 0,
          },
        }
      })
    )

    // Debug: Development'ta log ekle - veritabanından gelen veriyi göster
    if (process.env.NODE_ENV === 'development') {
      console.log('CustomerCompanies GET - Final companies:', {
        count: companies.length,
        companies: companies.map(c => ({ id: c.id, name: c.name, status: c.status })),
        rawDataCount: companiesData?.length || 0,
      })
    }

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
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('CustomerCompanies POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SUPER_ADMIN bu sayfayı kullanmaz
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden', message: 'SuperAdmin bu sayfayı kullanamaz' }, { status: 403 })
    }

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
    
    // Body validation - name zorunlu
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Firma adı gereklidir' },
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
          companyId: session.user.companyId, // Multi-tenant: Hangi CRM şirketine ait
        },
      ])
      .select()
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

