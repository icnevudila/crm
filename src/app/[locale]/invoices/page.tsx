'use client'

import dynamic from 'next/dynamic'
import { Receipt } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const InvoiceList = dynamic(() => import('@/components/invoices/InvoiceList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function InvoicesPage() {
  const tNav = useTranslations('nav')
  const tInvoices = useTranslations('invoicesPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="invoices-section"
        title={tNav('invoices')}
        description={tInvoices('description', {
          defaultMessage: 'Faturaları tablo veya kanban görünümünde yönetin, durum ve ödeme sürecini izleyin.',
        })}
        icon={Receipt}
        defaultOpen
      >
        {({ isOpen }) => <InvoiceList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





