'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Mail, Phone, MapPin, Building2, Briefcase, FileText, Receipt, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { toast } from '@/lib/toast'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('./CustomerForm'), {
  ssr: false,
  loading: () => null,
})

interface CustomerDetailModalProps {
  customerId: string | null
  open: boolean
  onClose: () => void
  initialData?: any // Liste sayfasından gelen veri (hızlı açılış için)
}

export default function CustomerDetailModal({
  customerId,
  open,
  onClose,
  initialData,
}: CustomerDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // SWR ile veri çek - cache'den hızlı açılış için
  const { data: customer, isLoading, error, mutate: mutateCustomer } = useData<any>(
    customerId && open ? `/api/customers/${customerId}` : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
      fallbackData: initialData, // İlk render için liste sayfasındaki veriyi kullan
    }
  )

  const handleDelete = async () => {
    const displayCustomer = customer || initialData
    if (!displayCustomer || !confirm(`${displayCustomer.name} müşterisini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Müşteri silindi')
      
      // Cache'i güncelle
      await mutate('/api/customers')
      await mutate(`/api/customers/${customerId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !customerId) return null

  // initialData varsa direkt göster (hızlı açılış için)
  // Loading/error state'leri sadece initialData yoksa göster
  const displayCustomer = customer || initialData

  // Loading state - sadece initialData yoksa ve hala loading ise göster
  if (isLoading && !initialData && !displayCustomer) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Müşteri Detayları"
        size="xl"
      >
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  // Error state - sadece initialData yoksa ve error varsa göster
  if (error && !initialData && !displayCustomer) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Hata"
        size="md"
      >
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  // Customer yoksa - sadece gerçekten yoksa göster (initialData varsa buraya gelmez)
  if (!displayCustomer) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Müşteri Bulunamadı"
        size="md"
      >
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri bulunamadı</p>
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
        title={displayCustomer?.name || 'Müşteri Detayları'}
        description="Müşteri bilgileri ve ilişkili kayıtlar"
        size="xl"
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

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">İletişim Bilgileri</h2>
              <div className="space-y-3">
                {displayCustomer?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{displayCustomer.address}</span>
                  </div>
                )}
                {displayCustomer?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCustomer.phone}</span>
                  </div>
                )}
                {displayCustomer?.fax && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Faks: {displayCustomer.fax}</span>
                  </div>
                )}
                {displayCustomer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCustomer.email}</span>
                  </div>
                )}
                {displayCustomer?.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCustomer.city}</span>
                  </div>
                )}
                {displayCustomer?.sector && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayCustomer.sector}</span>
                  </div>
                )}
                {displayCustomer?.website && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <a href={displayCustomer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {displayCustomer.website}
                    </a>
                  </div>
                )}
                {displayCustomer?.taxNumber && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Vergi No: {displayCustomer.taxNumber}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Durum</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Durum:</span>
                  <Badge
                    className={
                      displayCustomer?.status === 'ACTIVE'
                        ? 'bg-green-600 text-white ml-2 border-green-700'
                        : 'bg-red-600 text-white ml-2 border-red-700'
                    }
                  >
                    {displayCustomer?.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Oluşturulma:</span>
                  <span className="ml-2 text-gray-700">
                    {displayCustomer?.createdAt ? new Date(displayCustomer.createdAt).toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Related Data */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fırsatlar */}
            {displayCustomer?.Deal && displayCustomer.Deal.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Fırsatlar ({displayCustomer.Deal.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCustomer.Deal.slice(0, 5).map((deal: any) => (
                    <div
                      key={deal.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/deals/${deal.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-gray-600">{deal.stage}</p>
                        </div>
                        <Badge>{deal.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Teklifler */}
            {displayCustomer?.Quote && displayCustomer.Quote.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Teklifler ({displayCustomer.Quote.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCustomer.Quote.slice(0, 5).map((quote: any) => (
                    <div
                      key={quote.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/quotes/${quote.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{quote.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.total || 0)}
                          </p>
                        </div>
                        <Badge>{quote.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Faturalar */}
            {displayCustomer?.Invoice && displayCustomer.Invoice.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    Faturalar ({displayCustomer.Invoice.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {displayCustomer.Invoice.slice(0, 5).map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border cursor-pointer"
                      onClick={() => {
                        onClose()
                        router.push(`/${locale}/invoices/${invoice.id}`)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invoice.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(invoice.total || 0)}
                          </p>
                        </div>
                        <Badge>{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Activity Timeline */}
          {displayCustomer?.activities && displayCustomer.activities.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
              <ActivityTimeline activities={displayCustomer.activities} />
            </Card>
          )}

          {/* Comments & Files */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CommentsSection entityType="Customer" entityId={customerId} />
            <FileUpload entityType="Customer" entityId={customerId} />
          </div>
        </div>
      </DetailModal>

      {/* Form Modal */}
      <CustomerForm
        customer={displayCustomer || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateCustomer()
          await mutate(`/api/customers/${customerId}`)
        }}
      />
    </>
  )
}

