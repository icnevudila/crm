import { NextResponse } from 'next/server'
import { getSafeSession } from '@/lib/safe-session'
import { getSupabaseWithServiceRole } from '@/lib/supabase'
import { computeFinancialReport } from '@/lib/reports/compute'
import { getCacheScope, getReportCache, setReportCache } from '@/lib/cache/report-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { session, error: sessionError } = await getSafeSession(request)
    if (sessionError) {
      return sessionError
    }
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const companyId = session.user.companyId
    const supabase = getSupabaseWithServiceRole()
    const scope = getCacheScope(isSuperAdmin, companyId)
    const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1'

    const cached = await getReportCache({
      supabase,
      reportType: 'financial',
      scope,
      ttlMinutes: 60,
      forceRefresh,
    })

    if (cached) {
      return NextResponse.json(cached.payload, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'x-cache-hit': 'report-cache',
        },
      })
    }

    const payload = await computeFinancialReport({
      supabase,
      isSuperAdmin,
      companyId,
    })

    await setReportCache({
      supabase,
      reportType: 'financial',
      scope,
      payload,
    })

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'x-cache-hit': 'miss',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch financial reports' },
      { status: 500 }
    )
  }
}



