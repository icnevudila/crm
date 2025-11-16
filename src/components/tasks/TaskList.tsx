'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast, confirm } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from '@/hooks/useSession'
import { Plus, Edit, Trash2, Eye, CheckSquare } from 'lucide-react'
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
import RefreshButton from '@/components/ui/RefreshButton'
import EmptyState from '@/components/ui/EmptyState'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import InlineEditBadge from '@/components/ui/InlineEditBadge'
import InlineEditSelect from '@/components/ui/InlineEditSelect'
import { getStatusBadgeClass } from '@/lib/crm-colors'

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
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
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    return `/api/tasks?${params.toString()}`
  }, [isOpen, status, isSuperAdmin, filterCompanyId, currentPage, pageSize])

  interface TasksResponse {
    data: Task[]
    pagination: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }

  const { data: tasksData, isLoading, error, mutate: mutateTasks } = useData<Task[] | TasksResponse>(apiUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: true,
    refreshInterval: 10000,
  })
  
  const tasks = useMemo(() => {
    if (Array.isArray(tasksData)) return tasksData
    if (tasksData && typeof tasksData === 'object' && 'data' in tasksData) {
      return (tasksData as TasksResponse).data || []
    }
    return []
  }, [tasksData])
  
  const pagination = useMemo(() => {
    if (!tasksData || Array.isArray(tasksData)) return null
    if (tasksData && typeof tasksData === 'object' && 'pagination' in tasksData) {
      return (tasksData as TasksResponse).pagination || null
    }
    return null
  }, [tasksData])

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateTasks(undefined, { revalidate: true }),
      mutate('/api/tasks', undefined, { revalidate: true }),
      mutate('/api/tasks?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/tasks', undefined, { revalidate: true }),
    ])
  }

  const handleDelete = useCallback(async (id: string, title: string) => {
    if (!(await confirm(t('deleteConfirm', { title })))) {
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
      
      // Success toast göster
      const tCommon = useTranslations('common')
      toast.success(tCommon('taskDeletedSuccess'), tCommon('deleteSuccessMessage', { name: title }))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">{t('totalTasks', { count: tasks.length })}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <RefreshButton onRefresh={handleRefresh} />
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white flex-1 sm:flex-initial"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newTask')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => {
            setFilterCompanyId(v === 'all' ? '' : v)
            setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
          }}>
            <SelectTrigger className="w-full sm:w-48">
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
        <Select value={status || 'all'} onValueChange={(v) => {
          setStatus(v === 'all' ? '' : v)
          setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
        }}>
          <SelectTrigger className="w-full sm:w-48">
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

      {/* Table - Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
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
                <TableCell colSpan={isSuperAdmin ? 6 : 5} className="p-0">
                  <EmptyState
                    icon={CheckSquare}
                    title={t('noTasksFound')}
                    description={t('emptyStateDescription') || 'Yeni görev ekleyerek başlayın'}
                    action={{
                      label: t('newTask'),
                      onClick: handleAdd,
                    }}
                    className="border-0 shadow-none"
                  />
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
                    <InlineEditBadge
                      value={task.status}
                      options={[
                        { value: 'TODO', label: statusLabels['TODO'] || 'Yapılacak' },
                        { value: 'IN_PROGRESS', label: statusLabels['IN_PROGRESS'] || 'Devam Ediyor' },
                        { value: 'DONE', label: statusLabels['DONE'] || 'Tamamlandı' },
                      ]}
                      onSave={async (newStatus) => {
                        try {
                          const res = await fetch(`/api/tasks/${task.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),
                          })
                          if (!res.ok) {
                            const error = await res.json().catch(() => ({}))
                            throw new Error(error.error || 'Durum güncellenemedi')
                          }
                          const updatedTask = await res.json()
                          
                          // Cache'i güncelle
                          await Promise.all([
                            mutate('/api/tasks', undefined, { revalidate: true }),
                            mutate('/api/tasks?', undefined, { revalidate: true }),
                            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/tasks'), undefined, { revalidate: true }),
                          ])
                          
                          toast.success('Durum güncellendi', `Görev "${statusLabels[newStatus] || newStatus}" durumuna taşındı.`)
                        } catch (error: any) {
                          toast.error('Durum güncellenemedi', error?.message || 'Bir hata oluştu.')
                          throw error
                        }
                      }}
                    />
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
        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={t('noTasksFound')}
            description={t('emptyStateDescription') || 'Yeni görev ekleyerek başlayın'}
            action={{
              label: t('newTask'),
              onClick: handleAdd,
            }}
          />
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <InlineEditBadge
                      value={task.status}
                      options={[
                        { value: 'TODO', label: statusLabels['TODO'] || 'Yapılacak' },
                        { value: 'IN_PROGRESS', label: statusLabels['IN_PROGRESS'] || 'Devam Ediyor' },
                        { value: 'DONE', label: statusLabels['DONE'] || 'Tamamlandı' },
                      ]}
                      onSave={async (newStatus) => {
                        try {
                          const res = await fetch(`/api/tasks/${task.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus }),
                          })
                          if (!res.ok) {
                            const error = await res.json().catch(() => ({}))
                            throw new Error(error.error || 'Durum güncellenemedi')
                          }
                          await Promise.all([
                            mutate('/api/tasks', undefined, { revalidate: true }),
                            mutate('/api/tasks?', undefined, { revalidate: true }),
                          ])
                          toast.success('Durum güncellendi', `Görev "${statusLabels[newStatus] || newStatus}" durumuna taşındı.`)
                        } catch (error: any) {
                          toast.error('Durum güncellenemedi', error?.message || 'Bir hata oluştu.')
                          throw error
                        }
                      }}
                    />
                    {isSuperAdmin && task.Company?.name && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                        {task.Company.name}
                      </Badge>
                    )}
                  </div>
                  {task.User?.name && (
                    <p className="text-xs text-gray-600 mt-1">
                      {t('assignedTo')}: {task.User.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(task.createdAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedTaskId(task.id)
                      setSelectedTaskData(task)
                      setDetailModalOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleDelete(task.id, task.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
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





