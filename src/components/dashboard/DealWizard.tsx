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
import DealForm from '@/components/deals/DealForm'
import { toast } from '@/lib/toast'
import { mutate } from 'swr'

interface DealWizardProps {
  open: boolean
  onClose: () => void
}

export default function DealWizard({ open, onClose }: DealWizardProps) {
  const locale = useLocale()
  const router = useRouter()

  const handleSuccess = (deal: any) => {
    // Cache'i güncelle
    mutate('/api/deals')
    
    // Toast bildirimi ile yönlendirme önerisi
    toast.success(
      'Fırsat oluşturuldu!',
      `${deal.title} başarıyla kaydedildi.`,
      {
        action: {
          label: 'Fırsatı Görüntüle',
          onClick: () => {
            onClose()
            router.push(`/${locale}/deals/${deal.id}`)
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
          <DialogTitle className="text-2xl font-bold">Yeni Fırsat Oluştur</DialogTitle>
          <DialogDescription>
            Satış fırsatı bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <DealForm
            deal={undefined}
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





