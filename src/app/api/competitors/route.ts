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
    const { data, error } = await supabase
      .from('Competitor')
      .select('*')
      .eq('companyId', session.user.companyId)
      .order('name')

    if (error) throw error
    return NextResponse.json(data)
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

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'İsim alanı zorunludur' },
        { status: 400 }
      )
    }

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
    const averagePrice = body.averagePrice !== undefined && body.averagePrice !== null
      ? (isNaN(parseFloat(body.averagePrice)) ? null : parseFloat(body.averagePrice))
      : null

    // ✅ ÇÖZÜM: marketShare undefined ise null gönder, 0 geçerli bir değer
    const marketShare = body.marketShare !== undefined && body.marketShare !== null
      ? (isNaN(parseFloat(body.marketShare)) ? null : parseFloat(body.marketShare))
      : null

    const supabase = getSupabaseWithServiceRole()
    const { data, error } = await supabase
      .from('Competitor')
      .insert({
        name: body.name,
        description: body.description || null,
        website: body.website || null,
        strengths: strengths,
        weaknesses: weaknesses,
        pricingStrategy: body.pricingStrategy || null,
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



