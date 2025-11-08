'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { FileText, TrendingUp, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

const QuoteStatusPieChart = dynamic(() => import('@/components/reports/charts/QuoteStatusPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const QuoteTrendLineChart = dynamic(() => import('@/components/reports/charts/QuoteTrendLineChart'), {
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

export default function QuoteReports() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['quote-reports'],
    queryFn: fetchQuoteReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  })

  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-indigo-50 border-indigo-200">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Teklif Raporları</h3>
            <p className="text-sm text-gray-600">
              Teklif bazlı detaylı analizler. Durum dağılımı, trend analizi ve 
              kabul/red oranlarını görüntüleyin. Tüm veriler anlık olarak güncellenir.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Teklif Durum Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Durum bazlı teklif dağılımı</p>
            </div>
            <CheckCircle className="h-5 w-5 text-primary-600" />
          </div>
          <QuoteStatusPieChart data={data?.statusDistribution || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Tekliflerin durum bazlı dağılımı. 
            Taslak, gönderildi, kabul edildi ve reddedildi tekliflerin oranlarını görüntüleyin.
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Teklif Trend Analizi</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık teklif oluşturma trendi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <QuoteTrendLineChart data={data?.trend || []} />
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <strong>Açıklama:</strong> Aylık bazda teklif oluşturma trendi. 
            Hangi aylarda daha fazla teklif oluşturulduğunu görüntüleyin.
          </div>
        </Card>
      </div>
    </div>
  )
}



