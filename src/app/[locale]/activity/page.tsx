'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

const ActivityList = dynamic(() => import('@/components/activity/ActivityList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ActivityPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <ActivityList />
    </Suspense>
  )
}





