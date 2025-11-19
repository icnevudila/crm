'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, FileText, Phone, Mail, AlertTriangle, Package, Truck, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import { toast, confirm } from '@/lib/toast'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { getInvoiceWorkflowSteps } from '@/lib/workflowSteps'
import StatusInfoNote from '@/components/workflow/StatusInfoNote'
import NextStepButtons from '@/components/workflow/NextStepButtons'
import RelatedRecordsSuggestions from '@/components/workflow/RelatedRecordsSuggestions'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import jsPDF from 'jspdf'
import { formatDate, encodeTurkish, PDFStyles, drawTitle, drawSectionBox, drawFooter, drawSignatureArea } from '@/lib/pdf-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const InvoiceForm = dynamic(() => import('./InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

const InvoiceItemForm = dynamic(() => import('./InvoiceItemForm'), {
  ssr: false,
  loading: () => null,
})

interface InvoiceDetailModalProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-600 text-white border-gray-700',
  SENT: 'bg-blue-600 text-white border-blue-700',
  SHIPPED: 'bg-green-600 text-white border-green-700',
  RECEIVED: 'bg-teal-600 text-white border-teal-700',
  PAID: 'bg-emerald-600 text-white border-emerald-700',
  OVERDUE: 'bg-red-600 text-white border-red-700',
  CANCELLED: 'bg-yellow-600 text-white border-yellow-700',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyatı Yapıldı',
  RECEIVED: 'Mal Kabul Edildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

