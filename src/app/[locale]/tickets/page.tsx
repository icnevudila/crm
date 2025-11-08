'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load TicketList - performans için
const TicketList = dynamic(() => import('@/components/tickets/TicketList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function TicketsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <TicketList />
    </Suspense>
  )
}





