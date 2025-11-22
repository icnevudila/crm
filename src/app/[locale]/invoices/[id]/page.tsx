'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { useData } from '@/hooks/useData'
import { ArrowLeft, Edit, FileText, FileText as QuoteIcon, Truck, Trash2, Users, Plus, Package, AlertTriangle, Phone, Mail, Zap, Receipt, DollarSign, Calendar, Briefcase, RotateCcw, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast, toastError, toastWarning } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { mutate } from 'swr'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import dynamic from 'next/dynamic'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getInvoiceWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import DocumentList from '@/components/documents/DocumentList'
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

// Lazy load ShipmentForm - performans için
const ShipmentForm = dynamic(() => import('@/components/shipments/ShipmentForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load ReturnOrderForm - performans için
const ReturnOrderForm = dynamic(() => import('@/components/return-orders/ReturnOrderForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load PaymentPlanForm - performans için
const PaymentPlanForm = dynamic(() => import('@/components/payment-plans/PaymentPlanForm'), {
  ssr: false,
  loading: () => null,
})

// Status colors - merkezi renk sistemi kullanılıyor (getStatusBadgeClass)

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
  const { confirm } = useConfirm()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [shipmentFormOpen, setShipmentFormOpen] = useState(false)
  const [returnOrderFormOpen, setReturnOrderFormOpen] = useState(false)
  const [paymentPlanFormOpen, setPaymentPlanFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: invoice, isLoading, error, mutate: mutateInvoice } = useData<any>(
    id ? `/api/invoices/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  // Payment Plans - Invoice'a bağlı taksit planları
  const { data: paymentPlans = [] } = useData<any[]>(
    id ? `/api/payment-plans?invoiceId=${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  // Return Orders - Invoice'a bağlı iade siparişleri
  const { data: returnOrders = [] } = useData<any[]>(
    id ? `/api/return-orders?invoiceId=${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  // Credit Notes - Invoice'a bağlı alacak dekontları
  const { data: creditNotes = [] } = useData<any[]>(
    id ? `/api/credit-notes?invoiceId=${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
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

  // Invoice status'leri için available statuses
  const availableStatuses = [
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'SENT', label: 'Gönderildi' },
    { value: 'SHIPPED', label: 'Sevkiyatı Yapıldı' },
    { value: 'RECEIVED', label: 'Mal Kabul Edildi' },
    { value: 'PAID', label: 'Ödendi' },
    { value: 'OVERDUE', label: 'Vadesi Geçmiş' },
    { value: 'CANCELLED', label: 'İptal' },
  ]

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="invoice"
        entityId={id}
        currentStatus={invoice.status}
        availableStatuses={availableStatuses}
        onStatusChange={async (newStatus) => {
          const res = await fetch(`/api/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || 'Durum değiştirilemedi')
          }
          const updatedInvoice = await res.json()
          await mutateInvoice(updatedInvoice, { revalidate: false })
          await Promise.all([
            mutate('/api/invoices', undefined, { revalidate: true }),
            mutate('/api/invoices?', undefined, { revalidate: true }),
          ])
        }}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
          const confirmed = await confirm({
            title: 'Faturayı Sil?',
            description: `${invoice.title} faturasını silmek istediğinize emin misiniz?`,
            confirmLabel: 'Sil',
            cancelLabel: 'İptal',
            variant: 'destructive',
          })
          if (!confirmed) {
            return
          }
          setDeleteLoading(true)
          try {
            const res = await fetch(`/api/invoices/${id}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Silme işlemi başarısız')
            }
            router.push(`/${locale}/invoices`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message || 'Fatura silinirken bir hata oluştu')
            throw error
          } finally {
            setDeleteLoading(false)
          }
        }}
        onDuplicate={async () => {
          try {
            const res = await fetch(`/api/invoices/${id}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedInvoice = await res.json()
            toast.success('Fatura kopyalandı', { description: 'Fatura başarıyla kopyalandı' })
            router.push(`/${locale}/invoices/${duplicatedInvoice.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message || 'Fatura kopyalanırken bir hata oluştu')
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'shipment') {
            setShipmentFormOpen(true)
            toast.info('Yeni Sevkiyat', { description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası için yeni sevkiyat oluşturuluyor...` })
          }
        }}
        onSendEmail={invoice.Customer?.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={invoice.Customer?.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={invoice.Customer?.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
        onAddToCalendar={() => {
          // Takvime ekleme işlemi AddToCalendarButton ile yapılıyor
        }}
        onDownloadPDF={() => {
          window.open(`/api/pdf/invoice/${id}`, '_blank')
        }}
        canEdit={!invoice.quoteId && invoice.status !== 'SHIPPED' && invoice.status !== 'RECEIVED'}
        canDelete={!invoice.quoteId && invoice.status !== 'SHIPPED' && invoice.status !== 'RECEIVED'}
      />

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(16, 185, 129) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/invoices`)}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg ring-4 ring-emerald-100/50"
            >
              <Receipt className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                {invoice.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusBadgeClass(invoice.status)}>
                  {statusLabels[invoice.status] || invoice.status}
                </Badge>
                {invoice.invoiceNumber && (
                  <p className="text-gray-600 font-medium">
                    {invoice.invoiceNumber}
                  </p>
                )}
                {invoice.totalAmount && (
                  <p className="text-gray-600 font-semibold">
                    {formatCurrency(invoice.totalAmount || invoice.total || 0)}
                  </p>
                )}
                {invoice.dueDate && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Premium Tasarım */}
      {invoice.Customer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-emerald-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Hızlı İşlemler
              </h2>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {invoice.Customer.email && (
              <SendEmailButton
                to={invoice.Customer.email}
                subject={`Fatura: ${invoice.title}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Fatura Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Fatura:</strong> ${invoice.title}</p>
                      ${invoice.invoiceNumber ? `<p><strong>Fatura No:</strong> ${invoice.invoiceNumber}</p>` : ''}
                      <p><strong>Durum:</strong> ${statusLabels[invoice.status] || invoice.status}</p>
                      ${invoice.total ? `<p><strong>Toplam:</strong> ${formatCurrency(invoice.total)}</p>` : ''}
                      ${invoice.Quote?.title ? `<p><strong>İlgili Teklif:</strong> ${invoice.Quote.title}</p>` : ''}
                      ${invoice.notes ? `<p><strong>Notlar:</strong><br>${invoice.notes.replace(/\n/g, '<br>')}</p>` : ''}
                    </div>
                  </div>
                `}
                category="INVOICE"
                entityData={invoice}
              />
            )}
            {invoice.Customer.phone && (
              <>
                <SendSmsButton
                  to={invoice.Customer.phone.startsWith('+') 
                    ? invoice.Customer.phone 
                    : `+${invoice.Customer.phone.replace(/\D/g, '')}`}
                  message={`Merhaba, ${invoice.title} faturası hazır. Detaylar için lütfen iletişime geçin.`}
                />
                <SendWhatsAppButton
                  phoneNumber={invoice.Customer.phone.startsWith('+') 
                    ? invoice.Customer.phone 
                    : `+${invoice.Customer.phone.replace(/\D/g, '')}`}
                  entityType="Invoice"
                  entityId={invoice.id}
                  customerName={invoice.Customer.name}
                />
              </>
            )}
            <AddToCalendarButton
              recordType="invoice"
              record={invoice}
              startTime={invoice.createdAt}
              endTime={invoice.createdAt}
              location={invoice.Customer?.address}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(`/api/pdf/invoice/${id}`, '_blank')
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
            {invoice.quoteId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(`/${locale}/quotes/${invoice.quoteId}`, '_blank')
                }}
              >
                <QuoteIcon className="mr-2 h-4 w-4" />
                Teklifi Görüntüle
              </Button>
            )}
            {/* İade Oluştur - Sadece satış faturaları için */}
            {invoice.invoiceType === 'SALES' && invoice.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => {
                  setReturnOrderFormOpen(true)
                  toast.info('Yeni İade', { description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası için iade siparişi oluşturuluyor...` })
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                İade Oluştur
              </Button>
            )}
            {/* Taksit Planı Oluştur */}
            {invoice.status !== 'CANCELLED' && invoice.status !== 'PAID' && (
              <Button
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  setPaymentPlanFormOpen(true)
                  toast.info('Yeni Ödeme Planı', { description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası için ödeme planı oluşturuluyor...` })
                }}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Taksit Planı Oluştur
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
      )}

      {/* Return Order Form Modal */}
      {returnOrderFormOpen && (
        <ReturnOrderForm
          open={returnOrderFormOpen}
          onClose={() => setReturnOrderFormOpen(false)}
          invoiceId={id}
          onSuccess={async (savedReturnOrder) => {
            toast.success('İade Siparişi Oluşturuldu', {
              description: `"${savedReturnOrder.returnNumber || savedReturnOrder.id?.substring(0, 8) || 'İade Siparişi'}" başarıyla oluşturuldu. Fatura: ${invoice.title || invoice.invoiceNumber || 'Fatura'}`,
              action: {
                label: 'Görüntüle',
                onClick: () => router.push(`/${locale}/return-orders/${savedReturnOrder.id}`)
              }
            })
            setReturnOrderFormOpen(false)
            // Return orders listesini güncelle
            await mutate(`/api/return-orders?invoiceId=${id}`)
            // Invoice detail'i yenile
            await mutateInvoice()
          }}
        />
      )}

      {/* Payment Plan Form Modal */}
      {paymentPlanFormOpen && (
        <PaymentPlanForm
          open={paymentPlanFormOpen}
          onClose={() => setPaymentPlanFormOpen(false)}
          invoiceId={id}
          onSuccess={async (savedPlan) => {
            toast.success('Ödeme Planı Oluşturuldu', {
              description: `"${savedPlan.name || savedPlan.id?.substring(0, 8) || 'Ödeme Planı'}" başarıyla oluşturuldu. Fatura: ${invoice.title || invoice.invoiceNumber || 'Fatura'}`,
              action: {
                label: 'Görüntüle',
                onClick: () => router.push(`/${locale}/payment-plans/${savedPlan.id}`)
              }
            })
            setPaymentPlanFormOpen(false)
            // Payment plans listesini güncelle
            await mutate(`/api/payment-plans?invoiceId=${id}`)
            // Invoice detail'i yenile
            await mutateInvoice()
          }}
        />
      )}

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

      {/* Genel Bilgiler */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Genel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Kayıt No</p>
            <p className="font-medium text-gray-900">
              {invoice.invoiceNumber || invoice.id.substring(0, 8)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
            <p className="font-medium text-gray-900">
              {new Date(invoice.createdAt).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          {invoice.updatedAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Son Güncelleme</p>
              <p className="font-medium text-gray-900">
                {new Date(invoice.updatedAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}
          <div>
          <p className="text-sm text-gray-600 mb-1">Durum</p>
          <Badge className={getStatusBadgeClass(invoice.status)}>
            {statusLabels[invoice.status] || invoice.status}
          </Badge>
        </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">İşlem Tipi</p>
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
                ? 'Satış'
              : invoice.invoiceType === 'PURCHASE'
                ? 'Alış'
              : invoice.invoiceType === 'SERVICE_SALES'
                ? 'Hizmet Satış'
              : invoice.invoiceType === 'SERVICE_PURCHASE'
                ? 'Hizmet Alım'
              : 'Bilinmeyen'}
          </Badge>
        </div>
          {invoice.dueDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Vade Tarihi</p>
              <p className="font-medium text-gray-900">
                {new Date(invoice.dueDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          {invoice.paymentDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Ödeme Tarihi</p>
              <p className="font-medium text-green-600">
                {new Date(invoice.paymentDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Müşteri Bilgileri */}
      {(invoice.Customer || invoice.Quote?.Deal?.Customer) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Müşteri Bilgileri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const customer = invoice.Customer || invoice.Quote?.Deal?.Customer
              const customerCompany = customer?.CustomerCompany
              return (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Müşteri Adı</p>
                    <p className="font-medium text-gray-900">
                      {customerCompany?.name || customer?.name || '-'}
                    </p>
                  </div>
                  {customer?.email && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">E-posta</p>
                      <a 
                        href={`mailto:${customer.email}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer?.phone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Telefon</p>
                      <a 
                        href={`tel:${customer.phone}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {customer.phone}
                      </a>
                    </div>
                  )}
                  {(customerCompany?.address || customer?.address) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Adres</p>
                      <p className="font-medium text-gray-900">
                        {customerCompany?.address || customer?.address}
                      </p>
                    </div>
                  )}
                  {(customerCompany?.city || customer?.city) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Şehir</p>
                      <p className="font-medium text-gray-900">
                        {customerCompany?.city || customer?.city}
                      </p>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Card>
      )}

      {/* Finansal Bilgiler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
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
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Teklif</p>
          <p className="text-lg font-semibold text-gray-900">
            {invoice.Quote?.title || '-'}
          </p>
        </Card>
        {/* Ödeme Bilgileri */}
        {invoice.paidAmount !== undefined && invoice.paidAmount !== null && (
          <>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Ödenen Tutar</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(invoice.paidAmount || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Kalan Tutar</p>
              <p className={`text-2xl font-bold ${((invoice.totalAmount || invoice.total || 0) - (invoice.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency((invoice.totalAmount || invoice.total || 0) - (invoice.paidAmount || 0))}
              </p>
              {((invoice.totalAmount || invoice.total || 0) - (invoice.paidAmount || 0)) === 0 && (
                <p className="text-xs text-green-600 mt-1">✓ Tamamı ödendi</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Notes Card */}
      {invoice.notes && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notlar</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
        </Card>
      )}

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
                    toastWarning('Müşteri iletişim bilgisi bulunamadı')
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
                    toastWarning('Müşteri e-posta adresi bulunamadı')
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
                toast.success(feedback.title, { description: feedback.description } as any)
              } else if (feedback.variant === 'warning') {
                toast.warning(feedback.title, { description: feedback.description } as any)
              } else {
                toast.success(feedback.title, { description: feedback.description } as any)
              }
            } else {
              toast.success('Durum değiştirildi', { description: 'Fatura durumu başarıyla güncellendi' })
            }
            
            // Optimistic update - cache'i güncelle (sayfa reload yok)
            await mutateInvoice(undefined, { revalidate: true })
            
            // Tüm ilgili cache'leri güncelle
            await Promise.all([
              mutate('/api/invoices', undefined, { revalidate: true }),
              mutate('/api/invoices?', undefined, { revalidate: true }),
              mutate((key: string) => typeof key === 'string' && key.startsWith('/api/invoices'), undefined, { revalidate: true }),
            ])
          } catch (error: any) {
            toast.error('Durum değiştirilemedi', { description: error.message || 'Bir hata oluştu.' })
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
                          {item.productId && item.Product?.id ? (
                            <Link
                              href={`/${locale}/products/${item.Product.id}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {item.Product.name || 'Ürün bulunamadı'}
                            </Link>
                          ) : (
                            item.Product?.name || 'Ürün bulunamadı'
                          )}
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
                  <Badge className={getStatusBadgeClass(invoice.Quote.status)}>
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

      {/* Document List */}
      <DocumentList relatedTo="Invoice" relatedId={id} />

      {/* Return Orders */}
      {returnOrders && returnOrders.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              İade Siparişleri ({returnOrders.length})
            </h2>
          </div>
          <div className="space-y-4">
            {returnOrders.map((returnOrder: any) => (
              <div
                key={returnOrder.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/${locale}/return-orders/${returnOrder.id}`}
                        className="font-semibold text-orange-600 hover:underline"
                      >
                        {returnOrder.returnNumber}
                      </Link>
                      <Badge variant="outline" className={getStatusBadgeClass(returnOrder.status)}>
                        {returnOrder.status === 'PENDING' ? 'Beklemede' : 
                         returnOrder.status === 'APPROVED' ? 'Onaylandı' : 
                         returnOrder.status === 'REJECTED' ? 'Reddedildi' : 
                         returnOrder.status === 'COMPLETED' ? 'Tamamlandı' : returnOrder.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Toplam Tutar</p>
                        <p className="font-medium">{formatCurrency(returnOrder.totalAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">İade Tarihi</p>
                        <p className="font-medium">
                          {new Date(returnOrder.returnDate).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Oluşturulma</p>
                        <p className="font-medium">
                          {new Date(returnOrder.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/${locale}/return-orders/${returnOrder.id}`}>
                    <Button variant="outline" size="sm">
                      Detaylar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Credit Notes */}
      {creditNotes && creditNotes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Alacak Dekontları ({creditNotes.length})
            </h2>
          </div>
          <div className="space-y-4">
            {creditNotes.map((creditNote: any) => (
              <div
                key={creditNote.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/${locale}/credit-notes/${creditNote.id}`}
                        className="font-semibold text-purple-600 hover:underline"
                      >
                        {creditNote.creditNoteNumber}
                      </Link>
                      <Badge variant="outline" className={getStatusBadgeClass(creditNote.status)}>
                        {creditNote.status === 'DRAFT' ? 'Taslak' : 
                         creditNote.status === 'ISSUED' ? 'Düzenlendi' : 
                         creditNote.status === 'APPLIED' ? 'Uygulandı' : creditNote.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Tutar</p>
                        <p className="font-medium">{formatCurrency(creditNote.amount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Durum</p>
                        <p className="font-medium">
                          {creditNote.status === 'DRAFT' ? 'Taslak' : 
                           creditNote.status === 'ISSUED' ? 'Düzenlendi' : 
                           creditNote.status === 'APPLIED' ? 'Uygulandı' : creditNote.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Oluşturulma</p>
                        <p className="font-medium">
                          {new Date(creditNote.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/${locale}/credit-notes/${creditNote.id}`}>
                    <Button variant="outline" size="sm">
                      Detaylar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment Plans */}
      {paymentPlans && paymentPlans.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Taksit Planları ({paymentPlans.length})
            </h2>
          </div>
          <div className="space-y-4">
            {paymentPlans.map((plan: any) => (
              <div
                key={plan.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        href={`/${locale}/payment-plans/${plan.id}`}
                        className="font-semibold text-indigo-600 hover:underline"
                      >
                        {plan.name}
                      </Link>
                      <Badge variant="outline" className={getStatusBadgeClass(plan.status)}>
                        {plan.status === 'ACTIVE' ? 'Aktif' : plan.status === 'COMPLETED' ? 'Tamamlandı' : plan.status === 'OVERDUE' ? 'Vadesi Geçti' : plan.status === 'CANCELLED' ? 'İptal' : plan.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Toplam Tutar</p>
                        <p className="font-medium">{formatCurrency(plan.totalAmount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Taksit Sayısı</p>
                        <p className="font-medium">{plan.installmentCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sıklık</p>
                        <p className="font-medium">
                          {plan.installmentFrequency === 'WEEKLY' ? 'Haftalık' : 
                           plan.installmentFrequency === 'MONTHLY' ? 'Aylık' : 
                           plan.installmentFrequency === 'QUARTERLY' ? 'Çeyreklik' : 
                           plan.installmentFrequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Oluşturulma</p>
                        <p className="font-medium">
                          {new Date(plan.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link href={`/${locale}/payment-plans/${plan.id}`}>
                    <Button variant="outline" size="sm">
                      Detaylar
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline entityType="Invoice" entityId={id} />
      </Card>

      {/* Form Modal */}
      <InvoiceForm
        invoice={invoice}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedInvoice: any) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş invoice'u cache'e ekle
          await mutateInvoice(savedInvoice, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/invoices', undefined, { revalidate: true }),
            mutate('/api/invoices?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/invoices'), undefined, { revalidate: true }),
          ])
          setFormOpen(false)
        }}
      />

      {/* InvoiceItem Form Modal */}
      <InvoiceItemForm
        invoiceId={id}
        open={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSuccess={async () => {
          setItemFormOpen(false)
          // Cache'i güncelle - optimistic update
          await mutateInvoice(undefined, { revalidate: true })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/invoices', undefined, { revalidate: true }),
            mutate('/api/invoices?', undefined, { revalidate: true }),
            mutate(`/api/invoices/${id}`, undefined, { revalidate: true }),
          ])
        }}
      />

      {/* Shipment Form Modal */}
      <ShipmentForm
        shipment={undefined}
        open={shipmentFormOpen}
        onClose={() => setShipmentFormOpen(false)}
        invoiceId={id}
        onSuccess={async (savedShipment: any) => {
          // Cache'i güncelle - optimistic update
          await mutateInvoice(undefined, { revalidate: true })
          setShipmentFormOpen(false)
          toast.success('Sevkiyat Oluşturuldu', {
            description: `"${savedShipment.tracking || savedShipment.id?.substring(0, 8) || 'Sevkiyat'}" başarıyla oluşturuldu. Fatura: ${invoice.title || invoice.invoiceNumber || 'Fatura'}`,
            action: {
              label: 'Görüntüle',
              onClick: () => router.push(`/${locale}/shipments/${savedShipment.id}`)
            }
          })
          // Başarılı kayıt sonrası sevkiyat detay sayfasına yönlendir
          router.push(`/${locale}/shipments/${savedShipment.id}`)
        }}
      />
    </div>
  )
}

