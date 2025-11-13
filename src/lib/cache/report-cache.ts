import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_REPORT_CACHE_TTL_MINUTES = 60
const DEFAULT_KPI_CACHE_TTL_MINUTES = 15

interface CacheScope {
  companyId?: string | null
  isGlobal?: boolean
}

interface CacheResult<T> {
  payload: T
  computedAt: string
}

function resolveScope(scope: CacheScope) {
  const isGlobal = scope.isGlobal ?? false
  const companyId = isGlobal ? null : scope.companyId ?? null
  return { isGlobal, companyId }
}

export async function getReportCache<T = unknown>(params: {
  supabase: SupabaseClient
  reportType: string
  scope: CacheScope
  ttlMinutes?: number
  forceRefresh?: boolean
}): Promise<CacheResult<T> | null> {
  const { supabase, reportType, scope, ttlMinutes = DEFAULT_REPORT_CACHE_TTL_MINUTES, forceRefresh } = params

  if (forceRefresh) {
    return null
  }

  const { isGlobal, companyId } = resolveScope(scope)

  let query = supabase
    .from('ReportCache')
    .select('payload, computedAt')
    .eq('reportType', reportType)
    .eq('isGlobal', isGlobal)
    .order('computedAt', { ascending: false })
    .limit(1)

  if (isGlobal) {
    query = query.is('companyId', null)
  } else {
    query = query.eq('companyId', companyId)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return null
  }

  const computedAt = data.computedAt ? new Date(data.computedAt) : null
  if (!computedAt) {
    return null
  }

  const ttlThreshold = new Date(Date.now() - ttlMinutes * 60 * 1000)
  if (computedAt < ttlThreshold) {
    return null
  }

  return {
    payload: data.payload as T,
    computedAt: data.computedAt,
  }
}

export async function setReportCache(params: {
  supabase: SupabaseClient
  reportType: string
  scope: CacheScope
  payload: unknown
  computedAt?: Date
}): Promise<void> {
  const { supabase, reportType, scope, payload, computedAt = new Date() } = params
  const { isGlobal, companyId } = resolveScope(scope)

  await supabase
    .from('ReportCache')
    .upsert(
      {
        companyId,
        isGlobal,
        reportType,
        payload,
        computedAt: computedAt.toISOString(),
        updatedAt: computedAt.toISOString(),
      },
      {
        onConflict: 'reportType,companyId,isGlobal',
      }
    )
}

export async function getKpiCache<T = unknown>(params: {
  supabase: SupabaseClient
  scope: CacheScope
  ttlMinutes?: number
  forceRefresh?: boolean
}): Promise<CacheResult<T> | null> {
  const { supabase, scope, ttlMinutes = DEFAULT_KPI_CACHE_TTL_MINUTES, forceRefresh } = params

  if (forceRefresh) {
    return null
  }

  const { isGlobal, companyId } = resolveScope(scope)

  let query = supabase
    .from('KpiCache')
    .select('payload, computedAt')
    .eq('isGlobal', isGlobal)
    .order('computedAt', { ascending: false })
    .limit(1)

  if (isGlobal) {
    query = query.is('companyId', null)
  } else {
    query = query.eq('companyId', companyId)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    return null
  }

  const computedAt = data.computedAt ? new Date(data.computedAt) : null
  if (!computedAt) {
    return null
  }

  const ttlThreshold = new Date(Date.now() - ttlMinutes * 60 * 1000)
  if (computedAt < ttlThreshold) {
    return null
  }

  return {
    payload: data.payload as T,
    computedAt: data.computedAt,
  }
}

export async function setKpiCache(params: {
  supabase: SupabaseClient
  scope: CacheScope
  payload: unknown
  computedAt?: Date
}): Promise<void> {
  const { supabase, scope, payload, computedAt = new Date() } = params
  const { isGlobal, companyId } = resolveScope(scope)

  await supabase
    .from('KpiCache')
    .upsert(
      {
        companyId,
        isGlobal,
        payload,
        computedAt: computedAt.toISOString(),
        updatedAt: computedAt.toISOString(),
      },
      {
        onConflict: 'isGlobal,companyId',
      }
    )
}

export function getCacheScope(isSuperAdmin: boolean, companyId: string): CacheScope {
  return isSuperAdmin ? { isGlobal: true } : { companyId }
}


