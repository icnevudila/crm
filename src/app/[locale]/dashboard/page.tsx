'use client'

import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { Suspense, useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Eye } from 'lucide-react'
// ULTRA AGRESİF lazy loading - ilk yükleme hızı için
import SkeletonDashboard from '@/components/skeletons/SkeletonDashboard'
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs' // Hook'lar dynamic import edilemez
import { Card } from '@/components/ui/card' // Basit component - normal import
import GradientCard from '@/components/ui/GradientCard'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import {
  TrendingUp,
  FileText,
  Target,
  Building2,
  Activity,
  Receipt,
  Users,
  Briefcase,
  DollarSign,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useData } from '@/hooks/useData'

const SmartReminder = dynamic(() => import('@/components/automations/SmartReminder'), {
  ssr: false,
  loading: () => <div className="h-32 rounded-3xl animate-pulse bg-slate-100/80" />,
})

const ActivityTimeline = dynamic(() => import('@/components/ui/ActivityTimeline'), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse bg-gray-100 rounded" />,
})

const SalesTrendChart = dynamic(() => import('@/components/charts/SalesTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />,
})

const ProductSalesChart = dynamic(() => import('@/components/charts/ProductSalesChart'), {
  ssr: false,
  loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />,
})

const CustomerSectorChart = dynamic(() => import('@/components/charts/CustomerSectorChart'), {
  ssr: false,
  loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />,
})

const CompanySectorChart = dynamic(() => import('@/components/charts/CompanySectorChart'), {
  ssr: false,
  loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />,
})

const CompanyPerformanceChart = dynamic(() => import('@/components/charts/CompanyPerformanceChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />,
})

const InvoiceStatusChart = dynamic(() => import('@/components/charts/InvoiceStatusChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />,
})

const DealStatusChart = dynamic(() => import('@/components/charts/DealStatusChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />,
})

