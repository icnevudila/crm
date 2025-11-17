'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { toast } from '@/lib/toast'
import { mutate } from 'swr'

interface InvoiceWizardProps {
  open: boolean
  onClose: () => void
}

export default function InvoiceWizard({ open, onClose }: InvoiceWizardProps) {
  const locale = useLocale()
  const router = useRouter()

  const handleSuccess = (invoice: any) => {
    // Cache'i güncelle
    mutate('/api/invoices')
    
    // Toast bildirimi ile yönlendirme önerisi
    toast.success(
      'Fatura oluşturuldu!',
      `${invoice.title} başarıyla kaydedildi.`,
      {
        action: {
          label: 'Faturayı Görüntüle',
          onClick: () => {
            onClose()
            router.push(`/${locale}/invoices/${invoice.id}`)
          },
        },
      }
    )
    
    // 2 saniye sonra modal'ı kapat
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Yeni Fatura Oluştur</DialogTitle>
          <DialogDescription>
            Fatura bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <InvoiceForm
            invoice={undefined}
            open={true}
            onClose={onClose}
            onSuccess={handleSuccess}
            skipDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}



