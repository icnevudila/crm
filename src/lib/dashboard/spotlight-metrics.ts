import { getSupabaseWithServiceRole } from '@/lib/supabase'
import type { DashboardRange, DashboardSpotlightResponse } from '@/types/dashboard'

interface SpotlightOptions {
  range: DashboardRange
  companyId?: string
  isSuperAdmin?: boolean
  filterCompanyId?: string
  allowGlobal?: boolean
}

function createEmptySpotlight(range: DashboardRange): DashboardSpotlightResponse {
  const baseStage = (id: 'new' | 'proposal' | 'closing', label: string, color: string) => ({
    id,
    label,
    value: 0,
    delta: 0,
    color,
    count: 0,
    items: [] as DashboardSpotlightResponse['stages'][number]['items'],
  })

  return {
    range,
    trend: 0,
    watchers: 0,
    live: false,
    stages: [
      baseStage('new', 'Yeni fırsat', 'from-indigo-500 via-purple-500 to-pink-500'),
      baseStage('proposal', 'Teklif aşaması', 'from-cyan-500 via-indigo-500 to-purple-500'),
      baseStage('closing', 'Kapanışta', 'from-emerald-500 via-teal-500 to-sky-500'),
    ],
    hotDeals: [],
    totals: {
      activeUsers: 0,
      conversionDelta: 0,
    },
    schedule: [],
    performance: {
      value: 0,
      label: 'Veri yok',
    },
    satisfaction: {
      score: 4,
      trend: 0,
    },
  }
}

function toDate(value?: string | Date | null): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

type DealRecord = {
  id: string
  title: string | null
  stage: string | null
  status: string | null
  value: number | null
  createdAt: string
  updatedAt?: string | null
  companyId?: string | null
  assignedTo?: string | null
}

type UserRecord = {
  id: string
  name: string | null
  companyId?: string | null
}

type TaskRecord = {
  id: string
  title: string | null
  status: string | null
  createdAt: string
  assignedTo: string | null
}

