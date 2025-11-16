'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, FileText, Copy, AlertTriangle, RefreshCw, Plus, Info, Calendar, Download } from 'lucide-react'
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
import jsPDF from 'jspdf'
import { formatCurrency, formatDate, encodeTurkish, PDFStyles, drawHeader, drawTitle, drawSectionBox, drawFooter, drawSignatureArea } from '@/lib/pdf-utils'

const QuoteForm = dynamic(() => import('./QuoteForm'), {
  ssr: false,
  loading: () => null,
})

const MeetingForm = dynamic(() => import('../meetings/MeetingForm'), {
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
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: quote, isLoading, error, mutate: mutateQuote } = useData<any>(
    quoteId && open ? `/api/quotes/${quoteId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  const displayQuote = quote || initialData

  // DEBUG: Quote verilerini kontrol et
  if (process.env.NODE_ENV === 'development' && open) {
    console.log('[QuoteDetailModal] Debug Info:', {
      quoteId,
      open,
      isLoading,
      error: error?.message,
      hasQuote: !!quote,
      hasInitialData: !!initialData,
      displayQuoteStatus: displayQuote?.status,
      displayQuoteTitle: displayQuote?.title,
      displayQuoteKeys: displayQuote ? Object.keys(displayQuote) : [],
    })
  }

  // Loading state - modal açıldığında göster
  if (open && isLoading && !displayQuote) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Teklif Detayları"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </DetailModal>
    )
  }

  // Client-side PDF generation - jsPDF ile (Mevzuata Uygun Teklif Formatı)
  const handleDownloadPDF = () => {
    if (!displayQuote) {
      toast.error('PDF oluşturulamadı', 'Teklif verisi bulunamadı')
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = drawHeader(doc, pageWidth, displayQuote.Company?.name || 'Şirket Adı', displayQuote.Company)

      // Başlık
      yPos = drawTitle(doc, pageWidth, 'TEKLİF', yPos)

      // Teklif Bilgileri
      const validUntilDate = displayQuote.validUntil 
        ? formatDate(displayQuote.validUntil)
        : (() => {
            const today = new Date()
            const validUntil = new Date(today)
            validUntil.setDate(today.getDate() + 15) // Bugün + 15 gün
            return formatDate(validUntil)
          })()

      const quoteInfo: Array<[string, string]> = [
        ['Teklif No:', displayQuote.id?.substring(0, 8).toUpperCase() || displayQuote.quoteNumber || ''],
        ['Başlık:', encodeTurkish(displayQuote.title || '')],
        ['Tarih:', formatDate(displayQuote.createdAt || '')],
        ['Son Geçerlilik:', validUntilDate],
        ['Durum:', encodeTurkish(statusLabels[displayQuote.status] || displayQuote.status || '')],
      ]

      if (displayQuote.version && displayQuote.version > 1) {
        quoteInfo.push(['Versiyon:', `${displayQuote.version}`])
      }

      yPos = drawSectionBox(doc, pageWidth, yPos, 'Teklif Bilgileri', quoteInfo, 70)

      // Müşteri Bilgileri
      const customer = displayQuote.Deal?.Customer || displayQuote.Customer
      if (customer?.name) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 25
        }

        const customerInfo: Array<[string, string]> = [
          ['Müşteri:', encodeTurkish(customer.name || '')]
        ]
        if (customer.email) customerInfo.push(['E-posta:', customer.email])
        if (customer.phone) customerInfo.push(['Telefon:', customer.phone])
        if (customer.city) customerInfo.push(['Şehir:', encodeTurkish(customer.city)])
        if (customer.address) customerInfo.push(['Adres:', encodeTurkish(customer.address)])
        if (customer.taxNumber) customerInfo.push(['VKN/TCKN:', customer.taxNumber])

        yPos = drawSectionBox(doc, pageWidth, yPos, 'Müşteri Bilgileri', customerInfo, 50)
      }

      // Ürün/Hizmet Listesi ve Toplamlar
      if (yPos > pageHeight - 120) {
        doc.addPage()
        yPos = 25
      }

      const totalAmount = displayQuote.totalAmount || displayQuote.total || 0
      const taxRate = displayQuote.taxRate || 18
      const subtotal = totalAmount / (1 + taxRate / 100)
      const kdv = totalAmount - subtotal
      const total = totalAmount

      // Ürün/Hizmet Bilgileri Box
      doc.setFillColor(...PDFStyles.colors.background)
      doc.roundedRect(
        PDFStyles.spacing.margin,
        yPos - 10,
        pageWidth - PDFStyles.spacing.margin * 2,
        80,
        3,
        3,
        'FD'
      )

      doc.setFontSize(PDFStyles.fonts.subtitle)
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(encodeTurkish('Ürün/Hizmet Detayları'), PDFStyles.spacing.margin + 5, yPos)
      yPos += 12

      // Ürün tablosu header
      doc.setFontSize(PDFStyles.fonts.body)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(encodeTurkish('Açıklama'), PDFStyles.spacing.margin + 5, yPos)
      doc.text(encodeTurkish('Miktar'), 120, yPos)
      doc.text(encodeTurkish('Birim Fiyat'), 145, yPos)
      doc.text(encodeTurkish('Toplam'), 175, yPos)
      yPos += 8

      // Çizgi
      doc.setDrawColor(...PDFStyles.colors.border)
      doc.line(PDFStyles.spacing.margin + 5, yPos - 3, pageWidth - PDFStyles.spacing.margin - 5, yPos - 3)
      yPos += 5

      // Ürün satırı
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      const description = encodeTurkish(displayQuote.title || 'Teklif')
      const descriptionLines = doc.splitTextToSize(description, 100)
      descriptionLines.forEach((line: string, index: number) => {
        doc.text(line, PDFStyles.spacing.margin + 5, yPos + (index * 5))
      })
      doc.text('1', 120, yPos)
      doc.text(formatCurrency(subtotal), 145, yPos)
      doc.text(formatCurrency(subtotal), 175, yPos)
      yPos += Math.max(10, descriptionLines.length * 5)

      yPos += 10

      // Toplamlar
      doc.setFontSize(PDFStyles.fonts.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDFStyles.colors.gray)
      doc.text(encodeTurkish('Ara Toplam:'), 145, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(subtotal), 175, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDFStyles.colors.gray)
      doc.text(encodeTurkish(`KDV (%${taxRate}):`), 145, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(kdv), 175, yPos)
      yPos += 10

      // Genel Toplam
      doc.setDrawColor(...PDFStyles.colors.primary)
      doc.line(145, yPos - 3, pageWidth - PDFStyles.spacing.margin - 5, yPos - 3)
      yPos += 5
      doc.setFontSize(PDFStyles.fonts.subtitle)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.text(encodeTurkish('GENEL TOPLAM:'), 145, yPos)
      doc.setFontSize(PDFStyles.fonts.title - 4)
      doc.text(formatCurrency(total), 175, yPos)
      yPos += 15

      // Notlar (varsa)
      if (displayQuote.notes) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = 25
        }

        doc.setFontSize(PDFStyles.fonts.subtitle)
        doc.setTextColor(...PDFStyles.colors.primary)
        doc.setFont('helvetica', 'bold')
        doc.text(encodeTurkish('Notlar'), PDFStyles.spacing.margin, yPos)
        yPos += 8

        doc.setFontSize(PDFStyles.fonts.body)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        const notesLines = doc.splitTextToSize(encodeTurkish(displayQuote.notes), pageWidth - 40)
        notesLines.forEach((line: string) => {
          doc.text(line, PDFStyles.spacing.margin, yPos)
          yPos += 5
        })

        yPos += 10
      }

      // İmza Alanı
      if (yPos > pageHeight - 55) {
        doc.addPage()
        yPos = pageHeight - 55
      } else {
        yPos = pageHeight - 55
      }

      drawSignatureArea(doc, pageWidth, yPos)

      // Footer
      const reportDate = formatDate(displayQuote.createdAt || new Date().toISOString())
      drawFooter(doc, pageWidth, pageHeight, reportDate)

      // Son geçerlilik tarihi notu
      yPos = pageHeight - 5
      doc.setFontSize(PDFStyles.fonts.tiny)
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(
        encodeTurkish(`Son geçerlilik tarihi: ${validUntilDate}`),
        pageWidth / 2,
        yPos,
        { align: 'center' }
      )

      // PDF'i indir
      const fileName = `teklif-${displayQuote.id?.substring(0, 8) || 'rapor'}.pdf`
      doc.save(fileName)
      toast.success('PDF başarıyla indirildi')
    } catch (error: any) {
      console.error('PDF generation error:', error)
      toast.error('PDF oluşturulamadı', error?.message || 'Beklenmeyen bir hata oluştu')
    }
  }

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

  // ✅ ÇÖZÜM: quoteId null kontrolü - modal açılmadan önce kontrol et
  if (!open) return null
  
  if (!quoteId) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Teklif ID bulunamadı</p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
        </div>
      </DetailModal>
    )
  }

  // Loading state - modal açıldığında göster
  if (isLoading && !initialData && !displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Teklif Detayları" size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </DetailModal>
    )
  }

  // Error state - API hatası veya veri bulunamadı
  if (error && !initialData && !displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">
            {error?.message?.includes('404') || error?.message?.includes('bulunamadı')
              ? 'Teklif bulunamadı'
              : 'Teklif yüklenemedi'}
          </p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
        </div>
      </DetailModal>
    )
  }

  // Veri yoksa göster
  if (!displayQuote) {
    return (
      <DetailModal open={open} onClose={onClose} title="Teklif Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Teklif bulunamadı</p>
          <Button onClick={onClose} className="bg-gradient-primary text-white">
            Kapat
          </Button>
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
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pb-4 border-b">
            <Badge className={statusColors[displayQuote?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayQuote?.status] || displayQuote?.status}
            </Badge>
            {displayQuote?.parentQuoteId && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Revizyon
              </Badge>
            )}
            <Button
              className="bg-gradient-primary text-white w-full sm:w-auto"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
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
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button
                    onClick={handleCreateRevision}
                    disabled={creatingRevision}
                    className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {creatingRevision ? 'Oluşturuluyor...' : 'Revizyon Oluştur'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Stepper */}
          {displayQuote?.status ? (() => {
            const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
            const currentStepIndex = validStatuses.indexOf(displayQuote.status)
            const steps = getQuoteWorkflowSteps(displayQuote.status)
            
            // DEBUG: Workflow stepper hesaplama
            if (process.env.NODE_ENV === 'development') {
              console.log('[QuoteDetailModal] Workflow Stepper Debug:', {
                status: displayQuote.status,
                currentStepIndex,
                stepsCount: steps.length,
                steps: steps.map(s => ({ id: s.id, label: s.label, status: s.status })),
              })
            }
            
            // currentStepIndex -1 ise (status listede yoksa) veya steps boşsa göster
            if (currentStepIndex === -1 || steps.length === 0) {
              if (process.env.NODE_ENV === 'development') {
                return (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Workflow Stepper gösterilemedi: status = {String(displayQuote.status)} (geçersiz status)
                    </p>
                  </div>
                )
              }
              return null
            }
            
            return (
              <WorkflowStepper
                steps={steps}
                currentStep={currentStepIndex}
                title="Teklif İş Akışı"
              />
            )
          })() : (
            process.env.NODE_ENV === 'development' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Workflow Stepper gösterilemedi: status = {String(displayQuote?.status ?? 'undefined')}
                </p>
              </div>
            )
          )}

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
              if (type === 'meeting') {
                setMeetingFormOpen(true)
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
                  setMeetingFormOpen(true)
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

      {/* Meeting Form Modal */}
      <MeetingForm
        meeting={undefined}
        open={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        quoteId={quoteId || undefined}
        customerCompanyId={displayQuote?.customerCompanyId}
        onSuccess={async (savedMeeting: any) => {
          // Cache'i güncelle - optimistic update
          await mutateQuote()
          setMeetingFormOpen(false)
          // Başarılı kayıt sonrası görüşme detay sayfasına yönlendir
          router.push(`/${locale}/meetings/${savedMeeting.id}`)
        }}
      />
    </>
  )
}

