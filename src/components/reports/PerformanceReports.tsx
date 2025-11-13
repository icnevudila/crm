'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Target, Users, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const TeamPerformanceComparisonChart = dynamic(() => import('@/components/reports/charts/TeamPerformanceComparisonChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const UserPerformanceBarChart = dynamic(() => import('@/components/reports/charts/UserPerformanceBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const GoalAchievementLineChart = dynamic(() => import('@/components/reports/charts/GoalAchievementLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchPerformanceReports() {
  const res = await fetch('/api/reports/performance', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch performance reports')
  return res.json()
}

export default function PerformanceReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['performance-reports'],
    queryFn: fetchPerformanceReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-indigo-50 border-indigo-200">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Performans Raporları</h3>
            <p className="text-sm text-gray-600">
              Ekip ve kullanıcı performansını takip edin, hedef gerçekleşmelerini analiz edin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ekip Performansı</h3>
              <p className="text-sm text-gray-500 mt-1">Ekip bazlı performans karşılaştırması</p>
            </div>
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <TeamPerformanceComparisonChart data={data?.teamPerformance || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kullanıcı Performansı</h3>
              <p className="text-sm text-gray-500 mt-1">Kullanıcı bazlı performans</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <UserPerformanceBarChart data={data?.userPerformance || []} />
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hedef Gerçekleşmeleri</h3>
              <p className="text-sm text-gray-500 mt-1">Hedef bazlı ilerleme</p>
            </div>
            <Target className="h-5 w-5 text-primary-600" />
          </div>
          <GoalAchievementLineChart data={data?.goalAchievement || []} />
        </Card>
      </div>
    </div>
  )
}