const STAGE_MAPPING: Record<string, 'new' | 'proposal' | 'closing'> = {
  LEAD: 'new',
  CONTACTED: 'new',
  QUALIFIED: 'new',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'closing',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function inferTaskType(title: string | null): 'meeting' | 'call' | 'demo' {
  if (!title) return 'meeting'
  const lower = title.toLowerCase()
  if (lower.includes('demo') || lower.includes('tanıtım')) return 'demo'
  if (lower.includes('ara') || lower.includes('call') || lower.includes('telefon')) return 'call'
  return 'meeting'
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function getSpotlightMetrics({
  range,
  companyId,
  isSuperAdmin = false,
  filterCompanyId,
  allowGlobal = false,
}: SpotlightOptions): Promise<DashboardSpotlightResponse> {
  const supabase = getSupabaseWithServiceRole()

  const rangeDays = range === 'weekly' ? 7 : 30
  const now = new Date()
  const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000)
  const previousStart = new Date(rangeStart.getTime() - rangeDays * 24 * 60 * 60 * 1000)
  const previousEnd = rangeStart

  let targetCompanyId: string | undefined = companyId
  let isGlobalView = false

  if (isSuperAdmin) {
    if (filterCompanyId) {
      targetCompanyId = filterCompanyId
    }

    if (!targetCompanyId) {
      if (allowGlobal) {
        isGlobalView = true
      } else {
        const { data: fallbackCompany, error: companyError } = await supabase
          .from('Company')
          .select('id')
          .order('createdAt', { ascending: true })
          .limit(1)
          .maybeSingle()

        if (companyError) {
          throw new Error(`Failed to resolve company: ${companyError.message}`)
        }

        targetCompanyId = fallbackCompany?.id
      }
    }
  } else {
    targetCompanyId = companyId
  }

  if (!targetCompanyId && !isGlobalView) {
    return createEmptySpotlight(range)
  }
  const buildDealQuery = (fields: string) => {
    const query = supabase
      .from('Deal')
      .select(fields)
      .order('updatedAt', { ascending: false })
      .limit(500)
    if (!isGlobalView && targetCompanyId) {
      query.eq('companyId', targetCompanyId)
    }
    return query
  }

  const buildUserQuery = () => {
    const query = supabase
      .from('User')
      .select('id, name, companyId')
      .order('createdAt', { ascending: false })
    if (!isGlobalView && targetCompanyId) {
      query.eq('companyId', targetCompanyId)
    }
    return query
  }

  const buildTaskQuery = (fields: string) => {
    const query = supabase
      .from('Task')
      .select(fields)
      .order('createdAt', { ascending: true })
      .limit(25)
    if (!isGlobalView && targetCompanyId) {
      query.eq('companyId', targetCompanyId)
    }
    return query
  }

  const dealFieldsWithAssigned =
    'id, title, stage, status, value, createdAt, updatedAt, companyId, assignedTo'
  const dealFieldsFallback =
    'id, title, stage, status, value, createdAt, updatedAt, companyId'
  const taskFieldsWithAssigned = 'id, title, status, createdAt, assignedTo, companyId'
  const taskFieldsFallback = 'id, title, status, createdAt, companyId'

  let dealsRes = await buildDealQuery(dealFieldsWithAssigned)
  if (dealsRes.error && dealsRes.error.message?.toLowerCase().includes('assignedto')) {
    dealsRes = await buildDealQuery(dealFieldsFallback)
  }

  let tasksRes = await buildTaskQuery(taskFieldsWithAssigned)
  if (tasksRes.error && tasksRes.error.message?.toLowerCase().includes('assignedto')) {
    tasksRes = await buildTaskQuery(taskFieldsFallback)
  }

  const usersRes = await buildUserQuery()

  if (dealsRes.error) {
    throw new Error(`Failed to fetch deals: ${dealsRes.error.message}`)
  }
  if (usersRes.error) {
    throw new Error(`Failed to fetch users: ${usersRes.error.message}`)
  }
  if (tasksRes.error) {
    throw new Error(`Failed to fetch tasks: ${tasksRes.error.message}`)
  }

  const deals = ((dealsRes.data ?? []) as unknown) as DealRecord[]
  const users = ((usersRes.data ?? []) as unknown) as UserRecord[]
  const tasks = ((tasksRes.data ?? []) as unknown) as TaskRecord[]

  const userMap = new Map<string, string>()
  users.forEach((user) => {
    if (!user.id) return
    userMap.set(user.id, user.name ?? 'Atanmamış')
  })

  if (process.env.NODE_ENV === 'development') {
    console.debug('Spotlight metrics snapshot', {
      targetCompanyId,
      dealCount: deals.length,
      userCount: users.length,
      taskCount: tasks.length,
      sampleDeal: deals[0]?.stage,
    })
  }

  const dateOf = (record: DealRecord) => new Date(record.updatedAt ?? record.createdAt)

  const openDeals = deals
    .filter((deal) => deal.status !== 'LOST' && deal.status !== 'WON')
    .slice(0, 200)
  const currentDeals = openDeals.filter((deal) => dateOf(deal) >= rangeStart)
  const previousDeals = openDeals.filter((deal) => {
    const d = dateOf(deal)
    return d >= previousStart && d < previousEnd
  })

  const currentTotal = currentDeals.length
  const previousTotal = previousDeals.length
  const trend = previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : Math.round(((currentTotal - previousTotal) / previousTotal) * 100)

  const hotDeals = deals
    .filter((deal) => deal.status !== 'LOST')
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 5)
    .map((deal) => {
      const status: 'hot' | 'warming' = deal.stage === 'NEGOTIATION' ? 'hot' : 'warming'
      return {
        id: deal.id,
        company: deal.title ?? 'İsimsiz fırsat',
        owner: userMap.get(deal.assignedTo ?? '') ?? 'Atanmamış',
        amount: deal.value ?? 0,
        status,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      }
    })

  const upcomingTasks = tasks
    .filter((task) => task.status !== 'DONE')
    .map((task) => ({
      id: task.id,
      title: task.title ?? 'Planlanan görev',
      time: formatTime(toDate(task.createdAt)),
      type: inferTaskType(task.title),
      createdAt: task.createdAt,
      status: task.status,
      owner: userMap.get(task.assignedTo ?? '') ?? 'Atanmamış',
    }))
    .slice(0, 5)

  const dealsInRange = deals.filter((deal) => {
    const d = dateOf(deal)
    return d >= rangeStart && d <= now
  })

  const prevDealsInRange = deals.filter((deal) => {
    const d = dateOf(deal)
    return d >= previousStart && d < previousEnd
  })

  const stageCountsAll = { new: 0, proposal: 0, closing: 0 }
  const stageCountsCurrentRange = { new: 0, proposal: 0, closing: 0 }
  const stageCountsPreviousRange = { new: 0, proposal: 0, closing: 0 }

  deals.forEach((deal) => {
    const bucket = deal.stage ? STAGE_MAPPING[deal.stage] : undefined
    if (!bucket) return
    stageCountsAll[bucket] += 1
  })

  dealsInRange.forEach((deal) => {
    const bucket = deal.stage ? STAGE_MAPPING[deal.stage] : undefined
    if (!bucket) return
    stageCountsCurrentRange[bucket] += 1
  })

  prevDealsInRange.forEach((deal) => {
    const bucket = deal.stage ? STAGE_MAPPING[deal.stage] : undefined
    if (!bucket) return
    stageCountsPreviousRange[bucket] += 1
  })

  const totalStageRecords = Object.values(stageCountsAll).reduce((acc, value) => acc + value, 0)
  const buildStage = (key: keyof typeof stageCountsAll, label: string, color: string) => {
    const count = stageCountsAll[key]
    const value = totalStageRecords > 0 ? Math.round((count / totalStageRecords) * 100) : 0
    const delta = stageCountsCurrentRange[key] - stageCountsPreviousRange[key]
    const items = deals
      .filter((deal) => {
        const bucket = deal.stage ? STAGE_MAPPING[deal.stage] : undefined
        return bucket === key
      })
      .sort((a, b) => {
        const aDate = toDate(a.updatedAt ?? a.createdAt).getTime()
        const bDate = toDate(b.updatedAt ?? b.createdAt).getTime()
        return bDate - aDate
      })
      .slice(0, 10)
      .map((deal) => ({
        id: deal.id,
        title: deal.title ?? 'İsimsiz fırsat',
        amount: deal.value ?? 0,
        owner: userMap.get(deal.assignedTo ?? '') ?? 'Atanmamış',
        status: deal.status,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      }))
    return { id: key, label, value, delta, color, count, items }
  }

  const stages = [
    buildStage('new', 'Yeni fırsat', 'from-indigo-500 via-purple-500 to-pink-500'),
    buildStage('proposal', 'Teklif aşaması', 'from-cyan-500 via-indigo-500 to-purple-500'),
    buildStage('closing', 'Kapanışta', 'from-emerald-500 via-teal-500 to-sky-500'),
  ]

  const wonCount = dealsInRange.filter((deal) => deal.status === 'WON').length
  const totalCount = dealsInRange.length
  const prevWon = prevDealsInRange.filter((deal) => deal.status === 'WON').length
  const prevTotal = prevDealsInRange.length

  const successRate = totalCount === 0 ? 0 : Math.round((wonCount / totalCount) * 100)
  const prevSuccessRate = prevTotal === 0 ? 0 : Math.round((prevWon / prevTotal) * 100)

  const satisfactionScore = Number(clamp(4 + successRate / 100, 3.5, 5).toFixed(1))
  const prevSatisfaction = Number(clamp(4 + prevSuccessRate / 100, 3.5, 5).toFixed(1))

  const watchers = targetCompanyId
    ? users.filter((user) => !user.companyId || user.companyId === targetCompanyId).length
    : clamp(users.length, 0, 999)

  return {
    range,
    trend,
    watchers,
    live: currentTotal > 0,
    stages,
    hotDeals,
    totals: {
      activeUsers: watchers,
      conversionDelta: successRate,
    },
    schedule: upcomingTasks,
    performance: {
      value: successRate,
      label: 'Kapanan fırsat',
    },
    satisfaction: {
      score: satisfactionScore,
      trend: satisfactionScore - prevSatisfaction,
    },
  }
}
