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
        console.error('Deal Kanban API session error:', sessionError)
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
    
    // Filtre parametreleri
    const customerId = searchParams.get('customerId') || ''
    const search = searchParams.get('search') || ''
    const minValue = searchParams.get('minValue')
    const maxValue = searchParams.get('maxValue')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Base query - OPTİMİZE: Limit ve sadece gerekli alanlar (JOIN kaldırıldı - çok yavaş)
    let query = supabase
      .from('Deal')
      .select('id, title, stage, value, customerId, createdAt', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Filtreler
    if (customerId) {
      query = query.eq('customerId', customerId)
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    if (minValue) {
      query = query.gte('value', parseFloat(minValue))
    }

    if (maxValue) {
      query = query.lte('value', parseFloat(maxValue))
    }

    if (startDate) {
      query = query.gte('createdAt', startDate)
    }

    if (endDate) {
      query = query.lte('createdAt', endDate)
    }

    const { data: deals, error: queryError } = await query

    if (queryError) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Deal kanban query error:', queryError)
      }
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    // Stage'lere göre grupla - CONTACTED dahil
    const stages = ['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const kanban = stages.map((stage) => {
      const stageDeals = (deals || []).filter((deal: any) => deal.stage === stage)
      // Her stage için toplam tutar hesapla - value string olabilir, parseFloat kullan
      const totalValue = stageDeals.reduce((sum: number, deal: any) => {
        const dealValue = typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0)
        return sum + dealValue
      }, 0)
      
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development') {
        console.log(`Deal Kanban API - Stage: ${stage}`, {
          stageDealsCount: stageDeals.length,
          totalValue,
          deals: stageDeals.map((d: any) => ({ id: d.id, title: d.title, value: d.value, valueType: typeof d.value })),
        })
      }
      
      return {
        stage,
        count: stageDeals.length,
        totalValue, // Her stage için toplam tutar (0 dahil)
        deals: stageDeals.map((deal: any) => ({
          id: deal.id,
          title: deal.title,
          value: typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0),
          customer: deal.Customer ? { name: deal.Customer.name } : undefined,
          Customer: deal.Customer ? { name: deal.Customer.name } : undefined,
          status: deal.status,
          createdAt: deal.createdAt,
        })),
      }
    })

    // Cache headers - POST sonrası fresh data için cache'i kapat
    // NOT: dynamic = 'force-dynamic' ile cache zaten kapalı
    return NextResponse.json(
      { kanban },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST sonrası fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    // Production'da console.error kaldırıldı
    if (process.env.NODE_ENV === 'development') {
      console.error('Deal kanban API error:', error)
    }
    return NextResponse.json(
      { error: 'Failed to fetch deal kanban', message: error?.message },
      { status: 500 }
    )
  }
}



