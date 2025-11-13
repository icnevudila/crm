'use client'

import dynamic from 'next/dynamic'
import { Briefcase } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const DealList = dynamic(() => import('@/components/deals/DealList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function DealsPage() {
  const tNav = useTranslations('nav')
  const tDeals = useTranslations('dealsPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="deals-section"
        title={tNav('deals')}
        description={tDeals('description', {
          defaultMessage: 'Fırsatları tablo veya kanban görünümünde yönetin, filtreleyin ve skorlayın.',
        })}
        icon={Briefcase}
        defaultOpen
      >
        {({ isOpen }) => <DealList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}
