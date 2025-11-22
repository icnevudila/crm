import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getRecords, createRecord } from '@/lib/crud'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    // SuperAdmin kontrolü - SuperAdmin companyId olmadan da erişebilir
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
    if (!session?.user || (!session?.user?.companyId && !isSuperAdmin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const data = await getRecords({
      table: 'Vendor',
      filters: {
        search,
        status,
      },
    })

    // ULTRA AGRESİF cache headers - 30 dakika cache (tek tıkla açılmalı)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error: any) {
    // Production'da console.error kaldırıldı
    if (process.env.NODE_ENV === 'development') {
      console.error('Vendors API error:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      })
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch vendors',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error?.stack,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        }),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const { vendorCreateSchema } = await import('@/lib/validations/vendors')
    const validationResult = vendorCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Vendor verilerini oluştur - Zod validated data kullan
    const vendorData: any = {
      name: validatedData.name.trim(),
      status: validatedData.status || 'ACTIVE',
      companyId: session.user.companyId,
    }

    // Veritabanında olan alanlar
    if (validatedData.sector !== undefined && validatedData.sector !== null && validatedData.sector !== '') {
      vendorData.sector = validatedData.sector
    }
    if (validatedData.city !== undefined && validatedData.city !== null && validatedData.city !== '') {
      vendorData.city = validatedData.city
    }
    if (validatedData.address !== undefined && validatedData.address !== null && validatedData.address !== '') {
      vendorData.address = validatedData.address
    }
    if (validatedData.phone !== undefined && validatedData.phone !== null && validatedData.phone !== '') {
      vendorData.phone = validatedData.phone
    }
    if (validatedData.email !== undefined && validatedData.email !== null && validatedData.email !== '') {
      vendorData.email = validatedData.email
    }
    if (validatedData.website !== undefined && validatedData.website !== null && validatedData.website !== '') {
      vendorData.website = validatedData.website
    }
    if (validatedData.taxNumber !== undefined && validatedData.taxNumber !== null && validatedData.taxNumber !== '') {
      vendorData.taxNumber = validatedData.taxNumber
    }
    if (validatedData.taxOffice !== undefined && validatedData.taxOffice !== null && validatedData.taxOffice !== '') {
      vendorData.taxOffice = validatedData.taxOffice
    }
    if (validatedData.description !== undefined && validatedData.description !== null && validatedData.description !== '') {
      vendorData.description = validatedData.description
    }

    const data = await createRecord(
      'Vendor',
      vendorData,
      `Yeni tedarikçi eklendi: ${validatedData.name}`
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Vendors POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create vendor' },
      { status: 500 }
    )
  }
}





