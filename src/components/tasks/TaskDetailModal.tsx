'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, CheckSquare, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { toast, confirm } from '@/lib/toast'

// Lazy load TaskForm - performans için
const TaskForm = dynamic(() => import('./TaskForm'), {
  ssr: false,
  loading: () => null,
})

interface TaskDetailModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function TaskDetailModal({
  taskId,
  open,
  onClose,
  initialData,
}: TaskDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // SWR ile veri çek
  const { data: task, isLoading, error, mutate: mutateTask } = useData<any>(
    taskId && open ? `/api/tasks/${taskId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayTask = task || initialData

  const handleDelete = async () => {
    if (!displayTask || !confirm(`${displayTask.title} görevini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Görev silindi')
      
      await mutate('/api/tasks')
      await mutate(`/api/tasks/${taskId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !taskId) return null

  if (isLoading && !initialData && !displayTask) {
    return (
      <DetailModal open={open} onClose={onClose} title="Görev Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayTask) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Görev yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayTask) {
    return (
      <DetailModal open={open} onClose={onClose} title="Görev Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Görev bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const statusColors: Record<string, string> = {
    TODO: 'bg-gray-600 text-white border-gray-700',
    IN_PROGRESS: 'bg-blue-600 text-white border-blue-700',
    DONE: 'bg-green-600 text-white border-green-700',
    CANCELLED: 'bg-red-600 text-white border-red-700',
  }

  const statusLabels: Record<string, string> = {
    TODO: 'Yapılacak',
    IN_PROGRESS: 'Devam Ediyor',
    DONE: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayTask?.title || 'Görev Detayları'}
        description="Görev bilgileri ve aktivite geçmişi"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* Task Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Görev Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Durum</p>
                  <Badge className={`mt-1 ${statusColors[displayTask?.status] || 'bg-gray-600 text-white border-gray-700'}`}>
                    {statusLabels[displayTask?.status] || displayTask?.status}
                  </Badge>
                </div>
                {displayTask?.priority && (
                  <div>
                    <p className="text-sm text-gray-600">Öncelik</p>
                    <Badge className={`mt-1 ${
                      displayTask.priority === 'HIGH' ? 'bg-red-600 text-white border-red-700' :
                      displayTask.priority === 'MEDIUM' ? 'bg-yellow-600 text-white border-yellow-700' :
                      'bg-gray-600 text-white border-gray-700'
                    }`}>
                      {displayTask.priority === 'HIGH' ? 'Yüksek' : displayTask.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                    </Badge>
                  </div>
                )}
                {displayTask?.dueDate && (
                  <div>
                    <p className="text-sm text-gray-600">Son Tarih</p>
                    <p className="font-medium mt-1">
                      {new Date(displayTask.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}
                {displayTask?.User && (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Atanan Kullanıcı</p>
                      <p className="font-medium mt-1">{displayTask.User.name}</p>
                      <p className="text-sm text-gray-600">{displayTask.User.email}</p>
                    </div>
                  </div>
                )}
                {displayTask?.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayTask.description}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Görev ID</p>
                  <p className="font-mono text-sm mt-1">{displayTask?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                  <p className="font-medium mt-1">
                    {displayTask?.createdAt ? new Date(displayTask.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                {displayTask?.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Son Güncelleme</p>
                    <p className="font-medium mt-1">
                      {new Date(displayTask.updatedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Activity Timeline */}
          {displayTask?.activities && displayTask.activities.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
              <ActivityTimeline activities={displayTask.activities} />
            </Card>
          )}
        </div>
      </DetailModal>

      {/* Form Modal */}
      <TaskForm
        task={displayTask || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateTask()
          await mutate(`/api/tasks/${taskId}`)
        }}
      />
    </>
  )
}

