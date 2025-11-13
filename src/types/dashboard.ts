export type DashboardRange = 'weekly' | 'monthly'

export interface DashboardPipelineStage {
  id: string
  label: string
  value: number
  delta: number
  color: string
  count: number
  items: DashboardStageDeal[]
}

export interface DashboardHotDeal {
  id: string
  company: string
  owner: string
  amount: number
  status: 'hot' | 'warming'
  createdAt: string
  updatedAt?: string | null
}

export interface DashboardScheduleItem {
  id: string
  time: string
  title: string
  type: 'meeting' | 'call' | 'demo'
  createdAt: string
  status?: string | null
  owner?: string
}

export interface DashboardStageDeal {
  id: string
  title: string
  amount: number
  owner: string
  status: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface DashboardSpotlightResponse {
  range: DashboardRange
  trend: number
  watchers: number
  live: boolean
  stages: DashboardPipelineStage[]
  hotDeals: DashboardHotDeal[]
  totals: {
    activeUsers: number
    conversionDelta: number
  }
  aiInsight?: {
    highlight: string
    recommendation: string
  }
  schedule: DashboardScheduleItem[]
  performance: {
    value: number
    label: string
  }
  satisfaction: {
    score: number
    trend: number
  }
}


