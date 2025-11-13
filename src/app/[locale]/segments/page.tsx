'use client'

import dynamic from 'next/dynamic'
import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const SegmentList = dynamic(() => import('@/components/segments/SegmentList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function SegmentsPage() {
  const tNav = useTranslations('nav')
  const tSegments = useTranslations('segmentsPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="segments-section"
        title={tNav('segments')}
        description={tSegments('description', {
          defaultMessage: 'Müşteri segmentlerinizi oluşturun, düzenleyin ve filtreleyin.',
        })}
        icon={Users}
        defaultOpen
      >
        {({ isOpen }) => <SegmentList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}



