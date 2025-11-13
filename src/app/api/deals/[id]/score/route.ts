import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }

    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    
    const supabase = getSupabaseWithServiceRole()

    // Önce Deal'in bu company'ye ait olduğunu kontrol et
    let dealQuery = supabase
      .from('Deal')
      .select('id, companyId, title, stage, value')
      .eq('id', id)
    
    if (!isSuperAdmin) {
      dealQuery = dealQuery.eq('companyId', companyId)
    }

    const { data: deal, error: dealError } = await dealQuery.single()

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      )
    }

    // Lead score hesapla (SQL function kullanarak)
    const { data: scoreData, error: scoreError } = await supabase
      .rpc('calculate_lead_score', { deal_id: id })

    if (scoreError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Calculate lead score error:', scoreError)
      }
      return NextResponse.json(
        { error: 'Failed to calculate lead score' },
        { status: 500 }
      )
    }

    const score = scoreData || 0

    // Temperature hesapla
    const { data: temperatureData, error: tempError } = await supabase
      .rpc('get_lead_temperature', { lead_score: score })

    const temperature = temperatureData || 'COLD'

    // Engagement level hesapla
    let engagementLevel = 'LOW'
    if (score >= 70) engagementLevel = 'HIGH'
    else if (score >= 40) engagementLevel = 'MEDIUM'

    // LeadScore tablosuna kaydet veya güncelle
    const { data: existingScore } = await supabase
      .from('LeadScore')
      .select('id')
      .eq('dealId', id)
      .single()

    if (existingScore) {
      // Update
      await supabase
        .from('LeadScore')
        .update({
          score,
          temperature,
          engagementLevel,
          lastInteractionDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existingScore.id)
    } else {
      // Insert
      await supabase
        .from('LeadScore')
        .insert({
          dealId: id,
          customerId: (deal as any).customerId || null,
          score,
          temperature,
          engagementLevel,
          lastInteractionDate: new Date().toISOString(),
          companyId: deal.companyId,
        })
    }

    return NextResponse.json(
      {
        dealId: id,
        score,
        temperature,
        engagementLevel,
        calculatedAt: new Date().toISOString(),
        dealInfo: {
          title: deal.title,
          stage: deal.stage,
          value: deal.value,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Deal score API error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to get deal score' },
      { status: 500 }
    )
  }
}

// POST endpoint - Manual recalculation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // GET ile aynı logic - recalculate
    const getRequest = new Request(request.url, { method: 'GET' })
    return GET(getRequest, { params })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to recalculate score' },
      { status: 500 }
    )
  }
}



