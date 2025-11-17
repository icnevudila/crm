'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Edit, Mail, Phone, MapPin, Building2, Briefcase, FileText, Receipt, Trash2, X, User } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import DetailModal from '@/components/ui/DetailModal'
import TeamChat from '@/components/chat/TeamChat'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
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
  // ÖNEMLİ: initialData'da CreatedByUser/UpdatedByUser yoksa API'den fresh data çek
  const { data: customer, isLoading, error, mutate: mutateCustomer } = useData<any>(
    customerId && open ? `/api/customers/${customerId}` : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
    }
  )
  
  // initialData'yı fallback olarak kullan ama CreatedByUser/UpdatedByUser için API'den çek
  const displayCustomer = customer || (initialData && (initialData.CreatedByUser || initialData.UpdatedByUser) ? initialData : undefined)

  const handleDelete = async () => {
    const tCommon = useTranslations('common')
    if (!displayCustomer || !confirm(tCommon('deleteConfirm', { name: displayCustomer.name, item: 'müşteri' }))) {
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

      toast.success(tCommon('customerDeletedSuccess'))
      
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

  // ✅ ÇÖZÜM: customerId null kontrolü - modal açılmadan önce kontrol et
  if (!open) return null
  
  if (!customerId) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri ID bulunamadı</p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
        </div>
      </DetailModal>
    )
  }

  // displayCustomer zaten yukarıda tanımlı

  // DEBUG: CreatedByUser/UpdatedByUser kontrolü
  if (process.env.NODE_ENV === 'development' && displayCustomer) {
    console.log('[CustomerDetailModal] Debug Info:', {
      hasCreatedByUser: !!displayCustomer.CreatedByUser,
      hasUpdatedByUser: !!displayCustomer.UpdatedByUser,
      createdBy: displayCustomer.createdBy,
      updatedBy: displayCustomer.updatedBy,
      logoUrl: displayCustomer.logoUrl,
      customerId: customerId,
    })
  }

  // Loading state - sadece initialData yoksa ve hala loading ise göster
  if (isLoading && !initialData && !displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Müşteri Detayları" size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </DetailModal>
    )
  }

  // Error state - sadece initialData yoksa ve error varsa göster
  if (error && !initialData && !displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">
            {error?.message?.includes('404') || error?.message?.includes('bulunamadı')
              ? 'Müşteri bulunamadı'
              : 'Müşteri yüklenemedi'}
          </p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
        </div>
      </DetailModal>
    )
  }

  // Customer yoksa - sadece gerçekten yoksa göster (initialData varsa buraya gelmez)
  if (!displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Müşteri Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri bulunamadı</p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
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
          {/* Customer Logo/Photo */}
          {displayCustomer?.logoUrl && (
            <div className="flex justify-center pb-4 border-b">
              <div className="w-32 h-32 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center overflow-hidden">
                <Image
                  src={displayCustomer.logoUrl}
                  alt={displayCustomer.name || 'Müşteri'}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pb-4 border-b">
            <Button variant="outline" onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    <SendWhatsAppButton
                      phoneNumber={displayCustomer.phone}
                      entityType="Customer"
                      entityId={customerId || undefined}
                      customerName={displayCustomer.name}
                      variant="ghost"
                      size="sm"
                    />
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
              <h2 className="text-xl font-semibold mb-4">Durum ve Bilgiler</h2>
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
                {displayCustomer?.CreatedByUser && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Oluşturan:</span>
                      <span className="ml-2 text-gray-700 font-medium">
                        {displayCustomer.CreatedByUser.name}
                      </span>
                    </div>
                  </div>
                )}
                {displayCustomer?.updatedAt && (
                  <div>
                    <span className="text-sm text-gray-600">Son Güncelleme:</span>
                    <span className="ml-2 text-gray-700">
                      {new Date(displayCustomer.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
                {displayCustomer?.UpdatedByUser && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-600">Son Güncelleyen:</span>
                      <span className="ml-2 text-gray-700 font-medium">
                        {displayCustomer.UpdatedByUser.name}
                      </span>
                    </div>
                  </div>
                )}
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

          {/* Team Chat */}
          <TeamChat
            entityType="Customer"
            entityId={customerId || undefined}
            title={`${displayCustomer?.name || 'Müşteri'} - Takım Sohbeti`}
          />
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

