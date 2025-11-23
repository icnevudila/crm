'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TaskFormProps {
  task?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedTask: any) => void | Promise<void>
  defaultTitle?: string
  defaultDescription?: string
  customerName?: string
  customerCompanyName?: string
  deal?: any // ✅ ÇÖZÜM: Deal objesi direkt geçilebilir (API çağrısı yapmadan)
  quote?: any // ✅ ÇÖZÜM: Quote objesi direkt geçilebilir (API çağrısı yapmadan)
  invoice?: any // ✅ ÇÖZÜM: Invoice objesi direkt geçilebilir (API çağrısı yapmadan)
}


export default function TaskForm({ 
  task, 
  open, 
  onClose, 
  onSuccess, 
  defaultTitle, 
  defaultDescription, 
  customerName, 
  customerCompanyName,
  deal: dealProp,
  quote: quoteProp,
  invoice: invoiceProp,
}: TaskFormProps) {
  const t = useTranslations('tasks.form')
  const tCommon = useTranslations('common.form')
  const router = useRouter()
  const navigateToDetailToast = useNavigateToDetailToast()
  const [loading, setLoading] = useState(false)

  // Schema'yı component içinde oluştur - locale desteği için
  const taskSchema = z.object({
    title: z.string().min(1, t('titleRequired')).max(200, t('titleMaxLength')),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
    assignedTo: z.string().optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
    dueDate: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  })

  type TaskFormData = z.infer<typeof taskSchema>

  // Kullanıcıları çek - SWR ile
  const { data: users = [] } = useData<any[]>(
    open ? '/api/users' : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task || {
      title: defaultTitle || '',
      status: 'TODO',
      assignedTo: '',
      description: defaultDescription || '',
      dueDate: '',
      priority: 'MEDIUM',
    },
  })

  const status = watch('status')
  const priority = watch('priority')
  const assignedTo = watch('assignedTo')

  // Task prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (task) {
        // Düzenleme modu - task bilgilerini yükle
        // Tarih formatını düzelt
        let formattedDueDate = ''
        if (task.dueDate) {
          const date = new Date(task.dueDate)
          if (!isNaN(date.getTime())) {
            formattedDueDate = date.toISOString().split('T')[0]
          }
        }
        
        reset({
          title: task.title || '',
          status: task.status || 'TODO',
          assignedTo: task.assignedTo || '',
          description: task.description || '',
          dueDate: formattedDueDate,
          priority: task.priority || 'MEDIUM',
        })
      } else if (dealProp) {
        // ✅ ÖNEMLİ: dealProp öncelikli (direkt geçilen deal objesi) - API çağrısı yapmadan
        reset({
          title: dealProp.title ? `Görev: ${dealProp.title}` : (defaultTitle || ''),
          status: 'TODO',
          assignedTo: '',
          description: dealProp.description || defaultDescription || '',
          dueDate: '',
          priority: 'MEDIUM',
        })
      } else if (quoteProp) {
        // ✅ ÖNEMLİ: quoteProp öncelikli (direkt geçilen quote objesi) - API çağrısı yapmadan
        reset({
          title: quoteProp.title ? `Görev: ${quoteProp.title}` : (defaultTitle || ''),
          status: 'TODO',
          assignedTo: '',
          description: quoteProp.description || defaultDescription || '',
          dueDate: '',
          priority: 'MEDIUM',
        })
      } else if (invoiceProp) {
        // ✅ ÖNEMLİ: invoiceProp öncelikli (direkt geçilen invoice objesi) - API çağrısı yapmadan
        reset({
          title: invoiceProp.title ? `Görev: ${invoiceProp.title}` : (defaultTitle || ''),
          status: 'TODO',
          assignedTo: '',
          description: invoiceProp.description || defaultDescription || '',
          dueDate: '',
          priority: 'MEDIUM',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: defaultTitle || '',
          status: 'TODO',
          assignedTo: '',
          description: defaultDescription || '',
          dueDate: '',
          priority: 'MEDIUM',
        })
      }
    }
  }, [task, open, reset, defaultTitle, defaultDescription, dealProp, quoteProp, invoiceProp])

  const mutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = task ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save task')
      }

      return res.json()
    },
    onSuccess: (savedTask) => {
      // Toast mesajı göster
      if (task) {
        toast.success(t('taskUpdated'), { description: t('taskUpdatedMessage', { title: savedTask.title }) })
      } else {
        // Yeni task oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('task', savedTask.id, savedTask.title)
      }
      
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedTask)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(t('saveFailed'), { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {task ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(customerName || customerCompanyName) && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-700">
              {customerName && (
                <p className="font-semibold">{t('customerLabel')}: {customerName}</p>
              )}
              {customerCompanyName && (
                <p>{t('companyLabel')}: {customerCompanyName}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('titleLabel')} *</label>
              <Input
                {...register('title')}
                placeholder={t('titlePlaceholder')}
                disabled={loading}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('assignedToLabel')}</label>
              <Select
                value={assignedTo || ''}
                onValueChange={(value) => setValue('assignedTo', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('assignedToPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('statusLabel')}</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as TaskFormData['status'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">{t('statusTodo')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('statusInProgress')}</SelectItem>
                  <SelectItem value="DONE">{t('statusDone')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('priorityLabel')}</label>
              <Select
                value={priority || 'MEDIUM'}
                onValueChange={(value) =>
                  setValue('priority', value as TaskFormData['priority'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">{t('priorityLow')}</SelectItem>
                  <SelectItem value="MEDIUM">{t('priorityMedium')}</SelectItem>
                  <SelectItem value="HIGH">{t('priorityHigh')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dueDateLabel')}</label>
              <Input
                type="date"
                {...register('dueDate')}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('descriptionLabel')}</label>
              <Textarea
                {...register('description')}
                placeholder={t('descriptionPlaceholder')}
                rows={4}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
              disabled={loading}
              loading={loading}
            >
              {loading ? t('saving') : task ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
