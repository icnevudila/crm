'use client'

import { useData } from '@/hooks/useData'
import { Card } from '@/components/ui/card'
import { Building2, PieChart, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const SectorCustomerDistributionPieChart = dynamic(() => import('@/components/reports/charts/SectorCustomerDistributionPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SectorSalesRadarChart = dynamic(() => import('@/components/reports/charts/SectorSalesRadarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SectorProfitabilityBarChart = dynamic(() => import('@/components/reports/charts/SectorProfitabilityBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

export default function SectorReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useData(
    isActive ? '/api/reports/sector' : null,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  )

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-teal-50 border-teal-200">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-teal-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Sektör Raporları</h3>
            <p className="text-sm text-gray-600">
              Sektör bazlı müşteri ve satış dağılımlarını inceleyin, kâr oranlarını tespit edin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Müşteri Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Sektör bazlı müşteri oranı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <SectorCustomerDistributionPieChart data={data?.customerDistribution || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Kârlılığı</h3>
              <p className="text-sm text-gray-500 mt-1">Sektör bazlı kâr oranı</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <SectorProfitabilityBarChart data={data?.profitability || []} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Satış Performansı</h3>
              <p className="text-sm text-gray-500 mt-1">Sektör bazlı satış performansı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <SectorSalesRadarChart data={data?.salesPerformance || []} />
        </Card>
      </div>
    </div>
  )
}




