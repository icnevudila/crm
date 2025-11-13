'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Calendar, DollarSign, User, TrendingUp, Clock, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getDealWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const DealForm = dynamic(() => import('./DealForm'), {
  ssr: false,
  loading: () => null,
})

interface DealDetailModalProps {
  dealId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
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
  LEAD: 'bg-gray-600 text-white border-gray-700',
  CONTACT: 'bg-blue-600 text-white border-blue-700',
  DEMO: 'bg-cyan-600 text-white border-cyan-700',
  PROPOSAL: 'bg-purple-600 text-white border-purple-700',
  NEGOTIATION: 'bg-orange-600 text-white border-orange-700',
  WON: 'bg-green-600 text-white border-green-700',
  LOST: 'bg-red-600 text-white border-red-700',
}

export default function DealDetailModal({
  dealId,
  open,
  onClose,
  initialData,
}: DealDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: deal, isLoading, error, mutate: mutateDeal } = useData<any>(
    dealId && open ? `/api/deals/${dealId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayDeal = deal || initialData

  const handleDelete = async () => {
    if (!displayDeal || !confirm(`${displayDeal.title} fırsatını silmek istediğinize emin misiniz?`)) {
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

      toast.success('Fırsat silindi')
      
      await mutate('/api/deals')
      await mutate(`/api/deals/${dealId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !dealId) return null

  if (isLoading && !initialData && !displayDeal) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fırsat Detayları" size="xl">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayDeal) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fırsat yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayDeal) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fırsat Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fırsat bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayDeal?.title || 'Fırsat Detayları'}
        description={`#${dealId?.substring(0, 8)} • ${displayDeal?.createdAt ? new Date(displayDeal.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Badge className={stageColors[displayDeal?.stage] || 'bg-gray-600 text-white border-gray-700'}>
              {stageLabels[displayDeal?.stage] || displayDeal?.stage}
            </Badge>
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
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* Workflow Stepper */}
          <WorkflowStepper
            steps={getDealWorkflowSteps(displayDeal?.stage)}
            currentStep={['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON'].indexOf(displayDeal?.stage)}
            title="Fırsat İş Akışı"
          />

          {/* Status Info Note */}
          <StatusInfoNote
            entityType="deal"
            status={displayDeal?.stage}
            stage={displayDeal?.stage}
            relatedRecords={[
              ...(displayDeal?.customer ? [{
                type: 'customer',
                count: 1,
                message: `Müşteri: ${displayDeal.customer.name}`
              }] : []),
            ]}
          />

          {/* LOST Durumunda Kayıp Sebebi */}
          {displayDeal?.stage === 'LOST' && displayDeal?.lostReason && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                🔴 Fırsat Kaybedildi
              </AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                <p className="font-semibold mb-2">Kayıp Sebebi:</p>
                <p className="whitespace-pre-wrap">{displayDeal.lostReason}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Next Step Buttons */}
          <NextStepButtons
            entityType="deal"
            currentStatus={displayDeal?.stage}
            onAction={async (actionId) => {
              try {
                const res = await fetch(`/api/deals/${dealId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ stage: actionId }),
                })
                if (!res.ok) {
                  const error = await res.json().catch(() => ({}))
                  toast.error('Aşama değiştirilemedi', error.message || 'Bir hata oluştu.')
                  return
                }
                toast.success('Aşama değiştirildi')
                await mutateDeal()
              } catch (error: any) {
                toast.error('Aşama değiştirilemedi', error.message || 'Bir hata oluştu.')
              }
            }}
            onCreateRelated={(type) => {
              onClose()
              if (type === 'quote') {
                router.push(`/${locale}/quotes/new?dealId=${dealId}`)
              } else if (type === 'meeting') {
                router.push(`/${locale}/meetings/new?dealId=${dealId}`)
              }
            }}
          />

          {/* Related Records Suggestions */}
          <RelatedRecordsSuggestions
            entityType="deal"
            entityId={dealId || ''}
            relatedRecords={[
              ...(displayDeal?.Quote || []).map((q: any) => ({
                id: q.id,
                type: 'quote',
                title: q.title,
                link: `/${locale}/quotes/${q.id}`,
              })),
              ...(displayDeal?.Meeting || []).map((m: any) => ({
                id: m.id,
                type: 'meeting',
                title: m.title,
                link: `/${locale}/meetings/${m.id}`,
              })),
              ...(displayDeal?.Contract || []).map((c: any) => ({
                id: c.id,
                type: 'contract',
                title: c.title,
                link: `/${locale}/contracts/${c.id}`,
              })),
            ]}
            missingRecords={[
              ...(displayDeal?.stage === 'CONTACTED' && (!displayDeal?.Quote || displayDeal.Quote.length === 0) ? [{
                type: 'quote',
                label: 'Teklif Oluştur',
                icon: <FileText className="h-4 w-4" />,
                onCreate: () => {
                  onClose()
                  router.push(`/${locale}/quotes/new?dealId=${dealId}`)
                },
                description: 'Bu fırsat için teklif oluşturun',
              }] : []),
              ...(displayDeal?.stage === 'PROPOSAL' && (!displayDeal?.Meeting || displayDeal.Meeting.length === 0) ? [{
                type: 'meeting',
                label: 'Görüşme Planla',
                icon: <Calendar className="h-4 w-4" />,
                onCreate: () => {
                  onClose()
                  router.push(`/${locale}/meetings/new?dealId=${dealId}`)
                },
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
              <p className="text-2xl font-bold">{formatCurrency(displayDeal?.value || 0)}</p>
            </Card>

            {displayDeal?.leadScore && displayDeal.leadScore.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Lead Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{displayDeal.leadScore[0].score}</p>
                  <Badge
                    className={
                      displayDeal.leadScore[0].temperature === 'HOT'
                        ? 'bg-red-600 text-white border-red-700'
                        : displayDeal.leadScore[0].temperature === 'WARM'
                        ? 'bg-orange-600 text-white border-orange-700'
                        : 'bg-blue-600 text-white border-blue-700'
                    }
                  >
                    {displayDeal.leadScore[0].temperature === 'HOT'
                      ? '🔥 Sıcak'
                      : displayDeal.leadScore[0].temperature === 'WARM'
                      ? '☀️ Ilık'
                      : '❄️ Soğuk'}
                  </Badge>
                </div>
              </Card>
            )}

            {displayDeal?.winProbability && (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Kazanma İhtimali</span>
                </div>
                <p className="text-2xl font-bold">%{displayDeal.winProbability}</p>
              </Card>
            )}

            {displayDeal?.customer && (
              <Card className="p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Müşteri</span>
                </div>
                <p className="text-lg font-semibold truncate">{displayDeal.customer.name}</p>
              </Card>
            )}
          </div>

          {/* Stage History Timeline */}
          {displayDeal?.history && displayDeal.history.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Aşama Geçmişi
              </h2>
              <div className="space-y-4">
                {displayDeal.history.map((item: any, index: number) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      {index !== displayDeal.history.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={stageColors[item.fromStage] || 'bg-gray-600 text-white border-gray-700'}>
                          {stageLabels[item.fromStage] || item.fromStage}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge className={stageColors[item.toStage] || 'bg-gray-600 text-white border-gray-700'}>
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
      </DetailModal>

      {/* Form Modal */}
      <DealForm
        deal={displayDeal || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateDeal()
          await mutate(`/api/deals/${dealId}`)
        }}
      />
    </>
  )
}

