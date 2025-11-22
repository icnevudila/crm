'use client'

import dynamic from 'next/dynamic'
import { FileCheck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const CreditNoteList = dynamic(() => import('@/components/credit-notes/CreditNoteList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function CreditNotesPage() {
  const tNav = useTranslations('nav')
  const tCreditNotes = useTranslations('creditNotes')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="credit-notes-section"
        title={tNav('creditNotes')}
        description={tCreditNotes('description', {
          defaultMessage: 'Alacak dekontlarını yönetin, finans entegrasyonunu takip edin.',
        })}
        icon={FileCheck}
        defaultOpen
      >
        <CreditNoteList />
      </ModuleSection>
    </div>
  )
}


