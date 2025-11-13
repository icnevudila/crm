'use client'

import dynamic from 'next/dynamic'
import { ClipboardList } from 'lucide-react'
import { useTranslations } from 'next-intl'

import ModuleSection from '@/components/layout/ModuleSection'
import SkeletonList from '@/components/skeletons/SkeletonList'

const TaskList = dynamic(() => import('@/components/tasks/TaskList'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

export default function TasksPage() {
  const tNav = useTranslations('nav')
  const tTasks = useTranslations('tasksPage')

  return (
    <div className="space-y-4 p-4">
      <ModuleSection
        storageKey="tasks-section"
        title={tNav('tasks')}
        description={tTasks('description', {
          defaultMessage: 'Görevleri duruma göre yönetin, otomasyon uyarılarından yararlanın.',
        })}
        icon={ClipboardList}
        defaultOpen
      >
        {({ isOpen }) => <TaskList isOpen={isOpen} />}
      </ModuleSection>
    </div>
  )
}





