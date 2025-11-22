'use client'

import dynamic from 'next/dynamic'
import { Target } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const SalesQuotaList = dynamic(() => import('@/components/sales-quotas/SalesQuotaList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function SalesQuotasPage() {
  const tNav = useTranslations('nav')
  const tSalesQuotas = useTranslations('salesQuotas')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="sales-quotas-section"
        title={tNav('salesQuotas')}
        description={tSalesQuotas('description', {
          defaultMessage: 'Satış kotalarını yönetin, performansı takip edin ve hedefleri izleyin.',
        })}
        icon={Target}
        defaultOpen
      >
        <SalesQuotaList />
      </ModuleSection>
    </div>
  )
}

