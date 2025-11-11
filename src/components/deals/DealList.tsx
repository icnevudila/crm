'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, Search, Edit, Trash2, Eye, LayoutGrid, Table as TableIcon, Filter } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
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

// Lazy load büyük componentler - performans için
const DealForm = dynamic(() => import('./DealForm'), {
  ssr: false,
  loading: () => null,
})

const DealKanbanChart = dynamic(() => import('@/components/charts/DealKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

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
  return res.json()
}

async function fetchKanbanDeals(
  customerId: string,
  search: string,
  minValue: string,
  maxValue: string,
  startDate: string,
  endDate: string
) {
  const params = new URLSearchParams()
  if (customerId) params.append('customerId', customerId)
  if (search) params.append('search', search)
  if (minValue) params.append('minValue', minValue)
  if (maxValue) params.append('maxValue', maxValue)
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)

  // Cache headers - Performans için 60 saniye cache (repo kurallarına uygun)
  const res = await fetch(`/api/analytics/deal-kanban?${params.toString()}`, {
    next: { revalidate: 60 }, // 60 saniye ISR cache (repo kurallarına uygun)
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
  // OPTİMİZE: Cache headers (veri çekme mantığı aynı)
  const res = await fetch('/api/customers?pageSize=1000', {
    next: { revalidate: 300 },
    cache: 'force-cache',
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  // API'den dönen veri formatını kontrol et - array mi yoksa object mi?
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
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

export default function DealList() {
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
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
  const [showFilters, setShowFilters] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [losingDealId, setLosingDealId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')
  const queryClient = useQueryClient()
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // Debounced search - kullanıcı yazmayı bitirdikten 300ms sonra arama yap
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // URL parametrelerinden filtreleri oku
  const leadSourceFilter = searchParams.get('leadSource') || ''
  const stageFromUrl = searchParams.get('stage') || ''
  
  // URL'den gelen stage parametresini state'e set et
  useEffect(() => {
    if (stageFromUrl && stageFromUrl !== stage) {
      setStage(stageFromUrl)
    }
  }, [stageFromUrl])
  
  // OPTİMİZE: Agresif cache + placeholder data (veri çekme mantığı aynı)
  // Her zaman veri çek - viewMode değiştiğinde de veri hazır olsun
  // DÜZELTME: Liste'de stage filtresi yoksa tüm stage'ler gösterilmeli (kanban ile aynı)
  // DÜZELTME: enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)
  // DÜZELTME: refetchOnMount: true - sayfa yüklendiğinde veri çek (table view için)
  // OPTİMİZE: debouncedSearch kullan - her harfte arama yapılmaz
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', stage, customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId],
    queryFn: () => fetchDeals(stage || '', customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId || undefined), // debouncedSearch kullan
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Sayfa yüklendiğinde veri çek (table view için)
    placeholderData: (previousData) => previousData, // Optimistic update
    // enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)
  })

  const { data: kanbanData = [], isLoading: isLoadingKanban } = useQuery({
    queryKey: ['kanban-deals', customerId, debouncedSearch, minValue, maxValue, startDate, endDate],
    queryFn: () => fetchKanbanDeals(customerId, debouncedSearch, minValue, maxValue, startDate, endDate), // debouncedSearch kullan
    staleTime: 60 * 1000, // 60 saniye cache (repo kurallarına uygun - API ile aynı)
    gcTime: 5 * 60 * 1000, // 5 dakika garbage collection
    refetchOnWindowFocus: false, // Focus'ta refetch yapma - cache kullan
    refetchOnMount: false, // Mount'ta refetch yapma - cache kullan
    placeholderData: (previousData) => previousData, // Optimistic update
    enabled: viewMode === 'kanban', // Sadece kanban view'da çalış
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  })

  // customers'ı array olarak garanti et
  const customers = Array.isArray(customersData) ? customersData : []

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
      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı güncelle
      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
      // Optimistic update için cache'i temizle
      queryClient.refetchQueries({ queryKey: ['deals'] })
      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
      queryClient.refetchQueries({ queryKey: ['stats-deals'] })
      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı refetch et
      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
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
    if (!confirm(`${title} fırsatını silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
      
      // Başarı bildirimi
      toast.success(
        'Fırsat silindi!',
        `${title} başarıyla silindi.`
      )
      
      // Kanban ve table view için query'leri invalidate et
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })
      queryClient.invalidateQueries({ queryKey: ['stats-deals'] })
      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı güncelle
      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
      // Refetch yap - anında güncel veri gelsin
      queryClient.refetchQueries({ queryKey: ['deals'] })
      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
      queryClient.refetchQueries({ queryKey: ['stats-deals'] })
      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı refetch et
      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
    } catch (error: any) {
      toast.error('Silinemedi', error?.message)
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

  // ModuleStats'ten gelen total değerini kullan - dashboard ile tutarlı olması için
  // DÜZELTME: Kanban view'daki toplam sayıyı doğru hesapla (tüm stage'lerin count'larını topla)
  // OPTİMİZE: useMemo ile hesaplamaları optimize et
  // ÖNEMLİ: Hook'lar if statement'tan ÖNCE çağrılmalı (React Rules of Hooks)
  // ÖNEMLİ: kanbanData her zaman array olmalı (undefined kontrolü)
  const kanbanTotal = useMemo(() => {
    if (!Array.isArray(kanbanData) || kanbanData.length === 0) return 0
    return kanbanData.reduce((sum: number, col: any) => sum + (col.count || 0), 0)
  }, [kanbanData])

  const totalDeals = useMemo(() => {
    return stats?.total || (viewMode === 'table' ? deals.length : kanbanTotal)
  }, [stats?.total, viewMode, deals.length, kanbanTotal])

  // Skeleton göster - hook'lardan SONRA (early return)
  // ÖNEMLİ: kanbanData her zaman array olmalı (undefined kontrolü)
  const hasKanbanData = Array.isArray(kanbanData) && kanbanData.length > 0
  if (((isLoading && viewMode === 'table' && !deals.length) || 
      (isLoadingKanban && viewMode === 'kanban' && !hasKanbanData))) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="deals" statsUrl="/api/stats/deals" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fırsatlar</h1>
          <p className="mt-2 text-gray-600">Toplam {totalDeals} fırsat</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setViewMode('table')
              // Table view'a geçildiğinde veri çek
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
              // Kanban view'a geçildiğinde veri çek
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
            Yeni Fırsat
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
            Filtreler
          </Button>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ara</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Başlık veya açıklama..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* SuperAdmin Firma Filtresi */}
              {isSuperAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Firma</label>
                  <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Firmalar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Firmalar</SelectItem>
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
                <label className="text-sm font-medium">Müşteri</label>
                <Select value={customerId || 'all'} onValueChange={(v) => setCustomerId(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {customers.map((customer: any) => (
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
                  <label className="text-sm font-medium">Aşama</label>
                  <Select value={stage || 'all'} onValueChange={(v) => setStage(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="LEAD">Potansiyel</SelectItem>
                      <SelectItem value="CONTACTED">İletişimde</SelectItem>
                      <SelectItem value="PROPOSAL">Teklif</SelectItem>
                      <SelectItem value="NEGOTIATION">Pazarlık</SelectItem>
                      <SelectItem value="WON">Kazanıldı</SelectItem>
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
                    } else {
                      params.set('leadSource', v)
                    }
                    router.push(`?${params.toString()}`)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="WEB">Web Sitesi</SelectItem>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                      <SelectItem value="PHONE">Telefon</SelectItem>
                      <SelectItem value="REFERRAL">Referans</SelectItem>
                      <SelectItem value="SOCIAL">Sosyal Medya</SelectItem>
                      <SelectItem value="OTHER">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Min Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Değer (₺)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>

              {/* Max Value */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Değer (₺)</label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Bitiş Tarihi</label>
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
          data={kanbanData} 
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
              <TableHead>Başlık</TableHead>
              {isSuperAdmin && <TableHead>Firma</TableHead>}
              <TableHead>Aşama</TableHead>
              <TableHead>Değer</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Lead Score</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 10 : 9} className="text-center py-8 text-gray-500">
                  Fırsat bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
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
                        Müşteri #{deal.customerId.substring(0, 8)}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === 'OPEN' ? 'default' : 'secondary'}>
                      {deal.status === 'OPEN' ? 'Açık' : 'Kapalı'}
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
                            {deal.leadScore[0].temperature === 'HOT' ? '🔥 Sıcak' :
                             deal.leadScore[0].temperature === 'WARM' ? '☀️ Ilık' :
                             '❄️ Soğuk'}
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
                         deal.leadSource === 'OTHER' ? 'Diğer' :
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
                      <Link href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`${deal.title} fırsatını görüntüle`}>
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(deal)}
                        aria-label={`${deal.title} fırsatını düzenle`}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (deal.stage === 'WON') {
                            toast.warning('Bu fırsat kazanıldığı için silemezsiniz', 'Bu fırsat kazanıldı. Kazanılmış fırsatları silmek mümkün değildir.')
                            return
                          }
                          if (deal.status === 'CLOSED') {
                            toast.warning('Bu fırsat kapandığı için silemezsiniz', 'Bu fırsat kapatıldı. Kapatılmış fırsatları silmek mümkün değildir.')
                            return
                          }
                          handleDelete(deal.id, deal.title)
                        }}
                        disabled={deal.stage === 'WON' || deal.status === 'CLOSED'}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        aria-label={`${deal.title} fırsatını sil`}
                        title={
                          deal.stage === 'WON' ? 'Bu fırsat kazanıldığı için silemezsiniz' :
                          deal.status === 'CLOSED' ? 'Bu fırsat kapandığı için silemezsiniz' :
                          'Sil'
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

      {/* Form Modal */}
      <DealForm
        deal={selectedDeal || undefined}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedDeal(null)
        }}
        onSuccess={async (savedDeal) => {
          // Başarı bildirimi
          toast.success(
            selectedDeal ? 'Fırsat güncellendi!' : 'Fırsat oluşturuldu!',
            selectedDeal 
              ? `${savedDeal.title} başarıyla güncellendi.`
              : `${savedDeal.title} başarıyla oluşturuldu.`
          )
          
          // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
          // Böylece form kapanmadan önce fırsat listede görünür
          
          // Table view için optimistic update
          if (viewMode === 'table') {
            let updatedDeals: Deal[]
            
            if (selectedDeal) {
              // UPDATE: Mevcut kaydı güncelle
              updatedDeals = deals.map((d) =>
                d.id === savedDeal.id ? savedDeal : d
              )
            } else {
              // CREATE: Yeni kaydı listenin başına ekle
              updatedDeals = [savedDeal, ...deals]
            }
            
            // React Query cache'ini güncelle
            queryClient.setQueryData(['deals', stage, customerId, search, minValue, maxValue, startDate, endDate], updatedDeals)
          }
          
          // Tüm query'leri invalidate et - fresh data çek (hem table hem kanban)
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

      {/* LOST Dialog - Kayıp sebebi sor */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fırsatı Kaybedildi Olarak İşaretle</DialogTitle>
            <DialogDescription>
              Fırsatı kaybedildi olarak işaretlemek için lütfen sebep belirtin. Bu sebep fırsat detay sayfasında not olarak görünecektir ve analiz görevi oluşturulacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">Kayıp Sebebi *</Label>
              <Textarea
                id="lostReason"
                placeholder="Örn: Fiyat uygun değil, Müşteri ihtiyacı değişti, Teknik uyumsuzluk, Rakipler daha avantajlı..."
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
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!lostReason.trim()) {
                  toast.error('Sebep gerekli', 'Lütfen kayıp sebebini belirtin.')
                  return
                }

                if (!losingDealId) {
                  toast.error('Hata', 'Fırsat ID bulunamadı.')
                  setLostDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setLostDialogOpen(false)
                const dealId = losingDealId
                const reason = lostReason.trim()
                setLostReason('')
                setLosingDealId(null)

                // API çağrısı yap - lostReason ile birlikte
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
                  
                  // Toast mesajı - analiz görevi oluşturulduğunu bildir
                  toast.success(
                    'Fırsat kaybedildi olarak işaretlendi',
                    'Fırsat kaybedildi. Analiz görevi otomatik olarak oluşturuldu. Görevler sayfasından kontrol edebilirsiniz.',
                    {
                      label: 'Görevler Sayfasına Git',
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
                  toast.error('Kayıp işaretleme başarısız', error?.message || 'Fırsat kaybedildi olarak işaretlenemedi.')
                }
              }}
              disabled={!lostReason.trim()}
            >
              Kaybedildi Olarak İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

