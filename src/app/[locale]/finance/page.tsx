'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load FinanceList - performans için
const FinanceList = dynamic(() => import('@/components/finance/FinanceList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function FinancePage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <FinanceList />
    </Suspense>
  )
}





