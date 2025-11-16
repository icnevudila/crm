'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, FileText, Copy, AlertTriangle, RefreshCw, Plus, Info, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast, toastError } from '@/lib/toast'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getQuoteWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import { Calendar } from 'lucide-react'
import QuoteForm from '@/components/quotes/QuoteForm'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import ContractForm from '@/components/contracts/ContractForm'
import MeetingForm from '@/components/meetings/MeetingForm'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import { formatCurrency } from '@/lib/utils'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import DocumentList from '@/components/documents/DocumentList'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'

interface QuoteItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  Product?: {
    id: string
    name: string
    price: number
    stock: number
    sku?: string
  }
}

interface Quote {
  id: string
  quoteNumber?: string
  title: string
  status: string
  totalAmount?: number
  version?: number
  parentQuoteId?: string
  revisionNotes?: string
  notes?: string
  validUntil?: string
  discount?: number
  taxRate?: number
  quoteItems?: QuoteItem[]
  customer?: {
    id?: string
    name?: string
    email?: string
    phone?: string
    address?: string
  }
  deal?: {
    id: string
    title: string
    Customer?: {
      id?: string
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  }
  Deal?: {
    id: string
    title: string
    Customer?: {
      id?: string
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  }
  invoice?: {
    id: string
    title: string
  }
  Invoice?: {
    id: string
    title: string
  }
  customerCompanyId?: string
  customerId?: string
  dealId?: string // API'den gelebilir
  createdAt: string
  updatedAt?: string
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const quoteId = params.id as string
  const [creatingRevision, setCreatingRevision] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [newQuoteFormOpen, setNewQuoteFormOpen] = useState(false) // Yeni teklif için modal
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [contractFormOpen, setContractFormOpen] = useState(false)
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: quote, isLoading, error, mutate: mutateQuote } = useData<Quote>(
    quoteId ? `/api/quotes/${quoteId}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  const handleCreateRevision = async () => {
    if (!confirm('Bu teklifin yeni bir revizyonunu oluşturmak istiyor musunuz?')) {
      return
    }

    setCreatingRevision(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionNotes: 'Revizyon oluşturuldu'
        })
      })

      if (!res.ok) {
        throw new Error('Revizyon oluşturulamadı')
      }

      const newQuote = await res.json()
      
      // Yeni quote'a yönlendir - router.push kullan (sayfa reload yok)
      router.push(`/${locale}/quotes/${newQuote.id}`)
    } catch (error: any) {
      toastError('Revizyon oluşturulamadı', error.message)
    } finally {
      setCreatingRevision(false)
    }
  }

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !quote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Teklif Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Teklif yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/quotes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  // Status labels - merkezi renk sistemi kullanılıyor (getStatusBadgeClass)
  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi',
    DECLINED: 'Reddedildi',
    EXPIRED: 'Süresi Doldu',
    WAITING: 'Beklemede',
  }

  // Quote status'leri için available statuses
  const availableStatuses = [
    { value: 'DRAFT', label: 'Taslak' },
    { value: 'SENT', label: 'Gönderildi' },
    { value: 'ACCEPTED', label: 'Kabul Edildi' },
    { value: 'REJECTED', label: 'Reddedildi' },
    { value: 'DECLINED', label: 'Reddedildi' },
    { value: 'WAITING', label: 'Beklemede' },
    { value: 'EXPIRED', label: 'Süresi Doldu' },
  ]

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="quote"
        entityId={quoteId}
        currentStatus={quote.status}
        availableStatuses={availableStatuses}
        onStatusChange={async (newStatus) => {
          const res = await fetch(`/api/quotes/${quoteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || 'Durum değiştirilemedi')
          }
          const updatedQuote = await res.json()
          await mutateQuote(updatedQuote, { revalidate: false })
          await Promise.all([
            mutate('/api/quotes', undefined, { revalidate: true }),
            mutate('/api/quotes?', undefined, { revalidate: true }),
          ])
        }}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
          if (!confirm(`${quote.title} teklifini silmek istediğinize emin misiniz?`)) {
            return
          }
          setDeleteLoading(true)
          try {
            const res = await fetch(`/api/quotes/${quoteId}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Silme işlemi başarısız')
            }
            router.push(`/${locale}/quotes`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message)
            throw error
          } finally {
            setDeleteLoading(false)
          }
        }}
        onDuplicate={async () => {
          try {
            const res = await fetch(`/api/quotes/${quoteId}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedQuote = await res.json()
            toast.success('Teklif kopyalandı')
            // Yeni kopyalanan quote'un detay sayfasına yönlendir
            router.push(`/${locale}/quotes/${duplicatedQuote.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message)
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'invoice') {
            setInvoiceFormOpen(true) // Modal form aç
          } else if (type === 'contract') {
            setContractFormOpen(true) // Modal form aç
          } else if (type === 'meeting') {
            setMeetingFormOpen(true) // Modal form aç
          }
        }}
        onSendEmail={(quote.customer?.email || quote.Deal?.Customer?.email) ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={(quote.customer?.phone || quote.Deal?.Customer?.phone) ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={(quote.customer?.phone || quote.Deal?.Customer?.phone) ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
        onAddToCalendar={() => {
          // Takvime ekleme işlemi AddToCalendarButton ile yapılıyor
        }}
        onDownloadPDF={() => {
          window.open(`/api/pdf/quote/${quoteId}`, '_blank')
        }}
        canEdit={quote.status !== 'ACCEPTED'}
        canDelete={quote.status !== 'ACCEPTED'}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/quotes`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{quote.title}</h1>
            <p className="text-gray-600">
              {quote.quoteNumber} • Versiyon {quote.version}
            </p>
            {quote.parentQuoteId && (
              <p className="text-sm text-blue-600">
                Bu bir revizyon teklifdir
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeClass(quote.status)}>
            {statusLabels[quote.status] || quote.status}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/${locale}/quotes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          {(quote.customer?.email || quote.Deal?.Customer?.email) && (
            <SendEmailButton
              to={quote.customer?.email || quote.Deal?.Customer?.email || ''}
              subject={`Teklif: ${quote.title}`}
              html={`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    Teklif Bilgileri
                  </h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>Teklif:</strong> ${quote.title}</p>
                    <p><strong>Teklif No:</strong> ${quote.quoteNumber}</p>
                    <p><strong>Versiyon:</strong> ${quote.version}</p>
                    <p><strong>Durum:</strong> ${statusLabels[quote.status] || quote.status}</p>
                    ${quote.totalAmount ? `<p><strong>Toplam:</strong> ${formatCurrency(quote.totalAmount)}</p>` : ''}
                    ${quote.Deal?.title ? `<p><strong>İlgili Fırsat:</strong> ${quote.Deal.title}</p>` : ''}
                    ${quote.notes ? `<p><strong>Notlar:</strong><br>${quote.notes.replace(/\n/g, '<br>')}</p>` : ''}
                  </div>
                  <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                    Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                  </p>
                </div>
              `}
            />
          )}
          {(quote.customer?.phone || quote.Deal?.Customer?.phone) && (
            <>
              <SendSmsButton
                to={(quote.customer?.phone || quote.Deal?.Customer?.phone || '').startsWith('+') 
                  ? (quote.customer?.phone || quote.Deal?.Customer?.phone || '') 
                  : `+${(quote.customer?.phone || quote.Deal?.Customer?.phone || '').replace(/\D/g, '')}`}
                message={`Merhaba, ${quote.title} teklifi hazır. Detaylar için lütfen iletişime geçin.`}
              />
              <SendWhatsAppButton
                to={(quote.customer?.phone || quote.Deal?.Customer?.phone || '').startsWith('+') 
                  ? (quote.customer?.phone || quote.Deal?.Customer?.phone || '') 
                  : `+${(quote.customer?.phone || quote.Deal?.Customer?.phone || '').replace(/\D/g, '')}`}
                message={`Merhaba, ${quote.title} teklifi hazır. Detaylar için lütfen iletişime geçin.`}
              />
            </>
          )}
          <AddToCalendarButton
            recordType="quote"
            record={quote}
            startTime={quote.createdAt}
            endTime={quote.createdAt}
            location={quote.customer?.address || quote.Deal?.Customer?.address}
          />
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${quote.title} teklifini silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/quotes/${quoteId}`, {
                  method: 'DELETE',
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Silme işlemi başarısız')
                }
                router.push(`/${locale}/quotes`)
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

      {/* Quick Actions */}
      {(quote.customer?.email || quote.Deal?.Customer?.email || quote.customer?.phone || quote.Deal?.Customer?.phone) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(quote.customer?.email || quote.Deal?.Customer?.email) && (
              <SendEmailButton
                to={quote.customer?.email || quote.Deal?.Customer?.email || ''}
                subject={`Teklif: ${quote.title}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Teklif Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Teklif:</strong> ${quote.title}</p>
                      <p><strong>Teklif No:</strong> ${quote.quoteNumber}</p>
                      <p><strong>Versiyon:</strong> ${quote.version}</p>
                      <p><strong>Durum:</strong> ${statusLabels[quote.status] || quote.status}</p>
                      ${quote.totalAmount ? `<p><strong>Toplam:</strong> ${formatCurrency(quote.totalAmount)}</p>` : ''}
                      ${quote.Deal?.title ? `<p><strong>İlgili Fırsat:</strong> ${quote.Deal.title}</p>` : ''}
                      ${quote.notes ? `<p><strong>Notlar:</strong><br>${quote.notes.replace(/\n/g, '<br>')}</p>` : ''}
                    </div>
                  </div>
                `}
                category="QUOTE"
                entityData={quote}
              />
            )}
            {(quote.customer?.phone || quote.Deal?.Customer?.phone) && (
              <>
                <SendSmsButton
                  to={(quote.customer?.phone || quote.Deal?.Customer?.phone || '').startsWith('+') 
                    ? (quote.customer?.phone || quote.Deal?.Customer?.phone || '') 
                    : `+${(quote.customer?.phone || quote.Deal?.Customer?.phone || '').replace(/\D/g, '')}`}
                  message={`Merhaba, ${quote.title} teklifi hazır. Detaylar için lütfen iletişime geçin.`}
                />
                <SendWhatsAppButton
                  to={(quote.customer?.phone || quote.Deal?.Customer?.phone || '').startsWith('+') 
                    ? (quote.customer?.phone || quote.Deal?.Customer?.phone || '') 
                    : `+${(quote.customer?.phone || quote.Deal?.Customer?.phone || '').replace(/\D/g, '')}`}
                  message={`Merhaba, ${quote.title} teklifi hazır. Detaylar için lütfen iletişime geçin.`}
                />
              </>
            )}
            <AddToCalendarButton
              recordType="quote"
              record={quote}
              startTime={quote.createdAt}
              endTime={quote.createdAt}
              location={quote.customer?.address || quote.Deal?.Customer?.address}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setInvoiceFormOpen(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Fatura Oluştur
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setMeetingFormOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Toplantı Oluştur
            </Button>
          </div>
        </Card>
      )}

      {/* EXPIRED Uyarısı ve Öneriler */}
      {quote.status === 'EXPIRED' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            ⚠️ Bu Teklif Süresi Doldu
          </AlertTitle>
          <AlertDescription className="text-orange-800 mt-2">
            <p className="mb-3">
              Bu teklif 30 gün geçtiği için otomatik olarak süresi doldu (EXPIRED). 
              Müşteri ile iletişime geçip yeni bir teklif oluşturmanız önerilir.
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleCreateRevision}
                disabled={creatingRevision}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {creatingRevision ? 'Oluşturuluyor...' : 'Revizyon Oluştur'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setNewQuoteFormOpen(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Teklif Oluştur
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Workflow Stepper */}
      <WorkflowStepper
        steps={getQuoteWorkflowSteps(quote.status) as any}
        currentStep={['DRAFT', 'SENT', 'ACCEPTED'].indexOf(quote.status)}
        title="Teklif İş Akışı"
      />

      {/* Status Info Note */}
      <StatusInfoNote
        entityType="quote"
        status={quote.status}
        relatedRecords={[
          ...(quote.customer ? [{
            type: 'customer',
            count: 1,
            message: `Müşteri: ${quote.customer.name}`
          }] : []),
        ]}
      />

      {/* Next Step Buttons */}
      <NextStepButtons
        entityType="quote"
        currentStatus={quote.status}
        onAction={async (actionId) => {
          // Status değiştirme işlemi
          try {
            const res = await fetch(`/api/quotes/${quoteId}`, {
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
            const updatedQuote = await res.json()
            
            // Optimistic update - cache'i güncelle (sayfa reload yok)
            await mutateQuote(updatedQuote, { revalidate: false })
            
            // Tüm ilgili cache'leri güncelle
            await Promise.all([
              mutate('/api/quotes', undefined, { revalidate: true }),
              mutate('/api/quotes?', undefined, { revalidate: true }),
              mutate((key: string) => typeof key === 'string' && key.startsWith('/api/quotes'), undefined, { revalidate: true }),
            ])
            
            toast.success('Durum değiştirildi')
          } catch (error: any) {
            toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'meeting') {
            setMeetingFormOpen(true)
          }
        }}
      />

      {/* Quote Items */}
      {quote.quoteItems && quote.quoteItems.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Teklif Kalemleri
          </h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.quoteItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productId && item.Product?.id ? (
                        <Link
                          href={`/${locale}/products/${item.Product.id}`}
                          className="text-indigo-600 hover:underline"
                        >
                          {item.Product.name || 'Ürün Bulunamadı'}
                        </Link>
                      ) : (
                        item.Product?.name || 'Ürün Bulunamadı'
                      )}
                      {item.Product?.sku && (
                        <div className="text-xs text-gray-500">SKU: {item.Product.sku}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={3} className="text-right">
                    Genel Toplam:
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(quote.totalAmount || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Related Records Suggestions */}
      <RelatedRecordsSuggestions
        entityType="quote"
        entityId={quoteId}
        relatedRecords={[
          ...(quote.deal || quote.Deal ? [{
            id: (quote.deal || quote.Deal)!.id,
            type: 'deal',
            title: (quote.deal || quote.Deal)!.title,
            link: `/${locale}/deals/${(quote.deal || quote.Deal)!.id}`,
          }] : []),
          ...(quote.invoice || quote.Invoice ? [{
            id: (quote.invoice || quote.Invoice)!.id,
            type: 'invoice',
            title: (quote.invoice || quote.Invoice)!.title,
            link: `/${locale}/invoices/${(quote.invoice || quote.Invoice)!.id}`,
          }] : []),
        ]}
        missingRecords={[
          ...(quote.status === 'SENT' ? [{
            type: 'meeting',
            label: 'Görüşme Planla',
            icon: <Calendar className="h-4 w-4" />,
            onCreate: () => setMeetingFormOpen(true),
            description: 'Teklif sunumu için görüşme planlayın',
          }] : []),
        ]}
      />

      {/* Info Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Toplam Tutar</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              }).format(quote.totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Müşteri</p>
            <p className="text-lg font-semibold">
              {quote.customer?.name || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
            <p className="text-lg font-semibold">
              {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>

        {quote.revisionNotes && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 mb-1">Revizyon Notları:</p>
            <p className="text-sm text-blue-800">{quote.revisionNotes}</p>
          </div>
        )}

        {/* REJECTED durumunda reddetme notu - kırmızı renkle */}
        {quote.status === 'REJECTED' && quote.notes && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm font-bold text-red-900">REDDEDİLDİ</p>
            </div>
            <p className="text-sm font-semibold text-red-800 mb-2">Reddetme Sebebi:</p>
            <p className="text-sm text-red-700 whitespace-pre-wrap">
              {quote.notes.includes('Sebep:') 
                ? quote.notes.split('Sebep:')[1]?.trim() || quote.notes
                : quote.notes
              }
            </p>
          </div>
        )}

        {/* Genel Notlar (REJECTED dışında) */}
        {quote.status !== 'REJECTED' && quote.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">Notlar:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        )}

        {/* Ek Bilgiler */}
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          {quote.validUntil && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Geçerlilik Tarihi</p>
              <p className="text-lg font-semibold">
                {new Date(quote.validUntil).toLocaleDateString('tr-TR')}
              </p>
            </div>
          )}
          {quote.discount && quote.discount > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">İndirim</p>
              <p className="text-lg font-semibold text-red-600">
                -{formatCurrency(quote.discount)}
              </p>
            </div>
          )}
          {quote.taxRate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">KDV Oranı</p>
              <p className="text-lg font-semibold">%{quote.taxRate}</p>
            </div>
          )}
          {quote.updatedAt && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Son Güncelleme</p>
              <p className="text-lg font-semibold">
                {new Date(quote.updatedAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            İşlemler
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateRevision}
              disabled={creatingRevision}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {creatingRevision ? 'Oluşturuluyor...' : 'Revizyon Oluştur'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Revizyon oluşturduğunuzda, bu teklifin kopyası versiyon numarası artırılarak oluşturulur.
          </p>
        </Card>
      )}

      {/* Quote Form Modal */}
      <QuoteForm
        quote={quote}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedQuote: Quote) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş quote'u cache'e ekle
          await mutateQuote(savedQuote, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/quotes', undefined, { revalidate: true }),
            mutate('/api/quotes?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/quotes'), undefined, { revalidate: true }),
          ])
        }}
      />

      {/* Invoice Form Modal - İlişkili kayıt oluşturma */}
      <InvoiceForm
        open={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        quoteId={quoteId}
        customerCompanyId={quote.customerCompanyId}
        customerId={quote.customerId || quote.Deal?.Customer?.id}
        onSuccess={async (savedInvoice: any) => {
          // Cache'i güncelle - optimistic update
          await Promise.all([
            mutate('/api/invoices', undefined, { revalidate: true }),
            mutate('/api/invoices?', undefined, { revalidate: true }),
            mutate(`/api/quotes/${quoteId}`, undefined, { revalidate: true }),
          ])
          await mutateQuote(undefined, { revalidate: true })
          // Toast zaten InvoiceForm içinde gösteriliyor (navigateToDetailToast)
        }}
      />

      {/* Yeni Teklif Form Modal */}
      <QuoteForm
        quote={undefined}
        open={newQuoteFormOpen}
        onClose={() => setNewQuoteFormOpen(false)}
        onSuccess={async (savedQuote: any) => {
          // Cache'i güncelle - optimistic update
          await Promise.all([
            mutate('/api/quotes', undefined, { revalidate: true }),
            mutate('/api/quotes?', undefined, { revalidate: true }),
            mutate(`/api/quotes/${quoteId}`, undefined, { revalidate: true }),
          ])
          await mutateQuote(undefined, { revalidate: true })
          setNewQuoteFormOpen(false)
          // Başarılı kayıt sonrası yeni teklif detay sayfasına yönlendir
          router.push(`/${locale}/quotes/${savedQuote.id}`)
        }}
        dealId={quote.dealId || quote.deal?.id}
        customerId={quote.customerId}
        customerCompanyId={quote.customerCompanyId}
      />

      {/* Document List */}
      <DocumentList relatedTo="Quote" relatedId={quoteId} />

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline entityType="Quote" entityId={quoteId} />
      </Card>

      {/* Contract Form Modal - İlişkili kayıt oluşturma */}
      <ContractForm
        contract={undefined}
        open={contractFormOpen}
        onClose={() => setContractFormOpen(false)}
        onSuccess={async (savedContract: any) => {
          // Cache'i güncelle - optimistic update
          await Promise.all([
            mutate('/api/contracts', undefined, { revalidate: true }),
            mutate('/api/contracts?', undefined, { revalidate: true }),
            mutate(`/api/quotes/${quoteId}`, undefined, { revalidate: true }),
          ])
          await mutateQuote(undefined, { revalidate: true })
          setContractFormOpen(false)
        }}
        quoteId={quoteId}
        dealId={quote.dealId || quote.deal?.id}
        customerId={quote.customerId}
        customerCompanyId={quote.customerCompanyId}
      />

      {/* Meeting Form Modal - İlişkili kayıt oluşturma */}
      <MeetingForm
        meeting={undefined}
        open={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        quoteId={quoteId}
        customerCompanyId={quote.customerCompanyId}
        onSuccess={async (savedMeeting: any) => {
          // Cache'i güncelle - optimistic update
          await Promise.all([
            mutate('/api/meetings', undefined, { revalidate: true }),
            mutate('/api/meetings?', undefined, { revalidate: true }),
            mutate(`/api/quotes/${quoteId}`, undefined, { revalidate: true }),
          ])
          await mutateQuote(undefined, { revalidate: true })
          setMeetingFormOpen(false)
          // Başarılı kayıt sonrası görüşme detay sayfasına yönlendir
          router.push(`/${locale}/meetings/${savedMeeting.id}`)
        }}
      />
    </div>
  )
}
