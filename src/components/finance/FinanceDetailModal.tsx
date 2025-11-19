'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import DetailModal from '@/components/ui/DetailModal'
import { formatCurrency } from '@/lib/utils'
import { toast, confirm } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const FinanceForm = dynamic(() => import('./FinanceForm'), {
  ssr: false,
  loading: () => null,
})

interface FinanceDetailModalProps {
  financeId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function FinanceDetailModal({
  financeId,
  open,
  onClose,
  initialData,
}: FinanceDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: finance, isLoading, error, mutate: mutateFinance } = useData<any>(
    financeId && open ? `/api/finance/${financeId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayFinance = finance || initialData

  const handleDelete = async () => {
    if (!displayFinance || !confirm(`Bu finans kaydını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/finance/${financeId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Finans kaydı silindi')
      
      await mutate('/api/finance')
      await mutate(`/api/finance/${financeId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !financeId) return null

  if (isLoading && !initialData && !displayFinance) {
    return (
      <DetailModal open={open} onClose={onClose} title="Finans Detayları" size="lg">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayFinance) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Finans kaydı yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayFinance) {
    return (
      <DetailModal open={open} onClose={onClose} title="Finans Kaydı Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Finans kaydı bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const isIncome = displayFinance?.type === 'INCOME'

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayFinance?.description || 'Finans Detayları'}
        description={`${displayFinance?.type === 'INCOME' ? 'Gelir' : 'Gider'} • ${displayFinance?.createdAt ? new Date(displayFinance.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pb-4 border-b">
            <Badge className={isIncome ? 'bg-green-600 text-white border-green-700' : 'bg-red-600 text-white border-red-700'}>
              {isIncome ? (
                <><TrendingUp className="h-3 w-3 mr-1" /> Gelir</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1" /> Gider</>
              )}
            </Badge>
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

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Tutar</p>
              <p className={`text-3xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}{formatCurrency(displayFinance?.amount || 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Kategori</p>
              <p className="text-lg font-semibold">{displayFinance?.category || '-'}</p>
            </Card>
            {displayFinance?.paymentMethod && (
              <Card className="p-6">
                <p className="text-sm text-gray-600 mb-1">Ödeme Yöntemi</p>
                <p className="text-lg font-semibold">{displayFinance.paymentMethod}</p>
              </Card>
            )}
            {displayFinance?.paymentDate && (
              <Card className="p-6">
                <p className="text-sm text-gray-600 mb-1">Ödeme Tarihi</p>
                <p className="text-lg font-semibold">
                  {new Date(displayFinance.paymentDate).toLocaleDateString('tr-TR')}
                </p>
              </Card>
            )}
          </div>

          {/* Description */}
          {displayFinance?.description && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Açıklama</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{displayFinance.description}</p>
            </Card>
          )}

          {/* Related Entity */}
          {displayFinance?.relatedEntityType && displayFinance?.relatedEntityId && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">İlgili Kayıt</h2>
              <p className="text-gray-700">
                <span className="font-medium">{displayFinance.relatedEntityType}:</span>{' '}
                {displayFinance.relatedEntityId.substring(0, 8)}
              </p>
            </Card>
          )}

          {/* Customer Company */}
          {displayFinance?.customerCompany && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Müşteri Firma</h2>
              <p className="text-gray-700">{displayFinance.customerCompany.name}</p>
            </Card>
          )}
        </div>
      </DetailModal>

      {/* Form Modal */}
      <FinanceForm
        finance={displayFinance || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateFinance()
          await mutate(`/api/finance/${financeId}`)
        }}
      />
    </>
  )
}

