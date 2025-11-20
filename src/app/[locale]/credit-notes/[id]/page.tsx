'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Receipt, FileText, Users, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import CreditNoteForm from '@/components/credit-notes/CreditNoteForm'
import { toast, confirm } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  ISSUED: 'Düzenlendi',
  APPLIED: 'Uygulandı',
}

export default function CreditNoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: creditNote, isLoading, error, mutate: mutateCreditNote } = useData<any>(
    id ? `/api/credit-notes/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !creditNote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Alacak Dekontu Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Alacak dekontu yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/credit-notes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!(await confirm(`${creditNote.creditNoteNumber} alacak dekontunu silmek istediğinize emin misiniz?`))) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/credit-notes/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }
      router.push(`/${locale}/credit-notes`)
    } catch (error: any) {
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/credit-notes`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="h-8 w-8" />
              {creditNote.creditNoteNumber}
            </h1>
            <p className="mt-1 text-gray-600">Alacak Dekontu Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/credit-notes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          {creditNote.status !== 'APPLIED' && (
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
                Sil
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Genel Bilgiler */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Genel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Dekont No</p>
            <p className="font-medium text-gray-900">{creditNote.creditNoteNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Durum</p>
            <Badge className={getStatusBadgeClass(creditNote.status)}>
              {statusLabels[creditNote.status] || creditNote.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Tutar</p>
            <p className="font-medium text-gray-900 text-2xl">
              {formatCurrency(creditNote.amount || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Oluşturulma</p>
            <p className="font-medium text-gray-900">
              {new Date(creditNote.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {creditNote.issuedAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Düzenlenme Tarihi</p>
              <p className="font-medium text-gray-900">
                {new Date(creditNote.issuedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          {creditNote.appliedAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Uygulanma Tarihi</p>
              <p className="font-medium text-gray-900">
                {new Date(creditNote.appliedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* İlgili Kayıtlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {creditNote.returnOrder && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-indigo-600" />
              İade Siparişi
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">İade No</p>
              <Link
                href={`/${locale}/return-orders/${creditNote.returnOrder.id}`}
                className="text-indigo-600 hover:underline font-medium"
                prefetch={true}
              >
                {creditNote.returnOrder.returnNumber || 'N/A'}
              </Link>
              {creditNote.returnOrder.totalAmount && (
                <p className="text-sm text-gray-600">
                  Tutar: {formatCurrency(creditNote.returnOrder.totalAmount)}
                </p>
              )}
            </div>
          </Card>
        )}
        {creditNote.invoice && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Fatura
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Fatura No</p>
              <Link
                href={`/${locale}/invoices/${creditNote.invoice.id}`}
                className="text-indigo-600 hover:underline font-medium"
                prefetch={true}
              >
                {creditNote.invoice.invoiceNumber || creditNote.invoice.title || 'N/A'}
              </Link>
              {creditNote.invoice.totalAmount && (
                <p className="text-sm text-gray-600">
                  Tutar: {formatCurrency(creditNote.invoice.totalAmount)}
                </p>
              )}
            </div>
          </Card>
        )}
        {creditNote.customer && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Müşteri
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{creditNote.customer.name || 'N/A'}</p>
              {creditNote.customer.email && (
                <p className="text-sm text-gray-600">{creditNote.customer.email}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Sebep */}
      {creditNote.reason && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sebep</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{creditNote.reason}</p>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
        <ActivityTimeline entityType="CreditNote" entityId={id} />
      </Card>

      {/* Form Modal */}
      <CreditNoteForm
        creditNote={creditNote}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedCreditNote) => {
          await mutateCreditNote(savedCreditNote, { revalidate: false })
          await mutate(`/api/credit-notes/${id}`)
          setFormOpen(false)
        }}
      />
    </div>
  )
}


