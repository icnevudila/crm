'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { Plus, Edit, Trash2, Target, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import SalesQuotaForm from './SalesQuotaForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import RefreshButton from '@/components/ui/RefreshButton'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'

interface SalesQuota {
  id: string
  userId: string
  targetRevenue: number
  actualRevenue: number
  achievement: number
  period: string
  startDate: string
  endDate: string
  user?: { name: string }
  createdAt: string
}

export default function SalesQuotaList() {
  const locale = useLocale()
  const t = useTranslations('salesQuotas')
  const tCommon = useTranslations('common')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedQuota, setSelectedQuota] = useState<SalesQuota | null>(null)

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz
    
    return () => clearTimeout(timer)
  }, [search])

  // API URL'ini memoize et - her render'da yeni string oluşturma
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (period) params.append('period', period)
    return `/api/sales-quotas?${params.toString()}`
  }, [debouncedSearch, period])

  const { data: quotas = [], isLoading, mutate: mutateQuotas } = useData<SalesQuota[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
  })

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  // ÖNEMLİ: apiUrl'i dependency'den çıkar - sadece base URL'leri invalidate et
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutateQuotas(undefined, { revalidate: true }),
      mutate('/api/sales-quotas', undefined, { revalidate: true }),
      mutate('/api/sales-quotas?', undefined, { revalidate: true }),
      // apiUrl'i burada kullanma - her değiştiğinde callback yeniden oluşur
    ])
  }, [mutateQuotas]) // Sadece mutateQuotas dependency - callback sabit kalır

  const handleEdit = (quota: SalesQuota) => {
    setSelectedQuota(quota)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Satış Kotasını Sil?',
      description: 'Bu işlem geri alınamaz.',
      confirmLabel: 'Sil',
      cancelLabel: 'İptal',
      variant: 'destructive'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const res = await fetch(`/api/sales-quotas/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete quota')
      }

      const updatedQuotas = quotas.filter((q) => q.id !== id)
      await mutateQuotas(updatedQuotas, { revalidate: false })
      await Promise.all([
        mutate('/api/sales-quotas', updatedQuotas, { revalidate: false }),
        mutate('/api/sales-quotas?', updatedQuotas, { revalidate: false }),
        mutate(apiUrl, updatedQuotas, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed'), { description: error?.message || 'Bir hata oluştu' })
    }
  }

  const handleFormClose = () => {
    setSelectedQuota(null)
    setFormOpen(false)
  }

  // Otomasyon bilgilerini memoize et - her render'da yeni obje oluşturma
  const automations = useMemo(() => [
    {
      action: t('automationAchievement100', { defaultMessage: 'Kota %100 başarıya ulaştığında' }),
      result: t('automationAchievement100Result', { defaultMessage: 'Otomatik bildirim gönderilir' }),
      details: [
        t('automationAchievement100Details1', { defaultMessage: 'Kullanıcıya başarı bildirimi gönderilir' }),
        t('automationAchievement100Details2', { defaultMessage: 'Yöneticilere rapor hazırlanır' }),
      ],
    },
    {
      action: t('automationPeriodEnd', { defaultMessage: 'Kota periyodu bittiğinde' }),
      result: t('automationPeriodEndResult', { defaultMessage: 'Performans raporu oluşturulur' }),
      details: [
        t('automationPeriodEndDetails1', { defaultMessage: 'Başarı oranı hesaplanır' }),
        t('automationPeriodEndDetails2', { defaultMessage: 'Yeni periyot için öneriler sunulur' }),
      ],
    },
  ], [t])

  // Stats URL'ini memoize et - her render'da yeni string oluşturma
  const statsUrl = useMemo(() => '/api/stats/sales-quotas', [])

  // onSuccess callback'ini component seviyesinde tanımla - JSX içinde hook kullanma!
  const onSuccess = useCallback(async (savedQuota: SalesQuota) => {
    let updatedQuotas: SalesQuota[]

    if (selectedQuota) {
      updatedQuotas = quotas.map((q) =>
        q.id === savedQuota.id ? savedQuota : q
      )
    } else {
      updatedQuotas = [savedQuota, ...quotas]
    }

    await mutateQuotas(updatedQuotas, { revalidate: false })
    // Sadece base URL'leri güncelle - apiUrl her değiştiğinde callback yeniden oluşmasın
    await Promise.all([
      mutate('/api/sales-quotas', updatedQuotas, { revalidate: false }),
      mutate('/api/sales-quotas?', updatedQuotas, { revalidate: false }),
    ])
  }, [selectedQuota, quotas, mutateQuotas])

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="sales-quotas" statsUrl={statsUrl} />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle', { defaultMessage: 'Satış Kotaları Otomasyonları' })}
        automations={automations}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshButton onRefresh={handleRefresh} />
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          {t('newQuota')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={period || 'all'} onValueChange={(value) => setPeriod(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('selectPeriod')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allPeriods')}</SelectItem>
            <SelectItem value="MONTHLY">{t('periodMonthly')}</SelectItem>
            <SelectItem value="QUARTERLY">{t('periodQuarterly')}</SelectItem>
            <SelectItem value="YEARLY">{t('periodYearly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.user')}</TableHead>
              <TableHead>{t('tableHeaders.period')}</TableHead>
              <TableHead>{t('tableHeaders.target')}</TableHead>
              <TableHead>{t('tableHeaders.actual')}</TableHead>
              <TableHead>{t('tableHeaders.achievement')}</TableHead>
              <TableHead>{t('tableHeaders.dateRange')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  {t('noQuotasFound')}
                </TableCell>
              </TableRow>
            ) : (
              quotas.map((quota) => (
                <TableRow key={quota.id}>
                  <TableCell>
                    <div className="font-medium">{quota.user?.name || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800 border-0">
                      {quota.period === 'MONTHLY' ? t('periodMonthly') :
                       quota.period === 'QUARTERLY' ? t('periodQuarterly') : t('periodYearly')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(quota.targetRevenue)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(quota.actualRevenue || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Progress value={quota.achievement || 0} className="flex-1" />
                        <span className="text-sm font-medium">
                          {(quota.achievement || 0).toFixed(1)}%
                        </span>
                      </div>
                      {quota.achievement >= 100 ? (
                        <Badge className="bg-green-100 text-green-800 border-0">
                          <Target className="h-3 w-3 mr-1" />
                          {t('statusAchieved', { defaultMessage: 'Hedef Aşıldı' })}
                        </Badge>
                      ) : quota.achievement >= 80 ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0">
                          {t('statusNearTarget', { defaultMessage: 'Hedefe Yakın' })}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-0">
                          {t('statusAtRisk', { defaultMessage: 'Riskli' })}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(quota.startDate).toLocaleDateString('tr-TR')}</div>
                      <div className="text-gray-500">
                        {new Date(quota.endDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/sales-quotas/${quota.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(quota)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quota.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <SalesQuotaForm
        quota={selectedQuota || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={onSuccess}
      />
    </div>
  )
}


