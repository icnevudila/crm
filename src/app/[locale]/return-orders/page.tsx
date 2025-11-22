'use client'

import dynamic from 'next/dynamic'
import { RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const ReturnOrderList = dynamic(() => import('@/components/return-orders/ReturnOrderList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function ReturnOrdersPage() {
  const tNav = useTranslations('nav')
  const tReturnOrders = useTranslations('returnOrders')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="return-orders-section"
        title={tNav('returnOrders')}
        description={tReturnOrders('description', {
          defaultMessage: 'Fatura iadelerini yönetin, stok güncellemelerini takip edin.',
        })}
        icon={RotateCcw}
        defaultOpen
      >
        <ReturnOrderList />
      </ModuleSection>
    </div>
  )
}


