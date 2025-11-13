export type LandingRange = 'weekly' | 'monthly'

export interface LandingPipelineStage {
  id: string
  label: string
  value: number
  delta: number
  color: string
  count: number
  items: LandingStageDeal[]
}

export interface LandingHotDeal {
  id: string
  company: string
  owner: string
  amount: number
  status: 'hot' | 'warming'
  createdAt: string
  updatedAt?: string | null
}

export interface LandingScheduleItem {
  id: string
  time: string
  title: string
  type: 'meeting' | 'call' | 'demo'
  createdAt: string
  status?: string | null
  owner?: string
}

export interface LandingStageDeal {
  id: string
  title: string
  amount: number
  owner: string
  status: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface LandingPipelineResponse {
  range: LandingRange
  trend: number
  watchers: number
  live: boolean
  stages: LandingPipelineStage[]
  hotDeals: LandingHotDeal[]
  totals: {
    activeUsers: number
    conversionDelta: number
  }
  aiInsight?: {
    highlight: string
    recommendation: string
  }
  schedule: LandingScheduleItem[]
  performance: {
    value: number
    label: string
  }
  satisfaction: {
    score: number
    trend: number
  }
}



