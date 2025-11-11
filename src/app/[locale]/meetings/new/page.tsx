'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import MeetingForm from '@/components/meetings/MeetingForm'
import { toast } from '@/lib/toast'

export default function NewMeetingPage() {
  const router = useRouter()
  const locale = useLocale()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')
  const quoteId = searchParams.get('quoteId')
  const customerId = searchParams.get('customerId')
  const [formOpen, setFormOpen] = useState(true)

  useEffect(() => {
    // Sayfa yüklendiğinde form'u aç
    setFormOpen(true)
  }, [])

  const handleClose = () => {
    setFormOpen(false)
    router.push(`/${locale}/meetings`)
  }

  const handleSuccess = (savedMeeting: any) => {
    // Eğer dealId varsa, fırsatlar sayfasına yönlendir (yeni sekmede açıldıysa bu sekmede kalır)
    if (dealId) {
      // Kısa bir gecikme sonrası yönlendir (toast görünsün diye)
      setTimeout(() => {
        window.location.href = `/${locale}/deals`
      }, 1500)
    } else if (quoteId) {
      // Eğer quoteId varsa, teklifler sayfasına yönlendir
      setTimeout(() => {
        window.location.href = `/${locale}/quotes`
      }, 1500)
    } else {
      // Normal durumda görüşme detay sayfasına yönlendir
      setTimeout(() => {
        router.push(`/${locale}/meetings/${savedMeeting.id}`)
      }, 1500)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/meetings`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Görüşme</h1>
            <p className="text-sm text-gray-600">
              {dealId ? 'Fırsat için görüşme planlayın' : quoteId ? 'Teklif için görüşme planlayın' : 'Yeni görüşme planlayın'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <MeetingForm
          meeting={undefined}
          open={formOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  )
}


