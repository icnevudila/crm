'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, AlertTriangle, RefreshCw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { toast } from '@/lib/toast'

const ContractForm = dynamic(() => import('./ContractForm'), {
  ssr: false,
  loading: () => null,
})

interface ContractDetailModalProps {
  contractId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function ContractDetailModal({
  contractId,
  open,
  onClose,
  initialData,
}: ContractDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: contract, isLoading, error, mutate: mutateContract } = useData<any>(
    contractId && open ? `/api/contracts/${contractId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayContract = contract || initialData

  const handleDelete = async () => {
    if (!displayContract || !confirm(`${displayContract.title} sözleşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Sözleşme silindi')
      
      await mutate('/api/contracts')
      await mutate(`/api/contracts/${contractId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !contractId) return null

  if (isLoading && !initialData && !displayContract) {
    return (
      <DetailModal open={open} onClose={onClose} title="Sözleşme Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayContract) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Sözleşme yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayContract) {
    return (
      <DetailModal open={open} onClose={onClose} title="Sözleşme Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Sözleşme bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-600 text-white border-gray-700',
    ACTIVE: 'bg-green-600 text-white border-green-700',
    EXPIRED: 'bg-orange-600 text-white border-orange-700',
    TERMINATED: 'bg-red-600 text-white border-red-700',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    ACTIVE: 'Aktif',
    EXPIRED: 'Süresi Doldu',
    TERMINATED: 'Sonlandırıldı',
  }

  const isExpired = displayContract?.status === 'EXPIRED'
  const daysUntilExpiry = displayContract?.endDate
    ? Math.ceil((new Date(displayContract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayContract?.title || 'Sözleşme Detayları'}
        description="Sözleşme bilgileri ve müşteri detayları"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            {displayContract?.status === 'DRAFT' && (
              <>
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
              </>
            )}
            <Badge className={statusColors[displayContract?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayContract?.status] || displayContract?.status}
            </Badge>
          </div>

          {/* EXPIRED Uyarısı */}
          {isExpired && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900 font-semibold">
                ⚠️ Bu Sözleşme Süresi Doldu
              </AlertTitle>
              <AlertDescription className="text-orange-800 mt-2">
                <p className="mb-3">
                  Bu sözleşme süresi doldu (EXPIRED). Müşteri ile yenileme görüşmeleri başlatabilirsiniz.
                  {displayContract?.endDate && (
                    <span className="block mt-1 text-sm">
                      Bitiş Tarihi: <strong>{new Date(displayContract.endDate).toLocaleDateString('tr-TR')}</strong>
                    </span>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Yakında Dolacak Uyarısı */}
          {displayContract?.status === 'ACTIVE' && daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900 font-semibold">
                ⏰ Sözleşme Yakında Dolacak
              </AlertTitle>
              <AlertDescription className="text-yellow-800 mt-2">
                <p>
                  Bu sözleşme <strong>{daysUntilExpiry} gün</strong> sonra dolacak.
                  {displayContract?.endDate && (
                    <span className="block mt-1 text-sm">
                      Bitiş Tarihi: <strong>{new Date(displayContract.endDate).toLocaleDateString('tr-TR')}</strong>
                    </span>
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Contract Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Toplam Değer</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                }).format(displayContract?.value || 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Başlangıç Tarihi</p>
              <p className="text-lg font-semibold">
                {displayContract?.startDate ? new Date(displayContract.startDate).toLocaleDateString('tr-TR') : '-'}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Bitiş Tarihi</p>
              <p className="text-lg font-semibold">
                {displayContract?.endDate ? new Date(displayContract.endDate).toLocaleDateString('tr-TR') : '-'}
              </p>
            </Card>
          </div>

          {/* Customer Info */}
          {(displayContract?.customer || displayContract?.customerCompany) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayContract?.customer && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bireysel Müşteri</p>
                    <p className="font-medium">{displayContract.customer.name}</p>
                    {displayContract.customer.email && (
                      <p className="text-sm text-gray-600">{displayContract.customer.email}</p>
                    )}
                    {displayContract.customer.phone && (
                      <p className="text-sm text-gray-600">{displayContract.customer.phone}</p>
                    )}
                  </div>
                )}
                {displayContract?.customerCompany && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Firma</p>
                    <p className="font-medium">{displayContract.customerCompany.name}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Deal Info */}
          {displayContract?.deal && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">İlgili Fırsat</h2>
              <p className="font-medium">{displayContract.deal.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                Değer: {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY'
                }).format(displayContract.deal.value || 0)}
              </p>
            </Card>
          )}
        </div>
      </DetailModal>

      {/* Form Modal */}
      <ContractForm
        contract={displayContract || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateContract()
          await mutate(`/api/contracts/${contractId}`)
        }}
      />
    </>
  )
}

