'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load MeetingList - performans için
const MeetingList = dynamic(() => import('@/components/meetings/MeetingList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function MeetingsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <MeetingList />
    </Suspense>
  )
}

