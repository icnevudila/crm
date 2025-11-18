'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { toast } from '@/lib/toast'

export default function NewInvoicePage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const quoteId = searchParams.get('quoteId')
  const [formOpen, setFormOpen] = useState(true)

  useEffect(() => {
    // Sayfa yüklendiğinde form'u aç
    setFormOpen(true)
  }, [])

  const handleClose = () => {
    setFormOpen(false)
    router.push(`/${locale}/invoices`)
  }

  const handleSuccess = (savedInvoice: any) => {
    toast.success('Fatura oluşturuldu')
    router.push(`/${locale}/invoices/${savedInvoice.id}`)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/invoices`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Fatura</h1>
            <p className="text-sm text-gray-600">
              {quoteId ? 'Teklif için fatura oluşturun' : 'Yeni fatura oluşturun'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <InvoiceForm
          invoice={undefined}
          open={formOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  )
}







