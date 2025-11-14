'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  FileText,
  Receipt,
  Calendar,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ActionSuggestion {
  id: string
  type: 'quote' | 'invoice' | 'deal' | 'task' | 'meeting'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel: string
  actionUrl: string
  icon: React.ReactNode
  count?: number
}

interface NextBestActionProps {
  /**
   * Component görünür mü?
   */
  visible?: boolean
  
  /**
   * ClassName
   */
  className?: string
}

/**
 * Next Best Action Component
 * Kullanıcıya bir sonraki en iyi aksiyon önerilerini gösterir
 */
export default function NextBestAction({
  visible = true,
  className,
}: NextBestActionProps) {
  const locale = useLocale()
  const router = useRouter()
  const [dismissedActions, setDismissedActions] = useState<string[]>([])

  // Verileri çek - API'ler pagination objesi döndürüyor, data array'i içinde
  const { data: quotesResponse } = useData<any>('/api/quotes?status=WAITING&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: invoicesResponse } = useData<any>('/api/invoices?status=UNPAID&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: dealsResponse } = useData<any>('/api/deals?stage=PROPOSAL&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  // Pagination objesinden data array'ini al
  const quotesData = Array.isArray(quotesResponse?.data) ? quotesResponse.data : (Array.isArray(quotesResponse) ? quotesResponse : [])
  const invoicesData = Array.isArray(invoicesResponse?.data) ? invoicesResponse.data : (Array.isArray(invoicesResponse) ? invoicesResponse : [])
  const dealsData = Array.isArray(dealsResponse?.data) ? dealsResponse.data : (Array.isArray(dealsResponse) ? dealsResponse : [])

  // Önerileri oluştur
  const suggestions = useMemo<ActionSuggestion[]>(() => {
    const actions: ActionSuggestion[] = []

    // Bekleyen teklifler
    if (quotesData && quotesData.length > 0) {
      actions.push({
        id: 'pending-quotes',
        type: 'quote',
        priority: 'high',
        title: `${quotesData.length} Bekleyen Teklif`,
        description: `${quotesData.length} teklif müşteri yanıtı bekliyor. Gözden geçirmek ister misiniz?`,
        actionLabel: 'Teklifleri Görüntüle',
        actionUrl: `/${locale}/quotes?status=WAITING`,
        icon: <FileText className="h-5 w-5" />,
        count: quotesData.length,
      })
    }

    // Ödenmemiş faturalar
    if (invoicesData && invoicesData.length > 0) {
      actions.push({
        id: 'unpaid-invoices',
        type: 'invoice',
        priority: 'high',
        title: `${invoicesData.length} Ödenmemiş Fatura`,
        description: `${invoicesData.length} fatura ödeme bekliyor. Takip etmek ister misiniz?`,
        actionLabel: 'Faturaları Görüntüle',
        actionUrl: `/${locale}/invoices?status=UNPAID`,
        icon: <Receipt className="h-5 w-5" />,
        count: invoicesData.length,
      })
    }

    // Teklif aşamasındaki fırsatlar
    if (dealsData && dealsData.length > 0) {
      actions.push({
        id: 'proposal-deals',
        type: 'deal',
        priority: 'medium',
        title: `${dealsData.length} Teklif Aşamasında Fırsat`,
        description: `${dealsData.length} fırsat teklif aşamasında. Teklif hazırlamak ister misiniz?`,
        actionLabel: 'Fırsatları Görüntüle',
        actionUrl: `/${locale}/deals?stage=PROPOSAL`,
        icon: <TrendingUp className="h-5 w-5" />,
        count: dealsData.length,
      })
    }

    // Önceliğe göre sırala
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return actions
      .filter((action) => !dismissedActions.includes(action.id))
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 3) // En fazla 3 öneri göster
  }, [quotesData, invoicesData, dealsData, locale, dismissedActions])

  // Öneri kapat
  const handleDismiss = (id: string) => {
    setDismissedActions((prev) => [...prev, id])
  }

  // Aksiyon tıkla
  const handleAction = (url: string) => {
    router.push(url)
  }

  if (!visible || suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      {suggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          className={cn(
            'relative p-4 transition-all hover:shadow-md',
            suggestion.priority === 'high' && 'border-l-4 border-l-red-500 bg-red-50/50',
            suggestion.priority === 'medium' && 'border-l-4 border-l-yellow-500 bg-yellow-50/50',
            suggestion.priority === 'low' && 'border-l-4 border-l-blue-500 bg-blue-50/50'
          )}
        >
          {/* Kapat butonu */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => handleDismiss(suggestion.id)}
          >
            <X className="h-3 w-3" />
          </Button>

          <div className="flex items-start gap-3 pr-8">
            {/* İkon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                suggestion.priority === 'high' && 'bg-red-100 text-red-600',
                suggestion.priority === 'medium' && 'bg-yellow-100 text-yellow-600',
                suggestion.priority === 'low' && 'bg-blue-100 text-blue-600'
              )}
            >
              {suggestion.icon}
            </div>

            {/* İçerik */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-gray-900">
                  {suggestion.title}
                </h3>
                {suggestion.count && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      suggestion.priority === 'high' && 'border-red-300 text-red-700',
                      suggestion.priority === 'medium' && 'border-yellow-300 text-yellow-700',
                      suggestion.priority === 'low' && 'border-blue-300 text-blue-700'
                    )}
                  >
                    {suggestion.count}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600">{suggestion.description}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(suggestion.actionUrl)}
                className="mt-2"
              >
                {suggestion.actionLabel}
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

