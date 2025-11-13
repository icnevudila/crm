'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Users, PieChart, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const CustomerGrowthLineChart = dynamic(() => import('@/components/reports/charts/CustomerGrowthLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CustomerCityBarChart = dynamic(() => import('@/components/reports/charts/CustomerCityBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CustomerSectorRadarChart = dynamic(() => import('@/components/reports/charts/CustomerSectorRadarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchCustomerReports() {
  const res = await fetch('/api/reports/customers', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch customer reports')
  return res.json()
}

export default function CustomerReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-reports'],
    queryFn: fetchCustomerReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Müşteri Raporları</h3>
            <p className="text-sm text-gray-600">
              Müşteri artış trendleri, şehir ve sektör dağılımları hakkında bilgiler. Veriler anlık güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Müşteri Büyüme Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Son 12 ay müşteri artışı</p>
            </div>
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <CustomerGrowthLineChart data={data?.growthTrend || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Şehirlere Göre Müşteri Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">İl bazlı müşteri sayısı</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <CustomerCityBarChart data={data?.cityDistribution || []} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Sektör bazlı müşteri oranı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <CustomerSectorRadarChart data={data?.sectorDistribution || []} />
        </Card>
      </div>
    </div>
  )
}



