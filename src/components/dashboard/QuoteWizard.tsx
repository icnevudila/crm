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
import QuoteForm from '@/components/quotes/QuoteForm'
import { toast } from '@/lib/toast'
import { mutate } from 'swr'

interface QuoteWizardProps {
  open: boolean
  onClose: () => void
}

export default function QuoteWizard({ open, onClose }: QuoteWizardProps) {
  const locale = useLocale()
  const router = useRouter()

  const handleSuccess = (quote: any) => {
    // Cache'i güncelle
    mutate('/api/quotes')
    
    // Toast bildirimi ile yönlendirme önerisi
    toast.success(
      'Teklif oluşturuldu!',
      `${quote.title} başarıyla kaydedildi.`,
      {
        action: {
          label: 'Teklifi Görüntüle',
          onClick: () => {
            onClose()
            router.push(`/${locale}/quotes/${quote.id}`)
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Yeni Teklif Hazırla</DialogTitle>
          <DialogDescription>
            Müşteriye teklif bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <QuoteForm
            quote={undefined}
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





