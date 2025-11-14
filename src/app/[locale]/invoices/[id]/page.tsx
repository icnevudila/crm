'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useData } from '@/hooks/useData'
import { ArrowLeft, Edit, FileText, FileText as QuoteIcon, Truck, Trash2, Users, Plus, Package, AlertTriangle, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import dynamic from 'next/dynamic'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getInvoiceWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Lazy load InvoiceForm - performans için
const InvoiceForm = dynamic(() => import('@/components/invoices/InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load InvoiceItemForm - performans için
const InvoiceItemForm = dynamic(() => import('@/components/invoices/InvoiceItemForm'), {
  ssr: false,
  loading: () => null,
})

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-green-100 text-green-800',
  RECEIVED: 'bg-teal-100 text-teal-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyatı Yapıldı',
  RECEIVED: 'Mal Kabul Edildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: invoice, isLoading, error, mutate: refetch } = useData<any>(
    id ? `/api/invoices/${id}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Fatura Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Fatura yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/invoices`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
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
            onClick={() => router.push(`/${locale}/invoices`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.title}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Quote'tan oluşturulan, SHIPPED ve RECEIVED durumundaki faturalar düzenlenemez ve silinemez */}
          {!invoice.quoteId && invoice.status !== 'SHIPPED' && invoice.status !== 'RECEIVED' && (
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
          )}
          <Button
            className="bg-gradient-primary text-white"
            onClick={() => {
              window.open(`/api/pdf/invoice/${id}`, '_blank')
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/api/invoices/${id}/export`, '_blank')
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            XML Export (E-Fatura)
          </Button>
          {/* Quote'tan oluşturulan, SHIPPED ve RECEIVED durumundaki faturalar silinemez */}
          {!invoice.quoteId && invoice.status !== 'ACCEPTED' && invoice.status !== 'SHIPPED' && invoice.status !== 'RECEIVED' && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={async () => {
                if (!confirm(`${invoice.title} faturasını silmek istediğinize emin misiniz?`)) {
                  return
                }
                setDeleteLoading(true)
                try {
                  const res = await fetch(`/api/invoices/${id}`, {
                    method: 'DELETE',
                  })
                  if (!res.ok) throw new Error('Silme işlemi başarısız')
                  router.push(`/${locale}/invoices`)
                } catch (error: any) {
                  alert(error?.message || 'Silme işlemi başarısız oldu')
                } finally {
                  setDeleteLoading(false)
                }
              }}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          )}
        </div>
      </div>

      {/* Uyarı Mesajları */}
      {invoice.status === 'SHIPPED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-semibold">
            ✓ Sevkiyatı yapıldı, stoktan düşüldü, onaylandı. Bu fatura değiştirilemez.
          </p>
        </div>
      )}
      {invoice.status === 'RECEIVED' && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-sm text-teal-800 font-semibold">
            ✓ Mal kabul edildi, stoğa girişi yapıldı, onaylandı. Bu fatura değiştirilemez.
          </p>
        </div>
      )}
      {invoice.quoteId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800 font-semibold">
            ℹ️ Bu fatura tekliften oluşturuldu. Değiştirilemez.
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Durum</p>
          <Badge className={statusColors[invoice.status] || 'bg-gray-100'}>
            {statusLabels[invoice.status] || invoice.status}
          </Badge>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Fatura Tipi</p>
          <Badge className={
            invoice.invoiceType === 'SALES' 
              ? 'bg-blue-100 text-blue-800'
              : invoice.invoiceType === 'PURCHASE'
              ? 'bg-purple-100 text-purple-800'
              : invoice.invoiceType === 'SERVICE_SALES'
              ? 'bg-green-100 text-green-800'
              : invoice.invoiceType === 'SERVICE_PURCHASE'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-gray-100 text-gray-800'
          }>
            {invoice.invoiceType === 'SALES' 
              ? 'Satış Faturası'
              : invoice.invoiceType === 'PURCHASE'
              ? 'Alış Faturası'
              : invoice.invoiceType === 'SERVICE_SALES'
              ? 'Hizmet Satış Faturası'
              : invoice.invoiceType === 'SERVICE_PURCHASE'
              ? 'Hizmet Alım Faturası'
              : 'Bilinmeyen'}
          </Badge>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Toplam</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(invoice.totalAmount || invoice.total || 0)}
          </p>
          {/* KDV ve İndirim Detayları */}
          {(() => {
            const taxRate = invoice.taxRate || 18 // Varsayılan KDV oranı
            const totalAmount = invoice.totalAmount || invoice.total || 0
            
            // Hizmet faturaları için: totalAmount'dan KDV hariç tutarı hesapla
            if (invoice.invoiceType === 'SERVICE_SALES' || invoice.invoiceType === 'SERVICE_PURCHASE') {
              const subtotal = totalAmount / (1 + (taxRate / 100))
              const taxAmount = totalAmount - subtotal
              
              return (
                <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam (KDV Hariç):</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>KDV (%{taxRate}):</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold pt-2 border-t">
                    <span>Genel Toplam (KDV Dahil):</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              )
            }
            
            // Ürünlü faturalar için: InvoiceItem'lardan hesapla
            const itemsTotal = invoice.InvoiceItem?.reduce((sum: number, item: any) => 
              sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0) || 0
            const discount = invoice.discount || 0
            const subtotal = itemsTotal - discount
            const taxAmount = (subtotal * taxRate) / 100
            const totalWithTax = subtotal + taxAmount
            
            return (
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam (KDV Hariç):</span>
                  <span className="font-medium">{formatCurrency(itemsTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>İndirim:</span>
                    <span className="font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>KDV (%{taxRate}):</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold pt-2 border-t">
                  <span>Genel Toplam (KDV Dahil):</span>
                  <span>{formatCurrency(totalWithTax)}</span>
                </div>
              </div>
            )
          })()}
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Teklif</p>
          <p className="text-lg font-semibold text-gray-900">
            {invoice.Quote?.title || '-'}
          </p>
        </div>
      </div>

      {/* OVERDUE Uyarısı ve Öneriler */}
      {invoice.status === 'OVERDUE' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            ⚠️ Bu Fatura Vadesi Geçti
          </AlertTitle>
          <AlertDescription className="text-red-800 mt-2">
            <p className="mb-3">
              Bu fatura vadesi geçti! Müşteri ile acilen iletişime geçip ödeme talep etmeniz gerekiyor.
              {invoice.dueDate && (
                <span className="block mt-1 text-sm">
                  Vade Tarihi: <strong>{new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</strong>
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  const customer = invoice.Customer || invoice.Quote?.Deal?.Customer
                  if (customer?.phone) {
                    window.open(`tel:${customer.phone}`, '_blank')
                  } else if (customer?.email) {
                    window.open(`mailto:${customer.email}?subject=Ödeme Hatırlatması: ${invoice.title}`, '_blank')
                  } else {
                    alert('Müşteri iletişim bilgisi bulunamadı')
                  }
                }}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Phone className="h-4 w-4 mr-2" />
                Müşteriyi Ara
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const customer = invoice.Customer || invoice.Quote?.Deal?.Customer
                  if (customer?.email) {
                    window.open(`mailto:${customer.email}?subject=Ödeme Hatırlatması: ${invoice.title}&body=Sayın ${customer.name},%0D%0A%0D%0A${invoice.title} faturası vadesi geçmiştir. Lütfen ödemeyi gerçekleştiriniz.`, '_blank')
                  } else {
                    alert('Müşteri e-posta adresi bulunamadı')
                  }
                }}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Mail className="h-4 w-4 mr-2" />
                E-posta Gönder
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Stepper */}
      <WorkflowStepper
        steps={getInvoiceWorkflowSteps(invoice.status, invoice.invoiceType)}
        currentStep={['DRAFT', 'SENT', 'PAID'].indexOf(invoice.status)}
        title="Fatura İş Akışı"
      />

      {/* Status Info Note */}
      <StatusInfoNote
        entityType="invoice"
        status={invoice.status}
        relatedRecords={[
          ...(invoice.quoteId ? [{
            type: 'quote',
            count: 1,
            message: 'Bu fatura tekliften otomatik oluşturuldu'
          }] : []),
          ...(invoice.Customer ? [{
            type: 'customer',
            count: 1,
            message: `Müşteri: ${invoice.Customer.name}`
          }] : []),
        ]}
      />

      {/* Next Step Buttons */}
      <NextStepButtons
        entityType="invoice"
        currentStatus={invoice.status}
        onAction={async (actionId) => {
          // Status değiştirme işlemi
          try {
            const res = await fetch(`/api/invoices/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: actionId }),
            })
            if (!res.ok) {
              const error = await res.json().catch(() => ({}))
              toast.error(
                'Durum değiştirilemedi',
                error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
              )
              return
            }
            const statusMessages: Record<
              string,
              { variant: 'success' | 'warning' | 'info'; title: string; description: string }
            > = {
              SENT: {
                variant: 'success',
                title: 'Fatura gönderildi',
                description: 'Sevkiyat hazırlıkları başlatıldı. Sevkiyat detaylarını kontrol edebilirsiniz.',
              },
              SHIPPED: {
                variant: 'success',
                title: 'Sevkiyat onaylandı',
                description: 'Stoktan düşüm tamamlandı, sevkiyat süreci başladı.',
              },
              RECEIVED: {
                variant: 'success',
                title: 'Mal kabul edildi',
                description: 'Stoğa giriş yapıldı. Ödeme sürecini başlatabilirsiniz.',
              },
              PAID: {
                variant: 'success',
                title: 'Ödeme kaydedildi',
                description: 'Finans kayıtları otomatik olarak güncellendi.',
              },
              OVERDUE: {
                variant: 'info',
                title: 'Fatura vadesi geçti',
                description: 'Müşteriye ödeme hatırlatması göndermeyi unutmayın.',
              },
              CANCELLED: {
                variant: 'warning',
                title: 'Fatura iptal edildi',
                description: 'İlgili sevkiyat ve stok işlemleri geri alındı.',
              },
            }

            const feedback = statusMessages[actionId]
            if (feedback) {
              if (feedback.variant === 'success') {
                toast.success(feedback.title, feedback.description)
              } else if (feedback.variant === 'warning') {
                toast.warning(feedback.title, feedback.description)
              } else if (typeof toast.info === 'function') {
                toast.info(feedback.title, feedback.description)
              } else {
                toast.success(feedback.title, feedback.description)
              }
            } else {
              toast.success('Durum değiştirildi')
            }
            refetch()
          } catch (error: any) {
            toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'shipment') {
            window.location.href = `/${locale}/shipments/new?invoiceId=${id}`
          }
        }}
      />

      {/* Related Records Suggestions */}
      <RelatedRecordsSuggestions
        entityType="invoice"
        entityId={id}
        relatedRecords={[
          ...(invoice.Quote ? [{
            id: invoice.Quote.id,
            type: 'quote',
            title: invoice.Quote.title,
            link: `/${locale}/quotes/${invoice.Quote.id}`,
          }] : []),
          ...(invoice.Customer ? [{
            id: invoice.Customer.id,
            type: 'customer',
            title: invoice.Customer.name,
            link: `/${locale}/customers/${invoice.Customer.id}`,
          }] : []),
          ...(invoice.Shipment ? [{
            id: invoice.Shipment.id,
            type: 'shipment',
            title: invoice.Shipment.tracking || 'Sevkiyat',
            link: `/${locale}/shipments/${invoice.Shipment.id}`,
          }] : []),
        ]}
        missingRecords={[
          ...(invoice.status === 'SENT' && !invoice.Shipment ? [{
            type: 'shipment',
            label: 'Sevkiyat Oluştur',
            icon: <Package className="h-4 w-4" />,
            onCreate: () => window.location.href = `/${locale}/shipments/new?invoiceId=${id}`,
            description: 'Fiziksel ürünler için sevkiyat oluşturun',
          }] : []),
        ]}
      />

      {/* YENİ: İlgili Sevkiyat Bilgisi */}
      {invoice.shipmentId && invoice.Shipment && (
        <Card className="p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600 mb-1">İlgili Sevkiyat</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/${locale}/shipments/${invoice.shipmentId}`}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    {invoice.Shipment.tracking 
                      ? `Sevkiyat #${invoice.Shipment.tracking}` 
                      : `Sevkiyat #${invoice.shipmentId.substring(0, 8)}`}
                  </Link>
                  <Badge variant="outline" className={
                    invoice.Shipment.status === 'APPROVED' || invoice.Shipment.status === 'DELIVERED'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : invoice.Shipment.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800 border-gray-300'
                      : invoice.Shipment.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : invoice.Shipment.status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : invoice.Shipment.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }>
                    {invoice.Shipment.status === 'APPROVED' 
                      ? 'Onaylı'
                      : invoice.Shipment.status === 'DELIVERED'
                      ? 'Teslim Edildi'
                      : invoice.Shipment.status === 'DRAFT'
                      ? 'Taslak'
                      : invoice.Shipment.status === 'PENDING'
                      ? 'Beklemede'
                      : invoice.Shipment.status === 'IN_TRANSIT'
                      ? 'Yolda'
                      : invoice.Shipment.status === 'CANCELLED'
                      ? 'İptal'
                      : invoice.Shipment.status}
                  </Badge>
                  {invoice.Shipment.status === 'APPROVED' && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Stok düşürüldü
                    </span>
                  )}
                  {invoice.Shipment.status === 'DRAFT' && (
                    <span className="text-xs text-amber-600 font-medium">
                      ⚠ Onaylandığında stok düşecek
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/${locale}/shipments/${invoice.shipmentId}`}>
              <Button variant="outline" size="sm">
                <Truck className="mr-2 h-4 w-4" />
                Sevkiyat Detayı
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Invoice Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Fatura Kalemleri
            {invoice.InvoiceItem && invoice.InvoiceItem.length > 0 && (
              <Badge variant="outline">({invoice.InvoiceItem.length})</Badge>
            )}
          </h2>
          <Button
            onClick={() => setItemFormOpen(true)}
            className="bg-gradient-primary text-white"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ürün Ekle
          </Button>
        </div>
        {invoice.InvoiceItem && invoice.InvoiceItem.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.InvoiceItem.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.Product?.name || 'Ürün bulunamadı'}
                        </div>
                        {item.Product?.sku && (
                          <div className="text-xs text-gray-500">SKU: {item.Product.sku}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total || 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Toplam Özeti */}
            {(() => {
              const taxRate = invoice.taxRate || 18
              const itemsTotal = invoice.InvoiceItem.reduce((sum: number, item: any) => 
                sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0)
              const discount = invoice.discount || 0
              const subtotal = itemsTotal - discount
              const taxAmount = (subtotal * taxRate) / 100
              const totalWithTax = subtotal + taxAmount
              
              return (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="w-full max-w-md space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Ara Toplam (KDV Hariç):</span>
                        <span className="font-medium">{formatCurrency(itemsTotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>İndirim:</span>
                          <span className="font-medium">-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>KDV (%{taxRate}):</span>
                        <span className="font-medium">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                        <span>Genel Toplam (KDV Dahil):</span>
                        <span>{formatCurrency(totalWithTax)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Henüz ürün eklenmemiş</p>
            <Button
              onClick={() => setItemFormOpen(true)}
              variant="outline"
              className="mt-4"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              İlk Ürünü Ekle
            </Button>
          </div>
        )}
      </Card>

      {/* Hizmet Açıklaması - Hizmet Faturaları için */}
      {(invoice.invoiceType === 'SERVICE_SALES' || invoice.invoiceType === 'SERVICE_PURCHASE') && invoice.serviceDescription && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hizmet Açıklaması</h2>
          <p className="text-gray-900 whitespace-pre-wrap">{invoice.serviceDescription}</p>
        </Card>
      )}

      {/* Invoice Details */}
      {(invoice.invoiceNumber || invoice.dueDate || invoice.paymentDate || invoice.taxRate || invoice.description) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Fatura Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoice.invoiceNumber && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Fatura Numarası</p>
                <p className="font-medium">{invoice.invoiceNumber}</p>
              </div>
            )}
            {invoice.dueDate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Vade Tarihi</p>
                <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('tr-TR')}</p>
              </div>
            )}
            {invoice.paymentDate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Ödeme Tarihi</p>
                <p className="font-medium text-green-600">{new Date(invoice.paymentDate).toLocaleDateString('tr-TR')}</p>
              </div>
            )}
            {invoice.taxRate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">KDV Oranı</p>
                <p className="font-medium">{invoice.taxRate}%</p>
              </div>
            )}
            {invoice.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                <p className="text-gray-900 whitespace-pre-wrap">{invoice.description}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Fatura ID</span>
            <span className="font-mono text-sm">{invoice.id}</span>
          </div>
          {invoice.Quote && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">İlgili Teklif</span>
              <Link href={`/${locale}/quotes/${invoice.Quote.id}`} className="text-primary-600 hover:underline">
                {invoice.Quote.title}
              </Link>
            </div>
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Oluşturulma Tarihi</span>
            <span>{new Date(invoice.createdAt).toLocaleString('tr-TR')}</span>
          </div>
          {invoice.updatedAt && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Güncellenme Tarihi</span>
              <span>{new Date(invoice.updatedAt).toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* İlişkili Veriler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        {(invoice.Customer || invoice.Quote?.Deal?.Customer) && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Müşteri
              </h2>
            </div>
            {invoice.Customer ? (
              <Link
                href={`/${locale}/customers/${invoice.Customer.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{invoice.Customer.name}</p>
                {invoice.Customer.email && (
                  <p className="text-sm text-gray-600 mt-1">{invoice.Customer.email}</p>
                )}
              </Link>
            ) : invoice.Quote?.Deal?.Customer ? (
              <Link
                href={`/${locale}/customers/${invoice.Quote.Deal.Customer.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{invoice.Quote.Deal.Customer.name}</p>
                {invoice.Quote.Deal.Customer.email && (
                  <p className="text-sm text-gray-600 mt-1">{invoice.Quote.Deal.Customer.email}</p>
                )}
              </Link>
            ) : (
              <p className="text-gray-500 text-center py-4">Müşteri bilgisi yok</p>
            )}
          </Card>
        )}

        {/* Quote İlişkisi */}
        {invoice.Quote && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <QuoteIcon className="h-5 w-5" />
                İlgili Teklif
              </h2>
            </div>
            {invoice.Quote.id ? (
              <Link
                href={`/${locale}/quotes/${invoice.Quote.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{invoice.Quote.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[invoice.Quote.status] || 'bg-gray-100'}>
                    {statusLabels[invoice.Quote.status] || invoice.Quote.status}
                  </Badge>
                </div>
              </Link>
            ) : (
              <p className="text-gray-500 text-center py-4">İlgili teklif yok</p>
            )}
          </Card>
        )}

        {/* Shipments */}
        {invoice.Shipment && invoice.Shipment.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Sevkiyatlar ({invoice.Shipment.length})
              </h2>
            </div>
            <div className="space-y-3">
              {invoice.Shipment.map((shipment: any) => (
                <Link
                  key={shipment.id}
                  href={`/${locale}/shipments/${shipment.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">
                    Sevkiyat #{shipment.tracking || shipment.id.substring(0, 8)}
                  </p>
                  <Badge variant="outline" className={`mt-1 ${
                    shipment.status === 'APPROVED' || shipment.status === 'DELIVERED'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : shipment.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800 border-gray-300'
                      : shipment.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : shipment.status === 'IN_TRANSIT'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : shipment.status === 'CANCELLED'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}>
                    {shipment.status === 'APPROVED' 
                      ? 'Onaylı'
                      : shipment.status === 'DELIVERED'
                      ? 'Teslim Edildi'
                      : shipment.status === 'DRAFT'
                      ? 'Taslak'
                      : shipment.status === 'PENDING'
                      ? 'Beklemede'
                      : shipment.status === 'IN_TRANSIT'
                      ? 'Yolda'
                      : shipment.status === 'CANCELLED'
                      ? 'İptal'
                      : shipment.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Timeline */}
      {invoice.activities && invoice.activities.length > 0 && (
        <ActivityTimeline activities={invoice.activities} />
      )}

      {/* Form Modal */}
      <InvoiceForm
        invoice={invoice}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await refetch()
        }}
      />

      {/* InvoiceItem Form Modal */}
      <InvoiceItemForm
        invoiceId={id}
        open={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSuccess={async () => {
          setItemFormOpen(false)
          await refetch()
        }}
      />
    </div>
  )
}

