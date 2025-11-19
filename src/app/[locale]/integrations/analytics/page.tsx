'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Card } from '@/components/ui/card'
import { useData } from '@/hooks/useData'
import { Mail, MessageSquare, Calendar, TrendingUp, AlertCircle, DollarSign, BarChart3, PieChart } from 'lucide-react'
import dynamic from 'next/dynamic'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Lazy load charts
const IntegrationDailyChart = dynamic(() => import('@/components/integrations/charts/IntegrationDailyChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const IntegrationPieChart = dynamic(() => import('@/components/integrations/charts/IntegrationPieChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const ErrorTrendChart = dynamic(() => import('@/components/integrations/charts/ErrorTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

interface IntegrationAnalytics {
  totalSent: number
  totalFailed: number
  email: { sent: number; failed: number; total: number }
  sms: { sent: number; failed: number; total: number }
  whatsapp: { sent: number; failed: number; total: number }
  calendar: { added: number; failed: number; total: number }
  successRate: number
  emailSuccessRate: number
  smsSuccessRate: number
  whatsappSuccessRate: number
  calendarSuccessRate: number
  dailyStats: Array<{
    date: string
    email: number
    sms: number
    whatsapp: number
    calendar: number
    total: number
    failed: number
  }>
  topRecipients: Array<{
    recipient: string
    count: number
    type: 'email' | 'sms' | 'whatsapp'
  }>
  errorTrend: Array<{
    date: string
    count: number
    type: string
  }>
  estimatedCost: {
    email: { count: number; costPerUnit: number; total: number; freeLimit: number }
    sms: { count: number; costPerUnit: number; total: number; freeLimit: number }
    whatsapp: { count: number; costPerUnit: number; total: number; freeLimit: number }
    total: number
  }
  period: {
    start: string
    end: string
    days: number
  }
}

export default function IntegrationAnalyticsPage() {
  const locale = useLocale()
  const [days, setDays] = useState('30')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // API URL oluştur
  const params = new URLSearchParams()
  if (days) params.append('days', days)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  const apiUrl = `/api/integrations/analytics?${params.toString()}`
  const { data: analytics, isLoading, error } = useData<IntegrationAnalytics>(apiUrl, {
    dedupingInterval: 60000, // 1 dakika cache
    revalidateOnFocus: false,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <SkeletonList />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Entegrasyon istatistikleri yüklenemedi. Lütfen tekrar deneyin.</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entegrasyon İstatistikleri</h1>
          <p className="text-gray-600 mt-1">
            Son {analytics.period.days} günün entegrasyon kullanım analizi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Son 7 Gün</SelectItem>
              <SelectItem value="30">Son 30 Gün</SelectItem>
              <SelectItem value="90">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Gönderimler */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Gönderimler</p>
              <p className="text-3xl font-bold">{analytics.totalSent.toLocaleString('tr-TR')}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.totalFailed > 0 && (
                  <span className="text-red-600">{analytics.totalFailed} başarısız</span>
                )}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>

        {/* Başarı Oranı */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Başarı Oranı</p>
              <p className="text-3xl font-bold">{analytics.successRate.toFixed(1)}%</p>
              <Badge
                className={`mt-2 ${
                  analytics.successRate >= 95
                    ? 'bg-green-100 text-green-800'
                    : analytics.successRate >= 80
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {analytics.successRate >= 95 ? 'Mükemmel' : analytics.successRate >= 80 ? 'İyi' : 'Düşük'}
              </Badge>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* En Çok Kullanılan */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En Çok Kullanılan</p>
              <p className="text-2xl font-bold">
                {analytics.email.total >= analytics.sms.total && analytics.email.total >= analytics.whatsapp.total
                  ? 'E-posta'
                  : analytics.sms.total >= analytics.whatsapp.total
                  ? 'SMS'
                  : 'WhatsApp'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.max(analytics.email.total, analytics.sms.total, analytics.whatsapp.total).toLocaleString('tr-TR')} işlem
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <PieChart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Tahmini Maliyet */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tahmini Maliyet</p>
              <p className="text-3xl font-bold">
                ${analytics.estimatedCost.total.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Son {analytics.period.days} gün
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Entegrasyon Detayları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Email */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">E-posta</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{analytics.email.sent.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">
              {analytics.email.failed > 0 && (
                <span className="text-red-600">{analytics.email.failed} başarısız</span>
              )}
              {analytics.email.failed === 0 && <span className="text-green-600">%{analytics.emailSuccessRate.toFixed(1)} başarı</span>}
            </p>
          </div>
        </Card>

        {/* SMS */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">SMS</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{analytics.sms.sent.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">
              {analytics.sms.failed > 0 && (
                <span className="text-red-600">{analytics.sms.failed} başarısız</span>
              )}
              {analytics.sms.failed === 0 && <span className="text-green-600">%{analytics.smsSuccessRate.toFixed(1)} başarı</span>}
            </p>
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">WhatsApp</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{analytics.whatsapp.sent.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">
              {analytics.whatsapp.failed > 0 && (
                <span className="text-red-600">{analytics.whatsapp.failed} başarısız</span>
              )}
              {analytics.whatsapp.failed === 0 && <span className="text-green-600">%{analytics.whatsappSuccessRate.toFixed(1)} başarı</span>}
            </p>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Takvim</h3>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{analytics.calendar.added.toLocaleString('tr-TR')}</p>
            <p className="text-xs text-gray-600">
              {analytics.calendar.failed > 0 && (
                <span className="text-red-600">{analytics.calendar.failed} başarısız</span>
              )}
              {analytics.calendar.failed === 0 && <span className="text-green-600">%{analytics.calendarSuccessRate.toFixed(1)} başarı</span>}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Günlük Gönderim Grafiği */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Günlük Gönderim Trendi</h2>
          <IntegrationDailyChart data={analytics.dailyStats} />
        </Card>

        {/* Entegrasyon Dağılımı */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Entegrasyon Dağılımı</h2>
          <IntegrationPieChart
            email={analytics.email.total}
            sms={analytics.sms.total}
            whatsapp={analytics.whatsapp.total}
            calendar={analytics.calendar.total}
          />
        </Card>
      </div>

      {/* Hata Trend Analizi */}
      {analytics.errorTrend.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hata Trend Analizi</h2>
          <ErrorTrendChart data={analytics.errorTrend} />
        </Card>
      )}

      {/* En Çok Mesaj Gönderilen Müşteriler */}
      {analytics.topRecipients.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">En Çok Mesaj Gönderilen Müşteriler</h2>
          <div className="space-y-2">
            {analytics.topRecipients.map((recipient, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      recipient.type === 'email'
                        ? 'bg-indigo-100 text-indigo-800'
                        : recipient.type === 'sms'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {recipient.type === 'email' ? 'E-posta' : recipient.type === 'sms' ? 'SMS' : 'WhatsApp'}
                  </Badge>
                  <span className="font-medium">{recipient.recipient}</span>
                </div>
                <span className="text-gray-600">{recipient.count} mesaj</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Maliyet Detayları */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Maliyet Detayları</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">E-posta</p>
            <p className="text-2xl font-bold">${analytics.estimatedCost.email.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.estimatedCost.email.count.toLocaleString('tr-TR')} e-posta
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">SMS</p>
            <p className="text-2xl font-bold">${analytics.estimatedCost.sms.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.estimatedCost.sms.count.toLocaleString('tr-TR')} SMS
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
            <p className="text-2xl font-bold">${analytics.estimatedCost.whatsapp.total.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.estimatedCost.whatsapp.count.toLocaleString('tr-TR')} mesaj
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

