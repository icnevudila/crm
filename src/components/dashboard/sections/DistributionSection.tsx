'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui/card'
import { useData } from '@/hooks/useData'

import type { DistributionResponse } from '@/components/dashboard/types'

interface DistributionSectionProps {
  isOpen: boolean
}

const ProductSalesChart = dynamic(
  () => import('@/components/charts/ProductSalesChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

const CustomerSectorChart = dynamic(
  () => import('@/components/charts/CustomerSectorChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

const CompanySectorChart = dynamic(
  () => import('@/components/charts/CompanySectorChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

export default function DistributionSection({
  isOpen,
}: DistributionSectionProps) {
  const t = useTranslations('dashboard')

  const { data } = useData<DistributionResponse>(
    isOpen ? '/api/analytics/distribution' : null,
    {
      dedupingInterval: 120_000,
      refreshInterval: 240_000,
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
          {t('distributionAnalysis', {
            defaultMessage: 'Dağılım Analizi',
          })}
        </h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {t('distributionAnalysisDescription', {
            defaultMessage: 'Ürün ve müşteri segment dağılımları',
          })}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border border-gray-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {t('productSalesDistribution', {
                defaultMessage: 'Ürün Satış Dağılımı',
              })}
            </h3>
          </div>
          <ProductSalesChart data={data?.productSales ?? []} />
        </Card>

        <Card className="border border-gray-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {t('customerSectorDistribution', {
                defaultMessage: 'Müşteri Sektör Dağılımı',
              })}
            </h3>
          </div>
          <CustomerSectorChart data={data?.customerSectors ?? []} />
        </Card>

        <Card className="border border-gray-200 bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {t('companySectorDistribution', {
                defaultMessage: 'Firma Sektör Dağılımı',
              })}
            </h3>
          </div>
          <CompanySectorChart data={data?.companySectors ?? []} />
        </Card>
      </div>
    </section>
  )
}


















