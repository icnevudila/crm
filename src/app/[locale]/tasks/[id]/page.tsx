'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, CheckSquare, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import TaskForm from '@/components/tasks/TaskForm'
import { toastError } from '@/lib/toast'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority?: string
  dueDate?: string
  assignedTo?: string
  User?: {
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
  activities?: any[]
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: task, isLoading, error } = useData<Task>(
    id ? `/api/tasks/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Görev Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Görev yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/tasks`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  // Status labels - merkezi renk sistemi kullanılıyor (getStatusBadgeClass)
  const statusLabels: Record<string, string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam Ediyor',
    DONE: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/tasks`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-8 w-8" />
              {task.title}
            </h1>
            <p className="mt-1 text-gray-600">Görev Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/tasks`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${task.title} görevini silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/tasks/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Silme işlemi başarısız')
                }
                router.push(`/${locale}/tasks`)
              } catch (error: any) {
                toastError('Silme işlemi başarısız oldu', error?.message)
              } finally {
                setDeleteLoading(false)
              }
            }}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Task Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Görev Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge className={`mt-1 ${getStatusBadgeClass(task.status)}`}>
                {statusLabels[task.status] || task.status}
              </Badge>
            </div>
            {task.priority && (
              <div>
                <p className="text-sm text-gray-600">Öncelik</p>
                <Badge className={`mt-1 ${getStatusBadgeClass(task.priority || 'LOW')}`}>
                  {task.priority === 'HIGH' ? 'Yüksek' : task.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                </Badge>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="text-sm text-gray-600">Son Tarih</p>
                <p className="font-medium mt-1">
                  {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
            {task.User && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Atanan Kullanıcı</p>
                  <p className="font-medium mt-1">{task.User.name}</p>
                  <p className="text-sm text-gray-600">{task.User.email}</p>
                </div>
              </div>
            )}
            {task.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Görev ID</p>
              <p className="font-mono text-sm mt-1">{task.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(task.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {task.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(task.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      {task.activities && task.activities.length > 0 && (
        <ActivityTimeline activities={task.activities} />
      )}

      {/* Form Modal */}
      <TaskForm
        task={task}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          // Form başarılı olduğunda sayfayı yenile
          window.location.reload()
        }}
      />
    </div>
  )
}





