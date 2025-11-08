'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load UserList - performans için
const UserList = dynamic(() => import('@/components/users/UserList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function UsersPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <UserList />
    </Suspense>
  )
}