const MonthlySalesBarChart = dynamic(() => import('@/components/reports/charts/MonthlySalesBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CustomerGrowthLineChart = dynamic(() => import('@/components/reports/charts/CustomerGrowthLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

interface MonthlyKPI {
  month: string
  sales?: number
  quotes?: number
  acceptedQuotes?: number
  invoices?: number
  deals?: number
}

interface KPIData {
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

interface TrendsResponse {
  trends: Record<string, unknown>[]
}

interface DistributionResponse {
  productSales: Record<string, unknown>[]
  customerSectors: Record<string, unknown>[]
  companySectors: Record<string, unknown>[]
}

interface PerformanceResponse {
  performance: Record<string, unknown>[]
}

interface DealKanbanItem {
  id: string
  title?: string
  value?: number
  createdAt?: string
  customer?: { name?: string }
  Customer?: { name?: string }
}

interface DealKanbanColumn {
  stage: string
  count: number
  totalValue?: number
  deals?: DealKanbanItem[]
}

interface DealKanbanResponse {
  kanban: DealKanbanColumn[]
}

interface InvoiceKanbanItem {
  id: string
  title?: string
  totalAmount?: number
  total?: number
  createdAt: string
}

interface InvoiceKanbanColumn {
  status: string
  count: number
  totalValue?: number
  invoices?: InvoiceKanbanItem[]
}

interface InvoiceKanbanResponse {
  kanban: InvoiceKanbanColumn[]
}

interface QuoteAnalysisResponse {
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

interface SalesReportsResponse {
  monthlyComparison: Record<string, unknown>[]
}

interface CustomerReportsResponse {
  growthTrend: Record<string, unknown>[]
}

interface RecentActivitiesResponse {
  activities: Record<string, unknown>[]
}

// Status labels ve colors - component dışında tanımla (modal'da kullanılacak)
const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
}

// Stage labels ve colors - Deal modal için
const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  

  const {
    data: kpisData,
    isLoading: kpisLoading,
    error: kpisError,
  } = useData<KPIData>('/api/analytics/kpis', {
    dedupingInterval: 60_000,
    refreshInterval: 60_000,
    revalidateOnFocus: false,
  })

  const { data: trendsData } = useData<TrendsResponse>('/api/analytics/trends', {
    dedupingInterval: 90_000,
    refreshInterval: 180_000,
    revalidateOnFocus: false,
  })

  const { data: distributionData } = useData<DistributionResponse>('/api/analytics/distribution', {
    dedupingInterval: 120_000,
    refreshInterval: 240_000,
    revalidateOnFocus: false,
  })

  const { data: userPerformanceData } = useData<PerformanceResponse>('/api/analytics/user-performance', {
    dedupingInterval: 120_000,
    refreshInterval: 240_000,
    revalidateOnFocus: false,
  })

  const { data: dealKanbanData } = useData<DealKanbanResponse>('/api/analytics/deal-kanban', {
    dedupingInterval: 120_000,
    refreshInterval: 180_000,
    revalidateOnFocus: false,
  })

  const { data: invoiceKanbanData } = useData<InvoiceKanbanResponse>('/api/analytics/invoice-kanban', {
    dedupingInterval: 120_000,
    refreshInterval: 180_000,
    revalidateOnFocus: false,
  })

  const { data: recentActivitiesData } = useData<RecentActivitiesResponse>('/api/analytics/recent-activities', {
    dedupingInterval: 180_000,
    refreshInterval: 300_000,
    revalidateOnFocus: false,
  })

  const { data: quoteAnalysisData } = useData<QuoteAnalysisResponse>('/api/analytics/quote-analysis', {
    dedupingInterval: 120_000,
    refreshInterval: 180_000,
    revalidateOnFocus: false,
  })

  const { data: salesReportsData } = useData<SalesReportsResponse>('/api/reports/sales', {
    dedupingInterval: 300_000,
    refreshInterval: 600_000,
    revalidateOnFocus: false,
  })

  const { data: customerReportsData } = useData<CustomerReportsResponse>('/api/reports/customers', {
    dedupingInterval: 300_000,
    refreshInterval: 600_000,
    revalidateOnFocus: false,
  })

  // Realtime güncellemeler - sadece initial data ile başla
  // Realtime hook sonra günceller (lazy - performans için)
  // DÜZELTME: Hata durumunda varsayılan değerler kullan - ama önce initialKPIs'i kontrol et
  const defaultKPIs = {
    totalSales: 0,
    totalQuotes: 0,
    successRate: 0,
    activeCompanies: 0,
    recentActivity: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalDeals: 0,
    avgDealValue: 0,
    pendingInvoices: 0,
    pendingShipments: 0,
    pendingPurchaseShipments: 0,
    monthlyKPIs: [],
  }
  
  // DÜZELTME: kpisData varsa kullan, yoksa defaultKPIs kullan
  // Ama kpisError varsa ve kpisData yoksa, hata mesajı göster
  const kpis = useRealtimeKPIs(kpisData || defaultKPIs)
  
  // DÜZELTME: Hata durumunda log ekle - sorunun ne olduğunu anla
  if (kpisError && !kpisData) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard KPIs error - No data loaded:', kpisError)
    }
  }

  // Dashboard anında göster - skeleton sadece ilk yüklemede
  // Veriler paralel çekilirken bile sayfa görünür
  // Hata durumunda bile sayfayı göster (varsayılan değerlerle)
  if (kpisLoading && !kpisData && !kpisError) {
    return <SkeletonDashboard />
  }

  // Development'ta hata ve veri durumunu logla
  if (process.env.NODE_ENV === 'development') {
    if (kpisError) {
      console.error('Dashboard KPIs error:', kpisError)
    }
    if (kpisData) {
      console.log('Dashboard KPIs data:', kpisData)
    }
    if (session) {
      console.log('Dashboard session:', { userId: session.user?.id, companyId: session.user?.companyId })
    } else {
      console.warn('Dashboard: No session found!')
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1920px] mx-auto p-4 space-y-6">
        {/* Smart Reminder - Günlük bildirimler */}
        <SmartReminder />
        
        {/* Premium Welcome Section - Optimized */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 via-pink-600 to-rose-600 p-8 text-white shadow-2xl shadow-purple-500/50 mb-8">
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md shadow-lg border border-white/20">
                    <Sparkles className="h-7 w-7 drop-shadow-lg" />
                  </div>
                  <h1 className="text-4xl font-extrabold drop-shadow-lg">
                    {t('title')}
                  </h1>
                </div>
                <p className="text-indigo-100 text-lg mb-6 font-medium">
                  {t('welcome')}, <span className="font-bold text-white">{session?.user?.name}</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                    <Zap className="h-5 w-5 text-yellow-300" />
                    <span className="text-sm font-semibold">{t('realtime')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                    <Activity className="h-5 w-5 text-green-300" />
                    <span className="text-sm font-semibold">{kpis?.recentActivity || 0} {t('activity')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all duration-300">
                    <TrendingUp className="h-5 w-5 text-blue-300" />
                    <span className="text-sm font-semibold">
                      {formatCurrency(kpis?.totalSales || 0, 'TRY')} {t('sales')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
        </div>

        {/* Genel KPI Cards Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">{t('overview')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('overviewDescription')}</p>
          </div>
          <Suspense fallback={<SkeletonDashboard />}>
            <KPICards kpis={kpis} t={t} locale={locale} />
          </Suspense>
        </section>

        {/* Aylık KPI Cards Section */}
        {kpis?.monthlyKPIs && kpis.monthlyKPIs.length > 0 && (
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-900">{t('monthlyOverview')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('monthlyOverviewDescription')}</p>
            </div>
            <Suspense fallback={<SkeletonDashboard />}>
              <MonthlyKPICards monthlyKPIs={kpis.monthlyKPIs} t={t} locale={locale} />
            </Suspense>
          </section>
        )}

        {/* Sales & Performance Section - 3 Kart */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Satış & Performans Analizi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Aylık trendler ve dağılım analizleri</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol: Aylık Satış Karşılaştırması */}
            <div className="relative group">
              <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Aylık Satış Karşılaştırması</h3>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Aylar arası satış karşılaştırması</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />}>
                    <MonthlySalesBarChart data={salesReportsData?.monthlyComparison || []} />
                  </Suspense>
                </div>
              </Card>
            </div>

            {/* Sağ: Müşteri Büyüme Trendi */}
            <div className="relative group">
              <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Müşteri Büyüme Trendi</h3>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Zaman içinde müşteri sayısı değişimi</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />}>
                    <CustomerGrowthLineChart data={customerReportsData?.growthTrend || []} />
                  </Suspense>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Distribution Analysis Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">{t('distributionAnalysis')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('distributionAnalysisDescription')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Sales Chart */}
            <div className="relative group">
              <Card className="relative p-5 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">{t('productSalesDistribution')}</h3>
                  </div>
                  <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />}>
                    <ProductSalesChart data={distributionData?.productSales || []} />
                  </Suspense>
                </div>
              </Card>
            </div>

            {/* Customer Sector Chart */}
            <div className="relative group">
              <Card className="relative p-5 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">{t('customerSectorDistribution')}</h3>
                  </div>
                  <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />}>
                    <CustomerSectorChart data={distributionData?.customerSectors || []} />
                  </Suspense>
                </div>
              </Card>
            </div>

            {/* Company Sector Chart */}
            <div className="relative group">
              <Card className="relative p-5 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">{t('companySectorDistribution')}</h3>
                  </div>
                  <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded-lg" />}>
                    <CompanySectorChart data={distributionData?.companySectors || []} />
                  </Suspense>
                </div>
              </Card>
            </div>
        </div>
      </section>

        {/* Deal Status Section - Fırsat Durumu Grafik */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">{t('dealStatus')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('dealStatusDescription')}</p>
          </div>
          <div className="relative group">
            <Card className="relative p-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-white border border-gray-200">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('dealStatusDistribution')}</h3>
                    <p className="text-xs text-gray-600 mt-1 font-medium">{t('dealStatusDistributionDescription')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg">
                    <Briefcase className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
                <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded-lg" />}>
                  <DealStatusChart 
                    data={dealKanbanData?.kanban || []} 
                    onStageClick={(stage) => {
                      setSelectedStage(stage)
                      setStageModalOpen(true)
                    }}
                  />
                </Suspense>
              </div>
            </Card>
          </div>
        </section>

        {/* Invoice Status Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">{t('invoiceStatus')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('invoiceStatusDescription')}</p>
          </div>
          <Card className="p-6 shadow-card hover:shadow-card-hover transition-shadow bg-gradient-to-br from-white to-green-50/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{t('invoiceStatusDistribution')}</h3>
                <p className="text-xs text-gray-500 mt-1">{t('invoiceStatusDistributionDescription')}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
              <InvoiceStatusChart 
                data={invoiceKanbanData?.kanban || []} 
                onStatusClick={(status) => {
                  setSelectedStatus(status)
                  setStatusModalOpen(true)
                }}
              />
            </Suspense>
          </Card>
        </section>

        {/* Deal Stage Detail Modal */}
        <Dialog open={stageModalOpen} onOpenChange={setStageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStage && dealKanbanData?.kanban?.find((col: any) => col.stage === selectedStage) 
                  ? `${stageLabels[selectedStage] || selectedStage} ${t('dealsInStage')}`
                  : t('dealDetails')}
              </DialogTitle>
              <DialogDescription>
                {selectedStage && dealKanbanData?.kanban?.find((col: any) => col.stage === selectedStage)
                  ? `${dealKanbanData.kanban.find((col: any) => col.stage === selectedStage)?.count || 0} ${t('dealsFound')}`
                  : t('dealList')}
              </DialogDescription>
            </DialogHeader>
            {selectedStage && dealKanbanData?.kanban && (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('dealTitle')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('amount')}</TableHead>
                      <TableHead>{t('customer')}</TableHead>
                      <TableHead>{t('createdAt')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealKanbanData.kanban
                      .find((col: any) => col.stage === selectedStage)
                      ?.deals?.map((deal: any) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.title || t('untitled')}</TableCell>
                          <TableCell>
                            <Badge className={stageColors[selectedStage] || 'bg-gray-100'}>
                              {stageLabels[selectedStage] || selectedStage}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(deal.value || 0, 'TRY')}
                          </TableCell>
                          <TableCell>
                            {deal.customer?.name || deal.Customer?.name || '-'}
                          </TableCell>
                          <TableCell>
                            {deal.createdAt 
                              ? new Date(deal.createdAt).toLocaleDateString('tr-TR')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            {t('noDealsInStatus')}
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice Status Detail Modal */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStatus && invoiceKanbanData?.kanban?.find((col: any) => col.status === selectedStatus) 
                  ? `${statusLabels[selectedStatus] || selectedStatus} ${t('invoicesInStatus')}`
                  : t('invoiceDetails')}
              </DialogTitle>
              <DialogDescription>
                {selectedStatus && invoiceKanbanData?.kanban?.find((col: any) => col.status === selectedStatus)
                  ? `${invoiceKanbanData.kanban.find((col: any) => col.status === selectedStatus)?.count || 0} ${t('invoicesFound')}`
                  : t('invoiceList')}
              </DialogDescription>
            </DialogHeader>
            {selectedStatus && invoiceKanbanData?.kanban && (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('invoiceNumber')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('total')}</TableHead>
                      <TableHead>{t('createdAt')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceKanbanData.kanban
                      .find((col: any) => col.status === selectedStatus)
                      ?.invoices?.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.title}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[selectedStatus] || 'bg-gray-100'}>
                              {statusLabels[selectedStatus] || selectedStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {/* DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount) */}
                            {formatCurrency(invoice.totalAmount || invoice.total || 0)}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            {t('noInvoicesInStatus')}
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Recent Activities Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Son Aktiviteler
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Sistem aktivite logları</p>
          </div>
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            {recentActivitiesData?.activities && recentActivitiesData.activities.length > 0 ? (
              <ActivityTimeline activities={recentActivitiesData.activities} />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <p>Henüz aktivite kaydı yok</p>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}

// Memoized KPI Cards component for better performance - PREMIUM DESIGN
const KPICards = ({ kpis, t, locale }: { kpis: any; t: any; locale: string }) => {
  const memoizedCards = useMemo(
    () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Net Satış - Featured Card */}
        <Link href={`/${locale}/invoices`} prefetch={true} className="block h-full group" title="Fatura kısmından ödenen faturaların toplam tutarını gösterir">
          <Card className="p-5 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-indigo-200/50 group-hover:border-indigo-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  {t('totalSales')}
                </p>
                <AnimatedCounter
                  value={kpis?.totalSales || 0}
                  prefix="₺"
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Teklif Adedi */}
        <Link href={`/${locale}/quotes`} prefetch={true} className="block h-full group" title="Teklifler kısmından tüm tekliflerin toplam sayısını gösterir">
          <Card className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-purple-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-200/50 group-hover:border-purple-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  {t('totalQuotes')}
                </p>
                <AnimatedCounter
                  value={kpis?.totalQuotes || 0}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Başarı Oranı */}
        <Link href={`/${locale}/reports`} prefetch={true} className="block h-full group" title="Teklifler kısmından kabul edilen tekliflerin toplam tekliflere oranını gösterir">
          <Card className="p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-200/50 group-hover:border-green-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  {t('successRate')}
                </p>
                <AnimatedCounter
                  value={kpis?.successRate || 0}
                  suffix="%"
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Aktif Firma */}
        <Link href={`/${locale}/companies`} prefetch={true} className="block h-full group" title="Müşteri Firmaları kısmından aktif durumdaki firmaların toplam sayısını gösterir">
          <Card className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border-blue-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-200/50 group-hover:border-blue-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  {t('activeCompanies')}
                </p>
                <AnimatedCounter
                  value={kpis?.activeCompanies || 0}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Son Aktivite */}
        <Link href={`/${locale}/activity`} prefetch={true} className="block h-full group" title="Aktivite Logları kısmından son 30 gün içindeki aktivitelerin toplam sayısını gösterir">
          <Card className="p-5 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 border-pink-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-pink-200/50 group-hover:border-pink-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  {t('recentActivity')}
                </p>
                <AnimatedCounter
                  value={kpis?.recentActivity || 0}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Müşteriler */}
        <Link href={`/${locale}/customers`} prefetch={true} className="block h-full group" title="Müşteriler kısmından tüm müşterilerin toplam sayısını gösterir">
          <Card className="p-5 bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border-blue-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-blue-200/50 group-hover:border-blue-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Müşteriler
                </p>
                <AnimatedCounter
                  value={kpis?.totalCustomers || 0}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Fırsatlar */}
        <Link href={`/${locale}/deals`} prefetch={true} className="block h-full group" title="Fırsatlar kısmından tüm fırsatların toplam sayısını gösterir">
          <Card className="p-5 bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-purple-200/50 group-hover:border-purple-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/20 to-violet-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Fırsatlar
                </p>
                <AnimatedCounter
                  value={kpis?.totalDeals || 0}
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Bekleyen */}
        <Link href={`/${locale}/invoices?status=SENT`} prefetch={true} className="block h-full group" title="Fatura kısmından gönderilmiş ancak henüz ödenmemiş faturaların toplam tutarını gösterir">
          <Card className="p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200/60 cursor-pointer h-full transition-all duration-300 group-hover:shadow-xl group-hover:shadow-amber-200/50 group-hover:border-amber-300 group-hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Bekleyen
                </p>
                <AnimatedCounter
                  value={kpis?.pendingInvoices || 0}
                  prefix="₺"
                  className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent break-words leading-tight"
                />
              </div>
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex-shrink-0 ml-3 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
        </Link>
      </div>
    ),
    [kpis, t, locale]
  )

  return memoizedCards
}

