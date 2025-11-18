'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import CustomerForm from '@/components/customers/CustomerForm'
import { toast } from '@/lib/toast'

export default function NewCustomerPage() {
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
    router.push(`/${locale}/customers`)
  }

  const handleSuccess = (savedCustomer: any) => {
    toast.success('Müşteri oluşturuldu')
    router.push(`/${locale}/customers/${savedCustomer.id}`)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/customers`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Yeni Müşteri</h1>
            <p className="text-sm text-gray-600">
              {dealId ? 'Fırsat için müşteri oluşturun' : 'Yeni müşteri oluşturun'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <CustomerForm
          customer={undefined}
          open={formOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </Card>
    </div>
  )
}





