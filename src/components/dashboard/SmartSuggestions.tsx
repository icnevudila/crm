'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Receipt,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/hooks/useData'
import SkeletonList from '@/components/skeletons/SkeletonList'

interface Suggestion {
  id: string
  type: 'quote' | 'invoice' | 'customer' | 'task' | 'deal'
  title: string
  description: string
  count: number
  href: string
  icon: React.ReactNode
  priority: 'high' | 'medium' | 'low'
  color: string
}

export default function SmartSuggestions() {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const router = useRouter()

  // Bekleyen teklifler (SENT durumunda)
  const { data: pendingQuotes, isLoading: quotesLoading } = useData<{ count: number }>(
    '/api/analytics/pending-quotes',
    { dedupingInterval: 30000, revalidateOnFocus: false }
  )

  // Ödeme bekleyen faturalar
  const { data: pendingInvoices, isLoading: invoicesLoading } = useData<{ count: number }>(
    '/api/analytics/pending-invoices',
    { dedupingInterval: 30000, revalidateOnFocus: false }
  )

  // Takip edilmesi gereken müşteriler (30 gün iletişim yok)
  const { data: customersToFollow, isLoading: customersLoading } = useData<{ count: number }>(
    '/api/analytics/customers-to-follow',
    { dedupingInterval: 30000, revalidateOnFocus: false }
  )

  // Süresi dolmak üzere olan görevler
  const { data: upcomingTasks, isLoading: tasksLoading } = useData<{ count: number }>(
    '/api/analytics/upcoming-tasks',
    { dedupingInterval: 30000, revalidateOnFocus: false }
  )

  // Bekleyen fırsatlar (NEGOTIATION aşamasında - Kanban'da "Pazarlık" olarak gösteriliyor)
  const { data: pendingDeals, isLoading: dealsLoading } = useData<{ count: number }>(
    '/api/analytics/pending-deals',
    { dedupingInterval: 30000, revalidateOnFocus: false }
  )

  const suggestions = useMemo<Suggestion[]>(() => {
    const items: Suggestion[] = []

    // Bekleyen teklifler (SENT durumunda - Kanban'da "Gönderildi" olarak gösteriliyor)
    if (pendingQuotes?.count && pendingQuotes.count > 0) {
      items.push({
        id: 'pending-quotes',
        type: 'quote',
        title: t('pendingQuotesTitle'),
        description: t('pendingQuotesDescription', { count: pendingQuotes.count }),
        count: pendingQuotes.count,
        href: `/${locale}/quotes?status=SENT`,
        icon: <FileText className="h-5 w-5" />,
        priority: 'high',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      })
    }

    // Ödeme bekleyen faturalar
    if (pendingInvoices?.count && pendingInvoices.count > 0) {
      items.push({
        id: 'pending-invoices',
        type: 'invoice',
        title: t('pendingInvoicesTitle'),
        description: t('pendingInvoicesDescription', { count: pendingInvoices.count }),
        count: pendingInvoices.count,
        href: `/${locale}/invoices?status=SENT`,
        icon: <Receipt className="h-5 w-5" />,
        priority: 'high',
        color: 'text-orange-600 bg-orange-50 border-orange-200',
      })
    }

    // Takip edilmesi gereken müşteriler
    if (customersToFollow?.count && customersToFollow.count > 0) {
      items.push({
        id: 'customers-to-follow',
        type: 'customer',
        title: t('customersToFollowTitle'),
        description: t('customersToFollowDescription', { count: customersToFollow.count }),
        count: customersToFollow.count,
        href: `/${locale}/customers`,
        icon: <Users className="h-5 w-5" />,
        priority: 'medium',
        color: 'text-purple-600 bg-purple-50 border-purple-200',
      })
    }

    // Süresi dolmak üzere olan görevler
    if (upcomingTasks?.count && upcomingTasks.count > 0) {
      items.push({
        id: 'upcoming-tasks',
        type: 'task',
        title: t('upcomingTasksTitle'),
        description: t('upcomingTasksDescription', { count: upcomingTasks.count }),
        count: upcomingTasks.count,
        href: `/${locale}/tasks`,
        icon: <Clock className="h-5 w-5" />,
        priority: 'high',
        color: 'text-red-600 bg-red-50 border-red-200',
      })
    }

    // Bekleyen fırsatlar (NEGOTIATION aşamasında - Kanban'da "Pazarlık" olarak gösteriliyor)
    if (pendingDeals?.count && pendingDeals.count > 0) {
      items.push({
        id: 'pending-deals',
        type: 'deal',
        title: t('pendingDealsTitle'),
        description: t('pendingDealsDescription', { count: pendingDeals.count }),
        count: pendingDeals.count,
        href: `/${locale}/deals?stage=NEGOTIATION&status=OPEN`,
        icon: <TrendingUp className="h-5 w-5" />,
        priority: 'medium',
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      })
    }

    // Önceliğe göre sırala (high > medium > low)
    return items.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [pendingQuotes, pendingInvoices, customersToFollow, upcomingTasks, pendingDeals, locale, t])

  const isLoading = quotesLoading || invoicesLoading || customersLoading || tasksLoading || dealsLoading

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">{t('smartSuggestions')}</CardTitle>
          </div>
          <CardDescription>{t('smartSuggestionsAnalyzing')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SkeletonList count={3} />
        </CardContent>
      </Card>
    )
  }

  if (suggestions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg">{t('smartSuggestionsAllDone')}</CardTitle>
          </div>
          <CardDescription>{t('smartSuggestionsAllDoneDescription')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">{t('smartSuggestions')}</CardTitle>
          </div>
          <Badge variant="outline" className="bg-white">
            {suggestions.length} {t('smartSuggestionsCount')}
          </Badge>
        </div>
        <CardDescription>{t('smartSuggestionsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className={`w-full justify-between h-auto p-4 border-2 ${suggestion.color} hover:shadow-md transition-all`}
                onClick={() => router.push(suggestion.href)}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${suggestion.color.split(' ')[1]}`}>
                    {suggestion.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{suggestion.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{suggestion.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}







