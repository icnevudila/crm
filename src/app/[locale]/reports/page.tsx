'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Package, 
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Building2,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load rapor componentleri - güvenli import ile
const SalesReports = dynamic(
  () => import('@/components/reports/SalesReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const CustomerReports = dynamic(
  () => import('@/components/reports/CustomerReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const DealReports = dynamic(
  () => import('@/components/reports/DealReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const QuoteReports = dynamic(
  () => import('@/components/reports/QuoteReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const InvoiceReports = dynamic(
  () => import('@/components/reports/InvoiceReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const ProductReports = dynamic(
  () => import('@/components/reports/ProductReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const FinancialReports = dynamic(
  () => import('@/components/reports/FinancialReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const PerformanceReports = dynamic(
  () => import('@/components/reports/PerformanceReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const TimeBasedReports = dynamic(
  () => import('@/components/reports/TimeBasedReports').then((mod) => mod.default || mod),
  { 
    ssr: false,
    loading: () => <SkeletonList />,
  }
)

const SectorReports = dynamic(
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

// Icon mapping
const iconMap: Record<string, any> = {
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

export default function ReportsPage() {
  const locale = useLocale()
  const [activeTab, setActiveTab] = useState('sales')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['report-categories'],
    queryFn: fetchReportCategories,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  const reportTabs = [
    { id: 'sales', label: 'Satış Raporları', component: SalesReports },
    { id: 'customers', label: 'Müşteri Raporları', component: CustomerReports },
    { id: 'deals', label: 'Fırsat Raporları', component: DealReports },
    { id: 'quotes', label: 'Teklif Raporları', component: QuoteReports },
    { id: 'invoices', label: 'Fatura Raporları', component: InvoiceReports },
    { id: 'products', label: 'Ürün Raporları', component: ProductReports },
    { id: 'financial', label: 'Finansal Raporlar', component: FinancialReports },
    { id: 'performance', label: 'Performans Raporları', component: PerformanceReports },
    { id: 'time', label: 'Zaman Bazlı Raporlar', component: TimeBasedReports },
    { id: 'sector', label: 'Sektör Raporları', component: SectorReports },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
        <p className="mt-2 text-gray-600">
          Detaylı analiz ve raporlar - Anlık veri ile güncel bilgiler
        </p>
      </div>

      {/* Kategori Özeti */}
      {isLoading ? (
        <SkeletonList />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories?.map((category: ReportCategory) => {
            const IconComponent = category.iconId ? iconMap[category.iconId] : Activity
            return (
              <Card key={category.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    {IconComponent && <IconComponent className="h-5 w-5 text-primary-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{category.name}</p>
                    <p className="text-xs text-gray-500">{category.count} rapor</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Rapor Kategorileri - Tabs */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:grid-cols-10 mb-6">
            {reportTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {reportTabs.map((tab) => {
            const TabComponent = tab.component
            // Component'in yüklenip yüklenmediğini kontrol et
            if (!TabComponent) {
              return (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <div className="p-4 text-red-600">Rapor bileşeni yüklenemedi</div>
                </TabsContent>
              )
            }
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <TabComponent />
              </TabsContent>
            )
          })}
        </Tabs>
      </Card>
    </div>
  )
}
