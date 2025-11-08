'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load ShipmentList - performans için
const ShipmentList = dynamic(() => import('@/components/shipments/ShipmentList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ShipmentsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <ShipmentList />
    </Suspense>
  )
}





