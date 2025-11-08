'use client'

import { Suspense } from 'react'
import CompanyList from '@/components/companies/CompanyList'
import SkeletonList from '@/components/skeletons/SkeletonList'

export default function CompaniesPage() {
  return (
    <Suspense fallback={<SkeletonList />}>
      <CompanyList />
    </Suspense>
  )
}





