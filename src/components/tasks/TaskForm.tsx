'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

const taskSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).default('TODO'),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedTask: any) => void | Promise<void>
}

async function fetchUsers() {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export default function TaskForm({ task, open, onClose, onSuccess }: TaskFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: open,
  })

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
      title: '',
      status: 'TODO',
      assignedTo: '',
      description: '',
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
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: '',
          status: 'TODO',
          assignedTo: '',
          description: '',
          dueDate: '',
          priority: 'MEDIUM',
        })
      }
    }
  }, [task, open, reset])

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
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Görev Düzenle' : 'Yeni Görev'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Görev bilgilerini güncelleyin' : 'Yeni görev oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Görev Başlığı *</label>
              <Input
                {...register('title')}
                placeholder="Görev başlığı"
                disabled={loading}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Atanan Kişi</label>
              <Select
                value={assignedTo || ''}
                onValueChange={(value) => setValue('assignedTo', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kullanıcı seçin" />
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
              <label className="text-sm font-medium">Durum</label>
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
                  <SelectItem value="TODO">Yapılacak</SelectItem>
                  <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
                  <SelectItem value="DONE">Tamamlandı</SelectItem>
                  <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Öncelik</label>
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
                  <SelectItem value="LOW">Düşük</SelectItem>
                  <SelectItem value="MEDIUM">Orta</SelectItem>
                  <SelectItem value="HIGH">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Son Tarih</label>
              <Input
                type="date"
                {...register('dueDate')}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Görev açıklaması ve detaylar"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : task ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
