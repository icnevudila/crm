'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, MessageSquare, User, AlertCircle, Mail, MessageSquare as MessageSquareIcon, Calendar, Clock, Tag, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import TicketForm from '@/components/tickets/TicketForm'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import Link from 'next/link'
import { toastError, toastWarning, confirm } from '@/lib/toast'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import { useQuickActionSuccess } from '@/lib/quick-action-helper'
import { useData } from '@/hooks/useData'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'

import { Ticket } from '@/types/crm'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { handleQuickActionSuccess } = useQuickActionSuccess()

  const { data: ticket, isLoading, error, mutate: mutateTicket } = useData<Ticket>(
    id ? `/api/tickets/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  const refetch = () => {
    mutateTicket(undefined, { revalidate: true })
  }

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Destek Talebi Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Destek talebi yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/tickets`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    CLOSED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    OPEN: 'Açık',
    IN_PROGRESS: 'Devam Ediyor',
    CLOSED: 'Kapatıldı',
    CANCELLED: 'İptal Edildi',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  }

  const priorityLabels: Record<string, string> = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
    URGENT: 'Acil',
  }

  const handleDelete = async () => {
    if (!ticket) return

    // RESOLVED veya CLOSED ticket'ları silinemez
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      toastWarning('Çözülmüş veya kapatılmış talepler silinemez')
      return
    }

    if (!confirm(`${ticket.subject} destek talebini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete ticket')
      }

      router.push(`/${locale}/tickets`)
    } catch (error: any) {
      console.error('Delete error:', error)
      toastError('Silme işlemi başarısız oldu', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    refetch() // Form kapandığında veriyi yenile
  }

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="ticket"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={(ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') ? handleDelete : undefined}
      />

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(249, 115, 22) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/tickets`)}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg ring-4 ring-orange-100/50"
            >
              <MessageSquare className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {ticket.subject}
              </h1>
              <p className="text-gray-600 mt-1 font-medium">Destek Talebi Detayları</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Premium Tasarım */}
      {ticket.Customer && (ticket.Customer.email || ticket.Customer.phone) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Hızlı İşlemler
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ticket.Customer.email && (
                <SendEmailButton
                  to={ticket.Customer.email}
                  subject={`Destek Talebi: ${ticket.subject}`}
                  html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Destek Talebi Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Konu:</strong> ${ticket.subject}</p>
                      <p><strong>Durum:</strong> ${statusLabels[ticket.status] || ticket.status}</p>
                      <p><strong>Öncelik:</strong> ${priorityLabels[ticket.priority] || ticket.priority}</p>
                      ${ticket.description ? `<p><strong>Açıklama:</strong> ${ticket.description}</p>` : ''}
                    </div>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                      Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                    </p>
                  </div>
                `}
                  category="GENERAL"
                  entityData={ticket}
                  onSuccess={() => handleQuickActionSuccess({
                    entityType: 'ticket',
                    entityName: ticket.subject,
                    entityId: ticket.id,
                  })}
                />
              )}
              {ticket.Customer.phone && (
                <>
                  <SendSmsButton
                    to={ticket.Customer.phone}
                    message={`Merhaba ${ticket.Customer.name}, destek talebiniz hakkında size ulaşmak istiyoruz. Konu: ${ticket.subject}`}
                  />
                  <SendWhatsAppButton
                    phoneNumber={ticket.Customer.phone}
                    entityType="ticket"
                    entityId={ticket.id}
                    customerName={ticket.Customer.name}
                  />
                </>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Ticket Info - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Talep Bilgileri - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GradientCard
            gradient="warning"
            className="p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Talep Bilgileri</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/80 mb-2">Durum</p>
                <Badge className={`${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'} text-sm font-semibold`}>
                  {statusLabels[ticket.status] || ticket.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-white/80 mb-2">Öncelik</p>
                <Badge className={`${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'} text-sm font-semibold`}>
                  {priorityLabels[ticket.priority] || ticket.priority}
                </Badge>
              </div>
              {ticket.Customer && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                  <Link href={`/${locale}/customers/${ticket.Customer.id}`} className="flex-1">
                    <div>
                      <p className="text-sm text-white/80">Müşteri</p>
                      <p className="font-semibold text-white mt-1">{ticket.Customer.name}</p>
                      {ticket.Customer.email && (
                        <p className="text-sm text-white/70">{ticket.Customer.email}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )}
              {ticket.description && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-white/80 mb-2">Açıklama</p>
                  <p className="text-sm text-white/90 whitespace-pre-wrap bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                    {ticket.description}
                  </p>
                </div>
              )}
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-white/80" />
                    <p className="text-sm text-white/80">Etiketler</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="bg-white/20 text-white border-white/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GradientCard>
        </motion.div>

        {/* Bilgiler - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GradientCard
            gradient="accent"
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
                <p className="text-sm text-white/80 mb-1">Talep ID</p>
                <p className="font-mono text-sm text-white/90 break-all">{ticket.id}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Calendar className="h-5 w-5 text-white" />
                <div>
                  <p className="text-sm text-white/80">Oluşturulma Tarihi</p>
                  <p className="font-semibold text-white mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {ticket.updatedAt && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-sm text-white/80">Son Güncelleme</p>
                    <p className="font-semibold text-white mt-1">
                      {new Date(ticket.updatedAt).toLocaleDateString('tr-TR', {
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
              {ticket.User && (
                <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-sm text-white/80">Atanan Kullanıcı</p>
                    <p className="font-semibold text-white mt-1">{ticket.User.name}</p>
                    {ticket.User.email && (
                      <p className="text-sm text-white/70">{ticket.User.email}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GradientCard>
        </motion.div>
      </div>

      {/* Yorumlar Bölümü */}
      <CommentsSection
        entityType="Ticket"
        entityId={ticket.id}
      />

      {/* Activity Timeline */}
      {ticket.activities && ticket.activities.length > 0 && (
        <ActivityTimeline activities={ticket.activities} />
      )}

      {/* Form Modal */}
      <TicketForm
        ticket={ticket}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async () => {
          refetch() // Form kapandığında veriyi yenile
        }}
      />
    </div>
  )
}






