import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

/**
 * Competitor istatistikleri endpoint'i
 * GET: Rakip ile ilgili istatistikleri döndürür
 * - Toplam deal sayısı
 * - Kazanılan deal sayısı
 * - Kaybedilen deal sayısı
 * - Toplam değer
 * - Kazanma oranı
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
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
    const competitorId = params.id

    // Competitor'ın var olduğunu kontrol et
    const { data: competitor } = await supabase
      .from('Competitor')
      .select('id, name')
      .eq('id', competitorId)
      .eq('companyId', session.user.companyId)
      .single()

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    // Deal istatistiklerini çek
    const { data: deals, error: dealsError } = await supabase
      .from('Deal')
      .select('id, stage, value, status')
      .eq('competitorId', competitorId)
      .eq('companyId', session.user.companyId)

    if (dealsError) {
      console.error('Deals fetch error:', dealsError)
      // Deal'lar yoksa boş array döndür
    }

    const dealsData = deals || []

    // İstatistikleri hesapla
    const totalDeals = dealsData.length
    const wonDeals = dealsData.filter((d) => d.stage === 'WON').length
    const lostDeals = dealsData.filter((d) => d.stage === 'LOST').length
    const totalValue = dealsData.reduce((sum, d) => sum + (d.value || 0), 0)
    const wonValue = dealsData
      .filter((d) => d.stage === 'WON')
      .reduce((sum, d) => sum + (d.value || 0), 0)
    const winRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0

    // Son 30 gün içindeki deal'ları çek (trend analizi için)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentDeals } = await supabase
      .from('Deal')
      .select('id, stage, value, createdAt')
      .eq('competitorId', competitorId)
      .eq('companyId', session.user.companyId)
      .gte('createdAt', thirtyDaysAgo.toISOString())

    const recentDealsCount = recentDeals?.length || 0

    return NextResponse.json({
      competitor: {
        id: competitor.id,
        name: competitor.name,
      },
      stats: {
        totalDeals,
        wonDeals,
        lostDeals,
        totalValue,
        wonValue,
        winRate: Math.round(winRate * 100) / 100, // 2 ondalık basamak
        recentDealsCount,
      },
      trends: {
        // Son 30 gün içindeki trend
        dealsLast30Days: recentDealsCount,
        // Kazanma oranı trendi (basit karşılaştırma)
        winRateTrend: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0,
      },
    })
  } catch (error: any) {
    console.error('Competitor stats fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Rakip istatistikleri getirilemedi' },
      { status: 500 }
    )
  }
}

