'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, FileText, Phone, Mail, AlertTriangle, Package, Truck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getInvoiceWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const InvoiceForm = dynamic(() => import('./InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

const InvoiceItemForm = dynamic(() => import('./InvoiceItemForm'), {
  ssr: false,
  loading: () => null,
})

interface InvoiceDetailModalProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-600 text-white border-gray-700',
  SENT: 'bg-blue-600 text-white border-blue-700',
  SHIPPED: 'bg-green-600 text-white border-green-700',
  RECEIVED: 'bg-teal-600 text-white border-teal-700',
  PAID: 'bg-emerald-600 text-white border-emerald-700',
  OVERDUE: 'bg-red-600 text-white border-red-700',
  CANCELLED: 'bg-yellow-600 text-white border-yellow-700',
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

export default function InvoiceDetailModal({
  invoiceId,
  open,
  onClose,
  initialData,
}: InvoiceDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: invoice, isLoading, error, mutate: mutateInvoice } = useData<any>(
    invoiceId && open ? `/api/invoices/${invoiceId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayInvoice = invoice || initialData

  const handleDelete = async () => {
    if (!displayInvoice || !confirm(`${displayInvoice.title} faturasını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Fatura silindi')
      
      await mutate('/api/invoices')
      await mutate(`/api/invoices/${invoiceId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !invoiceId) return null

  if (isLoading && !initialData && !displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fatura Detayları" size="xl">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fatura yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fatura Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fatura bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const isFromQuote = !!displayInvoice?.quoteId
  const isShipped = displayInvoice?.status === 'SHIPPED'
  const isReceived = displayInvoice?.status === 'RECEIVED'

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayInvoice?.title || 'Fatura Detayları'}
        description={`${displayInvoice?.invoiceNumber || ''} • ${displayInvoice?.createdAt ? new Date(displayInvoice.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Badge className={statusColors[displayInvoice?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayInvoice?.status] || displayInvoice?.status}
            </Badge>
            {!isFromQuote && !isShipped && !isReceived && (
              <Button variant="outline" onClick={() => setFormOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
            )}
            <Button
              className="bg-gradient-primary text-white"
              onClick={() => {
                window.open(`/api/pdf/invoice/${invoiceId}`, '_blank')
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
            {!isFromQuote && !isShipped && !isReceived && displayInvoice?.status !== 'PAID' && (
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
          </div>

          {/* Uyarı Mesajları */}
          {isShipped && (
            <Alert className="border-green-200 bg-green-50">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 font-semibold">
                ✓ Sevkiyatı yapıldı
              </AlertTitle>
              <AlertDescription className="text-green-800">
                Stoktan düşüldü, onaylandı. Bu fatura değiştirilemez.
              </AlertDescription>
            </Alert>
          )}
          {isReceived && (
            <Alert className="border-teal-200 bg-teal-50">
              <AlertTriangle className="h-4 w-4 text-teal-600" />
              <AlertTitle className="text-teal-900 font-semibold">
                ✓ Mal kabul edildi
              </AlertTitle>
              <AlertDescription className="text-teal-800">
                Stoğa girişi yapıldı, onaylandı. Bu fatura değiştirilemez.
              </AlertDescription>
            </Alert>
          )}
          {isFromQuote && (
            <Alert className="border-indigo-200 bg-indigo-50">
              <AlertTriangle className="h-4 w-4 text-indigo-600" />
              <AlertTitle className="text-indigo-900 font-semibold">
                ℹ️ Bu fatura tekliften oluşturuldu
              </AlertTitle>
              <AlertDescription className="text-indigo-800">
                Değiştirilemez.
              </AlertDescription>
            </Alert>
          )}

          {/* OVERDUE Uyarısı */}
          {displayInvoice?.status === 'OVERDUE' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                ⚠️ Bu Fatura Vadesi Geçti
              </AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                <p className="mb-3">
                  Bu fatura vadesi geçti! Müşteri ile acilen iletişime geçip ödeme talep etmeniz gerekiyor.
                  {displayInvoice?.dueDate && (
                    <span className="block mt-1 text-sm">
                      Vade Tarihi: <strong>{new Date(displayInvoice.dueDate).toLocaleDateString('tr-TR')}</strong>
                    </span>
                  )}
                </p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(displayInvoice?.Customer || displayInvoice?.Quote?.Deal?.Customer)?.phone && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const customer = displayInvoice.Customer || displayInvoice.Quote?.Deal?.Customer
                        if (customer?.phone) {
                          window.open(`tel:${customer.phone}`, '_blank')
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Müşteriyi Ara
                    </Button>
                  )}
                  {(displayInvoice?.Customer || displayInvoice?.Quote?.Deal?.Customer)?.email && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const customer = displayInvoice.Customer || displayInvoice.Quote?.Deal?.Customer
                        if (customer?.email) {
                          window.open(`mailto:${customer.email}?subject=Ödeme Hatırlatması: ${displayInvoice.title}`, '_blank')
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      E-posta Gönder
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Stepper */}
          <WorkflowStepper
            steps={getInvoiceWorkflowSteps(displayInvoice?.status, displayInvoice?.invoiceType)}
            currentStep={['DRAFT', 'SENT', 'PAID'].indexOf(displayInvoice?.status)}
            title="Fatura İş Akışı"
          />

          {/* Status Info Note */}
          <StatusInfoNote
            entityType="invoice"
            status={displayInvoice?.status}
            relatedRecords={[
              ...(isFromQuote ? [{
                type: 'quote',
                count: 1,
                message: 'Bu fatura tekliften otomatik oluşturuldu'
              }] : []),
              ...(displayInvoice?.Customer ? [{
                type: 'customer',
                count: 1,
                message: `Müşteri: ${displayInvoice.Customer.name}`
              }] : []),
            ]}
          />

          {/* Next Step Buttons */}
          <NextStepButtons
            entityType="invoice"
            currentStatus={displayInvoice?.status}
            onAction={async (actionId) => {
              try {
                const res = await fetch(`/api/invoices/${invoiceId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: actionId }),
                })
                if (!res.ok) {
                  const error = await res.json().catch(() => ({}))
                  toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
                  return
                }
                toast.success('Durum değiştirildi')
                await mutateInvoice()
              } catch (error: any) {
                toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
              }
            }}
            onCreateRelated={(type) => {
              onClose()
              if (type === 'shipment') {
                router.push(`/${locale}/shipments/new?invoiceId=${invoiceId}`)
              }
            }}
          />

          {/* Related Records Suggestions */}
          <RelatedRecordsSuggestions
            entityType="invoice"
            entityId={invoiceId || ''}
            relatedRecords={[
              ...(displayInvoice?.Quote ? [{
                id: displayInvoice.Quote.id,
                type: 'quote',
                title: displayInvoice.Quote.title,
                link: `/${locale}/quotes/${displayInvoice.Quote.id}`,
              }] : []),
              ...(displayInvoice?.Customer ? [{
                id: displayInvoice.Customer.id,
                type: 'customer',
                title: displayInvoice.Customer.name,
                link: `/${locale}/customers/${displayInvoice.Customer.id}`,
              }] : []),
              ...(displayInvoice?.Shipment || []).map((s: any) => ({
                id: s.id,
                type: 'shipment',
                title: s.trackingNumber || 'Sevkiyat',
                link: `/${locale}/shipments/${s.id}`,
              })),
            ]}
            missingRecords={[
              ...(displayInvoice?.status === 'SENT' && (!displayInvoice?.Shipment || displayInvoice.Shipment.length === 0) ? [{
                type: 'shipment',
                label: 'Sevkiyat Oluştur',
                icon: <Truck className="h-4 w-4" />,
                onCreate: () => {
                  onClose()
                  router.push(`/${locale}/shipments/new?invoiceId=${invoiceId}`)
                },
                description: 'Bu fatura için sevkiyat kaydı oluşturun',
              }] : []),
            ]}
          />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Durum</p>
              <Badge className={statusColors[displayInvoice?.status] || 'bg-gray-600 text-white border-gray-700'}>
                {statusLabels[displayInvoice?.status] || displayInvoice?.status}
              </Badge>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Fatura Tipi</p>
              <Badge className={
                displayInvoice?.invoiceType === 'SALES' 
                  ? 'bg-blue-600 text-white border-blue-700'
                  : displayInvoice?.invoiceType === 'PURCHASE'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : displayInvoice?.invoiceType === 'SERVICE_SALES'
                  ? 'bg-green-600 text-white border-green-700'
                  : displayInvoice?.invoiceType === 'SERVICE_PURCHASE'
                  ? 'bg-orange-600 text-white border-orange-700'
                  : 'bg-gray-600 text-white border-gray-700'
              }>
                {displayInvoice?.invoiceType === 'SALES' 
                  ? 'Satış Faturası'
                  : displayInvoice?.invoiceType === 'PURCHASE'
                  ? 'Alış Faturası'
                  : displayInvoice?.invoiceType === 'SERVICE_SALES'
                  ? 'Hizmet Satış Faturası'
                  : displayInvoice?.invoiceType === 'SERVICE_PURCHASE'
                  ? 'Hizmet Alım Faturası'
                  : 'Bilinmeyen'}
              </Badge>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Toplam</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(displayInvoice?.totalAmount || displayInvoice?.total || 0)}
              </p>
            </Card>
          </div>

          {/* Invoice Items */}
          {displayInvoice?.InvoiceItem && displayInvoice.InvoiceItem.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Fatura Kalemleri</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayInvoice.InvoiceItem.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.Product?.name || item.description || '-'}</TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Activity Timeline */}
          <ActivityTimeline entityType="Invoice" entityId={invoiceId} />
        </div>
      </DetailModal>

      {/* Form Modal */}
      <InvoiceForm
        invoice={displayInvoice || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateInvoice()
          await mutate(`/api/invoices/${invoiceId}`)
        }}
      />

      {/* Item Form Modal */}
      <InvoiceItemForm
        invoiceId={invoiceId || ''}
        open={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSuccess={async () => {
          setItemFormOpen(false)
          await mutateInvoice()
          await mutate(`/api/invoices/${invoiceId}`)
        }}
      />
    </>
  )
}

