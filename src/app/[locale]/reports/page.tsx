'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Detaylı analiz ve raporlar - Anlık veri ile güncel bilgiler</p>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {categories?.map((category: ReportCategory) => {
            const IconComponent = category.iconId ? iconMap[category.iconId] : Activity
            const isActive = activeTab === category.id
            return (
              <Card 
                key={category.id} 
                className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary-500 shadow-md' : ''
                }`}
                onClick={() => setActiveTab(category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 transition-colors ${
                    isActive ? 'bg-primary-500' : 'bg-primary-50'
                  }`}>
                    {IconComponent && (
                      <IconComponent className={`h-5 w-5 ${
                        isActive ? 'text-white' : 'text-primary-600'
                      }`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${
                      isActive ? 'text-primary-700' : 'text-gray-900'
                    }`}>
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">{category.count} rapor</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Rapor İçeriği - Tab'lar olmadan */}
      {activeTab && (
        <Card className="p-4 sm:p-6">
          {reportTabs.map(({ id, Component }) => {
            if (activeTab !== id) return null
            return (
              <div key={id}>
                <Component isActive={true} />
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
