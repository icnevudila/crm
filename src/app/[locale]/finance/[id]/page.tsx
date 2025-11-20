'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, DollarSign, Trash2, Download, Receipt, FileText, User, Building2, Mail, Phone, Calendar, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import FinanceForm from '@/components/finance/FinanceForm'
import { toastError, confirm } from '@/lib/toast'

interface Finance {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  category?: string
  description?: string
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
    total?: number
    totalAmount?: number
    createdAt: string
    Customer?: {
      id: string
      name: string
      email?: string
    }
  }
  Contract?: {
    id: string
    title: string
    status: string
    contractNumber?: string
    totalAmount?: number
    createdAt: string
    CustomerCompany?: {
      id: string
      name: string
      email?: string
    }
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
            {finance.category && (
              <div>
                <p className="text-sm text-gray-600">Kategori</p>
                <p className="font-medium mt-1">{finance.category}</p>
              </div>
            )}
            {finance.description && (
              <div>
                <p className="text-sm text-gray-600">Açıklama</p>
                <p className="font-medium mt-1">{finance.description}</p>
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

      {/* İlgili Fatura Detayları */}
      {finance.Invoice && (
        <Card className="p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" />
              İlgili Fatura
            </h2>
            <Link href={`/${locale}/invoices/${finance.Invoice.id}`}>
              <Button variant="outline" size="sm">
                <Receipt className="mr-2 h-4 w-4" />
                Faturaya Git
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fatura No</p>
              <p className="font-medium text-gray-900">
                {finance.Invoice.invoiceNumber || finance.Invoice.id.substring(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Fatura Başlığı</p>
              <p className="font-medium text-gray-900">{finance.Invoice.title || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Durum</p>
              <Badge>{finance.Invoice.status || '-'}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                  finance.Invoice.total || finance.Invoice.totalAmount || 0
                )}
              </p>
            </div>
            {finance.Invoice.Customer && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Müşteri</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {finance.Invoice.Customer.name}
                  </p>
                </div>
                {finance.Invoice.Customer.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">E-posta</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {finance.Invoice.Customer.email}
                    </p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(finance.Invoice.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* İlgili Sözleşme Detayları */}
      {finance.Contract && (
        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              İlgili Sözleşme
            </h2>
            <Link href={`/${locale}/contracts/${finance.Contract.id}`}>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Sözleşmeye Git
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sözleşme No</p>
              <p className="font-medium text-gray-900">
                {finance.Contract.contractNumber || finance.Contract.id.substring(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Sözleşme Başlığı</p>
              <p className="font-medium text-gray-900">{finance.Contract.title || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Durum</p>
              <Badge>{finance.Contract.status || '-'}</Badge>
            </div>
            {finance.Contract.totalAmount && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    finance.Contract.totalAmount
                  )}
                </p>
              </div>
            )}
            {finance.Contract.CustomerCompany && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Müşteri Firma</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {finance.Contract.CustomerCompany.name}
                  </p>
                </div>
                {finance.Contract.CustomerCompany.email && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">E-posta</p>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {finance.Contract.CustomerCompany.email}
                    </p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
              <p className="text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                {new Date(finance.Contract.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </Card>
      )}

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







