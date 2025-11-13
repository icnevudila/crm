export interface MonthlyKPI {
  month: string
  sales?: number
  quotes?: number
  acceptedQuotes?: number
  invoices?: number
  deals?: number
}

export interface KPIData {
  totalSales: number
  totalQuotes: number
  successRate: number
  activeCompanies: number
  recentActivity: number
  totalInvoices: number
  totalCustomers: number
  totalDeals: number
  avgDealValue: number
  pendingInvoices: number
  pendingShipments: number
  pendingPurchaseShipments: number
  monthlyKPIs: MonthlyKPI[]
}

export interface TrendsResponse {
  trends: Record<string, unknown>[]
}

export interface DistributionResponse {
  productSales: Record<string, unknown>[]
  customerSectors: Record<string, unknown>[]
  companySectors: Record<string, unknown>[]
}

export interface PerformanceResponse {
  performance: Record<string, unknown>[]
}

export interface DealKanbanItem {
  id: string
  title?: string
  value?: number
  createdAt?: string
  customer?: { name?: string }
  Customer?: { name?: string }
}

export interface DealKanbanColumn {
  stage: string
  count: number
  totalValue?: number
  deals?: DealKanbanItem[]
}

export interface DealKanbanResponse {
  kanban: DealKanbanColumn[]
}

export interface InvoiceKanbanItem {
  id: string
  title?: string
  totalAmount?: number
  total?: number
  createdAt: string
}

export interface InvoiceKanbanColumn {
  status: string
  count: number
  totalValue?: number
  invoices?: InvoiceKanbanItem[]
}

export interface InvoiceKanbanResponse {
  kanban: InvoiceKanbanColumn[]
}

export interface QuoteAnalysisResponse {
  total: number
  accepted: number
  pending: number
  rejected: number
  successRate: number
  rejectionReasons: Record<string, unknown>[]
  acceptedTotal: number
  pendingTotal: number
  rejectedTotal: number
}

export interface SalesReportsResponse {
  monthlyComparison: Record<string, unknown>[]
}

export interface CustomerReportsResponse {
  growthTrend: Record<string, unknown>[]
}

export interface RecentActivitiesResponse {
  activities: Record<string, unknown>[]
}


