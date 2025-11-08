'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load QuoteList - performans için
const QuoteList = dynamic(() => import('@/components/quotes/QuoteList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function QuotesPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <QuoteList />
    </Suspense>
  )
}





