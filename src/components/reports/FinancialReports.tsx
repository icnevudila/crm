'use client'

import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { DollarSign, TrendingUp, PieChart } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { ReportSectionProps } from './types'

const FinancialIncomeExpenseComposedChart = dynamic(() => import('@/components/reports/charts/FinancialIncomeExpenseComposedChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const FinancialCategoryPieChart = dynamic(() => import('@/components/reports/charts/FinancialCategoryPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchFinancialReports() {
  const res = await fetch('/api/reports/financial', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch financial reports')
  return res.json()
}

export default function FinancialReports({ isActive }: ReportSectionProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-reports'],
    queryFn: fetchFinancialReports,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    enabled: isActive,
  })

  if (!isActive) return null
  if (isLoading) return <SkeletonList />
  if (error) return <div className="text-red-600">Rapor yüklenirken hata oluştu</div>

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-emerald-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Finansal Raporlar</h3>
            <p className="text-sm text-gray-600">
              Finansal analizler. Gelir-gider karşılaştırması, kategori bazlı dağılım ve karlılık analizi.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gelir-Gider Karşılaştırması</h3>
              <p className="text-sm text-gray-500 mt-1">Aylık gelir ve gider trendi</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <FinancialIncomeExpenseComposedChart data={data?.incomeExpense || []} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Finansal Kategori Dağılımı</h3>
              <p className="text-sm text-gray-500 mt-1">Kategori bazlı finansal dağılım</p>
            </div>
            <PieChart className="h-5 w-5 text-primary-600" />
          </div>
          <FinancialCategoryPieChart data={data?.categoryDistribution || []} />
        </Card>
      </div>
    </div>
  )
}



