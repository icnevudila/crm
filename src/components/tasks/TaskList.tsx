'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

// Lazy load TaskForm ve TaskDetailModal - performans için
const TaskForm = dynamic(() => import('./TaskForm'), {
  ssr: false,
  loading: () => null,
})
const TaskDetailModal = dynamic(() => import('./TaskDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface TaskListProps {
  isOpen?: boolean
}

interface Task {
  id: string
  title: string
  status: string
  assignedTo?: string
  companyId?: string
  User?: { name: string; email: string }
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
}

export default function TaskList({ isOpen = true }: TaskListProps) {
  const locale = useLocale()
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  
  const statusLabels: Record<string, string> = {
    TODO: t('statusTodo'),
    IN_PROGRESS: t('statusInProgress'),
    DONE: t('statusDone'),
  }
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [status, setStatus] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskData, setSelectedTaskData] = useState<Task | null>(null)
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isOpen && isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // SWR ile veri çekme (repo kurallarına uygun)
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/tasks?${params.toString()}`
  }, [isOpen, status, isSuperAdmin, filterCompanyId])

  const { data: tasks = [], isLoading, error, mutate: mutateTasks } = useData<Task[]>(apiUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: true,
    refreshInterval: 10000,
  })

  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!confirm(t('deleteConfirm', { title }))) {
      return
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete task')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedTasks = tasks.filter((t) => t.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateTasks(updatedTasks, { revalidate: false })
      
      // Tüm diğer task URL'lerini de güncelle
      await Promise.all([
        mutate('/api/tasks', updatedTasks, { revalidate: false }),
        mutate('/api/tasks?', updatedTasks, { revalidate: false }),
        apiUrl ? mutate(apiUrl, updatedTasks, { revalidate: false }) : Promise.resolve(),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(tCommon('error'), error?.message)
    }
  }, [tasks, mutateTasks, apiUrl, t, tCommon])

  const handleAdd = useCallback(() => {
    setSelectedTask(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((task: Task) => {
    setSelectedTask(task)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedTask(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
  }, [])

  if (!isOpen) {
    return null
  }

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationDone'),
            result: t('automationDoneResult'),
            details: [
              t('automationDoneDetails1'),
              t('automationDoneDetails2'),
            ],
          },
          {
            action: t('automationReminder'),
            result: t('automationReminderResult'),
            details: [
              t('automationReminderDetails1'),
              t('automationReminderDetails2'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalTasks', { count: tasks.length })}</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('newTask')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('selectCompany')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCompanies')}</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="TODO">{t('statusTodo')}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t('statusInProgress')}</SelectItem>
            <SelectItem value="DONE">{t('statusDone')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.task')}</TableHead>
              {isSuperAdmin && <TableHead>{t('tableHeaders.company')}</TableHead>}
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.assignedTo')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                  {t('noTasksFound')}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {task.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={statusColors[task.status] || 'bg-gray-100'}>
                      {statusLabels[task.status] || task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{task.User?.name || '-'}</TableCell>
                  <TableCell>
                    {new Date(task.createdAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTaskId(task.id)
                          setSelectedTaskData(task)
                          setDetailModalOpen(true)
                        }}
                        aria-label={t('viewTask', { title: task.title })}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(task)}
                        aria-label={t('editTask', { title: task.title })}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task.id, task.title)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={t('deleteTask', { title: task.title })}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedTaskId(null)
          setSelectedTaskData(null)
        }}
        initialData={selectedTaskData || undefined}
      />

      {/* Form Modal */}
      <TaskForm
        task={selectedTask || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedTask: Task) => {
          // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
          // Böylece form kapanmadan önce görev listede görünür
          
          let updatedTasks: Task[]
          
          if (selectedTask) {
            // UPDATE: Mevcut kaydı güncelle
            updatedTasks = tasks.map((t) =>
              t.id === savedTask.id ? savedTask : t
            )
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            updatedTasks = [savedTask, ...tasks]
          }
          
          // Cache'i güncelle - optimistic update'i hemen uygula ve koru
          // revalidate: false = background refetch yapmaz, optimistic update korunur
          await mutateTasks(updatedTasks, { revalidate: false })
          
          // Tüm diğer task URL'lerini de güncelle (optimistic update)
          await Promise.all([
            mutate('/api/tasks', updatedTasks, { revalidate: false }),
            mutate('/api/tasks?', updatedTasks, { revalidate: false }),
            apiUrl ? mutate(apiUrl, updatedTasks, { revalidate: false }) : Promise.resolve(),
          ])
        }}
      />
    </div>
  )
}





