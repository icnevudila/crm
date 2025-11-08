import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

// Dynamic route - POST/PUT sonrası fresh data için cache'i kapat
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Session kontrolü - hata yakalama ile
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (sessionError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Quote Kanban API session error:', sessionError)
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
    const dealId = searchParams.get('dealId') || ''
    const search = searchParams.get('search') || ''

    // Base query - OPTİMİZE: JOIN kaldırıldı - çok yavaş (JOIN kaldırıldı - çok yavaş)
    let query = supabase
      .from('Quote')
      .select('id, title, status, total, dealId, createdAt')
      .order('createdAt', { ascending: false })
      .limit(100) // ULTRA AGRESİF limit - sadece 100 kayıt (instant load)
    
    if (!isSuperAdmin) {
      query = query.eq('companyId', companyId)
    }

    // Filtreler
    if (dealId) {
      query = query.eq('dealId', dealId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%`)
    }

    const { data: quotes, error } = await query

    if (error) {
      console.error('Quote kanban error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!quotes) {
      return NextResponse.json({ kanban: [] })
    }

    // Status'lere göre grupla
    const statuses = ['DRAFT', 'SENT', 'WAITING', 'ACCEPTED', 'DECLINED']
    const kanban = statuses.map((status) => {
      const statusQuotes = quotes.filter((quote: any) => quote.status === status)
      // Her status için toplam tutarı hesapla
      const totalValue = statusQuotes.reduce((sum: number, quote: any) => {
        const quoteValue = typeof quote.total === 'string' ? parseFloat(quote.total) || 0 : (quote.total || 0)
        return sum + quoteValue
      }, 0)
      return {
        status,
        count: statusQuotes.length,
        totalValue, // Her status için toplam tutar
        quotes: statusQuotes.map((quote: any) => ({
          id: quote.id,
          title: quote.title,
          total: quote.total || 0,
          dealId: quote.dealId,
          createdAt: quote.createdAt,
        })),
      }
    })

    return NextResponse.json(
      { kanban },
      {
        headers: {
          'Cache-Control': 'no-store, must-revalidate', // POST/PUT sonrası fresh data için cache'i kapat
        },
      }
    )
  } catch (error: any) {
    console.error('Quote kanban exception:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote kanban' },
      { status: 500 }
    )
  }
}





