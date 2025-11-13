'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, AlertCircle, FileText, Users, Truck } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface SmartReminderData {
  pendingQuotes: number
  inactiveCustomers: number
  inactiveCustomersList: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    updatedAt: string
  }>
  pendingShipments: number
}

async function fetchSmartReminder(): Promise<SmartReminderData> {
  const res = await fetch('/api/automations/smart-reminder', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) {
    return {
      pendingQuotes: 0,
      inactiveCustomers: 0,
      inactiveCustomersList: [],
      pendingShipments: 0,
    }
  }
  return res.json()
}

export default function SmartReminder() {
  const locale = useLocale()
  const [dismissed, setDismissed] = useState(false)
  
  const { data, isLoading } = useQuery({
    queryKey: ['smart-reminder'],
    queryFn: fetchSmartReminder,
    staleTime: 60 * 1000, // 1 dakika cache
    refetchOnWindowFocus: false,
  })

  // localStorage'dan dismissed durumunu kontrol et
  useEffect(() => {
    const dismissedState = localStorage.getItem('smart-reminder-dismissed')
    if (dismissedState === 'true') {
      setDismissed(true)
    }
  }, [])

  // Eğer hiç bildirim yoksa veya dismissed ise göster
  if (dismissed || isLoading || !data) {
    return null
  }

  const hasReminders = 
    (data.pendingQuotes > 0) || 
    (data.inactiveCustomers > 0) || 
    (data.pendingShipments > 0)

  if (!hasReminders) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('smart-reminder-dismissed', 'true')
    // 24 saat sonra tekrar göster
    setTimeout(() => {
      localStorage.removeItem('smart-reminder-dismissed')
    }, 24 * 60 * 60 * 1000)
  }

  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Bugünün Özeti</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            {data.pendingQuotes > 0 && (
              <div className="flex items-center gap-2 text-indigo-700">
                <FileText className="h-4 w-4" />
                <span>
                  <strong>{data.pendingQuotes}</strong> teklifin onay bekliyor.
                </span>
                <Link href={`/${locale}/quotes?status=SENT`}>
                  <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600">
                    Görüntüle →
                  </Button>
                </Link>
              </div>
            )}
            
            {data.inactiveCustomers > 0 && (
              <div className="flex items-center gap-2 text-indigo-700">
                <Users className="h-4 w-4" />
                <span>
                  <strong>{data.inactiveCustomers}</strong> müşterinle 7 gündür görüşmedin.
                </span>
                <Link href={`/${locale}/customers`}>
                  <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600">
                    Takip Et →
                  </Button>
                </Link>
              </div>
            )}
            
            {data.pendingShipments > 0 && (
              <div className="flex items-center gap-2 text-indigo-700">
                <Truck className="h-4 w-4" />
                <span>
                  <strong>{data.pendingShipments}</strong> sevkiyat teslim bekliyor.
                </span>
                <Link href={`/${locale}/shipments?status=PENDING`}>
                  <Button variant="link" size="sm" className="h-auto p-0 text-indigo-600">
                    Kontrol Et →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-indigo-600 hover:text-indigo-800"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}






















































