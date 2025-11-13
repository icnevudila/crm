'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useSession } from '@/hooks/useSession'
import { Edit, Trash2, Calendar, Building2, User, FileText, DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import DetailModal from '@/components/ui/DetailModal'
import { toast } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import dynamic from 'next/dynamic'

const MeetingForm = dynamic(() => import('./MeetingForm'), {
  ssr: false,
  loading: () => null,
})

interface MeetingDetailModalProps {
  meetingId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function MeetingDetailModal({
  meetingId,
  open,
  onClose,
  initialData,
}: MeetingDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const { data: session } = useSession()
  const [formOpen, setFormOpen] = useState(false)

  const { data: meeting, isLoading, error, mutate: mutateMeeting } = useData<any>(
    meetingId && open ? `/api/meetings/${meetingId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayMeeting = meeting || initialData

  const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || displayMeeting?.createdBy === session?.user?.id

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-blue-600 text-white border-blue-700',
    DONE: 'bg-green-600 text-white border-green-700',
    CANCELLED: 'bg-red-600 text-white border-red-700',
  }

  const statusLabels: Record<string, string> = {
    PLANNED: 'Planlandı',
    DONE: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  }

  const handleDelete = async () => {
    if (!window.confirm(`${displayMeeting?.title} görüşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    const toastId = toast.loading('Siliniyor...')
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız oldu')
      }

      await mutate('/api/meetings')
      toast.dismiss(toastId)
      toast.success('Silindi', 'Görüşme başarıyla silindi.')
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.dismiss(toastId)
      toast.error('Silme başarısız', error?.message || 'Silme işlemi sırasında bir hata oluştu.')
    }
  }

  if (!open || !meetingId) return null

  if (isLoading && !initialData && !displayMeeting) {
    return (
      <DetailModal open={open} onClose={onClose} title="Görüşme Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayMeeting) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Görüşme yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayMeeting) {
    return (
      <DetailModal open={open} onClose={onClose} title="Görüşme Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Görüşme bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayMeeting?.title || 'Görüşme Detayları'}
        description={
          displayMeeting?.meetingDate
            ? new Date(displayMeeting.meetingDate).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : undefined
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          {canEdit && (
            <div className="flex justify-end gap-2 pb-4 border-b">
              <Badge className={statusColors[displayMeeting?.status] || 'bg-gray-600 text-white border-gray-700'}>
                {statusLabels[displayMeeting?.status] || displayMeeting?.status}
              </Badge>
              <Button
                variant="outline"
                onClick={() => setFormOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* GÃ¶rÃ¼ÅŸme Notu */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Görüşme Notu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {displayMeeting?.description || 'Not eklenmemiş'}
                  </p>
                </CardContent>
              </Card>

              {/* Ä°lgili Bilgiler */}
              <Card>
                <CardHeader>
                  <CardTitle>İlgili Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {displayMeeting?.Company && (
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Firma</p>
                        <div
                          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          onClick={() => {
                            onClose()
                            router.push(`/${locale}/companies/${displayMeeting.companyId}`)
                          }}
                        >
                          {displayMeeting.Company.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {displayMeeting?.Customer && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Müşteri</p>
                        <div
                          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          onClick={() => {
                            onClose()
                            router.push(`/${locale}/customers/${displayMeeting.customerId}`)
                          }}
                        >
                          {displayMeeting.Customer.name}
                        </div>
                      </div>
                    </div>
                  )}
                  {displayMeeting?.Deal && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Fırsat</p>
                        <div
                          className="text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                          onClick={() => {
                            onClose()
                            router.push(`/${locale}/deals/${displayMeeting.dealId}`)
                          }}
                        >
                          {displayMeeting.Deal.title}
                        </div>
                      </div>
                    </div>
                  )}
                  {displayMeeting?.location && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Konum</p>
                        <p className="text-gray-900">{displayMeeting.location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Giderler */}
              {displayMeeting?.expenseBreakdown && displayMeeting.expenseBreakdown.total > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Görüşme Giderleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {displayMeeting.expenseBreakdown.fuel > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Araç Yakıt:</span>
                        <span className="font-semibold">{formatCurrency(displayMeeting.expenseBreakdown.fuel)}</span>
                      </div>
                    )}
                    {displayMeeting.expenseBreakdown.accommodation > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Konaklama:</span>
                        <span className="font-semibold">{formatCurrency(displayMeeting.expenseBreakdown.accommodation)}</span>
                      </div>
                    )}
                    {displayMeeting.expenseBreakdown.food > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yemek:</span>
                        <span className="font-semibold">{formatCurrency(displayMeeting.expenseBreakdown.food)}</span>
                      </div>
                    )}
                    {displayMeeting.expenseBreakdown.other > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Diğer:</span>
                        <span className="font-semibold">{formatCurrency(displayMeeting.expenseBreakdown.other)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between pt-2">
                      <span className="font-semibold text-gray-900">Toplam:</span>
                      <span className="font-bold text-indigo-600">{formatCurrency(displayMeeting.expenseBreakdown.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gider UyarÄ±sÄ± */}
              {displayMeeting?.expenseWarning && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="text-amber-800">Gider Uyarısı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-700 mb-4">
                      Bu görüşme için operasyon gideri girilmemiş görünüyor.
                    </p>
                    <Button
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/finance?relatedTo=Meeting&relatedId=${displayMeeting.id}`)
                      }}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Gider Ekle
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* HÄ±zlÄ± Eylemler */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı Eylemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      onClose()
                      router.push(`/${locale}/finance?relatedTo=Meeting&relatedId=${displayMeeting?.id}`)
                    }}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Gider Ekle
                  </Button>
                  {displayMeeting?.customerId && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/quotes/new?customerId=${displayMeeting.customerId}&dealId=${displayMeeting.dealId || ''}`)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Teklif Oluştur
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* OluÅŸturan */}
              {displayMeeting?.CreatedBy && (
                <Card>
                  <CardHeader>
                    <CardTitle>Oluşturan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900">{displayMeeting.CreatedBy.name}</p>
                    {displayMeeting.CreatedBy.email && (
                      <p className="text-sm text-gray-500">{displayMeeting.CreatedBy.email}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DetailModal>

      {/* Edit Form Modal */}
      {formOpen && displayMeeting && (
        <MeetingForm
          meeting={displayMeeting}
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
          }}
          onSuccess={async (savedMeeting) => {
            await mutateMeeting()
            await mutate('/api/meetings')
            setFormOpen(false)
          }}
        />
      )}
    </>
  )
}

