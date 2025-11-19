'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Building2, Briefcase, FileText, Receipt, Trash2, User, Zap, DollarSign, Copy, Mail, Phone, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import DetailModal from '@/components/ui/DetailModal'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
<<<<<<< HEAD
import { toast, confirm } from '@/lib/toast'
=======
import { toast } from '@/lib/toast'
import DetailPageLayout from '@/components/layout/DetailPageLayout'
import OverviewCard from '@/components/layout/OverviewCard'
import RelatedRecordsSection from '@/components/layout/RelatedRecordsSection'
import { formatCurrency } from '@/lib/utils'
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('./CustomerForm'), {
  ssr: false,
  loading: () => null,
})

const DealForm = dynamic(() => import('../deals/DealForm'), {
  ssr: false,
  loading: () => null,
})

const QuoteForm = dynamic(() => import('../quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

interface CustomerDetailModalProps {
  customerId: string | null
  open: boolean
  onClose: () => void
  initialData?: any // Liste sayfasından gelen veri (hızlı açılış için)
}

export default function CustomerDetailModal({
  customerId,
  open,
  onClose,
  initialData,
}: CustomerDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const tCommon = useTranslations('common')
  const [formOpen, setFormOpen] = useState(false)
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // SWR ile veri çek - cache'den hızlı açılış için
  const { data: customer, isLoading, error, mutate: mutateCustomer } = useData<any>(
    customerId && open ? `/api/customers/${customerId}` : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
    }
  )
  
  // initialData'yı fallback olarak kullan
  const displayCustomer = customer || initialData

  const handleDelete = async () => {
    if (!displayCustomer || !confirm(tCommon('deleteConfirm', { name: displayCustomer.name, item: 'müşteri' }))) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success(tCommon('customerDeletedSuccess'), { description: 'Müşteri başarıyla silindi' })
      
      // Cache'i güncelle
      await mutate('/api/customers')
      await mutate(`/api/customers/${customerId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!displayCustomer) return
    
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...displayCustomer,
          name: `${displayCustomer.name} (Kopya)`,
          id: undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
      }

      const newCustomer = await res.json()
      toast.success('Müşteri kopyalandı')
      
      // Cache'i güncelle
      await mutate('/api/customers')
      
      // Yeni müşteriyi aç
      onClose()
      router.push(`/${locale}/customers/${newCustomer.id}`)
    } catch (error: any) {
      console.error('Duplicate error:', error)
      toast.error('Kopyalama işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    }
  }

  // ✅ ÇÖZÜM: customerId null kontrolü - modal açılmadan önce kontrol et
  if (!open) return null
  
  if (!customerId) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri ID bulunamadı</p>
        </div>
      </DetailModal>
    )
  }

  // Loading state - sadece initialData yoksa ve hala loading ise göster
  if (isLoading && !initialData && !displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Müşteri Detayları" size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </DetailModal>
    )
  }

  // Error state - sadece initialData yoksa ve error varsa göster
  if (error && !initialData && !displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">
            {error?.message?.includes('404') || error?.message?.includes('bulunamadı')
              ? 'Müşteri bulunamadı'
              : 'Müşteri yüklenemedi'}
          </p>
        </div>
      </DetailModal>
    )
  }

  // Customer yoksa
  if (!displayCustomer) {
    return (
      <DetailModal open={open} onClose={onClose} title="Müşteri Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Müşteri bulunamadı</p>
        </div>
      </DetailModal>
    )
  }

  // Finansal hesaplamalar
  const paidInvoices = displayCustomer.Invoice?.filter((inv: any) => inv.status === 'PAID') || []
  const pendingInvoices = displayCustomer.Invoice?.filter((inv: any) => inv.status === 'SENT' || inv.status === 'OVERDUE') || []
  const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
  const pendingPayments = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)

  // Overview Cards
  const overviewCards = (
    <>
      {displayCustomer.Invoice && displayCustomer.Invoice.length > 0 && (
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
        value={displayCustomer.Deal?.length || 0}
        icon={Briefcase}
        iconColor="text-indigo-600"
        description="Aktif fırsatlar"
      />
      <OverviewCard
        title="Toplam Teklif"
        value={displayCustomer.Quote?.length || 0}
        icon={FileText}
        iconColor="text-purple-600"
        description="Teklif sayısı"
      />
    </>
  )

  // Related Records - Deals
  const dealsRecords = displayCustomer.Deal?.map((deal: any) => ({
    id: deal.id,
    title: deal.title,
    subtitle: deal.stage,
    status: deal.status,
    date: deal.createdAt,
    href: `/deals/${deal.id}`,
  })) || []

  // Related Records - Quotes
  const quotesRecords = displayCustomer.Quote?.map((quote: any) => ({
    id: quote.id,
    title: quote.title,
    subtitle: formatCurrency(quote.total || 0),
    status: quote.status,
    amount: quote.total || 0,
    date: quote.createdAt,
    href: `/quotes/${quote.id}`,
  })) || []

  // Related Records - Invoices
  const invoicesRecords = displayCustomer.Invoice?.map((invoice: any) => ({
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
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayCustomer?.name || 'Müşteri Detayları'}
        description="Müşteri bilgileri ve ilişkili kayıtlar"
        size="xl"
      >
        <DetailPageLayout
          title={displayCustomer.name}
          subtitle={displayCustomer.sector || displayCustomer.city || 'Müşteri Detayları'}
          icon={<Building2 className="h-5 w-5 text-white" />}
          imageUrl={displayCustomer.logoUrl}
          badge={
            <Badge
              className={
                displayCustomer.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 text-xs'
                  : 'bg-red-100 text-red-800 text-xs'
              }
            >
              {displayCustomer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
            </Badge>
          }
          onClose={onClose}
          isModal={true}
          onEdit={() => setFormOpen(true)}
          onDelete={handleDelete}
          moreActions={[
            {
              label: 'Kopyala',
              icon: <Copy className="h-4 w-4" />,
              onClick: handleDuplicate
            },
          ]}
          quickActions={
            displayCustomer.email && (
              <SendEmailButton
                to={displayCustomer.email}
                subject={`Müşteri: ${displayCustomer.name}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Müşteri Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Müşteri:</strong> ${displayCustomer.name}</p>
                      ${displayCustomer.email ? `<p><strong>E-posta:</strong> ${displayCustomer.email}</p>` : ''}
                      ${displayCustomer.phone ? `<p><strong>Telefon:</strong> ${displayCustomer.phone}</p>` : ''}
                      ${displayCustomer.address ? `<p><strong>Adres:</strong> ${displayCustomer.address}</p>` : ''}
                      ${displayCustomer.city ? `<p><strong>Şehir:</strong> ${displayCustomer.city}</p>` : ''}
                      ${displayCustomer.sector ? `<p><strong>Sektör:</strong> ${displayCustomer.sector}</p>` : ''}
                    </div>
                  </div>
                `}
                category="CUSTOMER"
                entityData={displayCustomer}
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
                  onCreateNew={() => setDealFormOpen(true)}
                  onCreateLabel="Yeni Fırsat"
                  viewAllUrl={`/${locale}/deals?customerId=${customerId}`}
                />
              )}
              {quotesRecords.length > 0 && (
                <RelatedRecordsSection
                  title="Teklifler"
                  icon={FileText}
                  records={quotesRecords}
                  onCreateNew={() => setQuoteFormOpen(true)}
                  onCreateLabel="Yeni Teklif"
                  viewAllUrl={`/${locale}/quotes?customerId=${customerId}`}
                />
              )}
              {invoicesRecords.length > 0 && (
                <RelatedRecordsSection
                  title="Faturalar"
                  icon={Receipt}
                  records={invoicesRecords}
                  viewAllUrl={`/${locale}/invoices?customerId=${customerId}`}
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
                      {displayCustomer.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{displayCustomer.address}</span>
                        </div>
                      )}
                      {displayCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{displayCustomer.phone}</span>
                          <SendWhatsAppButton
                            phoneNumber={displayCustomer.phone}
                            entityType="Customer"
                            entityId={customerId || undefined}
                            customerName={displayCustomer.name}
                            variant="ghost"
                            size="sm"
                          />
                        </div>
                      )}
                      {displayCustomer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{displayCustomer.email}</span>
                        </div>
                      )}
                      {displayCustomer.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{displayCustomer.city}</span>
                        </div>
                      )}
                      {displayCustomer.sector && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{displayCustomer.sector}</span>
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
                            displayCustomer.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 ml-2 text-xs'
                              : 'bg-red-100 text-red-800 ml-2 text-xs'
                          }
                        >
                          {displayCustomer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-600">Oluşturulma:</span>
                        <span className="ml-2 text-gray-700">
                          {new Date(displayCustomer.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      {displayCustomer.updatedAt && (
                        <div>
                          <span className="text-gray-600">Son Güncelleme:</span>
                          <span className="ml-2 text-gray-700">
                            {new Date(displayCustomer.updatedAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )
            },
            {
              id: 'activity',
              label: 'Aktivite',
              icon: <Zap className="h-3.5 w-3.5" />,
              content: (
                <Card className="p-4">
                  <ActivityTimeline entityType="Customer" entityId={customerId || undefined} />
                </Card>
              )
            },
            {
              id: 'comments',
              label: 'Yorumlar',
              icon: <User className="h-3.5 w-3.5" />,
              content: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CommentsSection entityType="Customer" entityId={customerId || undefined} />
                  <FileUpload entityType="Customer" entityId={customerId || undefined} />
                </div>
              )
            }
          ]}
        />
      </DetailModal>

      {/* Form Modals */}
      <CustomerForm
        customer={displayCustomer || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedCustomer: any) => {
          await mutateCustomer(savedCustomer, { revalidate: false })
          await Promise.all([
            mutate('/api/customers', undefined, { revalidate: true }),
            mutate(`/api/customers/${customerId}`, undefined, { revalidate: true }),
          ])
        }}
      />

      <DealForm
        open={dealFormOpen}
        onClose={() => setDealFormOpen(false)}
        onSuccess={async () => {
          await mutateCustomer(undefined, { revalidate: true })
        }}
        customerId={customerId || undefined}
      />

      <QuoteForm
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onSuccess={async () => {
          await mutateCustomer(undefined, { revalidate: true })
        }}
        customerId={customerId || undefined}
      />
    </>
  )
}
