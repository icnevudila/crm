import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes GET API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SuperAdmin tüm şirketlerin verilerini görebilir
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // OPTİMİZE: Sadece gerekli kolonları seç - performans için (JOIN kaldırıldı - çok yavaş)
    let query = supabase
      .from('Quote')
      .select('id, title, status, total, dealId, createdAt')
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch quotes' },
        { status: 500 }
      )
    }

    // ULTRA AGRESİF cache headers - 30 dakika cache (tek tıkla açılmalı)
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
      },
    })
  } catch (error: any) {
    // Production'da console.error kaldırıldı
    if (process.env.NODE_ENV === 'development') {
      console.error('Quotes API exception:', error)
    }
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch quotes',
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
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
        console.error('Quotes POST API session error:', sessionError)
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
        console.error('Quotes POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Teklif başlığı gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Quote verilerini oluştur - SADECE schema.sql'de olan kolonları gönder
    // schema.sql: title, status, total, dealId, companyId
    // schema-extension.sql: description, validUntil, discount, taxRate (migration çalıştırılmamış olabilir - GÖNDERME!)
    // schema-vendor.sql: vendorId (migration çalıştırılmamış olabilir - GÖNDERME!)
    const quoteData: any = {
      title: body.title.trim(),
      status: body.status || 'DRAFT',
      total: body.total !== undefined ? parseFloat(body.total) : 0,
      companyId: session.user.companyId,
    }

    // Sadece schema.sql'de olan alanlar
    if (body.dealId) quoteData.dealId = body.dealId
    // NOT: description, vendorId, validUntil, discount, taxRate schema-extension'da var ama migration çalıştırılmamış olabilir - GÖNDERME!

    // @ts-ignore - Supabase type inference issue with Quote table
    const { data, error } = await supabase
      .from('Quote')
      // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
      .insert([quoteData])
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quotes POST API insert error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to create quote' },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    // @ts-ignore - Supabase database type tanımları eksik, insert metodu dinamik tip bekliyor
    await supabase.from('ActivityLog').insert([
      {
        entity: 'Quote',
        action: 'CREATE',
        description: `Yeni teklif oluşturuldu: ${body.title}`,
        meta: { entity: 'Quote', action: 'create', id: (data as any).id },
        userId: session.user.id,
        companyId: session.user.companyId,
      },
    ])

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Quotes POST API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to create quote' },
      { status: 500 }
    )
  }
}
