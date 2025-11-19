'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, AlertTriangle, RefreshCw, FileText } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useData } from '@/hooks/useData'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ContractForm from '@/components/contracts/ContractForm'
import { confirm } from '@/lib/toast'

interface Contract {
  id: string
  title: string
  status: string
  type: string
  value: number
  startDate: string
  endDate: string
  customer?: { name: string; email: string; phone: string }
  customerCompany?: { name: string }
  deal?: { title: string; value: number }
  createdAt: string
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const contractId = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: contract, isLoading, mutate } = useData<Contract>(`/api/contracts/${contractId}`)

  const handleDelete = async () => {
    if (!confirm(`${contract?.title} sözleşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Silme işlemi başarısız')
      }
      router.push(`/${locale}/contracts`)
    } catch (error: any) {
      alert(error?.message || 'Silme işlemi başarısız oldu')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!contract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sözleşme Bulunamadı</h1>
          <Button onClick={() => router.push(`/${locale}/contracts`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
    TERMINATED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    ACTIVE: 'Aktif',
    EXPIRED: 'Süresi Doldu',
    TERMINATED: 'Sonlandırıldı',
  }

  const isExpired = contract.status === 'EXPIRED'
  const daysUntilExpiry = contract.endDate
    ? Math.ceil((new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/${locale}/contracts`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contract.title}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'DRAFT' && (
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          )}
          {contract.status === 'DRAFT' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          )}
          <Badge className={statusColors[contract.status] || 'bg-gray-100'}>
            {statusLabels[contract.status] || contract.status}
          </Badge>
        </div>
      </div>

      {/* EXPIRED Uyarısı ve Öneriler */}
      {isExpired && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            ⚠️ Bu Sözleşme Süresi Doldu
          </AlertTitle>
          <AlertDescription className="text-orange-800 mt-2">
            <p className="mb-3">
              Bu sözleşme süresi doldu (EXPIRED). Müşteri ile yenileme görüşmeleri başlatabilirsiniz.
              {contract.endDate && (
                <span className="block mt-1 text-sm">
                  Bitiş Tarihi: <strong>{new Date(contract.endDate).toLocaleDateString('tr-TR')}</strong>
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/contracts/new?renewal=${contractId}`)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenileme Sözleşmesi Oluştur
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/deals/new?contract=${contractId}`)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Yeni Fırsat Oluştur
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Yakında Dolacak Uyarısı (30 gün kala) */}
      {contract.status === 'ACTIVE' && daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900 font-semibold">
            ⏰ Sözleşme Yakında Dolacak
          </AlertTitle>
          <AlertDescription className="text-yellow-800 mt-2">
            <p className="mb-3">
              Bu sözleşme <strong>{daysUntilExpiry} gün</strong> sonra dolacak. 
              Yenileme görüşmeleri için hazırlık yapmanız önerilir.
              {contract.endDate && (
                <span className="block mt-1 text-sm">
                  Bitiş Tarihi: <strong>{new Date(contract.endDate).toLocaleDateString('tr-TR')}</strong>
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/contracts/new?renewal=${contractId}`)}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenileme Sözleşmesi Hazırla
              </Button>
            </div>
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
            }).format(contract.value || 0)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Başlangıç Tarihi</p>
          <p className="text-lg font-semibold">
            {contract.startDate ? new Date(contract.startDate).toLocaleDateString('tr-TR') : '-'}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Bitiş Tarihi</p>
          <p className="text-lg font-semibold">
            {contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : '-'}
          </p>
        </Card>
      </div>

      {/* Customer Info */}
      {(contract.customer || contract.customerCompany) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Müşteri Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contract.customer && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Bireysel Müşteri</p>
                <p className="font-medium">{contract.customer.name}</p>
                {contract.customer.email && (
                  <p className="text-sm text-gray-600">{contract.customer.email}</p>
                )}
                {contract.customer.phone && (
                  <p className="text-sm text-gray-600">{contract.customer.phone}</p>
                )}
              </div>
            )}
            {contract.customerCompany && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Firma</p>
                <p className="font-medium">{contract.customerCompany.name}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Deal Info */}
      {contract.deal && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İlgili Fırsat</h2>
          <p className="font-medium">{contract.deal.title}</p>
          <p className="text-sm text-gray-600 mt-1">
            Değer: {new Intl.NumberFormat('tr-TR', {
              style: 'currency',
              currency: 'TRY'
            }).format(contract.deal.value || 0)}
          </p>
        </Card>
      )}

      {/* Contract Form Modal */}
      <ContractForm
        contract={contract}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          mutate()
          setFormOpen(false)
        }}
      />
    </div>
  )
}


