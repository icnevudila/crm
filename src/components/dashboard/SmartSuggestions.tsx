'use client'

import { useMemo, useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  FileText,
  Calendar,
  Target,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Suggestion {
  id: string
  type: 'opportunity' | 'warning' | 'tip' | 'achievement'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  icon: React.ReactNode
  count?: number
  dismissible?: boolean
}

interface SmartSuggestionsProps {
  className?: string
}

/**
 * Smart Suggestions Component
 * Kullanıcıya duruma göre akıllı öneriler sunar
 */
export default function SmartSuggestions({ className }: SmartSuggestionsProps) {
  const locale = useLocale()
  const router = useRouter()
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([])

  // localStorage'dan dismissed suggestions'ı yükle
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const dismissed = JSON.parse(localStorage.getItem('dismissed-suggestions') || '[]')
    const now = new Date()
    
    // 24 saatten eski dismissed suggestions'ları temizle
    const validDismissed = dismissed
      .filter((item: { id: string; dismissedAt: string }) => {
        const dismissedAt = new Date(item.dismissedAt)
        const hoursDiff = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60)
        return hoursDiff < 24 // 24 saat içindeyse geçerli
      })
      .map((item: { id: string }) => item.id)
    
    setDismissedSuggestions(validDismissed)
  }, [])

  // Verileri çek
  const { data: customersData } = useData<any>('/api/customers?pageSize=1&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: dealsData } = useData<any>('/api/deals?pageSize=1&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: quotesData } = useData<any>('/api/quotes?status=WAITING&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: invoicesData } = useData<any>('/api/invoices?status=UNPAID&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  const { data: tasksData } = useData<any>('/api/tasks?status=TODO&pageSize=5&page=1', {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  })

  // Pagination objesinden data array'ini al
  const customers = Array.isArray(customersData?.data) ? customersData.data : (Array.isArray(customersData) ? customersData : [])
  const deals = Array.isArray(dealsData?.data) ? dealsData.data : (Array.isArray(dealsData) ? dealsData : [])
  const quotes = Array.isArray(quotesData?.data) ? quotesData.data : (Array.isArray(quotesData) ? quotesData : [])
  const invoices = Array.isArray(invoicesData?.data) ? invoicesData.data : (Array.isArray(invoicesData) ? invoicesData : [])
  const tasks = Array.isArray(tasksData?.data) ? tasksData.data : (Array.isArray(tasksData) ? tasksData : [])

  // Önerileri oluştur
  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = []

    // İlk müşteri ekleme önerisi
    if (!customers || customers.length === 0) {
      items.push({
        id: 'no-customers',
        type: 'opportunity',
        priority: 'high',
        title: 'İlk Müşterinizi Ekleyin',
        description: 'Sisteminizi kullanmaya başlamak için ilk müşterinizi ekleyin. Müşteri ekledikten sonra fırsat oluşturabilirsiniz.',
        actionLabel: 'Müşteri Ekle',
        actionUrl: `/${locale}/customers`,
        icon: <Users className="h-5 w-5" />,
        dismissible: true,
      })
    }

    // İlk fırsat oluşturma önerisi
    if (customers && customers.length > 0 && (!deals || deals.length === 0)) {
      items.push({
        id: 'no-deals',
        type: 'opportunity',
        priority: 'high',
        title: 'İlk Fırsatınızı Oluşturun',
        description: 'Müşteriniz için bir fırsat oluşturun ve satış sürecinizi başlatın.',
        actionLabel: 'Fırsat Oluştur',
        actionUrl: `/${locale}/deals`,
        icon: <TrendingUp className="h-5 w-5" />,
        dismissible: true,
      })
    }

    // Bekleyen teklifler
    if (quotes && quotes.length > 0) {
      items.push({
        id: 'pending-quotes',
        type: 'warning',
        priority: 'high',
        title: `${quotes.length} Bekleyen Teklif`,
        description: `${quotes.length} teklif müşteri yanıtı bekliyor. Gözden geçirmek ister misiniz?`,
        actionLabel: 'Teklifleri Görüntüle',
        actionUrl: `/${locale}/quotes?status=WAITING`,
        icon: <FileText className="h-5 w-5" />,
        count: quotes.length,
        dismissible: true,
      })
    }

    // Ödenmemiş faturalar
    if (invoices && invoices.length > 0) {
      items.push({
        id: 'unpaid-invoices',
        type: 'warning',
        priority: 'high',
        title: `${invoices.length} Ödenmemiş Fatura`,
        description: `${invoices.length} fatura ödeme bekliyor. Takip etmek ister misiniz?`,
        actionLabel: 'Faturaları Görüntüle',
        actionUrl: `/${locale}/invoices?status=UNPAID`,
        icon: <DollarSign className="h-5 w-5" />,
        count: invoices.length,
        dismissible: true,
      })
    }

    // Bekleyen görevler
    if (tasks && tasks.length > 0) {
      items.push({
        id: 'pending-tasks',
        type: 'tip',
        priority: 'medium',
        title: `${tasks.length} Bekleyen Görev`,
        description: `${tasks.length} görev tamamlanmayı bekliyor. Görevlerinizi tamamlayarak ilerleme kaydedin.`,
        actionLabel: 'Görevleri Görüntüle',
        actionUrl: `/${locale}/tasks?status=TODO`,
        icon: <Target className="h-5 w-5" />,
        count: tasks.length,
        dismissible: true,
      })
    }

    // Başarı önerileri
    if (customers && customers.length > 0 && deals && deals.length > 0) {
      items.push({
        id: 'good-progress',
        type: 'achievement',
        priority: 'low',
        title: 'Harika İlerleme! 🎉',
        description: 'Müşteri ve fırsat kayıtlarınız var. Teklif oluşturarak satış sürecinizi ilerletebilirsiniz.',
        actionLabel: 'Teklif Oluştur',
        actionUrl: `/${locale}/quotes`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        dismissible: true,
      })
    }

    // Önceliğe göre sırala
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return items
      .filter((item) => !dismissedSuggestions.includes(item.id))
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5) // En fazla 5 öneri göster
  }, [customers, deals, quotes, invoices, tasks, locale, dismissedSuggestions])

  // Öneri kapat
  const handleDismiss = (id: string) => {
    setDismissedSuggestions((prev) => [...prev, id])
    // localStorage'a kaydet (24 saat sonra tekrar göster)
    const dismissed = JSON.parse(localStorage.getItem('dismissed-suggestions') || '[]')
    dismissed.push({ id, dismissedAt: new Date().toISOString() })
    localStorage.setItem('dismissed-suggestions', JSON.stringify(dismissed))
  }

  // Aksiyon tıkla
  const handleAction = (url: string) => {
    router.push(url)
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-5 w-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Akıllı Öneriler</h3>
      </div>
      <AnimatePresence>
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              className={cn(
                'relative p-4 transition-all hover:shadow-md',
                suggestion.type === 'opportunity' && 'border-l-4 border-l-indigo-500 bg-indigo-50/50',
                suggestion.type === 'warning' && 'border-l-4 border-l-red-500 bg-red-50/50',
                suggestion.type === 'tip' && 'border-l-4 border-l-yellow-500 bg-yellow-50/50',
                suggestion.type === 'achievement' && 'border-l-4 border-l-green-500 bg-green-50/50'
              )}
            >
              {/* Kapat butonu */}
              {suggestion.dismissible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => handleDismiss(suggestion.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              <div className="flex items-start gap-3 pr-8">
                {/* İkon */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    suggestion.type === 'opportunity' && 'bg-indigo-100 text-indigo-600',
                    suggestion.type === 'warning' && 'bg-red-100 text-red-600',
                    suggestion.type === 'tip' && 'bg-yellow-100 text-yellow-600',
                    suggestion.type === 'achievement' && 'bg-green-100 text-green-600'
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
                          suggestion.type === 'warning' && 'border-red-300 text-red-700',
                          suggestion.type === 'tip' && 'border-yellow-300 text-yellow-700',
                          suggestion.type === 'opportunity' && 'border-indigo-300 text-indigo-700',
                          suggestion.type === 'achievement' && 'border-green-300 text-green-700'
                        )}
                      >
                        {suggestion.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{suggestion.description}</p>
                  {suggestion.actionLabel && suggestion.actionUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(suggestion.actionUrl!)}
                      className="mt-2"
                    >
                      {suggestion.actionLabel}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
