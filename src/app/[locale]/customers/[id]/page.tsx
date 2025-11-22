'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Briefcase, FileText, Receipt, Trash2, User, Zap, DollarSign, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DocumentList from '@/components/documents/DocumentList'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import dynamic from 'next/dynamic'
import { confirm } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('@/components/customers/CustomerForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load DealForm - performans için
const DealForm = dynamic(() => import('@/components/deals/DealForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load QuoteForm - performans için
const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load MeetingForm - performans için
const MeetingForm = dynamic(() => import('@/components/meetings/MeetingForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load TaskForm - performans için
const TaskForm = dynamic(() => import('@/components/tasks/TaskForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load TicketForm - performans için
const TicketForm = dynamic(() => import('@/components/tickets/TicketForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load InvoiceForm - performans için
const InvoiceForm = dynamic(() => import('@/components/invoices/InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

import SendEmailButton from '@/components/integrations/SendEmailButton'
import { toast, toastError, toastSuccess, toastWithUndo } from '@/lib/toast'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import DetailPageLayout from '@/components/layout/DetailPageLayout'
import OverviewCard from '@/components/layout/OverviewCard'
import RelatedRecordsSection from '@/components/layout/RelatedRecordsSection'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [ticketFormOpen, setTicketFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: customer, isLoading, error, mutate: mutateCustomer } = useData<any>(
    id ? `/api/customers/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-500">Müşteri bulunamadı</p>
        <Button onClick={() => router.push(`/${locale}/customers`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  // Finansal hesaplamalar
  const paidInvoices = customer.Invoice?.filter((inv: any) => inv.status === 'PAID') || []
  const pendingInvoices = customer.Invoice?.filter((inv: any) => inv.status === 'SENT' || inv.status === 'OVERDUE') || []
  const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
  const pendingPayments = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
  const lastPaymentDate = paidInvoices.length > 0 
    ? paidInvoices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt
    : null

  // Delete handler
  const handleDelete = async () => {
          if (!confirm(`${customer.name} müşterisini silmek istediğinize emin misiniz?`)) {
            return
          }
          setDeleteLoading(true)
    const deletedCustomer = customer
    
          try {
            const res = await fetch(`/api/customers/${id}`, {
              method: 'DELETE',
            })
      if (!res.ok) throw new Error('Silme işlemi başarısız')
      
      toastWithUndo(
        `${deletedCustomer.name} müşterisi başarıyla silindi`,
        async () => {
          try {
            const restoreRes = await fetch(`/api/customers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deletedCustomer),
            })
            if (restoreRes.ok) {
              toastSuccess('Müşteri geri yüklendi')
              router.refresh()
            } else {
              toastError('Müşteri geri yüklenemedi', 'Müşteri geri yükleme işlemi başarısız oldu')
            }
          } catch (error) {
            toastError('Müşteri geri yüklenemedi', 'Müşteri geri yükleme işlemi başarısız oldu')
          }
        }
      )
      
            router.push(`/${locale}/customers`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message || 'Müşteri silinirken bir hata oluştu')
          } finally {
            setDeleteLoading(false)
          }
  }

  // Duplicate handler
  const handleDuplicate = async () => {
          try {
            const res = await fetch(`/api/customers/${id}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedCustomer = await res.json()
            toastSuccess('Müşteri kopyalandı')
            router.push(`/${locale}/customers/${duplicatedCustomer.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message || 'Müşteri kopyalanırken bir hata oluştu')
          }
  }

  // Overview Cards
  const overviewCards = (
    <>
      {customer.Invoice && customer.Invoice.length > 0 && (
        <>
          <OverviewCard
            title="Toplam Gelir"
            value={formatCurrency(totalRevenue)}
            icon={DollarSign}
            iconColor="text-green-600"
            description={`${paidInvoices.length} ödenmiş fatura`}
          />
          <OverviewCard
            title="Bekleyen Ödemeler"
            value={formatCurrency(pendingPayments)}
            icon={Receipt}
            iconColor="text-orange-600"
            description={`${pendingInvoices.length} bekleyen fatura`}
          />
        </>
      )}
      <OverviewCard
        title="Toplam Fırsat"
        value={customer.Deal?.length || 0}
        icon={Briefcase}
        iconColor="text-indigo-600"
        description="Aktif fırsatlar"
      />
      <OverviewCard
        title="Toplam Teklif"
        value={customer.Quote?.length || 0}
        icon={FileText}
        iconColor="text-purple-600"
        description="Teklif sayısı"
      />
    </>
  )

  // Related Records - Deals
  const dealsRecords = customer.Deal?.map((deal: any) => ({
    id: deal.id,
    title: deal.title,
    subtitle: deal.stage,
    status: deal.status,
    date: deal.createdAt,
    href: `/deals/${deal.id}`,
  })) || []

  // Related Records - Quotes
  const quotesRecords = customer.Quote?.map((quote: any) => ({
    id: quote.id,
    title: quote.title,
    subtitle: formatCurrency(quote.total || 0),
    status: quote.status,
    amount: quote.total || 0,
    date: quote.createdAt,
    href: `/quotes/${quote.id}`,
  })) || []

  // Related Records - Invoices
  const invoicesRecords = customer.Invoice?.map((invoice: any) => ({
    id: invoice.id,
    title: invoice.title,
    subtitle: formatCurrency(invoice.total || 0),
    status: invoice.status,
    amount: invoice.total || 0,
    date: invoice.createdAt,
    href: `/invoices/${invoice.id}`,
  })) || []

  return (
    <>
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="customer"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onCreateRelated={(type) => {
          if (type === 'deal') {
            setDealFormOpen(true) // Modal form aç
          } else if (type === 'quote') {
            setQuoteFormOpen(true) // Modal form aç
          } else if (type === 'meeting') {
            setMeetingFormOpen(true) // Modal form aç
          } else if (type === 'task') {
            setTaskFormOpen(true) // Modal form aç
          } else if (type === 'ticket') {
            setTicketFormOpen(true) // Modal form aç
          }
        }}
        onSendEmail={customer.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={customer.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={customer.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
      />

      {/* DetailPageLayout - Yeni Kompakt Monday.com Tarzı */}
      <DetailPageLayout
        title={customer.name}
        subtitle={customer.sector || customer.city || 'Müşteri Detayları'}
        icon={<Building2 className="h-5 w-5 text-white" />}
        imageUrl={customer.logoUrl}
        badge={
          <Badge
            className={
              customer.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800 text-xs'
                : 'bg-red-100 text-red-800 text-xs'
            }
          >
            {customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
          </Badge>
        }
        backUrl={`/${locale}/customers`}
        breadcrumbs={[
          { label: 'Müşteriler', href: `/${locale}/customers` },
          { label: customer.name }
        ]}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        moreActions={[
          {
            label: 'Kopyala',
            icon: <Copy className="h-4 w-4" />,
            onClick: handleDuplicate
          },
          ...(customer.email ? [{
            label: 'E-posta Gönder',
            icon: <Mail className="h-4 w-4" />,
            onClick: () => {}
          }] : [])
        ]}
        quickActions={
          customer.email && (
            <SendEmailButton
              to={customer.email}
              subject={`Müşteri: ${customer.name}`}
              html={`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    Müşteri Bilgileri
                  </h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>Müşteri:</strong> ${customer.name}</p>
                    ${customer.email ? `<p><strong>E-posta:</strong> ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p><strong>Telefon:</strong> ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p><strong>Adres:</strong> ${customer.address}</p>` : ''}
                    ${customer.city ? `<p><strong>Şehir:</strong> ${customer.city}</p>` : ''}
                    ${customer.sector ? `<p><strong>Sektör:</strong> ${customer.sector}</p>` : ''}
                  </div>
                </div>
              `}
              category="CUSTOMER"
              entityData={customer}
            />
          )
        }
        overviewCards={overviewCards}
        overviewCollapsible={false}
        relatedRecords={
          <div className="space-y-2">
            {dealsRecords.length > 0 && (
              <RelatedRecordsSection
                title="Fırsatlar"
                icon={Briefcase}
                records={dealsRecords}
                onCreateNew={() => {
                  setDealFormOpen(true)
                  toast.info('Yeni Fırsat', { description: `${customer.name} için yeni fırsat oluşturuluyor...` })
                }}
                onCreateLabel="Yeni Fırsat"
                viewAllUrl={`/${locale}/deals?customerId=${id}`}
              />
            )}
            {quotesRecords.length > 0 && (
              <RelatedRecordsSection
                title="Teklifler"
                icon={FileText}
                records={quotesRecords}
                onCreateNew={() => setQuoteFormOpen(true)}
                onCreateLabel="Yeni Teklif"
                viewAllUrl={`/${locale}/quotes?customerId=${id}`}
              />
            )}
            {invoicesRecords.length > 0 && (
              <RelatedRecordsSection
                title="Faturalar"
                icon={Receipt}
                records={invoicesRecords}
                onCreateNew={() => {
                  setInvoiceFormOpen(true)
                  toast.info('Yeni Fatura', { description: `${customer.name} için yeni fatura oluşturuluyor...` })
                }}
                onCreateLabel="Yeni Fatura"
                viewAllUrl={`/${locale}/invoices?customerId=${id}`}
              />
            )}
        </div>
        }
        relatedCollapsible={true}
        relatedDefaultOpen={true}
        tabs={[
          {
            id: 'general',
            label: 'Genel Bilgiler',
            icon: <User className="h-3.5 w-3.5" />,
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">İletişim Bilgileri</h3>
                  <div className="space-y-2 text-xs">
            {customer.address && (
              <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{customer.address}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{customer.email}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{customer.city}</span>
              </div>
            )}
            {customer.sector && (
              <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{customer.sector}</span>
              </div>
            )}
          </div>
        </Card>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3 text-gray-700">Durum ve Bilgiler</h3>
                  <div className="space-y-2 text-xs">
            <div>
                      <span className="text-gray-600">Durum:</span>
              <Badge
                className={
                  customer.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 ml-2 text-xs'
                            : 'bg-red-100 text-red-800 ml-2 text-xs'
                }
              >
                {customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            <div>
                      <span className="text-gray-600">Oluşturulma:</span>
              <span className="ml-2 text-gray-700">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
            {customer.updatedAt && (
              <div>
                        <span className="text-gray-600">Son Güncelleme:</span>
                <span className="ml-2 text-gray-700">
                  {new Date(customer.updatedAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>
        </Card>
        {customer.notes && (
                  <Card className="p-4 md:col-span-2">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">Notlar</h3>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
            </Card>
                )}
              </div>
            )
          },
          {
            id: 'activity',
            label: 'Aktivite',
            icon: <Zap className="h-3.5 w-3.5" />,
            content: (
              <Card className="p-4">
        <ActivityTimeline entityType="Customer" entityId={id} />
        </Card>
            )
          },
          {
            id: 'documents',
            label: 'Dokümanlar',
            icon: <FileText className="h-3.5 w-3.5" />,
            content: <DocumentList relatedTo="Customer" relatedId={id} />
          },
          {
            id: 'comments',
            label: 'Yorumlar',
            icon: <User className="h-3.5 w-3.5" />,
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CommentsSection entityType="Customer" entityId={id} />
        <FileUpload entityType="Customer" entityId={id} />
      </div>
            )
          }
        ]}
      />


      {/* Form Modals */}
      <CustomerForm
        customer={customer}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedCustomer: any) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş customer'ı cache'e ekle
          await mutateCustomer(savedCustomer, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/customers', undefined, { revalidate: true }),
            mutate('/api/customers?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/customers'), undefined, { revalidate: true }),
          ])
        }}
      />

      <DealForm
        open={dealFormOpen}
        onClose={() => setDealFormOpen(false)}
        onSuccess={async (savedDeal) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          toast.success('Fırsat Oluşturuldu', {
            description: `"${savedDeal.title || 'Fırsat'}" başarıyla oluşturuldu. Müşteri: ${customer.name}`,
            action: {
              label: 'Görüntüle',
              onClick: () => router.push(`/${locale}/deals/${savedDeal.id}`)
            }
          })
        }}
        customerId={id}
      />

      <QuoteForm
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onSuccess={async (savedQuote) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          toast.success('Teklif Oluşturuldu', {
            description: `"${savedQuote.title || 'Teklif'}" başarıyla oluşturuldu. Müşteri: ${customer.name}`,
            action: {
              label: 'Görüntüle',
              onClick: () => router.push(`/${locale}/quotes/${savedQuote.id}`)
            }
          })
        }}
        customerId={id}
      />

      <InvoiceForm
        open={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        onSuccess={async (savedInvoice) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          toast.success('Fatura Oluşturuldu', {
            description: `"${savedInvoice.title || savedInvoice.invoiceNumber || 'Fatura'}" başarıyla oluşturuldu. Müşteri: ${customer.name}`,
            action: {
              label: 'Görüntüle',
              onClick: () => router.push(`/${locale}/invoices/${savedInvoice.id}`)
            }
          })
        }}
        customerId={id}
      />

      <MeetingForm
        open={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        onSuccess={async (savedMeeting) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          // Toast zaten MeetingForm içinde gösteriliyor (navigateToDetailToast)
        }}
        customerId={id}
        customerCompanyId={customer.companyId}
        customerCompanyName={customer.name}
      />

      <TaskForm
        task={undefined}
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        customerName={customer.name}
        onSuccess={async (savedTask) => {
          await mutateCustomer(undefined, { revalidate: true })
          setTaskFormOpen(false)
        }}
      />

      <TicketForm
        ticket={undefined}
        open={ticketFormOpen}
        onClose={() => setTicketFormOpen(false)}
        onSuccess={async () => {
          await mutateCustomer(undefined, { revalidate: true })
          setTicketFormOpen(false)
        }}
      />
    </>
  )
}