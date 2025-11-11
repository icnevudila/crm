'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Building2, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load grafik componentleri
const SectorSalesRadarChart = dynamic(() => import('@/components/reports/charts/SectorSalesRadarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SectorProfitabilityBarChart = dynamic(() => import('@/components/reports/charts/SectorProfitabilityBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SectorCustomerDistributionPieChart = dynamic(() => import('@/components/reports/charts/SectorCustomerDistributionPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const SectorTrendLineChart = dynamic(() => import('@/components/reports/charts/SectorTrendLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchSectorReports() {
  const res = await fetch('/api/reports/sector', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch sector reports')
  return res.json()
}

export default function SectorReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sector-reports'],
    queryFn: fetchSectorReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-violet-50 border-violet-200">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-violet-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Sektör Raporları</h3>
            <p className="text-sm text-gray-600">
              Sektör bazlı detaylı analizler. Sektör performansı, karşılaştırmalar ve 
              trend analizlerini görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Sektör Satış Karşılaştırması */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Satış Karşılaştırması</h3>
              <p className="text-sm text-gray-500 mt-1">Sektörler arası satış, müşteri ve fırsat karşılaştırması</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <SectorSalesRadarChart data={data?.sectorSales || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik sektörler arası satış, müşteri ve fırsat performansını karşılaştırır.
          </div>
        </Card>

        {/* 2. Sektör Karlılık Analizi */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Karlılık Analizi</h3>
              <p className="text-sm text-gray-500 mt-1">Sektörler arası karlılık, satış ve ortalama sipariş değeri</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <SectorProfitabilityBarChart data={data?.sectorProfitability || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik sektörlerin karlılık oranlarını, satış ve ortalama sipariş değerlerini gösterir.
          </div>
        </Card>

        {/* 3. Sektör Müşteri Dağılımı */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Müşteri Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Sektörler arası müşteri sayısı dağılımı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <SectorCustomerDistributionPieChart data={data?.sectorCustomerDistribution || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik sektörler arası müşteri sayısı dağılımını gösterir.
          </div>
        </Card>

        {/* 4. Sektör Trend Analizi */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sektör Trend Analizi</h3>
              <p className="text-sm text-gray-500 mt-1">Sektörler arası aylık satış trendi</p>
            </div>
            <Building2 className="h-5 w-5 text-primary-600" />
          </div>
          <SectorTrendLineChart data={data?.sectorTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik sektörlerin son 12 ay içindeki satış trendini gösterir.
          </div>
        </Card>
      </div>
    </div>
  )
}




