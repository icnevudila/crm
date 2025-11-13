import { NextResponse } from 'next/server'

import type { DashboardRange } from '@/types/dashboard'
import { getSafeSession } from '@/lib/safe-session'
import { getSpotlightMetrics } from '@/lib/dashboard/spotlight-metrics'

// PERFORMANCE FIX: force-dynamic cache'i tamamen kapatıyor - kaldırıldı
// export const dynamic = 'force-dynamic' // KALDIRILDI - cache performansı için
export const revalidate = 60 // 60 saniye revalidate (performans için)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const rangeParam = url.searchParams.get('range') as DashboardRange | null
    const range: DashboardRange = rangeParam && ['weekly', 'monthly'].includes(rangeParam)
      ? rangeParam
      : 'weekly'

    const { session, error } = await getSafeSession(request)
    if (error) {
      return error
    }

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestedCompanyId = url.searchParams.get('companyId') || undefined
    const sessionCompanyId = session.user.companyId ?? undefined

    let effectiveCompanyId: string | undefined
    let filterCompanyId: string | undefined
    let allowGlobal = false

    if (isSuperAdmin) {
      effectiveCompanyId = requestedCompanyId ?? sessionCompanyId ?? undefined
      filterCompanyId = requestedCompanyId ?? sessionCompanyId ?? undefined
      allowGlobal = !requestedCompanyId && !sessionCompanyId
    } else {
      effectiveCompanyId = sessionCompanyId ?? undefined
      filterCompanyId = undefined
    }

    const metrics = await getSpotlightMetrics({
      range,
      companyId: effectiveCompanyId,
      isSuperAdmin,
      filterCompanyId,
      allowGlobal,
    })

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30', // PERFORMANCE FIX: Cache headers eklendi
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard spotlight error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to load spotlight metrics' },
      { status: 500 }
    )
  }
}


