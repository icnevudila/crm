'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

// Lazy load grafik componentleri
const MonthlySalesBarChart = dynamic(() => import('@/components/reports/charts/MonthlySalesBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SalesByStatusPieChart = dynamic(() => import('@/components/reports/charts/SalesByStatusPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchSalesReports() {
  const res = await fetch('/api/reports/sales', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch sales reports')
  return res.json()
}

export default function SalesReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: fetchSalesReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      {/* Rapor Açıklaması */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Satış Raporları</h3>
            <p className="text-sm text-gray-600">
              Satış performansınızı detaylı olarak analiz edin. Aylık trendler, durum bazlı dağılım ve 
              zaman içindeki değişimleri görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      {/* Raporlar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Aylık Satış Trendi - Line Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Satış Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Son 12 ayın satış performansı</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <MonthlySalesBarChart data={data?.monthlyTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik son 12 ayın satış trendini gösterir. 
            Yükselen trend pozitif performans, düşen trend dikkat gerektirir.
          </div>
        </Card>

        {/* 2. Aylık Satış Karşılaştırması - Bar Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Satış Karşılaştırması</h3>
              <p className="text-sm text-gray-500 mt-1">Aylar arası satış karşılaştırması</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <MonthlySalesBarChart data={data?.monthlyComparison || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Her ayın satış tutarını karşılaştırarak en yüksek ve 
            en düşük performans gösteren ayları belirleyin.
          </div>
        </Card>

        {/* 3. Satış Durum Dağılımı - Pie Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Satış Durum Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Faturaların durum bazlı dağılımı</p>
            </div>
            <DollarSign className="h-5 w-5 text-primary-600" />
          </div>
          <SalesByStatusPieChart data={data?.statusDistribution || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Faturaların ödeme durumlarına göre dağılımı. 
            Ödenen, bekleyen ve iptal edilen faturaların oranlarını görüntüleyin.
          </div>
        </Card>
      </div>
    </div>
  )
}

