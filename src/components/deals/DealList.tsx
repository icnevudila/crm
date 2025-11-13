'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, LayoutGrid, Table as TableIcon, Filter } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast, confirm } from '@/lib/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { AutomationInfo } from '@/components/automation/AutomationInfo'

// Lazy load büyük componentler - performans için
const DealForm = dynamic(() => import('./DealForm'), {
  ssr: false,
  loading: () => null,
})

const DealKanbanChart = dynamic(() => import('@/components/charts/DealKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

const DealDetailModal = dynamic(() => import('./DealDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface DealListProps {
  isOpen?: boolean
}

interface Deal {
  id: string
  title: string
  stage: string
  value: number
  status: string
  customerId?: string
  companyId?: string
  priorityScore?: number // Lead scoring (migration 024)
  isPriority?: boolean // Lead scoring (migration 024)
  leadSource?: string // Lead source tracking (migration 025)
  leadScore?: {
    score: number
    temperature: string
  }[] // Lead scoring from LeadScore table
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

async function fetchDeals(
  stage: string,
  customerId: string,
  search: string,
  minValue: string,
  maxValue: string,
  startDate: string,
  endDate: string,
  leadSource?: string,
  filterCompanyId?: string
): Promise<Deal[]> {
  const params = new URLSearchParams()
  if (stage) params.append('stage', stage)
  if (customerId) params.append('customerId', customerId)
  if (search) params.append('search', search)
  if (minValue) params.append('minValue', minValue)
  if (maxValue) params.append('maxValue', maxValue)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (leadSource) params.append('leadSource', leadSource)
  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)

  // Cache headers - POST sonrası fresh data için cache'i kapat
  const res = await fetch(`/api/deals?${params.toString()}`, {
    cache: 'no-store', // POST sonrası fresh data için cache'i kapat
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch deals')
  const data = await res.json()
  // Pagination format desteÄŸi: { data: [...], pagination: {...} } veya direkt array
  return Array.isArray(data) ? data : (data?.data || [])
}

async function fetchKanbanDeals(
  customerId: string,
  search: string,
  minValue: string,
  maxValue: string,
  startDate: string,
  endDate: string,
  filterCompanyId?: string
) {
  const params = new URLSearchParams()
  if (customerId) params.append('customerId', customerId)
  if (search) params.append('search', search)
  if (minValue) params.append('minValue', minValue)
  if (maxValue) params.append('maxValue', maxValue)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)

  // Cache headers - Performans için 60 saniye cache (repo kurallarına uygun)
  const res = await fetch(`/api/analytics/deal-kanban?${params.toString()}`, {
    next: { revalidate: 60 }, // 60 saniye ISR cache (repo kurallarÄ±na uygun)
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch kanban deals')
  const data = await res.json()
  // Debug: Development'ta log ekle
  if (process.env.NODE_ENV === 'development') {
    console.log('fetchKanbanDeals response:', {
      hasKanban: !!data.kanban,
      kanbanLength: data.kanban?.length,
      kanban: data.kanban?.map((col: any) => ({
        stage: col.stage,
        count: col.count,
        totalValue: col.totalValue,
        dealsCount: col.deals?.length,
      })),
    })
  }
  return data.kanban || []
}

async function fetchCustomers() {
  // OPTÄ°MÄ°ZE: Cache headers (veri Ã§ekme mantÄ±ÄŸÄ± aynÄ±)
  const res = await fetch('/api/customers?pageSize=1000', {
    next: { revalidate: 300 },
    cache: 'force-cache',
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  // API'den dÃ¶nen veri formatÄ±nÄ± kontrol et - array mi yoksa object mi?
  return Array.isArray(data) ? data : (data.data || data.customers || [])
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'Ä°letiÅŸimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'PazarlÄ±k',
  WON: 'KazanÄ±ldÄ±',
  LOST: 'Kaybedildi',
}

export default function DealList({ isOpen = true }: DealListProps) {
  const locale = useLocale()
  const t = useTranslations('deals')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolÃ¼
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
  const [stage, setStage] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('') // Debounced search - performans için
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [leadSourceFilter, setLeadSourceFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [selectedDealData, setSelectedDealData] = useState<Deal | null>(null)
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [losingDealId, setLosingDealId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')
  const queryClient = useQueryClient()
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynÄ± id'ye sahip kayÄ±tlarÄ± tekilleÅŸtir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // Debounced search - kullanÄ±cÄ± yazmayÄ± bitirdikten 300ms sonra arama yap
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!isOpen) return
    // URL parametrelerinden filtreleri oku
    const leadSourceFromUrl = searchParams.get('leadSource') || ''
    const stageFromUrl = searchParams.get('stage') || ''
    
    // URL'den gelen stage parametresini state'e set et
    if (stageFromUrl && stageFromUrl !== stage) {
      setStage(stageFromUrl)
    }
    if (leadSourceFromUrl !== leadSourceFilter) {
      setLeadSourceFilter(leadSourceFromUrl)
    }
  }, [isOpen, searchParams, stage, leadSourceFilter])

  // OPTİMİZE: Agresif cache + placeholder data (veri çekme mantığı aynı)
  // Her zaman veri çek - viewMode değiştiğinde de veri hazır olsun
  // DÜZELTME: Liste'de stage filtresi yoksa tüm stage'ler gösterilmeli (kanban ile aynı)
  // DÜZELTME: enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)
  // DÜZELTME: refetchOnMount: true - sayfa yüklendiğinde veri çek (table view için)
  // OPTİMİZE: debouncedSearch kullan - her harfte arama yapılmaz
  const dealsQuery = useQuery({
    queryKey: ['deals', stage, customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId],
    queryFn: () => fetchDeals(stage || '', customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId || undefined), // debouncedSearch kullan
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Sayfa yüklendiğinde veri çek (table view için)
    placeholderData: (previousData) => previousData, // Optimistic update
    // enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)
  })

  const kanbanQuery = useQuery({
    queryKey: ['kanban-deals', customerId, debouncedSearch, minValue, maxValue, startDate, endDate, filterCompanyId],
    queryFn: () => fetchKanbanDeals(customerId, debouncedSearch, minValue, maxValue, startDate, endDate, filterCompanyId || undefined), // debouncedSearch kullan
    staleTime: 60 * 1000, // 60 saniye cache (repo kurallarÄ±na uygun - API ile aynÄ±)
    gcTime: 5 * 60 * 1000, // 5 dakika garbage collection
    refetchOnWindowFocus: false, // Focus'ta refetch yapma - cache kullan
    refetchOnMount: false, // Mount'ta refetch yapma - cache kullan
    placeholderData: (previousData) => previousData, // Optimistic update
    enabled: isOpen && viewMode === 'kanban', // Sadece kanban view'da Ã§alÄ±ÅŸ
  })

  const { data: customers } = useQuery({
    queryKey: ['customers', { scope: 'deals' }],
    queryFn: fetchCustomers,
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
    enabled: isOpen,
  })

  // customers'Ä± array olarak garanti et
  const customersArray = Array.isArray(customers) ? customers : []

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to delete deal' }))
        throw new Error(error.error || 'Failed to delete deal')
      }
      return res.json()
    },
    onSuccess: () => {
      // Hem table hem kanban view için query'leri invalidate et
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })
      queryClient.invalidateQueries({ queryKey: ['stats-deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'Ä± gÃ¼ncelle
      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs gÃ¼ncelle (toplam deÄŸer, ortalama vs.)
      // Optimistic update için cache'i temizle
      queryClient.refetchQueries({ queryKey: ['deals'] })
      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
      queryClient.refetchQueries({ queryKey: ['stats-deals'] })
      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'Ä± refetch et
      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam deÄŸer, ortalama vs.)
    },
    onError: (error: any) => {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
    },
  })

  const handleEdit = useCallback((deal: Deal) => {
    setSelectedDeal(deal)
    setFormOpen(true)
  }, [])

  const handleDelete = async (id: string, title: string) => {
    if (!(await confirm(t('deleteConfirm', { title })))) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
      
      // BaÅŸarÄ± bildirimi
      toast.success(
        t('dealDeleted'),
        t('dealDeletedMessage', { title })
      )
      
      // Kanban ve table view iÃ§in query'leri invalidate et
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })
      queryClient.invalidateQueries({ queryKey: ['stats-deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'Ä± gÃ¼ncelle
      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs gÃ¼ncelle (toplam deÄŸer, ortalama vs.)
      // Refetch yap - anında güncel veri gelsin
      queryClient.refetchQueries({ queryKey: ['deals'] })
      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
      queryClient.refetchQueries({ queryKey: ['stats-deals'] })
      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'Ä± refetch et
      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam deÄŸer, ortalama vs.)
    } catch (error: any) {
      toast.error(tCommon('error'), error?.message)
    }
  }

  // OPTİMİZE: Sadece ilk yüklemede ve hiç veri yoksa skeleton göster (veri çekme aynı)
  // Cache'de veri varsa anında göster, skeleton engellemez
  // Stats verisini çek - toplam sayı için
  const { data: stats } = useQuery({
    queryKey: ['stats-deals'],
    queryFn: async () => {
      const res = await fetch('/api/stats/deals')
      if (!res.ok) throw new Error('Failed to fetch deal stats')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const tableDeals = dealsQuery.data ?? []

  const kanbanTotal = useMemo(() => {
    if (!Array.isArray(kanbanQuery.data) || kanbanQuery.data.length === 0) return 0
    return kanbanQuery.data.reduce((sum: number, col: any) => sum + (col.count || 0), 0)
  }, [kanbanQuery.data])

  const totalDeals = useMemo(() => {
    return stats?.total || (viewMode === 'table' ? tableDeals.length : kanbanTotal)
  }, [stats?.total, viewMode, tableDeals.length, kanbanTotal])

  // Skeleton gÃ¶ster - hook'lardan SONRA (early return)
  // Ã–NEMLÄ°: kanbanData her zaman array olmalÄ± (undefined kontrolÃ¼)
  const hasKanbanData = Array.isArray(kanbanQuery.data) && kanbanQuery.data.length > 0
  if (!isOpen) {
    return null
  }

  if (dealsQuery.isLoading && viewMode === 'table') {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* Ä°statistikler */}
      <ModuleStats module="deals" statsUrl="/api/stats/deals" />

      <AutomationInfo
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationWon'),
            result: t('automationWonResult'),
            details: [
              t('automationWonDetails1'),
              t('automationWonDetails2'),
            ],
          },
          {
            action: t('automationLost'),
            result: t('automationLostResult'),
            details: [
              t('automationLostDetails1'),
              t('automationLostDetails2'),
            ],
          },
          {
            action: t('automationNegotiation'),
            result: t('automationNegotiationResult'),
            details: [
              t('automationNegotiationDetails1'),
              t('automationNegotiationDetails2'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalDeals', { count: totalDeals })}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setViewMode('table')
              // Table view'a geÃ§ildiÄŸinde veri Ã§ek
              queryClient.refetchQueries({ queryKey: ['deals'] })
            }}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setViewMode('kanban')
              // Kanban view'a geÃ§ildiÄŸinde veri Ã§ek
              queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
            }}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              setSelectedDeal(null)
              setFormOpen(true)
            }}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newDeal')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {t('filters')}
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('searchLabel')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* SuperAdmin Firma Filtresi */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('companyLabel')}</label>
                  <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('allCompanies')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allCompanies')}</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Customer */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('customerLabel')}</label>
                <Select value={customerId || 'all'} onValueChange={(v) => setCustomerId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={tCommon('filters.all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
                    {customersArray.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage (sadece table view için) */}
              {viewMode === 'table' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('stageLabel')}</label>
                  <Select value={stage || 'all'} onValueChange={(v) => setStage(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('allStages')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">TÃ¼mÃ¼</SelectItem>
                      <SelectItem value="LEAD">Potansiyel</SelectItem>
                      <SelectItem value="CONTACTED">Ä°letiÅŸimde</SelectItem>
                      <SelectItem value="PROPOSAL">Teklif</SelectItem>
                      <SelectItem value="NEGOTIATION">PazarlÄ±k</SelectItem>
                      <SelectItem value="WON">KazanÄ±ldÄ±</SelectItem>
                      <SelectItem value="LOST">Kaybedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Lead Source Filter */}
              {viewMode === 'table' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kaynak</label>
                  <Select value={leadSourceFilter || 'all'} onValueChange={(v) => {
                    const params = new URLSearchParams(searchParams.toString())
                    if (v === 'all') {
                      params.delete('leadSource')
                      setLeadSourceFilter('')
                    } else {
                      params.set('leadSource', v)
                      setLeadSourceFilter(v)
                    }
                    router.push(`?${params.toString()}`)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="TÃ¼mÃ¼" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">TÃ¼mÃ¼</SelectItem>
                      <SelectItem value="WEB">Web Sitesi</SelectItem>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                      <SelectItem value="PHONE">Telefon</SelectItem>
                      <SelectItem value="REFERRAL">Referans</SelectItem>
                      <SelectItem value="SOCIAL">Sosyal Medya</SelectItem>
                      <SelectItem value="OTHER">DiÄŸer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Min Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min DeÄŸer (â‚º)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>

              {/* Max Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max DeÄŸer (â‚º)</label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDateLabel')}</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endDateLabel')}</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStage('')
                  setCustomerId('')
                  setSearch('')
                  setMinValue('')
                  setMaxValue('')
                  setStartDate('')
                  setEndDate('')
                  setFilterCompanyId('')
                  const params = new URLSearchParams(searchParams)
                  params.delete('leadSource')
                  router.push(`?${params.toString()}`)
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DealKanbanChart 
          data={kanbanQuery.data} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStageChange={async (dealId: string, newStage: string) => {
            // ✅ ÇÖZÜM: LOST durumuna geçerken sebep sor
            if (newStage === 'LOST') {
              // Kayıp dialog'unu aç
              setLosingDealId(dealId)
              setLostDialogOpen(true)
              return // Dialog açıldı, işlem dialog'dan devam edecek
            }
            
            // Deal'ın stage'ini güncelle
            try {
              const res = await fetch(`/api/deals/${dealId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage }),
              })
              
              if (!res.ok) {
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to update deal stage')
              }

              const responseData = await res.json()
              const automation = responseData?.automation || {}
              
              // Fırsat başlığını al
              const dealTitle = responseData?.title || 'Fırsat'
              
              // Detaylı toast mesajları oluştur
              let toastTitle = ''
              let toastDescription = ''
              let toastType: 'success' | 'warning' | 'info' = 'success'
              
              switch (newStage) {
                case 'WON':
                  toastTitle = `FÄ±rsat kazanÄ±ldÄ±: "${dealTitle}"`
                  toastDescription = `FÄ±rsat "KazanÄ±ldÄ±" aÅŸamasÄ±na taÅŸÄ±ndÄ±.`
                  
                  if (automation.quoteCreated && automation.quoteId) {
                    toastDescription += `\n\nOtomatik iÅŸlemler:\nâ€¢ Teklif oluÅŸturuldu (ID: ${automation.quoteId.substring(0, 8)}...)\nâ€¢ Teklif baÅŸlÄ±ÄŸÄ±: ${automation.quoteTitle || 'Otomatik oluÅŸturuldu'}\nâ€¢ E-posta gÃ¶nderildi\nâ€¢ Bildirim gÃ¶nderildi`
                  }
                  break
                  
                case 'LOST':
                  toastTitle = `FÄ±rsat kaybedildi: "${dealTitle}"`
                  toastDescription = `FÄ±rsat "Kaybedildi" aÅŸamasÄ±na taÅŸÄ±ndÄ±.`
                  
                  if (automation.taskCreated && automation.taskId) {
                    toastDescription += `\n\nOtomatik iÅŸlemler:\nâ€¢ Analiz gÃ¶revi oluÅŸturuldu (ID: ${automation.taskId.substring(0, 8)}...)\nâ€¢ Bildirim gÃ¶nderildi`
                  } else {
                    toastDescription += `\n\nBildirim gÃ¶nderildi`
                  }
                  
                  toastType = 'warning'
                  break
                  
                default:
                  const currentStageName = stageLabels[newStage] || newStage
                  toastTitle = `FÄ±rsat aÅŸamasÄ± gÃ¼ncellendi: "${dealTitle}"`
                  toastDescription = `FÄ±rsat "${currentStageName}" aÅŸamasÄ±na taÅŸÄ±ndÄ±.`
              }

              if (toastType === 'success') {
                toast.success(toastTitle, toastDescription)
              } else if (toastType === 'warning') {
                toast.warning(toastTitle, toastDescription)
              } else {
                toast.success(toastTitle, toastDescription)
              }

              // Cache'i invalidate et - fresh data çek (hem table hem kanban hem stats)
              // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['deals'] }),
                queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
                queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
      queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
              ])
              
              // Refetch yap - anında güncel veri gelsin
              await Promise.all([
                queryClient.refetchQueries({ queryKey: ['deals'] }),
                queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),
                queryClient.refetchQueries({ queryKey: ['stats-deals'] }),
      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
      queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
              ])
            } catch (error: any) {
              console.error('Stage update error:', error)
              throw error // DealKanbanChart'a hata fırlat (optimistic update geri alınır)
            }
          }}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-card overflow-hidden">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              {isSuperAdmin && <TableHead>{t('tableHeaders.company')}</TableHead>}
              <TableHead>{t('tableHeaders.stage')}</TableHead>
              <TableHead>{t('tableHeaders.value')}</TableHead>
              <TableHead>{t('tableHeaders.customer')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>Lead Score</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8 text-gray-500">
                  {t('noDealsFound')}
                </TableCell>
              </TableRow>
            ) : (
              tableDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {deal.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={stageColors[deal.stage] || 'bg-gray-100'}>
                      {stageLabels[deal.stage] || deal.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(deal.value || 0)}
                  </TableCell>
                  <TableCell>
                    {deal.customerId ? (
                      <Link 
                        href={`/${locale}/customers/${deal.customerId}`}
                        className="text-primary-600 hover:underline"
                        prefetch={true}
                      >
                        {t('customerPrefix')}{deal.customerId.substring(0, 8)}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === 'OPEN' ? 'default' : 'secondary'}>
                      {deal.status === 'OPEN' ? 'AÃ§Ä±k' : 'KapalÄ±'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {deal.leadScore && deal.leadScore.length > 0 ? (
                        <>
                          <span className="font-semibold text-lg">
                            {deal.leadScore[0].score}
                          </span>
                          <Badge 
                            className={
                              deal.leadScore[0].temperature === 'HOT' 
                                ? 'bg-red-100 text-red-800' 
                                : deal.leadScore[0].temperature === 'WARM'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {deal.leadScore[0].temperature === 'HOT' ? 'ğŸ”¥ SÄ±cak' :
                             deal.leadScore[0].temperature === 'WARM' ? 'â˜€ï¸ IlÄ±k' :
                             'â„ï¸ SoÄŸuk'}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.leadSource ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        {deal.leadSource === 'WEB' ? 'Web Sitesi' :
                         deal.leadSource === 'EMAIL' ? 'E-posta' :
                         deal.leadSource === 'PHONE' ? 'Telefon' :
                         deal.leadSource === 'REFERRAL' ? 'Referans' :
                         deal.leadSource === 'SOCIAL' ? 'Sosyal Medya' :
                         deal.leadSource === 'OTHER' ? 'DiÄŸer' :
                         deal.leadSource}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDealId(deal.id)
                          setSelectedDealData(deal)
                          setDetailModalOpen(true)
                        }}
                        aria-label={t('viewDeal', { title: deal.title })}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(deal)}
                        aria-label={t('editDealAction', { title: deal.title })}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (deal.stage === 'WON') {
                            toast.warning(t('cannotDeleteWon'), t('cannotDeleteWonMessage'))
                            return
                          }
                          if (deal.status === 'CLOSED') {
                            toast.warning(t('cannotDeleteClosed'), t('cannotDeleteClosedMessage'))
                            return
                          }
                          handleDelete(deal.id, deal.title)
                        }}
                        disabled={deal.stage === 'WON' || deal.status === 'CLOSED'}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        aria-label={t('deleteDealAction', { title: deal.title })}
                        title={
                          deal.stage === 'WON' ? t('cannotDeleteWon') :
                          deal.status === 'CLOSED' ? t('cannotDeleteClosed') :
                          tCommon('delete')
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      )}

      {/* Detail Modal */}
      <DealDetailModal
        dealId={selectedDealId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedDealId(null)
          setSelectedDealData(null)
        }}
        initialData={selectedDealData || undefined}
      />

      {/* Form Modal */}
      <DealForm
        deal={selectedDeal || undefined}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedDeal(null)
        }}
        onSuccess={async (savedDeal) => {
          // BaÅŸarÄ± bildirimi
          toast.success(
            selectedDeal ? 'FÄ±rsat gÃ¼ncellendi!' : 'FÄ±rsat oluÅŸturuldu!',
            selectedDeal 
              ? `${savedDeal.title} baÅŸarÄ±yla gÃ¼ncellendi.`
              : `${savedDeal.title} baÅŸarÄ±yla oluÅŸturuldu.`
          )
          
          // Optimistic update - yeni/ gÃ¼ncellenmiÅŸ kaydÄ± hemen cache'e ekle ve UI'da gÃ¶ster
          // BÃ¶ylece form kapanmadan Ã¶nce fÄ±rsat listede gÃ¶rÃ¼nÃ¼r
          
          // Table view iÃ§in optimistic update
          if (viewMode === 'table') {
            let updatedDeals: Deal[]
            
            if (selectedDeal) {
              // UPDATE: Mevcut kaydÄ± gÃ¼ncelle
              updatedDeals = dealsQuery.data.map((d) =>
                d.id === savedDeal.id ? savedDeal : d
              )
            } else {
              // CREATE: Yeni kaydÄ± listenin baÅŸÄ±na ekle
              updatedDeals = [savedDeal, ...dealsQuery.data]
            }
            
            // React Query cache'ini gÃ¼ncelle
            queryClient.setQueryData(['deals', stage, customerId, search, minValue, maxValue, startDate, endDate], updatedDeals)
          }
          
          // TÃ¼m query'leri invalidate et - fresh data Ã§ek (hem table hem kanban)
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['deals'] }),
            queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
            queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
          ])
          
          // Refetch yap - anında güncel veri gelsin
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ['deals'] }),
            queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),
            queryClient.refetchQueries({ queryKey: ['stats-deals'] }),
          ])
        }}
      />

      {/* LOST Dialog - KayÄ±p sebebi sor */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('lostDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('lostDialog.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">{t('lostDialog.reasonLabel')} *</Label>
              <Textarea
                id="lostReason"
                placeholder={t('lostDialog.reasonPlaceholder')}
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLostDialogOpen(false)
                setLostReason('')
                setLosingDealId(null)
              }}
            >
              {t('lostDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!lostReason.trim()) {
                  toast.error(t('lostDialog.reasonRequired'), t('lostDialog.reasonRequiredMessage'))
                  return
                }

                if (!losingDealId) {
                  toast.error(tCommon('error'), t('lostDialog.error'))
                  setLostDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setLostDialogOpen(false)
                const dealId = losingDealId
                const reason = lostReason.trim()
                setLostReason('')
                setLosingDealId(null)

                // API Ã§aÄŸrÄ±sÄ± yap - lostReason ile birlikte
                try {
                  const res = await fetch(`/api/deals/${dealId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      stage: 'LOST',
                      lostReason: reason,
                    }),
                  })
                  
                  if (!res.ok) {
                    const error = await res.json().catch(() => ({}))
                    throw new Error(error.error || 'Failed to mark deal as lost')
                  }

                  const updatedDeal = await res.json()
                  
                  // Toast mesajÄ± - analiz gÃ¶revi oluÅŸturulduÄŸunu bildir
                  toast.success(
                    t('lostDialog.dealMarkedAsLost'),
                    t('lostDialog.dealMarkedAsLostMessage'),
                    {
                      label: t('lostDialog.goToTasksPage'),
                      onClick: () => window.location.href = `/${locale}/tasks`,
                    }
                  )

                  // Cache'i invalidate et
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['deals'] }),
                    queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
                    queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
                    queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }),
                    queryClient.invalidateQueries({ queryKey: ['kpis'] }),
                  ])
                  
                  // Refetch yap
                  await Promise.all([
                    queryClient.refetchQueries({ queryKey: ['deals'] }),
                    queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),
                    queryClient.refetchQueries({ queryKey: ['stats-deals'] }),
                    queryClient.refetchQueries({ queryKey: ['deal-kanban'] }),
                    queryClient.refetchQueries({ queryKey: ['kpis'] }),
                  ])
                } catch (error: any) {
                  console.error('Lost error:', error)
                  toast.error(t('lostDialog.markAsLostFailed'), error?.message || t('lostDialog.markAsLostFailedMessage'))
                }
              }}
              disabled={!lostReason.trim()}
            >
              {t('lostDialog.markAsLost')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

