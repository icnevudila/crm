'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Briefcase, Target, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

const DealStageAreaChart = dynamic(() => import('@/components/reports/charts/DealStageAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const DealValueComposedChart = dynamic(() => import('@/components/reports/charts/DealValueComposedChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchDealReports() {
  const res = await fetch('/api/reports/deals', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch deal reports')
  return res.json()
}

export default function DealReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['deal-reports'],
    queryFn: fetchDealReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Briefcase className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Fırsat Raporları</h3>
            <p className="text-sm text-gray-600">
              Fırsat bazlı detaylı analizler. Aşama dağılımı, değer trendleri ve 
              kazanma/kaybetme oranlarını görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fırsat Aşama Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Aşama bazlı fırsat dağılımı</p>
            </div>
            <Target className="h-5 w-5 text-primary-600" />
          </div>
          <DealStageAreaChart data={data?.stageDistribution || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Fırsatların aşama bazlı dağılımı. 
            Hangi aşamada kaç fırsat olduğunu görüntüleyin.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fırsat Değer Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık fırsat değer ve sayı trendi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <DealValueComposedChart data={data?.valueTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Aylık bazda fırsat değer ve sayı trendi. 
            Hem değer hem sayı trendini birlikte görüntüleyin.
          </div>
        </Card>
      </div>
    </div>
  )
}



