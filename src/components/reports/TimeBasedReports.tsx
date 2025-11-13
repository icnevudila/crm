'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Calendar, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const DailyTrendLineChart = dynamic(() => import('@/components/reports/charts/DailyTrendLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const WeeklyComparisonBarChart = dynamic(() => import('@/components/reports/charts/WeeklyComparisonBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const YearlySummaryComposedChart = dynamic(() => import('@/components/reports/charts/YearlySummaryComposedChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchTimeReports() {
  const res = await fetch('/api/reports/time', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch time-based reports')
  return res.json()
}

export default function TimeBasedReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['time-reports'],
    queryFn: fetchTimeReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Zaman Bazlı Raporlar</h3>
            <p className="text-sm text-gray-600">
              Günlük, haftalık ve yıllık trendleri izleyin; dönemsel performansınızı değerlendirin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Günlük Trend</h3>
              <p className="text-sm text-gray-500 mt-1">Günlük aktiviteler ve satış trendi</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <DailyTrendLineChart data={data?.dailyTrend || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Haftalık Karşılaştırma</h3>
              <p className="text-sm text-gray-500 mt-1">Haftalık performans karşılaştırması</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <WeeklyComparisonBarChart data={data?.weeklyComparison || []} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Yıllık Özet</h3>
              <p className="text-sm text-gray-500 mt-1">Yıllık performans özeti</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <YearlySummaryComposedChart data={data?.yearlySummary || []} />
        </Card>
      </div>
    </div>
  )
}




