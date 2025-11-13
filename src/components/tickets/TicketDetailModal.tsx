'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, MessageSquare, User, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { toast } from '@/lib/toast'

const TicketForm = dynamic(() => import('./TicketForm'), {
  ssr: false,
  loading: () => null,
})

interface TicketDetailModalProps {
  ticketId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function TicketDetailModal({
  ticketId,
  open,
  onClose,
  initialData,
}: TicketDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: ticket, isLoading, error, mutate: mutateTicket } = useData<any>(
    ticketId && open ? `/api/tickets/${ticketId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayTicket = ticket || initialData

  const handleDelete = async () => {
    if (!displayTicket || !confirm(`${displayTicket.subject} destek talebini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Destek talebi silindi')
      
      await mutate('/api/tickets')
      await mutate(`/api/tickets/${ticketId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !ticketId) return null

  if (isLoading && !initialData && !displayTicket) {
    return (
      <DetailModal open={open} onClose={onClose} title="Destek Talebi Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayTicket) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Destek talebi yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayTicket) {
    return (
      <DetailModal open={open} onClose={onClose} title="Destek Talebi Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Destek talebi bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-600 text-white border-blue-700',
    IN_PROGRESS: 'bg-yellow-600 text-white border-yellow-700',
    CLOSED: 'bg-green-600 text-white border-green-700',
    CANCELLED: 'bg-red-600 text-white border-red-700',
  }

  const statusLabels: Record<string, string> = {
    OPEN: 'Açık',
    IN_PROGRESS: 'Devam Ediyor',
    CLOSED: 'Kapatıldı',
    CANCELLED: 'İptal Edildi',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-600 text-white border-gray-700',
    MEDIUM: 'bg-yellow-600 text-white border-yellow-700',
    HIGH: 'bg-red-600 text-white border-red-700',
  }

  const priorityLabels: Record<string, string> = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayTicket?.subject || 'Destek Talebi Detayları'}
        description="Destek talebi bilgileri ve yorumlar"
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

          {/* Ticket Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Talep Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Durum</p>
                  <Badge className={`mt-1 ${statusColors[displayTicket?.status] || 'bg-gray-600 text-white border-gray-700'}`}>
                    {statusLabels[displayTicket?.status] || displayTicket?.status}
                  </Badge>
                </div>
                {displayTicket?.priority && (
                  <div>
                    <p className="text-sm text-gray-600">Öncelik</p>
                    <Badge className={`mt-1 ${priorityColors[displayTicket.priority] || 'bg-gray-600 text-white border-gray-700'}`}>
                      {priorityLabels[displayTicket.priority] || displayTicket.priority}
                    </Badge>
                  </div>
                )}
                {displayTicket?.Customer && (
                  <div>
                    <p className="text-sm text-gray-600">Müşteri</p>
                    <p className="font-medium mt-1">{displayTicket.Customer.name}</p>
                    {displayTicket.Customer.email && (
                      <p className="text-sm text-gray-600">{displayTicket.Customer.email}</p>
                    )}
                  </div>
                )}
                {displayTicket?.User && (
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Atanan Kullanıcı</p>
                      <p className="font-medium mt-1">{displayTicket.User.name}</p>
                      {displayTicket.User.email && (
                        <p className="text-sm text-gray-600">{displayTicket.User.email}</p>
                      )}
                    </div>
                  </div>
                )}
                {displayTicket?.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Açıklama</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayTicket.description}</p>
                  </div>
                )}
                {displayTicket?.tags && displayTicket.tags.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Etiketler</p>
                    <div className="flex flex-wrap gap-2">
                      {displayTicket.tags.map((tag: string, index: number) => (
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
                  <p className="font-mono text-sm mt-1">{displayTicket?.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                  <p className="font-medium mt-1">
                    {displayTicket?.createdAt ? new Date(displayTicket.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </p>
                </div>
                {displayTicket?.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Son Güncelleme</p>
                    <p className="font-medium mt-1">
                      {new Date(displayTicket.updatedAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Comments & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CommentsSection entityType="Ticket" entityId={ticketId} />
            {displayTicket?.activities && displayTicket.activities.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
                <ActivityTimeline activities={displayTicket.activities} />
              </Card>
            )}
          </div>
        </div>
      </DetailModal>

      {/* Form Modal */}
      <TicketForm
        ticket={displayTicket || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateTicket()
          await mutate(`/api/tickets/${ticketId}`)
        }}
      />
    </>
  )
}

