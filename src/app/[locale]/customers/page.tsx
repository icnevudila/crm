'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load CustomerList - performans için
const CustomerList = dynamic(() => import('@/components/customers/CustomerList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function CustomersPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <CustomerList />
    </Suspense>
  )
}





