'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Calendar, DollarSign, User, TrendingUp, Clock, FileText, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getDealWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import DealForm from '@/components/deals/DealForm'
import SendEmailButton from '@/components/integrations/SendEmailButton'

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
  leadScore?: {
    score: number
    temperature: string
  }[]
  customer?: {
    name: string
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

async function fetchDealDetail(id: string): Promise<Deal> {
  const res = await fetch(`/api/deals/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch deal')
  return res.json()
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACT: 'İletişim',
  DEMO: 'Demo',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-gray-100 text-gray-800',
  CONTACT: 'bg-blue-100 text-blue-800',
  DEMO: 'bg-cyan-100 text-cyan-800',
  PROPOSAL: 'bg-purple-100 text-purple-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const dealId = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal-detail', dealId],
    queryFn: () => fetchDealDetail(dealId),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!deal) {
    return <div>Deal bulunamadı</div>
  }

  return (
    <div className="space-y-6">
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
          <Badge className={stageColors[deal.stage] || 'bg-gray-100'}>
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
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper
        steps={getDealWorkflowSteps(deal.stage)}
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
          // Stage değiştirme işlemi
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
            toast.success('Aşama değiştirildi')
            window.location.reload()
          } catch (error: any) {
            toast.error('Aşama değiştirilemedi', error.message || 'Bir hata oluştu.')
          }
        }}
        onCreateRelated={(type) => {
          // İlişkili kayıt oluşturma
          if (type === 'quote') {
            window.location.href = `/${locale}/quotes/new?dealId=${dealId}`
          } else if (type === 'meeting') {
            window.location.href = `/${locale}/meetings/new?dealId=${dealId}`
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
            onCreate: () => window.location.href = `/${locale}/quotes/new?dealId=${dealId}`,
            description: 'Bu fırsat için teklif oluşturun',
          }] : []),
          ...(deal.stage === 'PROPOSAL' && (!deal.Meeting || deal.Meeting.length === 0) ? [{
            type: 'meeting',
            label: 'Görüşme Planla',
            icon: <Calendar className="h-4 w-4" />,
            onCreate: () => window.location.href = `/${locale}/meetings/new?dealId=${dealId}`,
            description: 'Teklif sunumu için görüşme planlayın',
          }] : []),
        ]}
      />

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
      </div>

      {/* Form Modal */}
      <DealForm
        deal={deal}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          // Form başarılı olduğunda sayfayı yenile
          window.location.reload()
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
                    <Badge className={stageColors[item.fromStage] || 'bg-gray-100'}>
                      {stageLabels[item.fromStage] || item.fromStage}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <Badge className={stageColors[item.toStage] || 'bg-gray-100'}>
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
    </div>
  )
}
