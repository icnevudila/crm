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
import { toast, confirm } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getQuoteWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import { Calendar } from 'lucide-react'
import QuoteForm from '@/components/quotes/QuoteForm'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import { formatCurrency } from '@/lib/utils'

interface Quote {
  id: string
  quoteNumber: string
  title: string
  status: string
  totalAmount: number
  version: number
  parentQuoteId?: string
  revisionNotes?: string
  notes?: string
  customer?: {
    name: string
  }
  deal?: {
    id: string
    title: string
  }
  Deal?: {
    id: string
    title: string
  }
  invoice?: {
    id: string
    title: string
  }
  Invoice?: {
    id: string
    title: string
  }
  createdAt: string
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const quoteId = params.id as string
  const [creatingRevision, setCreatingRevision] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: quote, isLoading, mutate } = useData<Quote>(`/api/quotes/${quoteId}`)

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
      
      // Yeni quote'a yönlendir
      window.location.href = `/${locale}/quotes/${newQuote.id}`
    } catch (error: any) {
      alert(error.message || 'Revizyon oluşturulamadı')
    } finally {
      setCreatingRevision(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!quote) {
    return <div>Teklif bulunamadı</div>
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-orange-100 text-orange-800',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Taslak',
    SENT: 'Gönderildi',
    ACCEPTED: 'Kabul Edildi',
    REJECTED: 'Reddedildi',
    EXPIRED: 'Süresi Doldu',
  }

  return (
    <div className="space-y-6">
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
          <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
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
                onClick={() => router.push(`/${locale}/quotes/new`)}
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
        steps={getQuoteWorkflowSteps(quote.status)}
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
            toast.success('Durum değiştirildi')
            mutate()
          } catch (error: any) {
            toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'meeting') {
            window.location.href = `/${locale}/meetings/new?quoteId=${quoteId}`
          }
        }}
      />

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
            onCreate: () => window.location.href = `/${locale}/meetings/new?quoteId=${quoteId}`,
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

      {/* Form Modal */}
      <QuoteForm
        quote={quote}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          // Form başarılı olduğunda sayfayı yenile
          mutate()
        }}
      />
    </div>
  )
}
