'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui/card'
import { DollarSign, Users } from 'lucide-react'
import { useData } from '@/hooks/useData'

import type {
  SalesReportsResponse,
  CustomerReportsResponse,
} from '@/components/dashboard/types'

interface SalesPerformanceSectionProps {
  isOpen: boolean
}

const MonthlySalesBarChart = dynamic(
  () => import('@/components/reports/charts/MonthlySalesBarChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

const CustomerGrowthLineChart = dynamic(
  () => import('@/components/reports/charts/CustomerGrowthLineChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

export default function SalesPerformanceSection({
  isOpen,
}: SalesPerformanceSectionProps) {
  const t = useTranslations('dashboard')

  const { data: salesReports } = useData<SalesReportsResponse>(
    isOpen ? '/api/reports/sales' : null,
    {
      dedupingInterval: 300_000,
      refreshInterval: 600_000,
      revalidateOnFocus: false,
    }
  )

  const { data: customerReports } = useData<CustomerReportsResponse>(
    isOpen ? '/api/reports/customers' : null,
    {
      dedupingInterval: 300_000,
      refreshInterval: 600_000,
      revalidateOnFocus: false,
    }
  )

  if (!isOpen) {
    return null
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          {t('salesPerformanceAnalysis', {
            defaultMessage: 'Satış & Performans Analizi',
          })}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {t('salesPerformanceDescription', {
            defaultMessage: 'Aylık trendler ve dağılım analizleri',
          })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="relative overflow-hidden border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('monthlySalesComparison', {
                  defaultMessage: 'Aylık Satış Karşılaştırması',
                })}
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-600">
                {t('monthlySalesComparisonDescription', {
                  defaultMessage: 'Aylar arası satış karşılaştırması',
                })}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <MonthlySalesBarChart
            data={salesReports?.monthlyComparison ?? []}
          />
        </Card>

        <Card className="relative overflow-hidden border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t('customerGrowthTrend', {
                  defaultMessage: 'Müşteri Büyüme Trendi',
                })}
              </h3>
              <p className="mt-1 text-xs font-medium text-gray-600">
                {t('customerGrowthTrendDescription', {
                  defaultMessage: 'Zaman içinde müşteri sayısı değişimi',
                })}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <CustomerGrowthLineChart
            data={customerReports?.growthTrend ?? []}
          />
        </Card>
      </div>
    </section>
  )
}


