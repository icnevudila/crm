import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getRecords, createRecord } from '@/lib/crud'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

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
        console.error('Finance GET API session error:', sessionError)
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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    const supabase = getSupabaseWithServiceRole()
    // OPTİMİZE: Sadece gerekli kolonları seç - performans için
    let query = supabase
      .from('Finance')
      .select('id, type, amount, description, relatedTo, createdAt')
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    const { data, error } = await query

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Finance API error:', error)
      }
      return NextResponse.json(
        { error: error.message || 'Failed to fetch finance records' },
        { status: 500 }
      )
    }

    // ULTRA AGRESİF cache headers - 30 dakika cache (tek tıkla açılmalı)
    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200, max-age=1800',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch finance records' },
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
        console.error('Finance POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const description = `${body.type === 'INCOME' ? 'Gelir' : 'Gider'} kaydı oluşturuldu: ${body.amount} ₺`
    const data = await createRecord(
      'Finance',
      {
        ...body,
        amount: body.amount || 0,
      },
      description
    )

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create finance record' },
      { status: 500 }
    )
  }
}

