import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'

import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Deal-to-Quote Time Monitor
 * Fırsat oluşturulduktan sonra 48 saat içinde teklif hazırlanmamışsa uyarı çıkar
 */
export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    
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
        { error: 'Fırsatlar getirilemedi' },
        { status: 500 }
      )
    }

    if (!allDeals || allDeals.length === 0) {
      return NextResponse.json({
        message: 'Fırsat bulunamadı',
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
      message: warnings.length > 0 ? 'Teklifi olmayan fırsatlar bulundu' : 'Tüm fırsatların teklifi hazır',
      warnings,
      count: warnings.length,
    })
  } catch (error: any) {
    console.error('Deal-to-Quote Monitor error:', error)
    return NextResponse.json(
      { error: error?.message || 'Fırsatlar izlenemedi' },
      { status: 500 }
    )
  }
}













