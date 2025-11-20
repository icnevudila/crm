'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, RotateCcw, Package, Receipt, FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ReturnOrderForm from '@/components/return-orders/ReturnOrderForm'
import CreditNoteForm from '@/components/credit-notes/CreditNoteForm'
import { toast, confirm } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
}

const creditNoteStatusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  ISSUED: 'Düzenlendi',
  APPLIED: 'Uygulandı',
}

export default function ReturnOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [creditNoteFormOpen, setCreditNoteFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: returnOrder, isLoading, error, mutate: mutateReturnOrder } = useData<any>(
    id ? `/api/return-orders/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  // İlgili Credit Notes - Return Order'a bağlı alacak dekontları
  const { data: creditNotes = [] } = useData<any[]>(
    id ? `/api/credit-notes?returnOrderId=${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !returnOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            İade Siparişi Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'İade siparişi yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/return-orders`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!(await confirm(`${returnOrder.returnNumber} iade siparişini silmek istediğinize emin misiniz?`))) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/return-orders/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }
      router.push(`/${locale}/return-orders`)
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
            onClick={() => router.push(`/${locale}/return-orders`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw className="h-8 w-8" />
              {returnOrder.returnNumber}
            </h1>
            <p className="mt-1 text-gray-600">İade Siparişi Detayları</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/return-orders`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          {returnOrder.status !== 'COMPLETED' && (
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
          {/* Alacak Dekontu Oluştur - Sadece APPROVED durumunda */}
          {returnOrder.status === 'APPROVED' && (
            <Button
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => setCreditNoteFormOpen(true)}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Alacak Dekontu Oluştur
            </Button>
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
            <p className="text-sm text-gray-600 mb-1">İade No</p>
            <p className="font-medium text-gray-900">{returnOrder.returnNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Durum</p>
            <Badge className={getStatusBadgeClass(returnOrder.status)}>
              {statusLabels[returnOrder.status] || returnOrder.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">İade Tarihi</p>
            <p className="font-medium text-gray-900">
              {new Date(returnOrder.returnDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(returnOrder.totalAmount || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">İade Tutarı</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(returnOrder.refundAmount || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Oluşturulma</p>
            <p className="font-medium text-gray-900">
              {new Date(returnOrder.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* İlgili Kayıtlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {returnOrder.invoice && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Fatura
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Fatura No</p>
              <Link
                href={`/${locale}/invoices/${returnOrder.invoice.id}`}
                className="text-indigo-600 hover:underline font-medium"
                prefetch={true}
              >
                {returnOrder.invoice.invoiceNumber || returnOrder.invoice.title || 'N/A'}
              </Link>
              {returnOrder.invoice.totalAmount && (
                <p className="text-sm text-gray-600">
                  Tutar: {formatCurrency(returnOrder.invoice.totalAmount)}
                </p>
              )}
            </div>
          </Card>
        )}
        {returnOrder.customer && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Müşteri
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{returnOrder.customer.name || 'N/A'}</p>
              {returnOrder.customer.email && (
                <p className="text-sm text-gray-600">{returnOrder.customer.email}</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* İade Sebebi */}
      {returnOrder.reason && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İade Sebebi</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{returnOrder.reason}</p>
        </Card>
      )}

      {/* İade Edilen Ürünler */}
      {returnOrder.items && returnOrder.items.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            İade Edilen Ürünler
          </h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Toplam</TableHead>
                  <TableHead>Sebep</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnOrder.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.product?.name || item.product?.sku || item.productId?.substring(0, 8) || 'N/A'}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                    <TableCell>{formatCurrency(item.totalPrice || 0)}</TableCell>
                    <TableCell>{item.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Toplam İade Tutarı:</span>
              <span className="text-2xl font-bold text-indigo-600">
                {formatCurrency(returnOrder.totalAmount || 0)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* İlgili Alacak Dekontları */}
      {creditNotes.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-600" />
            İlgili Alacak Dekontları
            <Badge variant="outline">({creditNotes.length})</Badge>
          </h2>
          <div className="space-y-4">
            {creditNotes.map((cn: any) => (
              <Link href={`/${locale}/credit-notes/${cn.id}`} key={cn.id}>
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{cn.creditNoteNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(cn.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeClass(cn.status)}>
                      {creditNoteStatusLabels[cn.status] || cn.status}
                    </Badge>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(cn.amount || 0)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
        <ActivityTimeline entityType="ReturnOrder" entityId={id} />
      </Card>

      {/* Form Modal */}
      <ReturnOrderForm
        returnOrder={returnOrder}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedReturnOrder) => {
          await mutateReturnOrder(savedReturnOrder, { revalidate: false })
          await mutate(`/api/return-orders/${id}`)
          setFormOpen(false)
        }}
      />

      {/* Credit Note Form Modal */}
      <CreditNoteForm
        open={creditNoteFormOpen}
        onClose={() => setCreditNoteFormOpen(false)}
        returnOrderId={id}
        onSuccess={async (savedCreditNote) => {
          toast.success('Alacak dekontu oluşturuldu', {
            description: `${savedCreditNote.creditNoteNumber} başarıyla oluşturuldu.`,
          })
          setCreditNoteFormOpen(false)
          // Credit notes listesini güncelle
          await mutate(`/api/credit-notes?returnOrderId=${id}`)
          // Return order detail'i yenile
          await mutateReturnOrder()
        }}
      />
    </div>
  )
}


