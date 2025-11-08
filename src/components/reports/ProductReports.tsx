'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Package, TrendingUp, DollarSign } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

const ProductSalesScatterChart = dynamic(() => import('@/components/reports/charts/ProductSalesScatterChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const ProductTopSellersBarChart = dynamic(() => import('@/components/reports/charts/ProductTopSellersBarChart'), {
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

export default function ProductReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-reports'],
    queryFn: fetchProductReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-cyan-50 border-cyan-200">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-cyan-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Ürün Raporları</h3>
            <p className="text-sm text-gray-600">
              Ürün bazlı detaylı analizler. En çok satan ürünler, fiyat-performans analizi ve 
              stok durumu raporlarını görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">En Çok Satan Ürünler</h3>
              <p className="text-sm text-gray-500 mt-1">Top 10 ürün satış performansı</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <ProductTopSellersBarChart data={data?.topSellers || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> En çok satan 10 ürünün satış performansı. 
            Hangi ürünlerin daha fazla satıldığını görüntüleyin.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fiyat-Performans Analizi</h3>
              <p className="text-sm text-gray-500 mt-1">Ürün fiyatı ve satış ilişkisi</p>
            </div>
            <DollarSign className="h-5 w-5 text-primary-600" />
          </div>
          <ProductSalesScatterChart data={data?.pricePerformance || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Ürün fiyatı ve satış performansı arasındaki ilişki. 
            Yüksek fiyatlı ürünlerin satış performansını analiz edin.
          </div>
        </Card>
      </div>
    </div>
  )
}



