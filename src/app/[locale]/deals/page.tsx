'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load DealList - performans için
const DealList = dynamic(() => import('@/components/deals/DealList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function DealsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <DealList />
    </Suspense>
  )
}
