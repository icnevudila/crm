'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load InvoiceList - performans için
const InvoiceList = dynamic(() => import('@/components/invoices/InvoiceList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function InvoicesPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <InvoiceList />
    </Suspense>
  )
}





