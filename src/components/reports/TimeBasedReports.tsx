'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load grafik componentleri
const DailyTrendLineChart = dynamic(() => import('@/components/reports/charts/DailyTrendLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const WeeklyComparisonBarChart = dynamic(() => import('@/components/reports/charts/WeeklyComparisonBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const MonthlyGrowthAreaChart = dynamic(() => import('@/components/reports/charts/MonthlyGrowthAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const YearlySummaryComposedChart = dynamic(() => import('@/components/reports/charts/YearlySummaryComposedChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchTimeBasedReports() {
  const res = await fetch('/api/reports/time', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch time-based reports')
  return res.json()
}

export default function TimeBasedReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['time-based-reports'],
    queryFn: fetchTimeBasedReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-teal-50 border-teal-200">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Zaman Bazlı Raporlar</h3>
            <p className="text-sm text-gray-600">
              Belirli zaman dilimlerindeki trendler ve analizler. Günlük, haftalık, aylık ve yıllık 
              performans raporlarını görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Günlük Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Günlük Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Son 30 günün satış, müşteri ve fırsat trendi</p>
            </div>
            <Clock className="h-5 w-5 text-primary-600" />
          </div>
          <DailyTrendLineChart data={data?.dailyTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik son 30 günün günlük satış, müşteri ve fırsat trendini gösterir.
          </div>
        </Card>

        {/* 2. Haftalık Karşılaştırma */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Haftalık Karşılaştırma</h3>
              <p className="text-sm text-gray-500 mt-1">Son 12 haftanın performans karşılaştırması</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <WeeklyComparisonBarChart data={data?.weeklyComparison || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik son 12 haftanın satış, müşteri ve fırsat performansını karşılaştırır.
          </div>
        </Card>

        {/* 3. Aylık Büyüme */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Büyüme</h3>
              <p className="text-sm text-gray-500 mt-1">Son 12 ayın büyüme trendi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <MonthlyGrowthAreaChart data={data?.monthlyGrowth || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik son 12 ayın satış ve müşteri büyüme trendini gösterir.
          </div>
        </Card>

        {/* 4. Yıllık Özet */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Yıllık Özet</h3>
              <p className="text-sm text-gray-500 mt-1">Son 3 yılın performans özeti</p>
            </div>
            <Calendar className="h-5 w-5 text-primary-600" />
          </div>
          <YearlySummaryComposedChart data={data?.yearlySummary || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik son 3 yılın satış, müşteri, fırsat ve fatura özetini gösterir.
          </div>
        </Card>
      </div>
    </div>
  )
}




