'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load VendorList - performans için
const VendorList = dynamic(() => import('@/components/vendors/VendorList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function VendorsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <VendorList />
    </Suspense>
  )
}





