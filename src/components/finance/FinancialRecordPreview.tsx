'use client'

import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FinancialRecordPreviewProps {
  finance: {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    category?: string
    description?: string
    paymentMethod?: string
    paymentDate?: string
    createdAt: string
    updatedAt?: string
    CustomerCompany?: {
      id: string
      name: string
    }
    Company?: {
      id: string
      name: string
      address?: string
      city?: string
      phone?: string
      email?: string
    }
  }
}

const categoryLabels: Record<string, string> = {
  SALARY: 'Maaş',
  RENT: 'Kira',
  UTILITIES: 'Faturalar',
  MARKETING: 'Pazarlama',
  TRAVEL: 'Seyahat',
  OFFICE_SUPPLIES: 'Ofis Malzemeleri',
  SHIPPING: 'Kargo',
  TAX: 'Vergi',
  INSURANCE: 'Sigorta',
  MAINTENANCE: 'Bakım',
  OTHER: 'Diğer',
  INVOICE_INCOME: 'Fatura Geliri',
  SERVICE: 'Hizmet Geliri',
  PRODUCT_SALE: 'Ürün Satışı',
  FUEL: 'Yakıt',
  ACCOMMODATION: 'Konaklama',
  FOOD: 'Yemek',
  TRANSPORT: 'Ulaşım',
  OFFICE: 'Ofis',
}

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Nakit',
  CARD: 'Kart',
  TRANSFER: 'Havale/EFT',
  CHECK: 'Çek',
  OTHER: 'Diğer',
}

export default function FinancialRecordPreview({ finance }: FinancialRecordPreviewProps) {
  const company = finance.Company || {}
  const customerCompany = finance.CustomerCompany
  const isIncome = finance.type === 'INCOME'

  const formattedAmount = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(finance.amount || 0)

  const formattedDate = new Date(finance.createdAt).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedPaymentDate = finance.paymentDate
    ? new Date(finance.paymentDate).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-'

  const categoryLabel = finance.category
    ? categoryLabels[finance.category] || finance.category
    : '-'

  const paymentMethodLabel = finance.paymentMethod
    ? paymentMethodLabels[finance.paymentMethod] || finance.paymentMethod
    : '-'

  const handleDownloadPDF = () => {
    window.open(`/api/pdf/finance/${finance.id}`, '_blank')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:p-8">
      {/* Print Actions - Print'te görünmeyecek */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          PDF İndir
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Yazdır
        </Button>
      </div>

      {/* Document */}
      <div className="bg-white p-8 shadow-sm print:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {company.name || 'Firma Adı'}
              </h1>
              {company.address && (
                <p className="text-sm text-gray-600">{company.address}</p>
              )}
              {company.city && (
                <p className="text-sm text-gray-600">{company.city}</p>
              )}
              {company.phone && (
                <p className="text-sm text-gray-600">Tel: {company.phone}</p>
              )}
              {company.email && (
                <p className="text-sm text-gray-600">E-posta: {company.email}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Finansal Kayıt Özeti
              </h2>
              <p className="text-sm text-gray-600">{formattedDate}</p>
              <p className="text-xs text-gray-500 mt-1">
                Kayıt No: {finance.id.substring(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* İşlem Bilgileri */}
          <Card className="p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3">İşlem Bilgileri</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">İşlem Türü:</span>
                <Badge
                  className={
                    isIncome
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {isIncome ? 'Gelir' : 'Gider'}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Kategori:</span>
                <span className="text-sm font-medium text-gray-900">{categoryLabel}</span>
              </div>
              {customerCompany && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Müşteri Firma:</span>
                  <span className="text-sm font-medium text-gray-900">{customerCompany.name}</span>
                </div>
              )}
              {finance.paymentMethod && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Ödeme Yöntemi:</span>
                  <span className="text-sm font-medium text-gray-900">{paymentMethodLabel}</span>
                </div>
              )}
              {finance.paymentDate && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Ödeme Tarihi:</span>
                  <span className="text-sm font-medium text-gray-900">{formattedPaymentDate}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">İşlem Tarihi:</span>
                <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
              </div>
            </div>
          </Card>

          {/* Açıklama */}
          {finance.description && (
            <Card className="p-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Açıklama</h3>
              <p className="text-sm text-gray-900 leading-relaxed">{finance.description}</p>
            </Card>
          )}

          {/* Tutar */}
          <Card className="p-6 border-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              {isIncome ? 'Gelir Tutarı' : 'Gider Tutarı'}
            </p>
            <p
              className={`text-3xl font-bold ${
                isIncome ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {formattedAmount}
            </p>
          </Card>
        </div>

        {/* Footer - MUTLAKA OLACAK */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            Bu belge resmî bir fatura değildir. Hiçbir resmi geçerliliği yoktur.
          </p>
          <p className="text-xs font-bold text-red-600 mt-2">
            İç kullanım amaçlı hazırlanmıştır.
          </p>
        </div>
      </div>
    </div>
  )
}

















