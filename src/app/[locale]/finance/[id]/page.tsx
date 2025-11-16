'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, DollarSign, Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import FinanceForm from '@/components/finance/FinanceForm'
import { toastError } from '@/lib/toast'

interface Finance {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  relatedTo?: string
  relatedEntityType?: string
  relatedEntityId?: string
  invoiceId?: string
  contractId?: string
  Invoice?: {
    id: string
    title: string
    status: string
    invoiceNumber?: string
  }
  Contract?: {
    id: string
    title: string
    status: string
    contractNumber?: string
  }
  createdAt: string
  updatedAt?: string
  activities?: any[]
}

async function fetchFinance(id: string): Promise<Finance> {
  const res = await fetch(`/api/finance/${id}`)
  if (!res.ok) throw new Error('Failed to fetch finance record')
  return res.json()
}

export default function FinanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: finance, isLoading } = useQuery({
    queryKey: ['finance', id],
    queryFn: () => fetchFinance(id),
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!finance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Finans kaydı bulunamadı</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/finance`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/finance`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Finans Kaydı
            </h1>
            <p className="mt-1 text-gray-600">
              {finance.type === 'INCOME' ? 'Gelir' : 'Gider'} Detayları
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/finance`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/api/pdf/finance/${id}`, '_blank')
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm('Bu finans kaydını silmek istediğinize emin misiniz?')) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/finance/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Silme işlemi başarısız')
                }
                router.push(`/${locale}/finance`)
              } catch (error: any) {
                toastError('Silme işlemi başarısız oldu', error?.message)
              } finally {
                setDeleteLoading(false)
              }
            }}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Finance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Finans Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Tip</p>
              <Badge
                className={
                  finance.type === 'INCOME'
                    ? 'bg-green-100 text-green-800 mt-1'
                    : 'bg-red-100 text-red-800 mt-1'
                }
              >
                {finance.type === 'INCOME' ? 'Gelir' : 'Gider'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tutar</p>
              <p className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(finance.amount)}
              </p>
            </div>
            {finance.relatedTo && (
              <div>
                <p className="text-sm text-gray-600">İlişkili</p>
                <p className="font-medium mt-1">{finance.relatedTo}</p>
              </div>
            )}
            {finance.Invoice && (
              <div>
                <p className="text-sm text-gray-600">İlgili Fatura</p>
                <Link
                  href={`/${locale}/invoices/${finance.Invoice.id}`}
                  className="font-medium text-indigo-600 hover:underline mt-1 block"
                >
                  {finance.Invoice.invoiceNumber || finance.Invoice.title}
                </Link>
              </div>
            )}
            {finance.Contract && (
              <div>
                <p className="text-sm text-gray-600">İlgili Sözleşme</p>
                <Link
                  href={`/${locale}/contracts/${finance.Contract.id}`}
                  className="font-medium text-indigo-600 hover:underline mt-1 block"
                >
                  {finance.Contract.contractNumber || finance.Contract.title}
                </Link>
              </div>
            )}
            {finance.relatedEntityType && finance.relatedEntityId && !finance.Invoice && !finance.Contract && (
              <div>
                <p className="text-sm text-gray-600">İlgili Kayıt</p>
                <Link
                  href={`/${locale}/${finance.relatedEntityType.toLowerCase()}s/${finance.relatedEntityId}`}
                  className="font-medium text-indigo-600 hover:underline mt-1 block"
                >
                  {finance.relatedEntityType} #{finance.relatedEntityId.substring(0, 8)}
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Kayıt ID</p>
              <p className="font-mono text-sm mt-1">{finance.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(finance.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {finance.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(finance.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      {finance.activities && finance.activities.length > 0 && (
        <ActivityTimeline activities={finance.activities} />
      )}

      {/* Form Modal */}
      <FinanceForm
        finance={finance}
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







