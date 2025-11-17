'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Calendar, DollarSign, User, TrendingUp, Clock, FileText, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast, toastError } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getDealWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import DealForm from '@/components/deals/DealForm'
import QuoteForm from '@/components/quotes/QuoteForm'
import MeetingForm from '@/components/meetings/MeetingForm'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import DocumentList from '@/components/documents/DocumentList'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import { Briefcase, FileText as FileTextIcon } from 'lucide-react'

interface DealHistory {
  id: string
  fromStage: string
  toStage: string
  changedAt: string
  changedBy: string
  notes: string
  user: {
    name: string
  }
}

interface Deal {
  id: string
  title: string
  stage: string
  value: number
  status: string
  customerId?: string
  expectedCloseDate?: string
  winProbability?: number
  lostReason?: string
  description?: string
  leadSource?: string
  leadScore?: {
    score: number
    temperature: string
  }[]
  customer?: {
    name: string
  }
  Customer?: {
    id: string
    name: string
    email?: string
    phone?: string
    companyId?: string
  }
  CreatedByUser?: {
    id: string
    name: string
    email: string
  }
  UpdatedByUser?: {
    id: string
    name: string
    email: string
  }
  Quote?: Array<{
    id: string
    title: string
    status: string
    total: number
    createdAt: string
  }>
  Contract?: Array<{
    id: string
    title: string
    status: string
    createdAt: string
  }>
  Meeting?: Array<{
    id: string
    title: string
    meetingDate: string
    status: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
  history?: DealHistory[]
}

// Stage labels - merkezi renk sistemi kullanılıyor (getStatusBadgeClass)
const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACT: 'İletişim',
  CONTACTED: 'İletişim Kuruldu',
  DEMO: 'Demo',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const dealId = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: deal, isLoading, error, mutate: mutateDeal } = useData<Deal>(
    dealId ? `/api/deals/${dealId}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !deal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Fırsat Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Fırsat yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/deals`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  // Deal stage'leri için available statuses
  const availableStages = [
    { value: 'LEAD', label: 'Potansiyel' },
    { value: 'CONTACTED', label: 'İletişim Kuruldu' },
    { value: 'PROPOSAL', label: 'Teklif' },
    { value: 'NEGOTIATION', label: 'Pazarlık' },
    { value: 'WON', label: 'Kazanıldı' },
    { value: 'LOST', label: 'Kaybedildi' },
  ]

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="deal"
        entityId={dealId}
        currentStatus={deal.stage}
        availableStatuses={availableStages}
        onStatusChange={async (newStage) => {
          const res = await fetch(`/api/deals/${dealId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: newStage }),
          })
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || 'Durum değiştirilemedi')
          }
          const updatedDeal = await res.json()
          await mutateDeal(updatedDeal, { revalidate: false })
          await Promise.all([
            mutate('/api/deals', undefined, { revalidate: true }),
            mutate('/api/deals?', undefined, { revalidate: true }),
          ])
        }}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
          if (!confirm(`${deal.title} fırsatını silmek istediğinize emin misiniz?`)) {
            return
          }
          setDeleteLoading(true)
          try {
            const res = await fetch(`/api/deals/${dealId}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Silme işlemi başarısız')
            }
            router.push(`/${locale}/deals`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message)
            throw error
          } finally {
            setDeleteLoading(false)
          }
        }}
        onDuplicate={async () => {
          try {
            const res = await fetch(`/api/deals/${dealId}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedDeal = await res.json()
            toast.success('Fırsat kopyalandı')
            router.push(`/${locale}/deals/${duplicatedDeal.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message)
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'quote') {
            setQuoteFormOpen(true) // Modal form aç
          } else if (type === 'meeting') {
            setMeetingFormOpen(true) // Modal form aç
          }
        }}
        onSendEmail={deal.Customer?.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={deal.Customer?.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={deal.Customer?.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
        onAddToCalendar={deal.expectedCloseDate ? () => {
          // Takvime ekleme işlemi AddToCalendarButton ile yapılıyor
        } : undefined}
        canEdit={deal.stage !== 'WON' && deal.stage !== 'LOST'}
        canDelete={deal.stage !== 'WON' && deal.stage !== 'LOST'}
      />

      {/* Quick Actions */}
      {deal.Customer && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {deal.Customer.email && (
              <SendEmailButton
                to={deal.Customer.email}
                subject={`Fırsat: ${deal.title}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Fırsat Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Fırsat:</strong> ${deal.title}</p>
                      <p><strong>Durum:</strong> ${stageLabels[deal.stage] || deal.stage}</p>
                      ${deal.value ? `<p><strong>Tutar:</strong> ${formatCurrency(deal.value)}</p>` : ''}
                      ${deal.expectedCloseDate ? `<p><strong>Beklenen Kapanış:</strong> ${new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}</p>` : ''}
                    </div>
                  </div>
                `}
                category="DEAL"
                entityData={deal}
              />
            )}
            {deal.Customer.phone && (
              <>
                <SendSmsButton
                  to={deal.Customer.phone}
                  message={`Merhaba, "${deal.title}" fırsatı hakkında sizinle iletişime geçmek istiyoruz.`}
                />
                <SendWhatsAppButton
                  to={deal.Customer.phone}
                  message={`Merhaba, "${deal.title}" fırsatı hakkında sizinle iletişime geçmek istiyoruz.`}
                />
              </>
            )}
            {deal.expectedCloseDate && (
              <AddToCalendarButton
                recordType="deal"
                record={deal}
                startTime={new Date(deal.expectedCloseDate).toISOString()}
                endTime={new Date(new Date(deal.expectedCloseDate).getTime() + 60 * 60 * 1000).toISOString()}
                location={deal.Customer?.name || ''}
              />
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setQuoteFormOpen(true)}
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              Teklif Oluştur
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/deals`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <p className="text-gray-600">
              #{dealId.substring(0, 8)} • {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusBadgeClass(deal.stage)}>
            {stageLabels[deal.stage] || deal.stage}
          </Badge>
          <Button variant="outline" onClick={() => router.push(`/${locale}/deals`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          {deal.Customer?.email && (
            <SendEmailButton
              to={deal.Customer.email}
              subject={`Fırsat: ${deal.title}`}
              html={`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    Fırsat Bilgileri
                  </h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>Fırsat:</strong> ${deal.title}</p>
                    <p><strong>Durum:</strong> ${stageLabels[deal.stage] || deal.stage}</p>
                    ${deal.value ? `<p><strong>Tutar:</strong> ${formatCurrency(deal.value)}</p>` : ''}
                    ${deal.expectedCloseDate ? `<p><strong>Beklenen Kapanış:</strong> ${new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}</p>` : ''}
                    ${deal.description ? `<p><strong>Açıklama:</strong><br>${deal.description.replace(/\n/g, '<br>')}</p>` : ''}
                  </div>
                  <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                    Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                  </p>
                </div>
              `}
            />
          )}
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${deal.title} fırsatını silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/deals/${dealId}`, {
                  method: 'DELETE',
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Silme işlemi başarısız')
                }
                router.push(`/${locale}/deals`)
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

      {/* Workflow Stepper */}
      <WorkflowStepper
        steps={getDealWorkflowSteps(deal.stage) as any}
        currentStep={['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON'].indexOf(deal.stage)}
        title="Fırsat İş Akışı"
      />

      {/* Status Info Note */}
      <StatusInfoNote
        entityType="deal"
        status={deal.stage}
        stage={deal.stage}
        relatedRecords={[
          ...(deal.customer ? [{
            type: 'customer',
            count: 1,
            message: `Müşteri: ${deal.customer.name}`
          }] : []),
        ]}
      />

      {/* LOST Durumunda Kayıp Sebebi Gösterimi */}
      {deal.stage === 'LOST' && deal.lostReason && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            🔴 Fırsat Kaybedildi
          </AlertTitle>
          <AlertDescription className="text-red-800 mt-2">
            <p className="font-semibold mb-2">Kayıp Sebebi:</p>
            <p className="whitespace-pre-wrap">{deal.lostReason}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Next Step Buttons */}
      <NextStepButtons
        entityType="deal"
        currentStatus={deal.stage}
        onAction={async (actionId) => {
          // Stage değiştirme işlemi - Optimistic update ile
          try {
            const res = await fetch(`/api/deals/${dealId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stage: actionId }),
            })
            if (!res.ok) {
              const error = await res.json().catch(() => ({}))
              toast.error(
                'Aşama değiştirilemedi',
                error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
              )
              return
            }
            
            const updatedDeal = await res.json()
            
            // Optimistic update - cache'i güncelle (sayfa reload yok)
            await mutateDeal(updatedDeal, { revalidate: false })
            
            // Tüm ilgili cache'leri güncelle
            await Promise.all([
              mutate('/api/deals', undefined, { revalidate: true }),
              mutate('/api/deals?', undefined, { revalidate: true }),
              mutate((key: string) => typeof key === 'string' && key.startsWith('/api/deals'), undefined, { revalidate: true }),
            ])
            
            toast.success('Aşama değiştirildi')
          } catch (error: any) {
            toast.error('Aşama değiştirilemedi', error.message || 'Bir hata oluştu.')
          }
        }}
        onCreateRelated={(type) => {
          // İlişkili kayıt oluşturma - modal aç
          if (type === 'quote') {
            setQuoteFormOpen(true)
          } else if (type === 'meeting') {
            setMeetingFormOpen(true)
          }
        }}
      />

      {/* Related Records Suggestions */}
      <RelatedRecordsSuggestions
        entityType="deal"
        entityId={dealId}
        relatedRecords={[
          ...(deal.Quote || []).map((q: any) => ({
            id: q.id,
            type: 'quote',
            title: q.title,
            link: `/${locale}/quotes/${q.id}`,
          })),
          ...(deal.Meeting || []).map((m: any) => ({
            id: m.id,
            type: 'meeting',
            title: m.title,
            link: `/${locale}/meetings/${m.id}`,
          })),
          ...(deal.Contract || []).map((c: any) => ({
            id: c.id,
            type: 'contract',
            title: c.title,
            link: `/${locale}/contracts/${c.id}`,
          })),
        ]}
        missingRecords={[
          ...(deal.stage === 'CONTACTED' && (!deal.Quote || deal.Quote.length === 0) ? [{
            type: 'quote',
            label: 'Teklif Oluştur',
            icon: <FileText className="h-4 w-4" />,
            onCreate: () => setQuoteFormOpen(true),
            description: 'Bu fırsat için teklif oluşturun',
          }] : []),
          ...(deal.stage === 'PROPOSAL' && (!deal.Meeting || deal.Meeting.length === 0) ? [{
            type: 'meeting',
            label: 'Görüşme Planla',
            icon: <Calendar className="h-4 w-4" />,
            onCreate: () => setMeetingFormOpen(true),
            description: 'Teklif sunumu için görüşme planlayın',
          }] : []),
        ]}
      />

      {/* İlgili Sözleşme */}
      {deal.Contract && deal.Contract.length > 0 && (
        <Card className="p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              İlgili Sözleşme
            </h2>
            {deal.Contract.length > 1 && (
              <Badge variant="outline">{deal.Contract.length} Sözleşme</Badge>
            )}
          </div>
          <div className="space-y-2">
            {deal.Contract.map((contract: any) => (
              <Link
                key={contract.id}
                href={`/${locale}/contracts/${contract.id}`}
                className="block p-4 rounded-lg hover:bg-gray-50 transition-colors border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{contract.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Durum: <Badge className="ml-1">{contract.status}</Badge>
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Detayları Gör →
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Değer</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(deal.value)}</p>
        </Card>

        {deal.leadScore && deal.leadScore.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Lead Score</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{deal.leadScore[0].score}</p>
              <Badge
                className={
                  deal.leadScore[0].temperature === 'HOT'
                    ? 'bg-red-100 text-red-800'
                    : deal.leadScore[0].temperature === 'WARM'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {deal.leadScore[0].temperature === 'HOT'
                  ? '🔥 Sıcak'
                  : deal.leadScore[0].temperature === 'WARM'
                  ? '☀️ Ilık'
                  : '❄️ Soğuk'}
              </Badge>
            </div>
          </Card>
        )}

        {deal.winProbability && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Kazanma İhtimali</span>
            </div>
            <p className="text-2xl font-bold">%{deal.winProbability}</p>
          </Card>
        )}

        {deal.customer && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Müşteri</span>
            </div>
            <p className="text-lg font-semibold truncate">{deal.customer.name}</p>
          </Card>
        )}

        {deal.leadSource && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Lead Kaynağı</span>
            </div>
            <p className="text-lg font-semibold">{deal.leadSource}</p>
          </Card>
        )}
      </div>

      {/* Description Card */}
      {deal.description && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Açıklama</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{deal.description}</p>
        </Card>
      )}

      {/* Audit Trail Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Kayıt Bilgileri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Oluşturulma</p>
            <p className="font-medium mt-1">
              {new Date(deal.createdAt).toLocaleString('tr-TR')}
            </p>
            {deal.CreatedByUser && (
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {deal.CreatedByUser.name}
                </span>
              </div>
            )}
          </div>
      {deal.updatedAt && (
            <div>
              <p className="text-sm text-gray-600">Son Güncelleme</p>
              <p className="font-medium mt-1">
                {new Date(deal.updatedAt).toLocaleString('tr-TR')}
              </p>
              {deal.UpdatedByUser && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {deal.UpdatedByUser.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Form Modals */}
      <DealForm
        deal={deal}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedDeal: Deal) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş deal'i cache'e ekle
          await mutateDeal(savedDeal, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/deals', undefined, { revalidate: true }),
            mutate('/api/deals?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/deals'), undefined, { revalidate: true }),
          ])
        }}
      />

      {/* Stage History Timeline */}
      {deal.history && deal.history.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aşama Geçmişi
          </h2>
          <div className="space-y-4">
            {deal.history.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                {/* Timeline Line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  {index !== deal.history!.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getStatusBadgeClass(item.fromStage)}>
                      {stageLabels[item.fromStage] || item.fromStage}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className={getStatusBadgeClass(item.toStage)}>
                      {stageLabels[item.toStage] || item.toStage}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.user?.name || 'Sistem'} •{' '}
                    {new Date(item.changedAt).toLocaleString('tr-TR')}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Document List */}
      <DocumentList relatedTo="Deal" relatedId={dealId} />

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline entityType="Deal" entityId={dealId} />
      </Card>

      {/* Form Modals */}
      <QuoteForm
        quote={undefined}
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onSuccess={async (savedQuote) => {
          // Cache'i güncelle - optimistic update
          await mutateDeal(undefined, { revalidate: true })
          setQuoteFormOpen(false)
          // Başarılı kayıt sonrası teklif detay sayfasına yönlendir
          router.push(`/${locale}/quotes/${savedQuote.id}`)
        }}
        dealId={dealId}
        customerCompanyId={deal.Customer?.companyId}
        customerCompanyName={deal.Customer?.name}
      />

      <MeetingForm
        meeting={undefined}
        open={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        onSuccess={async (savedMeeting) => {
          // Cache'i güncelle - optimistic update
          await mutateDeal(undefined, { revalidate: true })
          setMeetingFormOpen(false)
          // Başarılı kayıt sonrası görüşme detay sayfasına yönlendir
          router.push(`/${locale}/meetings/${savedMeeting.id}`)
        }}
        dealId={dealId}
        customerCompanyId={deal.Customer?.companyId}
        customerCompanyName={deal.Customer?.name}
      />
    </div>
  )
}
