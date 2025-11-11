'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Target, TrendingUp, Users, Award } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load grafik componentleri
const UserPerformanceBarChart = dynamic(() => import('@/components/reports/charts/UserPerformanceBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const GoalAchievementLineChart = dynamic(() => import('@/components/reports/charts/GoalAchievementLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const TopPerformersPieChart = dynamic(() => import('@/components/reports/charts/TopPerformersPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const TeamPerformanceComparisonChart = dynamic(() => import('@/components/reports/charts/TeamPerformanceComparisonChart'), {
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

export default function PerformanceReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['performance-reports'],
    queryFn: fetchPerformanceReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Performans Raporları</h3>
            <p className="text-sm text-gray-600">
              Kullanıcı ve ekip performans analizleri. Satış performansı, hedef gerçekleşme oranları ve 
              kullanıcı bazlı karşılaştırmaları görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      {/* Ekip Performans Özeti */}
      {data?.teamPerformance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Satış</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₺{new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(data.teamPerformance.totalSales)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ortalama Hedef Gerçekleşme</p>
                <p className="text-2xl font-bold text-gray-900">
                  %{data.teamPerformance.averageGoalAchievement.toFixed(1)}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold text-gray-900">{data.teamPerformance.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Kullanıcı Performans Karşılaştırması */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Kullanıcı Performans Karşılaştırması</h3>
              <p className="text-sm text-gray-500 mt-1">Kullanıcı bazlı satış performansı</p>
            </div>
            <Users className="h-5 w-5 text-primary-600" />
          </div>
          <UserPerformanceBarChart data={data?.userPerformance || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik kullanıcıların toplam satış performansını gösterir. 
            En yüksek satış yapan kullanıcıları belirleyin.
          </div>
        </Card>

        {/* 2. Hedef Gerçekleşme Trendi */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hedef Gerçekleşme Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık hedef vs gerçekleşen satış</p>
            </div>
            <Target className="h-5 w-5 text-primary-600" />
          </div>
          <GoalAchievementLineChart data={data?.monthlyGoalTrend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik aylık hedefler ile gerçekleşen satışları karşılaştırır. 
            Hedefin üzerinde performans gösteren ayları belirleyin.
          </div>
        </Card>

        {/* 3. En İyi Performans Gösterenler */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">En İyi Performans Gösterenler</h3>
              <p className="text-sm text-gray-500 mt-1">Top 5 kullanıcı performans dağılımı</p>
            </div>
            <Award className="h-5 w-5 text-primary-600" />
          </div>
          <TopPerformersPieChart data={data?.topPerformers || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik en yüksek satış yapan 5 kullanıcının performans dağılımını gösterir.
          </div>
        </Card>

        {/* 4. Ekip Performans Karşılaştırması */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ekip Performans Karşılaştırması</h3>
              <p className="text-sm text-gray-500 mt-1">Kullanıcılar arası performans karşılaştırması</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <TeamPerformanceComparisonChart data={data?.userPerformance || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Bu grafik kullanıcıların farklı metriklerdeki performanslarını karşılaştırır.
          </div>
        </Card>
      </div>
    </div>
  )
}




