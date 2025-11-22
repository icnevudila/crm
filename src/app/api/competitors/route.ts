import { NextRequest, NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - build-time'da çalışmasın
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canRead kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canRead = await hasPermission('competitor', 'read', session.user.id)
    if (!canRead) {
      return buildPermissionDeniedResponse()
    }

    const supabase = getSupabaseWithServiceRole()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    
    // Pagination parametreleri
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10) // Default 20 kayıt/sayfa

    // Query oluştur
    let query = supabase
      .from('Competitor')
      .select('*', { count: 'exact' })
      .eq('companyId', session.user.companyId)
      .order('name')

    // Search filtresi
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination uygula - EN SON (filtrelerden sonra)
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / pageSize)

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('Competitors fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip listesi getirilemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check - canCreate kontrolü
    const { hasPermission, buildPermissionDeniedResponse } = await import('@/lib/permissions')
    const canCreate = await hasPermission('competitor', 'create', session.user.id)
    if (!canCreate) {
      return buildPermissionDeniedResponse()
    }

    // Body parse - hata yakalama ile
    let body
    try {
      body = await request.json()
    } catch (jsonError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Competitors POST API JSON parse error:', jsonError)
      }
      return NextResponse.json(
        { error: 'Invalid JSON body', message: jsonError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    // Zod validation
    const { competitorCreateSchema } = await import('@/lib/validations/competitors')
    const validationResult = competitorCreateSchema.safeParse(body)
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

    // ✅ ÇÖZÜM: strengths ve weaknesses JSON string ise parse et, TEXT[] formatına dönüştür
    let strengths: string[] | null = null
    let weaknesses: string[] | null = null
    
    if (body.strengths) {
      if (typeof body.strengths === 'string') {
        try {
          strengths = JSON.parse(body.strengths)
        } catch {
          // JSON parse edilemezse direkt array olarak kullan
          strengths = [body.strengths]
        }
      } else if (Array.isArray(body.strengths)) {
        strengths = body.strengths
      }
    }
    
    if (body.weaknesses) {
      if (typeof body.weaknesses === 'string') {
        try {
          weaknesses = JSON.parse(body.weaknesses)
        } catch {
          // JSON parse edilemezse direkt array olarak kullan
          weaknesses = [body.weaknesses]
        }
      } else if (Array.isArray(body.weaknesses)) {
        weaknesses = body.weaknesses
      }
    }

    // ✅ ÇÖZÜM: averagePrice undefined ise null gönder, 0 geçerli bir değer
    const averagePrice = validatedData.averagePrice !== undefined && validatedData.averagePrice !== null
      ? validatedData.averagePrice
      : null

    // ✅ ÇÖZÜM: marketShare undefined ise null gönder, 0 geçerli bir değer
    const marketShare = validatedData.marketShare !== undefined && validatedData.marketShare !== null
      ? validatedData.marketShare
      : null

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        website: validatedData.website || null,
        strengths: strengths,
        weaknesses: weaknesses,
        pricingStrategy: validatedData.pricingStrategy || null,
        averagePrice: averagePrice,
        marketShare: marketShare,
        companyId: session.user.companyId,
      })
      .select()
      .single()

    if (error) throw error

    await supabase.from('ActivityLog').insert({
      action: 'CREATE',
      entityType: 'Competitor',
      entityId: data.id,
      userId: session.user.id,
      companyId: session.user.companyId,
      description: `Rakip eklendi: ${data.name}`,
    })

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Competitor create error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip oluşturulamadı' },
      { status: 500 }
    )
  }
}



