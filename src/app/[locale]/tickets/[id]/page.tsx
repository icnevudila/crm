'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, MessageSquare, User, AlertCircle, Mail, MessageSquare as MessageSquareIcon, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import TicketForm from '@/components/tickets/TicketForm'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import Link from 'next/link'
import { toastError, toastWarning } from '@/lib/toast'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import { useQuickActionSuccess } from '@/lib/quick-action-helper'
import { useData } from '@/hooks/useData'

interface Ticket {
  id: string
  subject: string
  description?: string
  status: string
  priority: string
  tags?: string[]
  customerId?: string
  assignedTo?: string
  Customer?: {
    id: string
    name: string
    email?: string
  }
  User?: {
    id: string
    name: string
    email?: string
  }
  createdAt: string
  updatedAt?: string
  activities?: any[]
}

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/tickets`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              {ticket.subject}
            </h1>
            <p className="mt-1 text-gray-600">Destek Talebi Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          {(ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {ticket.Customer && (ticket.Customer.email || ticket.Customer.phone) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
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
                  actionType: 'updated',
                  onClose: () => {},
                })}
              />
            )}
            {ticket.Customer.phone && (
              <>
                <SendSmsButton
                  to={ticket.Customer.phone}
                  message={`Merhaba ${ticket.Customer.name}, destek talebiniz hakkında size ulaşmak istiyoruz. Konu: ${ticket.subject}`}
                  onSuccess={() => handleQuickActionSuccess({
                    entityType: 'ticket',
                    entityName: ticket.subject,
                    entityId: ticket.id,
                    actionType: 'updated',
                    onClose: () => {},
                  })}
                />
                <SendWhatsAppButton
                  to={ticket.Customer.phone}
                  message={`Merhaba ${ticket.Customer.name}, destek talebiniz hakkında size ulaşmak istiyoruz. Konu: ${ticket.subject}`}
                  onSuccess={() => handleQuickActionSuccess({
                    entityType: 'ticket',
                    entityName: ticket.subject,
                    entityId: ticket.id,
                    actionType: 'updated',
                    onClose: () => {},
                  })}
                />
              </>
            )}
          </div>
        </Card>
      )}

      {/* Ticket Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Talep Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Durum</p>
              <Badge className={`mt-1 ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                {statusLabels[ticket.status] || ticket.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Öncelik</p>
              <Badge className={`mt-1 ${priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'}`}>
                {priorityLabels[ticket.priority] || ticket.priority}
              </Badge>
            </div>
            {ticket.Customer && (
              <div>
                <p className="text-sm text-gray-600">Müşteri</p>
                <Link href={`/${locale}/customers/${ticket.Customer.id}`}>
                  <div className="flex items-center gap-2 mt-1 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{ticket.Customer.name}</p>
                      {ticket.Customer.email && (
                        <p className="text-sm text-gray-600">{ticket.Customer.email}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )}
            {ticket.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Etiketler</p>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Talep ID</p>
              <p className="font-mono text-sm mt-1">{ticket.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {ticket.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(ticket.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
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





