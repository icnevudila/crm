'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, DollarSign, User, TrendingUp, Clock, FileText, AlertTriangle, Edit, Trash2, Briefcase, FileText as FileTextIcon, Zap, Target, Percent } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
<<<<<<< HEAD
import { toast, confirm } from '@/lib/toast'
=======
import { toast, toastError } from '@/lib/toast'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { getStatusBadgeClass } from '@/lib/crm-colors'
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8
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
<<<<<<< HEAD
  priorityScore?: number
  isPriority?: boolean
=======
  description?: string
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8
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
            toastError('Silme işlemi başarısız oldu', error?.message || 'Fırsat silinirken bir hata oluştu')
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
            toast.success('Fırsat kopyalandı', { description: 'Fırsat başarıyla kopyalandı' })
            router.push(`/${locale}/deals/${duplicatedDeal.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message || 'Fırsat kopyalanırken bir hata oluştu')
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

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/deals`)}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg ring-4 ring-blue-100/50"
            >
              <Briefcase className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {deal.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={getStatusBadgeClass(deal.stage)}>
                  {stageLabels[deal.stage] || deal.stage}
                </Badge>
                {deal.value && (
                  <p className="text-gray-600 font-semibold">
                    {formatCurrency(deal.value)}
                  </p>
                )}
                {deal.winProbability && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Target className="h-4 w-4" />
                    <span className="text-sm font-medium">{deal.winProbability}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Premium Tasarım */}
      {deal.Customer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-blue-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hızlı İşlemler
              </h2>
            </div>
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
        </motion.div>
      )}

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
            
            toast.success('Aşama değiştirildi', { description: 'Fırsat aşaması başarıyla güncellendi' })
          } catch (error: any) {
            toast.error('Aşama değiştirilemedi', { description: error.message || 'Bir hata oluştu.' })
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

<<<<<<< HEAD
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Değer</span>
=======
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
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8
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

      {/* İstatistikler ve Özet - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Değer - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GradientCard
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-500"
            className="p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white/90">Fırsat Değeri</h3>
            </div>
            <p className="text-3xl font-bold text-white mb-2">{formatCurrency(deal.value)}</p>
            {deal.expectedCloseDate && (
              <p className="text-xs text-white/80">
                Beklenen: {new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}
              </p>
            )}
          </GradientCard>
        </motion.div>

        {/* Lead Score - Premium Card */}
        {deal.leadScore && deal.leadScore.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GradientCard
              gradientFrom="from-orange-500"
              gradientTo="to-red-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Lead Score</h3>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-white">{deal.leadScore[0].score}</p>
                <Badge
                  className={
                    deal.leadScore[0].temperature === 'HOT'
                      ? 'bg-white/30 text-white border-white/50'
                      : deal.leadScore[0].temperature === 'WARM'
                      ? 'bg-white/20 text-white border-white/40'
                      : 'bg-white/10 text-white border-white/30'
                  }
                >
                  {deal.leadScore[0].temperature === 'HOT'
                    ? '🔥 Sıcak'
                    : deal.leadScore[0].temperature === 'WARM'
                    ? '☀️ Ilık'
                    : '❄️ Soğuk'}
                </Badge>
              </div>
            </GradientCard>
          </motion.div>
        )}

<<<<<<< HEAD
        {deal.priorityScore !== undefined && deal.priorityScore !== null && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Öncelik Skoru</span>
              </div>
              {deal.isPriority && (
                <Badge className="bg-red-100 text-red-800 border-red-300">
                  🔥 Öncelikli
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-indigo-600">{Math.round(deal.priorityScore)}</p>
          </Card>
        )}

        {deal.leadSource && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Kaynak</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {deal.leadSource === 'WEB' ? '🌐 Web Sitesi' :
               deal.leadSource === 'EMAIL' ? '📧 E-posta' :
               deal.leadSource === 'PHONE' ? '📞 Telefon' :
               deal.leadSource === 'REFERRAL' ? '👥 Referans' :
               deal.leadSource === 'SOCIAL' ? '📱 Sosyal Medya' :
               deal.leadSource === 'OTHER' ? '📋 Diğer' :
               deal.leadSource}
            </Badge>
          </Card>
        )}

