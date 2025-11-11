import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Login sayfası için cache - 30 saniye (yeni firmalar için)
export const revalidate = 30

export async function GET(request: Request) {
  try {
    // Companies endpoint'i login sayfası için - session kontrolü yok
    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { 
          error: 'Supabase configuration missing',
          message: 'NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY eksik. Lütfen .env.local dosyasını kontrol edin.',
        },
        { status: 500 }
      )
    }

    // Login sayfası için - RLS bypass için service role key kullan
    const { getSupabaseWithServiceRole } = await import('@/lib/supabase')
    let supabase
    
    try {
      supabase = getSupabaseWithServiceRole()
    } catch (error: any) {
      console.error('Supabase client creation error:', error)
      return NextResponse.json(
        { 
          error: 'Supabase client creation failed',
          message: error?.message || 'Supabase bağlantısı oluşturulamadı',
        },
        { status: 500 }
      )
    }

    // URL parametrelerini al (filtreleme için)
    const url = new URL(request.url)
    const searchParam = url.searchParams.get('search') || ''
    const statusParam = url.searchParams.get('status') || ''
    
    // Query builder oluştur - önce şirketleri çek
    let query = supabase
      .from('Company')
      .select('id, name, sector, city, status, createdAt', { count: 'exact' })
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
      console.error('Supabase query error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // Tablo yoksa veya RLS sorunu varsa daha açıklayıcı mesaj
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Company tablosu bulunamadı',
            message: 'Supabase\'de Company tablosu yok veya migration çalıştırılmamış. Lütfen schema.sql dosyasını çalıştırın.',
            code: error.code,
          },
          { status: 500 }
        )
      }

      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        return NextResponse.json(
          { 
            error: 'RLS policy hatası',
            message: 'Row-Level Security (RLS) politikaları Company tablosu için login sayfasında şirketleri görmeye izin vermiyor. Lütfen RLS politikalarını kontrol edin.',
            code: error.code,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message || 'Supabase query failed',
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    // Her şirket için istatistikleri paralel olarak çek (performans için)
    const companies = await Promise.all(
      (companiesData || []).map(async (company: any) => {
        // Her şirket için count'ları paralel çek
        const [customersCount, dealsCount, quotesCount, invoicesCount] = await Promise.all([
          supabase
            .from('Customer')
            .select('*', { count: 'exact', head: true })
            .eq('companyId', company.id),
          supabase
            .from('Deal')
            .select('*', { count: 'exact', head: true })
            .eq('companyId', company.id),
          supabase
            .from('Quote')
            .select('*', { count: 'exact', head: true })
            .eq('companyId', company.id),
          supabase
            .from('Invoice')
            .select('*', { count: 'exact', head: true })
            .eq('companyId', company.id),
        ])

        return {
          id: company.id,
          name: company.name,
          sector: company.sector,
          city: company.city,
          status: company.status,
          createdAt: company.createdAt,
          stats: {
            customers: customersCount.count || 0,
            deals: dealsCount.count || 0,
            quotes: quotesCount.count || 0,
            invoices: invoicesCount.count || 0,
          },
        }
      })
    )

    // Login sayfası için cache - 30 saniye (yeni firmalar için)
    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60, max-age=30',
        'CDN-Cache-Control': 'public, s-maxage=30',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
        'X-Total-Count': String(count || companies.length),
      },
    })
  } catch (error: any) {
    console.error('Companies API exception:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch companies',
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error?.stack,
          name: error?.name,
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
        console.error('Companies POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece SuperAdmin firma oluşturabilir
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Sadece SuperAdmin firma oluşturabilir' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Company oluştur - service role key kullan (RLS bypass) - singleton pattern kullan
    const supabase = getSupabaseWithServiceRole()

    // Company oluştur (companyId yok - root entity)
    // @ts-ignore - Supabase type inference issue with dynamic table names
    const { data: company, error } = await (supabase
      .from('Company') as any)
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
          maxUsers: body.maxUsers || null, // Limitasyon alanları
          maxModules: body.maxModules || null,
          adminUserLimit: body.adminUserLimit || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create company' },
        { status: 500 }
      )
    }

    // Eğer admin bilgileri verilmişse, admin kullanıcısı oluştur
    if (body.adminEmail && body.adminName && body.adminPassword) {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash(body.adminPassword, 10)
      
      const { data: adminUser, error: adminError } = await (supabase
        .from('User') as any)
        .insert([
          {
            name: body.adminName,
            email: body.adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id,
          },
        ])
        .select()
        .single()

      if (adminError) {
        console.error('Admin user creation error:', adminError)
        // Admin oluşturma hatası kurum oluşturmayı engellemez, sadece log'lanır
      } else {
        // Admin oluşturuldu - ActivityLog
        await (supabase.from('ActivityLog') as any).insert([
          {
            entity: 'User',
            action: 'CREATE',
            description: `Kurum admin'i oluşturuldu: ${body.adminName}`,
            meta: { entity: 'User', action: 'create', id: adminUser.id, companyId: company.id },
            userId: session.user.id,
            companyId: company.id,
          },
        ])
      }
    }

    // ActivityLog kaydı (SuperAdmin için)
    // @ts-ignore - Supabase type inference issue with dynamic table names
    await (supabase.from('ActivityLog') as any).insert([
      {
        entity: 'Company',
        action: 'CREATE',
        description: `Yeni firma oluşturuldu: ${body.name}`,
        meta: { entity: 'Company', action: 'create', id: company.id, ...(body as any) },
        userId: session.user.id,
        companyId: company.id, // Yeni oluşturulan company'nin ID'si
      },
    ])

    return NextResponse.json(company, { status: 201 })
  } catch (error: any) {
    console.error('Companies POST exception:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create company',
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          stack: error?.stack,
        }),
      },
      { status: 500 }
    )
  }
}
