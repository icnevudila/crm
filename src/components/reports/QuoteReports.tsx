'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { FileText, PieChart, TrendingUp } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const QuoteTrendLineChart = dynamic(() => import('@/components/reports/charts/QuoteTrendLineChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const QuoteStatusPieChart = dynamic(() => import('@/components/reports/charts/QuoteStatusPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchQuoteReports() {
  const res = await fetch('/api/reports/quotes', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch quote reports')
  return res.json()
}

export default function QuoteReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quote-reports'],
    queryFn: fetchQuoteReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-rose-50 border-rose-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-rose-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Teklif Raporları</h3>
            <p className="text-sm text-gray-600">
              Teklif trendleri ve durum dağılımları. Kazanma/kaybetme oranlarını ve durum bazlı performansı inceleyin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Teklif Trendi</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık teklif durumu değişimleri</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <QuoteTrendLineChart data={data?.trend || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Teklif Durum Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Durum bazlı teklif sayısı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <QuoteStatusPieChart data={data?.statusDistribution || []} />
        </Card>
      </div>
    </div>
  )
}



