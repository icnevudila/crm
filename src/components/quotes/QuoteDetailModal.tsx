'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, FileText, Copy, AlertTriangle, RefreshCw, Plus, Info, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast, confirm } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getQuoteWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

const QuoteForm = dynamic(() => import('./QuoteForm'), {
  ssr: false,
  loading: () => null,
})

interface QuoteDetailModalProps {
  quoteId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-600 text-white border-gray-700',
  SENT: 'bg-blue-600 text-white border-blue-700',
  ACCEPTED: 'bg-green-600 text-white border-green-700',
  REJECTED: 'bg-red-600 text-white border-red-700',
  EXPIRED: 'bg-orange-600 text-white border-orange-700',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  EXPIRED: 'Süresi Doldu',
}

export default function QuoteDetailModal({
  quoteId,
  open,
  onClose,
  initialData,
}: QuoteDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [creatingRevision, setCreatingRevision] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: quote, isLoading, error, mutate: mutateQuote } = useData<any>(
    quoteId && open ? `/api/quotes/${quoteId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayQuote = quote || initialData

  const handleDelete = async () => {
    if (!displayQuote || !confirm(`${displayQuote.title} teklifini silmek istediğinize emin misiniz?`)) {
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

      toast.success('Teklif silindi')
      
      await mutate('/api/quotes')
      await mutate(`/api/quotes/${quoteId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCreateRevision = async () => {
    if (!(await confirm('Bu teklifin yeni bir revizyonunu oluşturmak istiyor musunuz?'))) {
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
      
      onClose()
      router.push(`/${locale}/quotes/${newQuote.id}`)
    } catch (error: any) {
      toast.error('Revizyon oluşturulamadı', error.message)
    } finally {
      setCreatingRevision(false)
    }
  }

  if (!open || !quoteId) return null

  if (isLoading && !initialData && !displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Teklif Detayları" size="xl">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Teklif yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Teklif Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Teklif bulunamadı</p>
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
        title={displayQuote?.title || 'Teklif Detayları'}
        description={`${displayQuote?.quoteNumber || ''} • Versiyon ${displayQuote?.version || 1}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end gap-2 pb-4 border-b">
            <Badge className={statusColors[displayQuote?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayQuote?.status] || displayQuote?.status}
            </Badge>
            {displayQuote?.parentQuoteId && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Revizyon
              </Badge>
            )}
            <Button variant="outline" onClick={() => setFormOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteLoading || displayQuote?.status === 'ACCEPTED'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* EXPIRED Uyarısı */}
          {displayQuote?.status === 'EXPIRED' && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900 font-semibold">
                ⚠️ Bu Teklif Süresi Doldu
              </AlertTitle>
              <AlertDescription className="text-orange-800 mt-2">
                <p className="mb-3">
                  Bu teklif 30 gün geçtiği için otomatik olarak süresi doldu (EXPIRED).
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
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Stepper */}
          <WorkflowStepper
            steps={getQuoteWorkflowSteps(displayQuote?.status)}
            currentStep={['DRAFT', 'SENT', 'ACCEPTED'].indexOf(displayQuote?.status)}
            title="Teklif İş Akışı"
          />

          {/* Status Info Note */}
          <StatusInfoNote
            entityType="quote"
            status={displayQuote?.status}
            relatedRecords={[
              ...(displayQuote?.customer ? [{
                type: 'customer',
                count: 1,
                message: `Müşteri: ${displayQuote.customer.name}`
              }] : []),
            ]}
          />

          {/* Next Step Buttons */}
          <NextStepButtons
            entityType="quote"
            currentStatus={displayQuote?.status}
            onAction={async (actionId) => {
              try {
                const res = await fetch(`/api/quotes/${quoteId}`, {
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
                await mutateQuote()
              } catch (error: any) {
                toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
              }
            }}
            onCreateRelated={(type) => {
              onClose()
              if (type === 'meeting') {
                router.push(`/${locale}/meetings/new?quoteId=${quoteId}`)
              }
            }}
          />

          {/* Related Records Suggestions */}
          <RelatedRecordsSuggestions
            entityType="quote"
            entityId={quoteId || ''}
            relatedRecords={[
              ...(displayQuote?.deal || displayQuote?.Deal ? [{
                id: (displayQuote.deal || displayQuote.Deal)!.id,
                type: 'deal',
                title: (displayQuote.deal || displayQuote.Deal)!.title,
                link: `/${locale}/deals/${(displayQuote.deal || displayQuote.Deal)!.id}`,
              }] : []),
              ...(displayQuote?.invoice || displayQuote?.Invoice ? [{
                id: (displayQuote.invoice || displayQuote.Invoice)!.id,
                type: 'invoice',
                title: (displayQuote.invoice || displayQuote.Invoice)!.title,
                link: `/${locale}/invoices/${(displayQuote.invoice || displayQuote.Invoice)!.id}`,
              }] : []),
            ]}
            missingRecords={[
              ...(displayQuote?.status === 'SENT' ? [{
                type: 'meeting',
                label: 'Görüşme Planla',
                icon: <Calendar className="h-4 w-4" />,
                onCreate: () => {
                  onClose()
                  router.push(`/${locale}/meetings/new?quoteId=${quoteId}`)
                },
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
                  }).format(displayQuote?.totalAmount || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Müşteri</p>
                <p className="text-lg font-semibold">
                  {displayQuote?.customer?.name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Oluşturulma Tarihi</p>
                <p className="text-lg font-semibold">
                  {displayQuote?.createdAt ? new Date(displayQuote.createdAt).toLocaleDateString('tr-TR') : '-'}
                </p>
              </div>
            </div>

            {displayQuote?.revisionNotes && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">Revizyon Notları:</p>
                <p className="text-sm text-blue-800">{displayQuote.revisionNotes}</p>
              </div>
            )}

            {displayQuote?.status === 'REJECTED' && displayQuote?.notes && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-900">REDDEDİLDİ</p>
                </div>
                <p className="text-sm font-semibold text-red-800 mb-2">Reddetme Sebebi:</p>
                <p className="text-sm text-red-700 whitespace-pre-wrap">
                  {displayQuote.notes.includes('Sebep:') 
                    ? displayQuote.notes.split('Sebep:')[1]?.trim() || displayQuote.notes
                    : displayQuote.notes
                  }
                </p>
              </div>
            )}
          </Card>

          {/* Actions */}
          {displayQuote?.status !== 'ACCEPTED' && displayQuote?.status !== 'REJECTED' && (
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
        </div>
      </DetailModal>

      {/* Form Modal */}
      <QuoteForm
        quote={displayQuote || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateQuote()
          await mutate(`/api/quotes/${quoteId}`)
        }}
      />
    </>
  )
}

