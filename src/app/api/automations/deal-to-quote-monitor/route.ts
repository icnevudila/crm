import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Deal-to-Quote Time Monitor
 * Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseWithServiceRole()
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

    // 48 saatten eski fırsatları bul (teklif oluşturulmamış)
    const { data: dealsWithoutQuotes, error: findError } = await supabase
      .from('Deal')
      .select(`
        id,
        title,
        "createdAt",
        value,
        stage,
        Quote!inner(id)
      `)
      .eq('companyId', session.user.companyId)
      .eq('status', 'OPEN')
      .lt('createdAt', fortyEightHoursAgo.toISOString())
      .is('Quote.id', null) // Teklif yok

    // Doğru query: LEFT JOIN ile teklif olmayan fırsatları bul
    const { data: allDeals, error: dealsError } = await supabase
      .from('Deal')
      .select('id, title, "createdAt", value, stage')
      .eq('companyId', session.user.companyId)
      .eq('status', 'OPEN')
      .lt('createdAt', fortyEightHoursAgo.toISOString())

    if (dealsError) {
      console.error('Deal-to-Quote Monitor error:', dealsError)
      return NextResponse.json(
        { error: 'Failed to find deals' },
        { status: 500 }
      )
    }

    if (!allDeals || allDeals.length === 0) {
      return NextResponse.json({
        message: 'No deals found',
        warnings: [],
      })
    }

    // Her fırsat için teklif var mı kontrol et
    const warnings: Array<{
      dealId: string
      dealTitle: string
      createdAt: string
      hoursSinceCreation: number
    }> = []

    for (const deal of allDeals || []) {
      const dealData = deal as any
      const { data: quotes, error: quotesError } = await supabase
        .from('Quote')
        .select('id')
        .eq('dealId', dealData.id)
        .eq('companyId', session.user.companyId)
        .limit(1)

      if (!quotesError && (!quotes || quotes.length === 0)) {
        const hoursSinceCreation = Math.floor(
          (Date.now() - new Date(dealData.createdAt || new Date()).getTime()) / (1000 * 60 * 60)
        )
        warnings.push({
          dealId: dealData.id,
          dealTitle: dealData.title || 'İsimsiz Fırsat',
          createdAt: dealData.createdAt || new Date().toISOString(),
          hoursSinceCreation,
        })
      }
    }

    return NextResponse.json({
      message: warnings.length > 0 ? 'Deals without quotes found' : 'All deals have quotes',
      warnings,
      count: warnings.length,
    })
  } catch (error: any) {
    console.error('Deal-to-Quote Monitor error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to monitor deals' },
      { status: 500 }
    )
  }
}

