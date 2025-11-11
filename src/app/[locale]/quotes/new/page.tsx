'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import QuoteForm from '@/components/quotes/QuoteForm'
import { toast } from '@/lib/toast'

export default function NewQuotePage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')
  const [formOpen, setFormOpen] = useState(true)

  useEffect(() => {
    // Sayfa yüklendiğinde form'u aç
    setFormOpen(true)
  }, [])

  const handleClose = () => {
    setFormOpen(false)
    router.push(`/${locale}/quotes`)
  }

  const handleSuccess = async (savedQuote: any) => {
    // Deal stage değişikliği kontrolü - dealId varsa kontrol et
    if (dealId && savedQuote.dealId) {
      try {
        // Deal'ı çek ve stage'ini kontrol et
        const dealRes = await fetch(`/api/deals/${dealId}`)
        if (dealRes.ok) {
          const deal = await dealRes.json()
          if (deal.stage === 'PROPOSAL') {
            // Deal PROPOSAL'a taşındı - kullanıcıya bildir
            toast.success(
              'Teklif oluşturuldu ve fırsat güncellendi',
              `Teklif başarıyla oluşturuldu. "${deal.title}" fırsatı "Teklif" aşamasına taşındı.`,
              {
                label: 'Fırsatı Görüntüle',
                onClick: () => router.push(`/${locale}/deals/${dealId}`),
              }
            )
          } else {
            toast.success('Teklif oluşturuldu')
          }
        } else {
          toast.success('Teklif oluşturuldu')
        }
      } catch (error) {
        // Hata durumunda sadece teklif oluşturuldu mesajı göster
        toast.success('Teklif oluşturuldu')
      }
    } else {
      toast.success('Teklif oluşturuldu')
    }
    
    router.push(`/${locale}/quotes/${savedQuote.id}`)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
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
            <h1 className="text-2xl font-bold">Yeni Teklif</h1>
            <p className="text-sm text-gray-600">
              {dealId ? 'Fırsat için teklif oluşturun' : 'Yeni teklif oluşturun'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <QuoteForm
          quote={undefined}
          open={formOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  )
}


