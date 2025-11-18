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
import { Progress } from '@/components/ui/progress'
import CustomerForm from '@/components/customers/CustomerForm'
import { toast } from '@/lib/toast'
import { mutate } from 'swr'

interface CustomerWizardProps {
  open: boolean
  onClose: () => void
}

export default function CustomerWizard({ open, onClose }: CustomerWizardProps) {
  const locale = useLocale()
  const router = useRouter()

  const handleSuccess = (customer: any) => {
    // Cache'i güncelle
    mutate('/api/customers')
    
    // Toast bildirimi ile yönlendirme önerisi
    toast.success(
      'Müşteri oluşturuldu!',
      `${customer.name} başarıyla kaydedildi.`,
      {
        action: {
          label: 'Müşteriyi Görüntüle',
          onClick: () => {
            onClose()
            router.push(`/${locale}/customers/${customer.id}`)
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
          <DialogTitle className="text-2xl font-bold">Yeni Müşteri Ekle</DialogTitle>
          <DialogDescription>
            Yeni müşteri bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <CustomerForm
            customer={undefined}
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