// Memoized Monthly KPI Cards component for better performance
// KOMPAKT: Daha az yer kaplayan, daha küçük kartlar
const MonthlyKPICards = ({ monthlyKPIs, t, locale }: { monthlyKPIs: any[]; t: any; locale: string }) => {
  const memoizedCards = useMemo(
    () => (
      <div className="space-y-2">
        {monthlyKPIs.map((monthly: any) => {
          const monthName = new Date(monthly.month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
          const successRate = monthly.quotes > 0 ? Math.round((monthly.acceptedQuotes / monthly.quotes) * 100) : 0
          
          return (
            <div key={monthly.month} className="mb-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 capitalize">{monthName}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {/* Aylık Satış */}
                <GradientCard gradient="primary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Satış
                      </p>
                      <AnimatedCounter
                        value={monthly.sales || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ml-2 flex-shrink-0">
                      <TrendingUp className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Teklif */}
                <GradientCard gradient="secondary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Teklif
                      </p>
                      <AnimatedCounter
                        value={monthly.quotes || 0}
                        className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 ml-2 flex-shrink-0">
                      <FileText className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Başarı Oranı */}
                <GradientCard gradient="success" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Başarı
                      </p>
                      <AnimatedCounter
                        value={successRate}
                        suffix="%"
                        className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ml-2 flex-shrink-0">
                      <Target className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Fatura */}
                <GradientCard gradient="primary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Fatura
                      </p>
                      <AnimatedCounter
                        value={monthly.invoices || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ml-2 flex-shrink-0">
                      <Receipt className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Fırsat */}
                <GradientCard gradient="secondary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Fırsat
                      </p>
                      <AnimatedCounter
                        value={monthly.deals || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 ml-2 flex-shrink-0">
                      <Briefcase className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                </GradientCard>
              </div>
            </div>
          )
        })}
      </div>
    ),
    [monthlyKPIs, t, locale]
  )

  return memoizedCards
}

