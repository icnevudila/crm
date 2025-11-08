import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - her zaman fresh data
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Meetings GET API session error:', sessionError)
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
    const statusFilter = searchParams.get('status') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const userId = searchParams.get('userId') || '' // Admin filtreleme için
    const customerId = searchParams.get('customerId') || ''

    // Query builder
    let query = supabase
      .from('Meeting')
      .select(`
        id,
        title,
        description,
        meetingDate,
        meetingDuration,
        location,
        status,
        companyId,
        customerId,
        dealId,
        createdBy,
        createdAt,
        updatedAt,
        Customer:Customer(id, name, email, phone),
        Deal:Deal(id, title, stage),
        CreatedBy:User!Meeting_createdBy_fkey(id, name, email)
      `)
      .order('meetingDate', { ascending: false })
      .limit(1000)

    // CompanyId filtresi (SuperAdmin hariç)
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Status filtresi
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    // Search filtresi (title veya description'da arama)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Tarih aralığı filtresi
    if (dateFrom) {
      query = query.gte('meetingDate', dateFrom)
    }
    if (dateTo) {
      query = query.lte('meetingDate', dateTo)
    }

    // Kullanıcı filtresi (Admin için) - Normal kullanıcılar sadece kendi görüşmelerini görür
    if (!isSuperAdmin && session.user.role !== 'ADMIN') {
      // Normal kullanıcı sadece kendi görüşmelerini görür
      query = query.eq('createdBy', session.user.id)
    } else if (userId && (session.user.role === 'ADMIN' || isSuperAdmin)) {
      // Admin belirli bir kullanıcının görüşmelerini filtreleyebilir
      query = query.eq('createdBy', userId)
    }

    // Müşteri filtresi
    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    const { data: meetings, error } = await query

    if (error) {
      console.error('Meetings GET API error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch meetings' },
        { status: 500 }
      )
    }

    // Her görüşme için gider bilgilerini Finance tablosundan çek (relatedTo='Meeting')
    const meetingsWithExpenses = await Promise.all(
      (meetings || []).map(async (meeting: any) => {
        // Finance tablosundan Meeting ile ilişkili giderleri çek
        const { data: expenses } = await supabase
          .from('Finance')
          .select('id, type, amount, description, createdAt, relatedTo, relatedId')
          .eq('relatedTo', 'Meeting')
          .eq('relatedId', meeting.id)
          .eq('type', 'EXPENSE')

        // Gider tiplerine göre grupla
        const fuelExpense = expenses?.filter((e: any) => e.description?.includes('Yakıt') || e.description?.includes('FUEL')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const accommodationExpense = expenses?.filter((e: any) => e.description?.includes('Konaklama') || e.description?.includes('ACCOMMODATION')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const foodExpense = expenses?.filter((e: any) => e.description?.includes('Yemek') || e.description?.includes('FOOD')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const otherExpense = expenses?.filter((e: any) => e.description?.includes('Diğer') || e.description?.includes('OTHER')).reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0
        const totalExpense = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0

        return {
          ...meeting,
          expenses: expenses || [],
          expenseBreakdown: {
            fuel: fuelExpense,
            accommodation: accommodationExpense,
            food: foodExpense,
            other: otherExpense,
            total: totalExpense,
          },
          totalExpense,
        }
      })
    )

    return NextResponse.json(meetingsWithExpenses, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  } catch (error: any) {
    console.error('Meetings GET API exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Session kontrolü
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Meetings POST API session error:', sessionError)
      }
      return NextResponse.json(
        { error: 'Session error', message: sessionError?.message || 'Failed to get session' },
        { status: 500 }
      )
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Body parse
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Meetings POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zorunlu alanları kontrol et
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Görüşme başlığı gereklidir' },
        { status: 400 }
      )
    }

    if (!body.meetingDate) {
      return NextResponse.json(
        { error: 'Görüşme tarihi gereklidir' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseWithServiceRole()

    // Meeting verilerini oluştur
    const meetingData: any = {
      title: body.title.trim(),
      description: body.description || null,
      meetingDate: body.meetingDate,
      meetingDuration: body.meetingDuration || 60,
      location: body.location || null,
      status: body.status || 'SCHEDULED',
      companyId: session.user.companyId,
      customerId: body.customerId || null,
      dealId: body.dealId || null,
      createdBy: session.user.id,
    }

    const { data: meeting, error } = await supabase
      .from('Meeting')
      .insert([meetingData])
      .select()
      .single()

    if (error) {
      console.error('Meetings POST API error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create meeting' },
        { status: 500 }
      )
    }

    // ActivityLog kaydı
    try {
      await supabase.from('ActivityLog').insert([
        {
          entity: 'Meeting',
          action: 'CREATE',
          description: `Yeni görüşme oluşturuldu: ${body.title}`,
          meta: { 
            entity: 'Meeting', 
            action: 'create', 
            meetingId: meeting.id,
            companyId: session.user.companyId,
            createdBy: session.user.id,
            ...body 
          },
          userId: session.user.id,
          companyId: session.user.companyId,
        },
      ])
    } catch (activityError) {
      // ActivityLog hatası ana işlemi engellemez
      console.error('ActivityLog error:', activityError)
    }

    // Gider uyarısı kontrolü - eğer gider yoksa expenseWarning true olacak (trigger ile)
    // Frontend'de kullanıcıya uyarı gösterilecek

    return NextResponse.json(meeting, { status: 201 })
  } catch (error: any) {
    console.error('Meetings POST API exception:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting', message: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