=======
        {/* Kazanma İhtimali - Premium Card */}
>>>>>>> 2f6c0097c017a17c4f8c673c6450be3bfcfd0aa8
        {deal.winProbability && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GradientCard
              gradientFrom="from-blue-500"
              gradientTo="to-indigo-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Kazanma İhtimali</h3>
              </div>
              <p className="text-3xl font-bold text-white">%{deal.winProbability}</p>
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${deal.winProbability}%` }}
                />
              </div>
            </GradientCard>
          </motion.div>
        )}

        {/* Lead Kaynağı - Premium Card */}
        {deal.leadSource && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GradientCard
              gradientFrom="from-purple-500"
              gradientTo="to-pink-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Lead Kaynağı</h3>
              </div>
              <p className="text-lg font-bold text-white">{deal.leadSource}</p>
            </GradientCard>
          </motion.div>
        )}
      </div>

      {/* İlişkili Kayıtlar Özeti - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Teklifler - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GradientCard
            gradientFrom="from-green-500"
            gradientTo="to-emerald-500"
            className="p-6 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              if (deal.Quote && deal.Quote.length > 0) {
                router.push(`/${locale}/quotes?dealId=${dealId}`)
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Teklifler</h3>
              </div>
              <Badge className="bg-white/30 text-white border-white/50">
                {deal.Quote?.length || 0}
              </Badge>
            </div>
            {deal.Quote && deal.Quote.length > 0 && (
              <div className="space-y-2">
                {deal.Quote.slice(0, 2).map((quote: any) => (
                  <div key={quote.id} className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white truncate">{quote.title}</p>
                    <p className="text-xs text-white/80">
                      {formatCurrency(quote.totalAmount || 0)}
                    </p>
                  </div>
                ))}
                {deal.Quote.length > 2 && (
                  <p className="text-xs text-white/70">+{deal.Quote.length - 2} daha fazla</p>
                )}
              </div>
            )}
            {(!deal.Quote || deal.Quote.length === 0) && (
              <p className="text-sm text-white/70">Henüz teklif oluşturulmamış</p>
            )}
          </GradientCard>
        </motion.div>

        {/* Toplantılar - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GradientCard
            gradientFrom="from-violet-500"
            gradientTo="to-purple-500"
            className="p-6 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              if (deal.Meeting && deal.Meeting.length > 0) {
                router.push(`/${locale}/meetings?dealId=${dealId}`)
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Toplantılar</h3>
              </div>
              <Badge className="bg-white/30 text-white border-white/50">
                {deal.Meeting?.length || 0}
              </Badge>
            </div>
            {deal.Meeting && deal.Meeting.length > 0 && (
              <div className="space-y-2">
                {deal.Meeting.slice(0, 2).map((meeting: any) => (
                  <div key={meeting.id} className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white truncate">{meeting.title}</p>
                    <p className="text-xs text-white/80">
                      {new Date(meeting.meetingDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                ))}
                {deal.Meeting.length > 2 && (
                  <p className="text-xs text-white/70">+{deal.Meeting.length - 2} daha fazla</p>
                )}
              </div>
            )}
            {(!deal.Meeting || deal.Meeting.length === 0) && (
              <p className="text-sm text-white/70">Henüz toplantı planlanmamış</p>
            )}
          </GradientCard>
        </motion.div>

        {/* Sözleşmeler - Premium Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GradientCard
            gradientFrom="from-amber-500"
            gradientTo="to-orange-500"
            className="p-6 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => {
              if (deal.Contract && deal.Contract.length > 0) {
                router.push(`/${locale}/contracts?dealId=${dealId}`)
              }
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FileTextIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Sözleşmeler</h3>
              </div>
              <Badge className="bg-white/30 text-white border-white/50">
                {deal.Contract?.length || 0}
              </Badge>
            </div>
            {deal.Contract && deal.Contract.length > 0 && (
              <div className="space-y-2">
                {deal.Contract.slice(0, 2).map((contract: any) => (
                  <div key={contract.id} className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white truncate">{contract.title}</p>
                    <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">
                      {contract.status}
                    </Badge>
                  </div>
                ))}
                {deal.Contract.length > 2 && (
                  <p className="text-xs text-white/70">+{deal.Contract.length - 2} daha fazla</p>
                )}
              </div>
            )}
            {(!deal.Contract || deal.Contract.length === 0) && (
              <p className="text-sm text-white/70">Henüz sözleşme oluşturulmamış</p>
            )}
          </GradientCard>
        </motion.div>

        {/* Müşteri Bilgisi - Premium Card */}
        {deal.Customer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GradientCard
              gradientFrom="from-cyan-500"
              gradientTo="to-blue-500"
              className="p-6 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => router.push(`/${locale}/customers/${deal.Customer?.id}`)}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white/90">Müşteri</h3>
              </div>
              <p className="text-lg font-bold text-white mb-2 truncate">{deal.Customer.name}</p>
              {deal.Customer.email && (
                <p className="text-xs text-white/80 truncate">{deal.Customer.email}</p>
              )}
              {deal.Customer.phone && (
                <p className="text-xs text-white/80 mt-1">{deal.Customer.phone}</p>
              )}
            </GradientCard>
          </motion.div>
        )}
      </div>

      {/* Finansal Özet - Premium Card */}
      {deal.Quote && deal.Quote.length > 0 && (() => {
        const totalQuoteValue = deal.Quote.reduce((sum: number, q: any) => sum + (q.totalAmount || 0), 0)
        const acceptedQuotes = deal.Quote.filter((q: any) => q.status === 'ACCEPTED')
        const totalAcceptedValue = acceptedQuotes.reduce((sum: number, q: any) => sum + (q.totalAmount || 0), 0)
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GradientCard
              gradientFrom="from-indigo-500"
              gradientTo="to-blue-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Finansal Özet</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-white/80 mb-2">Toplam Teklif Değeri</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalQuoteValue)}</p>
                  <p className="text-xs text-white/70 mt-1">{deal.Quote.length} teklif</p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-white/80 mb-2">Kabul Edilen Teklifler</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(totalAcceptedValue)}</p>
                  <p className="text-xs text-white/70 mt-1">{acceptedQuotes.length} kabul edildi</p>
                </div>
                <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm text-white/80 mb-2">Fırsat Değeri</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(deal.value)}</p>
                  <p className="text-xs text-white/70 mt-1">
                    {deal.winProbability ? `%${deal.winProbability} kazanma ihtimali` : 'Beklemede'}
                  </p>
                </div>
              </div>
            </GradientCard>
          </motion.div>
        )
      })()}

      {/* Açıklama - Premium Card */}
      {deal.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GradientCard
            gradientFrom="from-slate-500"
            gradientTo="to-gray-500"
            className="p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Açıklama</h2>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{deal.description}</p>
            </div>
          </GradientCard>
        </motion.div>
      )}

      {/* Kayıt Bilgileri - Premium Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GradientCard
          gradientFrom="from-gray-500"
          gradientTo="to-slate-500"
          className="p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Kayıt Bilgileri</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-white/80 mb-2">Oluşturulma</p>
              <p className="font-semibold text-white mb-2">
                {new Date(deal.createdAt).toLocaleString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {deal.CreatedByUser && (
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">
                    {deal.CreatedByUser.name}
                  </span>
                </div>
              )}
            </div>
            {deal.updatedAt && (
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-white/80 mb-2">Son Güncelleme</p>
                <p className="font-semibold text-white mb-2">
                  {new Date(deal.updatedAt).toLocaleString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {deal.UpdatedByUser && (
                  <div className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4 text-white/70" />
                    <span className="text-sm text-white/80">
                      {deal.UpdatedByUser.name}
                    </span>
                  </div>
                )}
              </div>
            )}
            {deal.expectedCloseDate && (
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-white/80 mb-2">Beklenen Kapanış</p>
                <p className="font-semibold text-white mb-2">
                  {new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {new Date(deal.expectedCloseDate) < new Date() && (
                  <Badge className="bg-red-500/30 text-white border-red-400/50 text-xs mt-2">
                    Gecikmiş
                  </Badge>
                )}
              </div>
            )}
            {deal.leadSource && (
              <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-white/80 mb-2">Lead Kaynağı</p>
                <p className="font-semibold text-white">{deal.leadSource}</p>
              </div>
            )}
          </div>
        </GradientCard>
      </motion.div>

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
