import { NextResponse } from 'next/server'

import type { LandingPipelineResponse, LandingRange } from '@/types/landing'
import type { DashboardRange } from '@/types/dashboard'
import { getSafeSession } from '@/lib/safe-session'
import { getSpotlightMetrics } from '@/lib/dashboard/spotlight-metrics'
import { getSupabaseWithServiceRole } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 60

async function resolveCompanyId(): Promise<string | undefined> {
  const supabase = getSupabaseWithServiceRole()
  const { data, error } = await supabase.from('Company').select('id').order('createdAt', { ascending: true }).limit(1).maybeSingle()
  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Landing pipeline company lookup error:', error)
    }
    return undefined
  }
  return data?.id
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const rangeParam = url.searchParams.get('range') as LandingRange | null
    const range: LandingRange = rangeParam && ['weekly', 'monthly'].includes(rangeParam)
      ? rangeParam
      : 'weekly'

    const { session } = await getSafeSession(request)
    const requestedCompanyId = url.searchParams.get('companyId') || undefined
    const sessionCompanyId = session?.user?.companyId ?? undefined
    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

    let effectiveCompanyId: string | undefined
    let filterCompanyId: string | undefined
    let allowGlobal = false

    if (session?.user) {
      if (isSuperAdmin) {
        effectiveCompanyId = requestedCompanyId ?? sessionCompanyId ?? undefined
        filterCompanyId = requestedCompanyId ?? sessionCompanyId ?? undefined
        allowGlobal = !requestedCompanyId && !sessionCompanyId
      } else {
        if (!sessionCompanyId) {
          return NextResponse.json({ error: 'Şirket bilgisi bulunamadı' }, { status: 403 })
        }
        effectiveCompanyId = sessionCompanyId
        filterCompanyId = undefined
      }
    } else {
      effectiveCompanyId = requestedCompanyId ?? (await resolveCompanyId())
      filterCompanyId = undefined
    }

    if (!effectiveCompanyId && !allowGlobal) {
      return NextResponse.json({ error: 'Şirket bulunamadı' }, { status: 404 })
    }

    const metrics = await getSpotlightMetrics({
      range: range as DashboardRange,
      companyId: effectiveCompanyId,
      isSuperAdmin,
      filterCompanyId: isSuperAdmin ? filterCompanyId : undefined,
      allowGlobal,
    })

    const response: LandingPipelineResponse = {
      range,
      trend: metrics.trend,
      watchers: metrics.watchers,
      live: metrics.live,
      stages: metrics.stages,
      hotDeals: metrics.hotDeals,
      totals: metrics.totals,
      schedule: metrics.schedule,
      performance: metrics.performance,
      satisfaction: metrics.satisfaction,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Landing pipeline error:', error)
    }
    return NextResponse.json(
      { error: error?.message || 'Failed to load landing pipeline metrics' },
      { status: 500 }
    )
  }
}



