'use client'

import dynamic from 'next/dynamic'
import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const QuoteList = dynamic(() => import('@/components/quotes/QuoteList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function QuotesPage() {
  const tNav = useTranslations('nav')
  const tQuotes = useTranslations('quotesPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="quotes-section"
        title={tNav('quotes')}
        description={tQuotes('description', {
          defaultMessage: 'Teklifleri tablo veya kanban görünümünde yönetin, durumlarını takip edin.',
        })}
        icon={FileText}
        defaultOpen
      >
        {({ isOpen }) => <QuoteList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





