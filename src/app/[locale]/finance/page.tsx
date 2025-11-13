'use client'

import dynamic from 'next/dynamic'
import { DollarSign } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const FinanceList = dynamic(() => import('@/components/finance/FinanceList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function FinancePage() {
  const tNav = useTranslations('nav')
  const tFinance = useTranslations('financePage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="finance-section"
        title={tNav('finance')}
        description={tFinance('description', {
          defaultMessage: 'Gelir ve giderleri raporlarla yönetin, finansal performansı izleyin.',
        })}
        icon={DollarSign}
        defaultOpen
      >
        {({ isOpen }) => <FinanceList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