export default function InvoiceDetailModal({
  invoiceId,
  open,
  onClose,
  initialData,
}: InvoiceDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: invoice, isLoading, error, mutate: mutateInvoice } = useData<any>(
    invoiceId && open ? `/api/invoices/${invoiceId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  const displayInvoice = invoice || initialData

  // Client-side PDF generation - jsPDF ile (Türkiye Fatura Mevzuatına Uygun)
  const handleDownloadPDF = () => {
    if (!displayInvoice) {
      toast.error('PDF oluşturulamadı', 'Fatura verisi bulunamadı')
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPos = 25

      // Header - Üst çizgi
      doc.setDrawColor(...PDFStyles.colors.primary)
      doc.setLineWidth(2)
      doc.line(PDFStyles.spacing.margin, 18, pageWidth - PDFStyles.spacing.margin, 18)

      // İki sütunlu header: Satıcı (sol) ve Alıcı (sağ)
      // Satıcı Bilgileri (Sol)
      doc.setFontSize(20)
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(encodeTurkish(displayInvoice.Company?.name || 'Şirket Adı'), PDFStyles.spacing.margin, yPos)
      yPos += 8

      doc.setFontSize(PDFStyles.fonts.small)
      doc.setTextColor(...PDFStyles.colors.gray)
      doc.setFont('helvetica', 'normal')
      const companyInfo = []
      if (displayInvoice.Company?.taxNumber) companyInfo.push(`VKN: ${displayInvoice.Company.taxNumber}`)
      if (displayInvoice.Company?.address) companyInfo.push(encodeTurkish(displayInvoice.Company.address))
      if (displayInvoice.Company?.city) companyInfo.push(encodeTurkish(displayInvoice.Company.city))
      if (displayInvoice.Company?.phone) companyInfo.push(`Tel: ${displayInvoice.Company.phone}`)
      if (displayInvoice.Company?.email) companyInfo.push(`E-posta: ${displayInvoice.Company.email}`)

      companyInfo.forEach((info) => {
        doc.text(info, PDFStyles.spacing.margin, yPos)
        yPos += 4
      })

      // Alıcı Bilgileri (Sağ)
      const customer = displayInvoice.Quote?.Deal?.Customer || displayInvoice.Customer
      if (customer) {
        let customerYPos = 25
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        const customerTitle = encodeTurkish('ALICI')
        const customerTitleWidth = doc.getTextWidth(customerTitle)
        doc.text(customerTitle, pageWidth - PDFStyles.spacing.margin - customerTitleWidth, customerYPos)
        customerYPos += 8

        doc.setFontSize(PDFStyles.fonts.small)
        doc.setTextColor(...PDFStyles.colors.gray)
        doc.setFont('helvetica', 'normal')
        const customerInfo = []
        if (customer.name) customerInfo.push(encodeTurkish(customer.name))
        if (customer.CustomerCompany?.name) customerInfo.push(encodeTurkish(customer.CustomerCompany.name))
        if (customer.taxNumber || customer.CustomerCompany?.taxNumber) {
          customerInfo.push(`VKN/TCKN: ${customer.taxNumber || customer.CustomerCompany?.taxNumber}`)
        }
        if (customer.address || customer.CustomerCompany?.address) {
          customerInfo.push(encodeTurkish(customer.address || customer.CustomerCompany?.address))
        }
        if (customer.city || customer.CustomerCompany?.city) {
          customerInfo.push(encodeTurkish(customer.city || customer.CustomerCompany?.city))
        }
        if (customer.phone) customerInfo.push(`Tel: ${customer.phone}`)
        if (customer.email) customerInfo.push(`E-posta: ${customer.email}`)

        customerInfo.forEach((info) => {
          const infoWidth = doc.getTextWidth(info)
          doc.text(info, pageWidth - PDFStyles.spacing.margin - infoWidth, customerYPos)
          customerYPos += 4
        })
      }

      yPos += 15

      // Başlık
      yPos = drawTitle(doc, pageWidth, 'FATURA', yPos)

      // Fatura Bilgileri
      const invoiceInfo: Array<[string, string]> = [
        ['Fatura No:', displayInvoice.invoiceNumber || displayInvoice.id?.substring(0, 8).toUpperCase() || ''],
        ['Başlık:', encodeTurkish(displayInvoice.title || '')],
        ['Tarih:', formatDate(displayInvoice.createdAt || '')],
        ['Fatura Tipi:', encodeTurkish(displayInvoice.invoiceType === 'SALES' ? 'Satış Faturası' : displayInvoice.invoiceType === 'PURCHASE' ? 'Alış Faturası' : 'Genel')],
        ['Durum:', encodeTurkish(statusLabels[displayInvoice.status] || displayInvoice.status || '')],
      ]

      if (displayInvoice.dueDate) {
        invoiceInfo.push(['Vade Tarihi:', formatDate(displayInvoice.dueDate)])
      }

      yPos = drawSectionBox(doc, pageWidth, yPos, 'Fatura Bilgileri', invoiceInfo, 70)

      // Ürün/Hizmet Listesi ve Toplamlar
      if (yPos > pageHeight - 150) {
        doc.addPage()
        yPos = 25
      }

      const invoiceItems = displayInvoice.InvoiceItem || []
      const totalAmount = displayInvoice.totalAmount || displayInvoice.total || 0
      const taxRate = displayInvoice.taxRate || 18
      const subtotal = totalAmount / (1 + taxRate / 100)
      const kdv = totalAmount - subtotal
      const total = totalAmount

      // Ürün/Hizmet Tablosu
      doc.setFillColor(...PDFStyles.colors.background)
      const tableHeight = Math.min(60 + invoiceItems.length * 8, 100)
      doc.roundedRect(
        PDFStyles.spacing.margin,
        yPos - 10,
        pageWidth - PDFStyles.spacing.margin * 2,
        tableHeight,
        3,
        3,
        'FD'
      )

      doc.setFontSize(PDFStyles.fonts.subtitle)
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.setFont('helvetica', 'bold')
      doc.text(encodeTurkish('Ürün/Hizmet Detayları'), PDFStyles.spacing.margin + 5, yPos)
      yPos += 12

      // Tablo header
      doc.setFontSize(PDFStyles.fonts.body)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(encodeTurkish('Açıklama'), PDFStyles.spacing.margin + 5, yPos)
      doc.text(encodeTurkish('Miktar'), 100, yPos)
      doc.text(encodeTurkish('Birim Fiyat'), 125, yPos)
      doc.text(encodeTurkish('KDV %'), 150, yPos)
      doc.text(encodeTurkish('Toplam'), 165, yPos)
      yPos += 8

      // Header alt çizgi
      doc.setDrawColor(...PDFStyles.colors.border)
      doc.line(PDFStyles.spacing.margin + 5, yPos - 3, pageWidth - PDFStyles.spacing.margin - 5, yPos - 3)
      yPos += 5

      // Ürün satırları
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      if (invoiceItems.length > 0) {
        invoiceItems.forEach((item: any) => {
          const itemDescription = encodeTurkish(item.description || item.product?.name || 'Ürün/Hizmet')
          const itemQuantity = item.quantity || 1
          const itemUnitPrice = item.unitPrice || item.total || 0
          const itemTaxRate = item.taxRate || taxRate
          const itemTotal = item.total || (itemUnitPrice * itemQuantity)

          const descriptionLines = doc.splitTextToSize(itemDescription, 80)
          descriptionLines.forEach((line: string, index: number) => {
            doc.text(line, PDFStyles.spacing.margin + 5, yPos + (index * 4))
          })
          const maxLines = Math.max(1, descriptionLines.length)
          doc.text(String(itemQuantity), 100, yPos)
          doc.text(formatCurrency(itemUnitPrice), 125, yPos)
          doc.text(`%${itemTaxRate}`, 150, yPos)
          doc.text(formatCurrency(itemTotal), 165, yPos)
          yPos += maxLines * 4 + 3
        })
      } else {
        // Ürün yoksa tek satır göster
        doc.text(encodeTurkish(displayInvoice.title || 'Fatura'), PDFStyles.spacing.margin + 5, yPos)
        doc.text('1', 100, yPos)
        doc.text(formatCurrency(subtotal), 125, yPos)
        doc.text(`%${taxRate}`, 150, yPos)
        doc.text(formatCurrency(subtotal), 165, yPos)
        yPos += 7
      }

      yPos += 10

      // Toplamlar
      doc.setFontSize(PDFStyles.fonts.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDFStyles.colors.gray)
      doc.text(encodeTurkish('Ara Toplam (KDV Hariç):'), 135, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(subtotal), 165, yPos)
      yPos += 7

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...PDFStyles.colors.gray)
      doc.text(encodeTurkish(`KDV (%${taxRate}):`), 135, yPos)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(formatCurrency(kdv), 165, yPos)
      yPos += 10

      // Genel Toplam
      doc.setDrawColor(...PDFStyles.colors.primary)
      doc.line(135, yPos - 3, pageWidth - PDFStyles.spacing.margin - 5, yPos - 3)
      yPos += 5
      doc.setFontSize(PDFStyles.fonts.subtitle)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PDFStyles.colors.primary)
      doc.text(encodeTurkish('GENEL TOPLAM (KDV Dahil):'), 135, yPos)
      doc.setFontSize(PDFStyles.fonts.title - 4)
      doc.text(formatCurrency(total), 165, yPos)
      yPos += 15

      // Ödeme Bilgileri (varsa)
      if (displayInvoice.paymentMethod || displayInvoice.paymentDate) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = 25
        }

        const paymentInfo: Array<[string, string]> = []
        if (displayInvoice.paymentMethod) {
          paymentInfo.push(['Ödeme Yöntemi:', encodeTurkish(displayInvoice.paymentMethod)])
        }
        if (displayInvoice.paymentDate) {
          paymentInfo.push(['Ödeme Tarihi:', formatDate(displayInvoice.paymentDate)])
        }

        if (paymentInfo.length > 0) {
          yPos = drawSectionBox(doc, pageWidth, yPos, 'Ödeme Bilgileri', paymentInfo, 30)
        }
      }

      // Notlar (varsa)
      if (displayInvoice.notes) {
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
        const notesLines = doc.splitTextToSize(encodeTurkish(displayInvoice.notes), pageWidth - 40)
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
      const reportDate = formatDate(displayInvoice.createdAt || new Date().toISOString())
      drawFooter(doc, pageWidth, pageHeight, reportDate)

      // PDF'i indir
      const fileName = `fatura-${displayInvoice.invoiceNumber || displayInvoice.id?.substring(0, 8) || 'rapor'}.pdf`
      doc.save(fileName)
      toast.success('PDF başarıyla indirildi')
    } catch (error: any) {
      console.error('PDF generation error:', error)
      toast.error('PDF oluşturulamadı', error?.message || 'Beklenmeyen bir hata oluştu')
    }
  }

  const handleDelete = async () => {
    if (!displayInvoice || !confirm(`${displayInvoice.title} faturasını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Fatura silindi')
      
      await mutate('/api/invoices')
      await mutate(`/api/invoices/${invoiceId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !invoiceId) return null

  if (isLoading && !initialData && !displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fatura Detayları" size="xl">
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  if (error && !initialData && !displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Hata" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fatura yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  if (!displayInvoice) {
    return (
      <DetailModal open={open} onClose={onClose} title="Fatura Bulunamadı" size="md">
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Fatura bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const isFromQuote = !!displayInvoice?.quoteId
  const isShipped = displayInvoice?.status === 'SHIPPED'
  const isReceived = displayInvoice?.status === 'RECEIVED'

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayInvoice?.title || 'Fatura Detayları'}
        description={`${displayInvoice?.invoiceNumber || ''} • ${displayInvoice?.createdAt ? new Date(displayInvoice.createdAt).toLocaleDateString('tr-TR') : ''}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pb-4 border-b">
            <Badge className={statusColors[displayInvoice?.status] || 'bg-gray-600 text-white border-gray-700'}>
              {statusLabels[displayInvoice?.status] || displayInvoice?.status}
            </Badge>
            {!isFromQuote && !isShipped && !isReceived && (
              <Button variant="outline" onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
            )}
            <Button
              className="bg-gradient-primary text-white w-full sm:w-auto"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF İndir
            </Button>
            {!isFromQuote && !isShipped && !isReceived && displayInvoice?.status !== 'PAID' && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteLoading ? 'Siliniyor...' : 'Sil'}
              </Button>
            )}
          </div>

          {/* Uyarı Mesajları */}
          {isShipped && (
            <Alert className="border-green-200 bg-green-50">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900 font-semibold">
                ✓ Sevkiyatı yapıldı
              </AlertTitle>
              <AlertDescription className="text-green-800">
                Stoktan düşüldü, onaylandı. Bu fatura değiştirilemez.
              </AlertDescription>
            </Alert>
          )}
          {isReceived && (
            <Alert className="border-teal-200 bg-teal-50">
              <AlertTriangle className="h-4 w-4 text-teal-600" />
              <AlertTitle className="text-teal-900 font-semibold">
                ✓ Mal kabul edildi
              </AlertTitle>
              <AlertDescription className="text-teal-800">
                Stoğa girişi yapıldı, onaylandı. Bu fatura değiştirilemez.
              </AlertDescription>
            </Alert>
          )}
          {isFromQuote && (
            <Alert className="border-indigo-200 bg-indigo-50">
              <AlertTriangle className="h-4 w-4 text-indigo-600" />
              <AlertTitle className="text-indigo-900 font-semibold">
                ℹ️ Bu fatura tekliften oluşturuldu
              </AlertTitle>
              <AlertDescription className="text-indigo-800">
                Değiştirilemez.
              </AlertDescription>
            </Alert>
          )}

          {/* OVERDUE Uyarısı */}
          {displayInvoice?.status === 'OVERDUE' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                ⚠️ Bu Fatura Vadesi Geçti
              </AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                <p className="mb-3">
                  Bu fatura vadesi geçti! Müşteri ile acilen iletişime geçip ödeme talep etmeniz gerekiyor.
                  {displayInvoice?.dueDate && (
                    <span className="block mt-1 text-sm">
                      Vade Tarihi: <strong>{new Date(displayInvoice.dueDate).toLocaleDateString('tr-TR')}</strong>
                    </span>
                  )}
                </p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {(displayInvoice?.Customer || displayInvoice?.Quote?.Deal?.Customer)?.phone && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const customer = displayInvoice.Customer || displayInvoice.Quote?.Deal?.Customer
                        if (customer?.phone) {
                          window.open(`tel:${customer.phone}`, '_blank')
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Müşteriyi Ara
                    </Button>
                  )}
                  {(displayInvoice?.Customer || displayInvoice?.Quote?.Deal?.Customer)?.email && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const customer = displayInvoice.Customer || displayInvoice.Quote?.Deal?.Customer
                        if (customer?.email) {
                          window.open(`mailto:${customer.email}?subject=Ödeme Hatırlatması: ${displayInvoice.title}`, '_blank')
                        }
                      }}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      E-posta Gönder
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Stepper */}
          <WorkflowStepper
            steps={getInvoiceWorkflowSteps(displayInvoice?.status, displayInvoice?.invoiceType)}
            currentStep={['DRAFT', 'SENT', 'PAID'].indexOf(displayInvoice?.status)}
            title="Fatura İş Akışı"
          />

          {/* Status Info Note */}
          <StatusInfoNote
            entityType="invoice"
            status={displayInvoice?.status}
            relatedRecords={[
              ...(isFromQuote ? [{
                type: 'quote',
                count: 1,
                message: 'Bu fatura tekliften otomatik oluşturuldu'
              }] : []),
              ...(displayInvoice?.Customer ? [{
                type: 'customer',
                count: 1,
                message: `Müşteri: ${displayInvoice.Customer.name}`
              }] : []),
            ]}
          />

          {/* Next Step Buttons */}
          <NextStepButtons
            entityType="invoice"
            currentStatus={displayInvoice?.status}
            onAction={async (actionId) => {
              try {
                const res = await fetch(`/api/invoices/${invoiceId}`, {
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
                await mutateInvoice()
              } catch (error: any) {
                toast.error('Durum değiştirilemedi', error.message || 'Bir hata oluştu.')
              }
            }}
            onCreateRelated={(type) => {
              onClose()
              if (type === 'shipment') {
                router.push(`/${locale}/shipments/new?invoiceId=${invoiceId}`)
              }
            }}
          />

          {/* Related Records Suggestions */}
          <RelatedRecordsSuggestions
            entityType="invoice"
            entityId={invoiceId || ''}
            relatedRecords={[
              ...(displayInvoice?.Quote ? [{
                id: displayInvoice.Quote.id,
                type: 'quote',
                title: displayInvoice.Quote.title,
                link: `/${locale}/quotes/${displayInvoice.Quote.id}`,
              }] : []),
              ...(displayInvoice?.Customer ? [{
                id: displayInvoice.Customer.id,
                type: 'customer',
                title: displayInvoice.Customer.name,
                link: `/${locale}/customers/${displayInvoice.Customer.id}`,
              }] : []),
              ...(displayInvoice?.Shipment || []).map((s: any) => ({
                id: s.id,
                type: 'shipment',
                title: s.trackingNumber || 'Sevkiyat',
                link: `/${locale}/shipments/${s.id}`,
              })),
            ]}
            missingRecords={[
              ...(displayInvoice?.status === 'SENT' && (!displayInvoice?.Shipment || displayInvoice.Shipment.length === 0) ? [{
                type: 'shipment',
                label: 'Sevkiyat Oluştur',
                icon: <Truck className="h-4 w-4" />,
                onCreate: () => {
                  onClose()
                  router.push(`/${locale}/shipments/new?invoiceId=${invoiceId}`)
                },
                description: 'Bu fatura için sevkiyat kaydı oluşturun',
              }] : []),
            ]}
          />

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Durum</p>
              <Badge className={statusColors[displayInvoice?.status] || 'bg-gray-600 text-white border-gray-700'}>
                {statusLabels[displayInvoice?.status] || displayInvoice?.status}
              </Badge>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Fatura Tipi</p>
              <Badge className={
                displayInvoice?.invoiceType === 'SALES' 
                  ? 'bg-blue-600 text-white border-blue-700'
                  : displayInvoice?.invoiceType === 'PURCHASE'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : displayInvoice?.invoiceType === 'SERVICE_SALES'
                  ? 'bg-green-600 text-white border-green-700'
                  : displayInvoice?.invoiceType === 'SERVICE_PURCHASE'
                  ? 'bg-orange-600 text-white border-orange-700'
                  : 'bg-gray-600 text-white border-gray-700'
              }>
                {displayInvoice?.invoiceType === 'SALES' 
                  ? 'Satış Faturası'
                  : displayInvoice?.invoiceType === 'PURCHASE'
                  ? 'Alış Faturası'
                  : displayInvoice?.invoiceType === 'SERVICE_SALES'
                  ? 'Hizmet Satış Faturası'
                  : displayInvoice?.invoiceType === 'SERVICE_PURCHASE'
                  ? 'Hizmet Alım Faturası'
                  : 'Bilinmeyen'}
              </Badge>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-1">Toplam</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(displayInvoice?.totalAmount || displayInvoice?.total || 0)}
              </p>
            </Card>
          </div>

          {/* Invoice Items */}
          {displayInvoice?.InvoiceItem && displayInvoice.InvoiceItem.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Fatura Kalemleri</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayInvoice.InvoiceItem.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.Product?.name || item.description || '-'}</TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Activity Timeline */}
          <ActivityTimeline entityType="Invoice" entityId={invoiceId} />
        </div>
      </DetailModal>

      {/* Form Modal */}
      <InvoiceForm
        invoice={displayInvoice || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateInvoice()
          await mutate(`/api/invoices/${invoiceId}`)
        }}
      />

      {/* Item Form Modal */}
      <InvoiceItemForm
        invoiceId={invoiceId || ''}
        open={itemFormOpen}
        onClose={() => setItemFormOpen(false)}
        onSuccess={async () => {
          setItemFormOpen(false)
          await mutateInvoice()
          await mutate(`/api/invoices/${invoiceId}`)
        }}
      />
    </>
  )
}

