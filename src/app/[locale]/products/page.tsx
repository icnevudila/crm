'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'

// Lazy load ProductList - performans için
const ProductList = dynamic(() => import('@/components/products/ProductList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ProductsPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <ProductList />
    </Suspense>
  )
}





