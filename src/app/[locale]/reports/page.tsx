'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  Receipt,
  Package,
  DollarSign,
  Activity,
  Building2,
  Calendar,
  Target,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

import type { ReportSectionProps } from '@/components/reports/types'

const SalesReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/SalesReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const CustomerReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/CustomerReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const DealReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/DealReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const QuoteReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/QuoteReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const InvoiceReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/InvoiceReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const ProductReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/ProductReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const FinancialReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/FinancialReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const PerformanceReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/PerformanceReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const TimeBasedReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/TimeBasedReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const SectorReports = dynamic<ReportSectionProps>(
  () => import('@/components/reports/SectorReports').then((mod) => mod.default || mod),
  {
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

interface ReportCategory {
  id: string
  name: string
  iconId?: string
  description?: string
  count: number
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  sales: TrendingUp,
  customers: Users,
  deals: Briefcase,
  quotes: FileText,
  invoices: Receipt,
  products: Package,
  financial: DollarSign,
  performance: Target,
  time: Calendar,
  sector: Building2,
}

async function fetchReportCategories() {
  const res = await fetch('/api/reports/categories', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch report categories')
  return res.json()
}

interface ReportTab {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  Component: ComponentType<ReportSectionProps>
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['report-categories'],
    queryFn: fetchReportCategories,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  const reportTabs: ReportTab[] = [
    { id: 'sales', label: 'Satış Raporları', icon: TrendingUp, Component: SalesReports },
    { id: 'customers', label: 'Müşteri Raporları', icon: Users, Component: CustomerReports },
    { id: 'deals', label: 'Fırsat Raporları', icon: Briefcase, Component: DealReports },
    { id: 'quotes', label: 'Teklif Raporları', icon: FileText, Component: QuoteReports },
    { id: 'invoices', label: 'Fatura Raporları', icon: Receipt, Component: InvoiceReports },
    { id: 'products', label: 'Ürün Raporları', icon: Package, Component: ProductReports },
    { id: 'financial', label: 'Finansal Raporlar', icon: DollarSign, Component: FinancialReports },
    { id: 'performance', label: 'Performans Raporları', icon: Target, Component: PerformanceReports },
    { id: 'time', label: 'Zaman Bazlı Raporlar', icon: Calendar, Component: TimeBasedReports },
    { id: 'sector', label: 'Sektör Raporları', icon: Building2, Component: SectorReports },
  ]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="mt-2 text-gray-600">Detaylı analiz ve raporlar - Anlık veri ile güncel bilgiler</p>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {categories?.map((category: ReportCategory) => {
            const IconComponent = category.iconId ? iconMap[category.iconId] : Activity
            return (
              <Card key={category.id} className="cursor-pointer p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-50 p-2">
                    {IconComponent && <IconComponent className="h-5 w-5 text-primary-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{category.name}</p>
                    <p className="text-xs text-gray-500">{category.count} rapor</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10">
            {reportTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map(({ id, Component }) => (
            <TabsContent key={id} value={id} className="mt-0">
              <Component isActive={activeTab === id} />
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  )
}
