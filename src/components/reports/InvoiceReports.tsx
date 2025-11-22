'use client'

import { useData } from '@/hooks/useData'
import { Card } from '@/components/ui/card'
import { Receipt, PieChart, LineChart } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const InvoiceMonthlyAreaChart = dynamic(() => import('@/components/reports/charts/InvoiceMonthlyAreaChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const InvoicePaymentBarChart = dynamic(() => import('@/components/reports/charts/InvoicePaymentBarChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

export default function InvoiceReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useData(
    isActive ? '/api/reports/invoices' : null,
    {
      dedupingInterval: 5 * 60 * 1000,
      revalidateOnFocus: false,
    }
  )

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <Receipt className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Fatura Raporları</h3>
            <p className="text-sm text-gray-600">
              Fatura ödeme trendleri ve durum dağılımları. Tahsilat performansınızı analiz edin.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Aylık Fatura Trendleri</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık fatura tutarı ve sayısı</p>
            </div>
            <LineChart className="h-5 w-5 text-primary-600" />
          </div>
          <InvoiceMonthlyAreaChart data={data?.monthlyTrend || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ödeme Durum Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Durum bazlı fatura sayısı</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <InvoicePaymentBarChart data={data?.statusDistribution || []} />
        </Card>
      </div>
    </div>
  )
}



