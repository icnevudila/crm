'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, CheckSquare, User, Trash2, Clock, Calendar, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import TaskForm from '@/components/tasks/TaskForm'
import { toastError } from '@/lib/toast'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'

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
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="task"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
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
      />

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(16, 185, 129) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/tasks`)}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg ring-4 ring-emerald-100/50"
            >
              <CheckSquare className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                {task.title}
              </h1>
              <p className="text-gray-600 mt-1 font-medium">Görev Detayları</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Task Info - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Görev Bilgileri - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GradientCard
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
            className="p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Görev Bilgileri</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/80 mb-2">Durum</p>
                <Badge className={`${getStatusBadgeClass(task.status)} text-sm font-semibold`}>
                  {statusLabels[task.status] || task.status}
                </Badge>
              </div>
              {task.priority && (
                <div>
                  <p className="text-sm text-white/80 mb-2">Öncelik</p>
                  <Badge className={`${getStatusBadgeClass(task.priority || 'LOW')} text-sm font-semibold`}>
                    {task.priority === 'HIGH' ? 'Yüksek' : task.priority === 'MEDIUM' ? 'Orta' : 'Düşük'}
                  </Badge>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-sm text-white/80">Son Tarih</p>
                    <p className="font-semibold text-white mt-1">
                      {new Date(task.dueDate).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              )}
              {task.User && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-sm text-white/80">Atanan Kullanıcı</p>
                    <p className="font-semibold text-white mt-1">{task.User.name}</p>
                    <p className="text-sm text-white/70">{task.User.email}</p>
                  </div>
                </div>
              )}
              {task.description && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-white/80 mb-2">Açıklama</p>
                  <p className="text-sm text-white/90 whitespace-pre-wrap bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    {task.description}
                  </p>
                </div>
              )}
            </div>
          </GradientCard>
        </motion.div>

        {/* Bilgiler - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GradientCard
            gradientFrom="from-purple-500"
            gradientTo="to-pink-500"
            className="p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Bilgiler</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-white/80 mb-1">Görev ID</p>
                <p className="font-mono text-sm text-white/90 break-all">{task.id}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Oluşturulma Tarihi</p>
                  <p className="font-semibold text-white mt-1">
                    {new Date(task.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {task.updatedAt && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-sm text-white/80">Son Güncelleme</p>
                    <p className="font-semibold text-white mt-1">
                      {new Date(task.updatedAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GradientCard>
        </motion.div>
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
