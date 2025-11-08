'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load TaskList - performans için
const TaskList = dynamic(() => import('@/components/tasks/TaskList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function TasksPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <TaskList />
    </Suspense>
  )
}





