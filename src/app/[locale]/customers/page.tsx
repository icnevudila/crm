'use client'

import dynamic from 'next/dynamic'
import { Users } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const CustomerList = dynamic(() => import('@/components/customers/CustomerList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function CustomersPage() {
  const t = useTranslations('nav')
  const tCustomers = useTranslations('customersPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="customers-section"
        title={t('customers')}
        description={tCustomers('description', {
          defaultMessage: 'Müşteri kayıtlarını yönetin, filtreleyin ve içe/dışa aktarın.',
        })}
        icon={Users}
        defaultOpen
      >
        {({ isOpen }) => <CustomerList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





