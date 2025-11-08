import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecords, createRecord } from '@/lib/crud'

// Agresif cache - 1 saat cache (instant navigation - <300ms hedef)
export const revalidate = 3600

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
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
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Vendors POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
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

    // Zorunlu alanları kontrol et
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json(
        { error: 'Tedarikçi adı gereklidir' },
        { status: 400 }
      )
    }

    // Vendor verilerini oluştur - SADECE veritabanında olan kolonları gönder
    // Veritabanı şeması: name, sector, city, address, phone, email, website, taxNumber, taxOffice, description, status, companyId
    const vendorData: any = {
      name: body.name.trim(),
      status: body.status || 'ACTIVE',
      companyId: session.user.companyId,
    }

    // Veritabanında olan alanlar
    if (body.sector !== undefined && body.sector !== null && body.sector !== '') {
      vendorData.sector = body.sector
    }
    if (body.city !== undefined && body.city !== null && body.city !== '') {
      vendorData.city = body.city
    }
    if (body.address !== undefined && body.address !== null && body.address !== '') {
      vendorData.address = body.address
    }
    if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
      vendorData.phone = body.phone
    }
    if (body.email !== undefined && body.email !== null && body.email !== '') {
      vendorData.email = body.email
    }
    if (body.website !== undefined && body.website !== null && body.website !== '') {
      vendorData.website = body.website
    }
    if (body.taxNumber !== undefined && body.taxNumber !== null && body.taxNumber !== '') {
      vendorData.taxNumber = body.taxNumber
    }
    if (body.taxOffice !== undefined && body.taxOffice !== null && body.taxOffice !== '') {
      vendorData.taxOffice = body.taxOffice
    }
    if (body.description !== undefined && body.description !== null && body.description !== '') {
      vendorData.description = body.description
    }

    const data = await createRecord(
      'Vendor',
      vendorData,
      `Yeni tedarikçi eklendi: ${body.name}`
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





