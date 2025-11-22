'use client'

import dynamic from 'next/dynamic'
import { CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const PaymentPlanList = dynamic(() => import('@/components/payment-plans/PaymentPlanList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function PaymentPlansPage() {
  const tNav = useTranslations('nav')
  const tPaymentPlans = useTranslations('paymentPlans')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="payment-plans-section"
        title={tNav('paymentPlans')}
        description={tPaymentPlans('description', {
          defaultMessage: 'Faturalar için taksit planları oluşturun ve yönetin.',
        })}
        icon={CreditCard}
        defaultOpen
      >
        <PaymentPlanList />
      </ModuleSection>
    </div>
  )
}

