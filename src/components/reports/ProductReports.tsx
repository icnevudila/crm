'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Package, TrendingUp, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const ProductTopSellersBarChart = dynamic(() => import('@/components/reports/charts/ProductTopSellersBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const ProductSalesScatterChart = dynamic(() => import('@/components/reports/charts/ProductSalesScatterChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const MonthlyGrowthAreaChart = dynamic(() => import('@/components/reports/charts/MonthlyGrowthAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchProductReports() {
  const res = await fetch('/api/reports/products', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch product reports')
  return res.json()
}

export default function ProductReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-reports'],
    queryFn: fetchProductReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-orange-50 border-orange-200">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Ürün Raporları</h3>
            <p className="text-sm text-gray-600">
              En çok satan ürünler, fiyat-performans analizi ve büyüme trendlerini inceleyin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">En Çok Satan Ürünler</h3>
              <p className="text-sm text-gray-500 mt-1">Satışa göre sıralama</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <ProductTopSellersBarChart data={data?.topSellers || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ürün Performansı</h3>
              <p className="text-sm text-gray-500 mt-1">Fiyat ve satış ilişkisi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <ProductSalesScatterChart data={data?.performance || []} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Büyüme</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık ürün performans trendi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <MonthlyGrowthAreaChart data={data?.growth || []} />
        </Card>
      </div>
    </div>
  )
}



