'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, FileText, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import RefreshButton from '@/components/ui/RefreshButton'

// Lazy load büyük componentler - performans için
const QuoteForm = dynamic(() => import('./QuoteForm'), {
  ssr: false,
  loading: () => null,
})

const QuoteKanbanChart = dynamic(() => import('@/components/charts/QuoteKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

const QuoteDetailModal = dynamic(() => import('./QuoteDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface QuoteListProps {
  isOpen?: boolean
}

interface Quote {
  id: string
  title: string
  status: string
  total?: number
  totalAmount?: number
  dealId?: string
  companyId?: string
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

async function fetchKanbanQuotes(search: string, dealId: string, filterCompanyId?: string, customerCompanyId?: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (dealId) params.append('dealId', dealId)
  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)
  if (customerCompanyId) params.append('customerCompanyId', customerCompanyId) // Firma bazlı filtreleme

  // ÇÖZÜM: Cache'i kapat - refresh sonrası her zaman yeni data çek
  const res = await fetch(`/api/analytics/quote-kanban?${params.toString()}`, {
    cache: 'no-store', // ÇÖZÜM: Next.js cache'i kapat - her zaman fresh data çek
    headers: {
      'Cache-Control': 'no-store, must-revalidate', // ÇÖZÜM: Browser cache'i de kapat
    },
  })
  if (!res.ok) throw new Error('Failed to fetch kanban quotes')
  const data = await res.json()
  return data.kanban || []
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DECLINED: 'bg-red-100 text-red-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
}

export default function QuoteList({ isOpen = true }: QuoteListProps) {
  const locale = useLocale()
  const t = useTranslations('quotes')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const statusLabels: Record<string, string> = {
    DRAFT: tStatus('draft'),
    SENT: tStatus('sent'),
    ACCEPTED: tStatus('accepted'),
    REJECTED: t('statusRejected'),
    DECLINED: tStatus('declined'),
    WAITING: t('statusWaiting'),
  }
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  // URL parametrelerinden filtreleri oku
  const statusFromUrl = searchParams.get('status') || ''
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban') // Kanban default
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(statusFromUrl)
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [customerCompanyId, setCustomerCompanyId] = useState('') // Firma bazlı filtreleme
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  
  // URL'den gelen status parametresini state'e set et
  useEffect(() => {
    if (statusFromUrl && statusFromUrl !== status) {
      setStatus(statusFromUrl)
    }
    const customerCompanyIdFromUrl = searchParams.get('customerCompanyId') || '' // Read from URL
    if (customerCompanyIdFromUrl && customerCompanyIdFromUrl !== customerCompanyId) {
      setCustomerCompanyId(customerCompanyIdFromUrl)
    }
  }, [statusFromUrl, status, searchParams, customerCompanyId])
  const [dealId, setDealId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedQuoteData, setSelectedQuoteData] = useState<Quote | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isOpen && isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )
  
  // SWR ile veri çekme (CustomerList pattern'i) - Table view için
  // DÜZELTME: Status filtresi yoksa tüm status'ler gösterilmeli (kanban ile aynı)
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/quotes?${params.toString()}`
  }, [isOpen, debouncedSearch, status, isSuperAdmin, filterCompanyId])

  const { data: quotesResponse, isLoading, mutate: mutateQuotes } = useData<any>(
    isOpen && viewMode === 'table' && apiUrl ? apiUrl : null,
    {
      dedupingInterval: 60000, // 60 saniye cache (performans için)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
      refreshInterval: 0,
    }
  )

  // Pagination format desteği: { data: [...], pagination: {...} } veya direkt array (all=true için)
  const quotes = useMemo(() => {
    if (!quotesResponse) return []
    if (Array.isArray(quotesResponse)) return quotesResponse // all=true durumu
    if (quotesResponse?.data && Array.isArray(quotesResponse.data)) return quotesResponse.data // pagination durumu
    return []
  }, [quotesResponse])

  // Kanban view için TanStack Query kullanıyoruz (kanban özel endpoint)
  // ÖNEMLİ: Her zaman çalıştır (viewMode ne olursa olsun) - silme/güncelleme için gerekli
  const queryClient = useQueryClient()

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutateQuotes(undefined, { revalidate: true }),
      mutate('/api/quotes', undefined, { revalidate: true }),
      mutate('/api/quotes?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/quotes', undefined, { revalidate: true }),
      queryClient.invalidateQueries({ queryKey: ['kanban-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }),
    ])
  }, [mutateQuotes, apiUrl, queryClient])
  // SuperAdmin için filterCompanyId'yi normalize et - boş string yerine undefined kullan
  const normalizedFilterCompanyId = filterCompanyId && filterCompanyId !== '' ? filterCompanyId : undefined
  const { data: kanbanDataFromQuery = [], isLoading: isLoadingKanban } = useQuery({
    queryKey: ['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId, isSuperAdmin],
    queryFn: () => fetchKanbanQuotes(debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId || undefined),
    staleTime: 0, // ✅ ÇÖZÜM: Cache'i kapat - refresh sonrası her zaman yeni data çek
    gcTime: 0, // ✅ ÇÖZÜM: Garbage collection'ı kapat - cache'i hemen temizle
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ ÇÖZÜM: Mount olduğunda refetch YAP - refresh sonrası yeni data çek
    refetchOnReconnect: false, // Reconnect'te refetch YAPMA - optimistic update'i koru
    placeholderData: (previousData) => previousData, // Optimistic update
    structuralSharing: false, // ÖNEMLİ: Structural sharing'i kapat - referans değişikliğini algıla
    notifyOnChangeProps: 'all', // ✅ ÇÖZÜM: Tüm değişiklikleri notify et - setQueryData değişikliklerini algıla
    // ÖNEMLİ: setQueryData ile cache güncellenince otomatik olarak güncellenir
    enabled: isOpen && viewMode === 'kanban', // Sadece kanban view'da çalış
  })

  // ✅ ÇÖZÜM: useQuery'den gelen data'yı state'e kopyala - optimistic update için
  // ÖNEMLİ: State-based optimistic update - React Query cache'inden bağımsız
  const [kanbanData, setKanbanData] = useState<any[]>(kanbanDataFromQuery)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // ✅ ÇÖZÜM: Initial load kontrolü
  
  // useQuery'den gelen data değiştiğinde state'i güncelle (sadece initial load'da)
  // ÖNEMLİ: Bu useEffect sadece initial load'da çalışır - optimistic update'ler bu useEffect'i bypass eder
  // ÖNEMLİ: Refresh sonrası API'den eski data gelirse state'i override etmemek için initial load kontrolü var
  useEffect(() => {
    if (!isOpen) return
    if (!isInitialLoad && kanbanDataFromQuery.length === 0) {
      return
    }

    if (kanbanDataFromQuery.length > 0) {
      setKanbanData(kanbanDataFromQuery)
      setIsInitialLoad(false)
    }
  }, [kanbanDataFromQuery, isInitialLoad, isOpen])

  const handleEdit = useCallback((quote: Quote) => {
    setSelectedQuote(quote)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string, title: string) => {
    // Çift tıklamayı önle
    if (deletingId === id) {
      return
    }

    const confirmed = await confirm(
      t('deleteConfirm', { title }),
      t('deleteConfirmMessage')
    )
    if (!confirmed) {
      return
    }

    setDeletingId(id)

    try {
      // ÖNCE optimistic update yap - UI anında güncellensin
      // Table view için optimistic update
      if (quotes.length > 0) {
        const updatedQuotes = quotes.filter((q) => q.id !== id)
        mutateQuotes(updatedQuotes, { revalidate: false })
        mutate('/api/quotes', updatedQuotes, { revalidate: false })
        mutate('/api/quotes?', updatedQuotes, { revalidate: false })
        mutate(apiUrl, updatedQuotes, { revalidate: false })
      }
      
      // Kanban view için optimistic update - silinen kaydı kanban data'dan kaldır
      if (Array.isArray(kanbanData) && kanbanData.length > 0) {
        const updatedKanbanData = kanbanData.map((col: any) => {
          const quoteIndex = (col.quotes || []).findIndex((q: any) => q.id === id)
          if (quoteIndex !== -1) {
            // Silinen quote'u bu kolondan kaldır - totalValue'yu da güncelle
            const updatedQuotes = (col.quotes || []).filter((q: any) => q.id !== id)
            const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
              const quoteValue = q.totalAmount || q.total || 0
              return sum + (typeof quoteValue === 'string' ? parseFloat(quoteValue) || 0 : quoteValue)
            }, 0)
            return {
              ...col,
              quotes: updatedQuotes,
              count: Math.max(0, (col.count || 0) - 1),
              totalValue: updatedTotalValue, // Toplam tutarı güncelle
            }
          }
          return col
        })
        // Kanban query cache'ini güncelle - optimistic update (refetch yapmadan önce)
        // ÖNEMLİ: setQueryData ile cache'i güncelle, böylece kanbanData prop'u otomatik güncellenir
        queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId], updatedKanbanData)
      }
      
      // SONRA API'ye DELETE isteği gönder
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        // Hata durumunda optimistic update'i geri al - eski veriyi geri getir
        mutateQuotes(undefined, { revalidate: true })
        queryClient.invalidateQueries({ queryKey: ['kanban-quotes'] })
        queryClient.refetchQueries({ queryKey: ['kanban-quotes'] })
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete quote')
      }
      
      // Başarı bildirimi
      toast.success(
        t('quoteDeleted'),
        t('quoteDeletedMessage', { title })
      )
      
      // ✅ ÇÖZÜM: Sadece dashboard'daki diğer query'leri invalidate et (background'da, refetch olmadan)
      // ÖNEMLİ: kanban-quotes query'sini invalidate ETME - optimistic update'i koru
      // ÖNEMLİ: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
      // Sadece dashboard'daki diğer query'leri invalidate et - onlar kendi staleTime'larına göre refetch olur
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }), // Table view için
        queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }), // Stats için
        queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle
      ])
      
      // ✅ ÇÖZÜM: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
      // Optimistic update zaten yapıldı, invalidate yeterli - query'ler kendi staleTime'larına göre refetch olur
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(tCommon('error'), error?.message)
    } finally {
      setDeletingId(null)
    }
  }, [quotes, mutateQuotes, apiUrl, kanbanData, debouncedSearch, dealId, queryClient, deletingId])

  const handleAdd = useCallback(() => {
    setSelectedQuote(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedQuote(null)
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>(isOpen ? '/api/stats/quotes' : null, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  if (!isOpen) {
    return null
  }

  if (viewMode === 'table' && isLoading) {
    return <SkeletonList />
  }

  // ModuleStats'ten gelen total değerini kullan - dashboard ile tutarlı olması için
  const totalQuotes = stats?.total || (viewMode === 'table' 
    ? quotes.length 
    : kanbanData.reduce((sum: number, col: any) => sum + col.count, 0))

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="quotes" statsUrl="/api/stats/quotes" />

      <AutomationInfo
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationAccepted'),
            result: t('automationAcceptedResult'),
            details: [
              t('automationAcceptedDetails'),
              t('automationAcceptedDetails2'),
            ],
          },
          {
            action: t('automationRejected'),
            result: t('automationRejectedResult'),
            details: [
              t('automationRejectedDetails'),
            ],
          },
          {
            action: t('automationWaiting'),
            result: t('automationWaitingResult'),
            details: [
              t('automationWaitingDetails'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">{t('totalQuotes', { count: totalQuotes })}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-1 sm:flex-initial">
            <RefreshButton onRefresh={handleRefresh} />
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={() => {
              setSelectedQuote(null)
              setFormOpen(true)
            }}
            className="bg-gradient-primary text-white w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newQuote')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative w-full sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={tCommon('select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon('filters.all')}</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {viewMode === 'table' && (
          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={tStatus('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="DRAFT">{statusLabels.DRAFT}</SelectItem>
              <SelectItem value="SENT">{statusLabels.SENT}</SelectItem>
              <SelectItem value="ACCEPTED">{statusLabels.ACCEPTED}</SelectItem>
              <SelectItem value="DECLINED">{statusLabels.DECLINED}</SelectItem>
              <SelectItem value="WAITING">{statusLabels.WAITING}</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <QuoteKanbanChart
          onView={(quoteId) => {
            setSelectedQuoteId(quoteId)
            setDetailModalOpen(true)
          }} // ✅ ÇÖZÜM: Modal açmak için callback
          data={kanbanData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={async (quoteId: string, newStatus: string) => {
            // ✅ ÇÖZÜM: REJECTED durumuna geçerken sebep sor
            if (newStatus === 'REJECTED' || newStatus === 'DECLINED') {
              // Reddet dialog'unu aç
              setRejectingQuoteId(quoteId)
              setRejectDialogOpen(true)
              return // Dialog açıldı, işlem dialog'dan devam edecek
            }
            
            // ✅ ÇÖZÜM: Kullanıcıya onay sor - backend'de güncelleme yapılmadan önce
            const statusLabel = statusLabels[newStatus] || newStatus
            const quote = kanbanData
              .flatMap((c: any) => c.quotes || [])
              .find((q: any) => q.id === quoteId)
            const quoteTitle = quote?.title || t('defaultQuoteTitle')
            
            const confirmed = await confirm(
              t('rejectDialog.statusChangeConfirm', { quoteTitle, statusLabel }),
              t('rejectDialog.statusChangeMessage')
            )
            if (!confirmed) {
              return // Kullanıcı iptal etti, işlemi durdur
            }
            
            // ✅ ÇÖZÜM: Kullanıcı onayladı, şimdi optimistic update yap
            // ÖNEMLİ: Optimistic update yap - kart anında taşınır
            const previousKanbanData = kanbanData
            
            // ✅ ÇÖZÜM: Debug - REJECTED status'ü için özel log
            if (newStatus === 'REJECTED' || newStatus === 'DECLINED') {
              console.log('REJECTED/DECLINED Status Update:', {
                quoteId,
                newStatus,
                kanbanDataStatuses: kanbanData.map((col: any) => col.status),
                quoteFound: kanbanData.flatMap((c: any) => c.quotes || []).find((q: any) => q.id === quoteId),
              })
            }
            
            // ÇÖZÜM: Optimistic update - kart anında taşınır
            const optimisticKanbanData = kanbanData.map((col: any) => {
              // Eski status'den quote'u bul ve kaldır
              const quoteIndex = (col.quotes || []).findIndex((q: any) => q.id === quoteId)
              if (quoteIndex !== -1) {
                const updatedQuotes = (col.quotes || []).filter((q: any) => q.id !== quoteId)
                const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                  const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                  return sum + quoteValue
                }, 0)
                return {
                  ...col,
                  quotes: updatedQuotes,
                  count: Math.max(0, (col.count || 0) - 1),
                  totalValue: updatedTotalValue,
                }
              }
              
              // Yeni status'e quote'u ekle - REJECTED ve DECLINED ikisini de destekle
              if (col.status === newStatus || (newStatus === 'REJECTED' && col.status === 'DECLINED') || (newStatus === 'DECLINED' && col.status === 'REJECTED')) {
                const quote = previousKanbanData
                  .flatMap((c: any) => c.quotes || [])
                  .find((q: any) => q.id === quoteId)
                
                if (quote) {
                  const updatedQuote = { 
                    ...quote, 
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                  }
                  const updatedQuotes = [updatedQuote, ...(col.quotes || [])]
                  const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                    const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                    return sum + quoteValue
                  }, 0)
                  return {
                    ...col,
                    quotes: updatedQuotes,
                    count: (col.count || 0) + 1,
                    totalValue: updatedTotalValue,
                  }
                }
              }
              
              return col
            })
            
            // ÇÖZÜM: Optimistic update'i state'e set et - kart anında taşınır
            const optimisticKanbanDataWithNewRef = JSON.parse(JSON.stringify(optimisticKanbanData))
            setKanbanData(optimisticKanbanDataWithNewRef)
            
            // ÇÖZÜM: API çağrısı yap - backend'de güncelleme yapılsın
            try {
              const res = await fetch(`/api/quotes/${quoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              })
              
              if (!res.ok) {
                // Hata durumunda optimistic update'i geri al
                setKanbanData(previousKanbanData)
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to update quote status')
              }

              // %100 KESİN ÇÖZÜM: API'den dönen güncellenmiş quote'u al
              // ÖNEMLİ: Backend'den dönen gerçek data'yı kullan - updatedAt ve diğer alanlar güncel olacak
              const updatedQuote = await res.json()
              const automation = updatedQuote?.automation || {}
              
              // Teklif başlığını al
              const quoteTitle = updatedQuote?.title || 'Teklif'
              
              // Detaylı toast mesajları oluştur
              let toastTitle = ''
              let toastDescription = ''
              let toastType: 'success' | 'warning' | 'info' = 'success'
              
              switch (newStatus) {
                case 'ACCEPTED':
                  toastTitle = `Teklif kabul edildi: "${quoteTitle}"`
                  toastDescription = `Teklif "Kabul Edildi" durumuna taşındı.`
                  
                  if (automation.invoiceCreated && automation.invoiceId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Fatura oluşturuldu (ID: ${automation.invoiceId.substring(0, 8)}...)\n• Fatura başlığı: ${automation.invoiceTitle || 'Otomatik oluşturuldu'}\n• E-posta gönderildi\n• Bildirim gönderildi`
                  }
                  break
                  
                case 'REJECTED':
                case 'DECLINED':
                  toastTitle = `Teklif reddedildi: "${quoteTitle}"`
                  toastDescription = `Teklif "${newStatus === 'REJECTED' ? 'Reddedildi' : 'İptal Edildi'}" durumuna taşındı.`
                  
                  if (automation.taskCreated && automation.taskId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Revizyon görevi oluşturuldu (ID: ${automation.taskId.substring(0, 8)}...)\n• Bildirim gönderildi`
                  } else {
                    toastDescription += `\n\nBildirim gönderildi`
                  }
                  
                  toastType = 'warning'
                  break
                  
                case 'SENT':
                  toastTitle = `Teklif gönderildi: "${quoteTitle}"`
                  toastDescription = `Teklif "Gönderildi" durumuna taşındı.\n\nOtomatik işlemler:\n• E-posta gönderildi\n• Bildirim gönderildi`
                  break
                  
                default:
                  const statusName = statusLabels[newStatus] || newStatus
                  toastTitle = `Teklif durumu güncellendi: "${quoteTitle}"`
                  toastDescription = `Teklif "${statusName}" durumuna taşındı.`
              }

              if (toastType === 'success') {
                toast.success(toastTitle, toastDescription)
              } else if (toastType === 'warning') {
                toast.warning(toastTitle, toastDescription)
              } else {
                toast.success(toastTitle, toastDescription)
              }
              
              // %100 KESİN ÇÖZÜM: Backend'den dönen güncellenmiş quote ile kanban data'yı güncelle
              // ÖNEMLİ: Backend'den dönen gerçek data'yı kullan - updatedAt güncel olacak
              const updatedKanbanDataWithBackendData = previousKanbanData.map((col: any) => {
                // Eski kolondan quote'u kaldır
                if (col.quotes?.some((q: any) => q.id === quoteId)) {
                  const filteredQuotes = col.quotes.filter((q: any) => q.id !== quoteId)
                  const updatedTotalValue = filteredQuotes.reduce((sum: number, q: any) => {
                    const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                    return sum + quoteValue
                  }, 0)
                  return {
                    ...col,
                    quotes: filteredQuotes,
                    count: filteredQuotes.length,
                    totalValue: updatedTotalValue,
                  }
                }
                return col
              }).map((col: any) => {
                // Yeni kolona güncellenmiş quote'u ekle - REJECTED ve DECLINED ikisini de destekle
                if (col.status === newStatus || (newStatus === 'REJECTED' && col.status === 'DECLINED') || (newStatus === 'DECLINED' && col.status === 'REJECTED')) {
                  // ÇÖZÜM: Backend'den dönen güncellenmiş quote'u kullan
                  const updatedQuoteForKanban = {
                    id: updatedQuote.id,
                    title: updatedQuote.title,
                    totalAmount: updatedQuote.totalAmount || 0,
                    dealId: updatedQuote.dealId,
                    createdAt: updatedQuote.createdAt,
                    updatedAt: updatedQuote.updatedAt, // ÇÖZÜM: Backend'den dönen güncel updatedAt
                  }
                  const updatedQuotes = [updatedQuoteForKanban, ...(col.quotes || [])]
                  const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                    const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                    return sum + quoteValue
                  }, 0)
                  return {
                    ...col,
                    quotes: updatedQuotes,
                    count: updatedQuotes.length,
                    totalValue: updatedTotalValue,
                  }
                }
                return col
              })
              
              // %100 KESİN ÇÖZÜM: Backend'den dönen güncellenmiş data ile cache'i güncelle
              const updatedKanbanDataWithNewRef = JSON.parse(JSON.stringify(updatedKanbanDataWithBackendData))
              
              // %100 KESİN ÇÖZÜM: Backend'den dönen gerçek data ile cache'i güncelle
              // ÖNEMLİ: Backend'den dönen gerçek data ile cache güncelleniyor - refresh sonrası güncel data görünecek
              queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId], updatedKanbanDataWithNewRef)
              
              // %100 KESİN ÇÖZÜM: State'i de güncelle - backend'den dönen gerçek data ile
              setKanbanData(updatedKanbanDataWithNewRef)
              
              // %100 KESİN ÇÖZÜM: Cache'i tamamen temizle - refresh sonrası kesinlikle yeni data çekilsin
              // ÖNEMLİ: removeQueries ile cache'i tamamen temizle - refresh sonrası kesinlikle API'den yeni data çekilecek
              queryClient.removeQueries({ 
                queryKey: ['kanban-quotes'],
              })
              
              // %100 KESİN ÇÖZÜM: Cache'i backend'den dönen gerçek data ile tekrar set et
              // ÖNEMLİ: removeQueries sonrası cache'i tekrar set et - refresh sonrası cache'den güncel data gelsin
              queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId], updatedKanbanDataWithNewRef)
              
              // %100 KESİN ÇÖZÜM: Query'yi invalidate et ve manuel refetch yap - refresh sonrası API'den yeni data çekilsin
              // ÖNEMLİ: staleTime: 0 ve gcTime: 0 nedeniyle refresh sonrası kesinlikle yeni data çekilecek
              await queryClient.invalidateQueries({ 
                queryKey: ['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId],
                exact: true,
              })
              
              // %100 KESİN ÇÖZÜM: Manuel refetch yap - kesinlikle fresh data çek
              // ÖNEMLİ: invalidateQueries sonrası manuel refetch yap - kesinlikle API'den yeni data çekilsin
              await queryClient.refetchQueries({ 
                queryKey: ['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId],
                exact: true,
              })
              
              // %100 KESİN ÇÖZÜM: isInitialLoad'i false yap - useEffect'in state'i override etmesini engelle
              setIsInitialLoad(false)

              // ÇÖZÜM: Sadece dashboard'daki diğer query'leri invalidate et (background'da, refetch olmadan)
              // ÖNEMLİ: kanban-quotes query'sini invalidate ETME - optimistic update'i koru
              // ÖNEMLİ: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
              // Sadece dashboard'daki diğer query'leri invalidate et - onlar kendi staleTime'larına göre refetch olur
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['quotes'] }), // Table view için
                queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }), // Stats için
                queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
                queryClient.invalidateQueries({ queryKey: ['quote-analysis'] }), // Dashboard'daki quote analiz grafiğini güncelle
                queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle
              ])
              
              // ✅ ÇÖZÜM: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
              // Optimistic update zaten yapıldı, invalidate yeterli - query'ler kendi staleTime'larına göre refetch olur
            } catch (error: any) {
              console.error('Status update error:', error)
              toast.error(t('rejectDialog.statusUpdateError'), error?.message)
              throw error
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
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead>{t('tableHeaders.total')}</TableHead>
                <TableHead>{t('tableHeaders.deal')}</TableHead>
                <TableHead>{t('tableHeaders.date')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                    {tCommon('noData')}
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.title}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {quote.Company?.name || '-'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
                        {statusLabels[quote.status] || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(quote.totalAmount || quote.total || 0)}
                    </TableCell>
                    <TableCell>
                      {quote.dealId ? (
                        <Link 
                          href={`/${locale}/deals/${quote.dealId}`}
                          className="text-primary-600 hover:underline"
                          prefetch={true}
                        >
                          Fırsat #{quote.dealId.substring(0, 8)}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedQuoteId(quote.id)
                            setSelectedQuoteData(quote)
                            setDetailModalOpen(true)
                          }}
                          aria-label={t('viewQuote', { title: quote.title })}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quote.status === 'ACCEPTED') {
                              toast.warning(t('cannotEditAccepted'), t('cannotEditAcceptedMessage'))
                              return
                            }
                            handleEdit(quote)
                          }}
                          disabled={quote.status === 'ACCEPTED'}
                          aria-label={t('editQuote', { title: quote.title })}
                          title={quote.status === 'ACCEPTED' ? t('cannotEditAccepted') : tCommon('edit')}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quote.status === 'ACCEPTED') {
                              toast.warning(t('cannotDeleteAccepted'), t('cannotDeleteAcceptedMessage'))
                              return
                            }
                            handleDelete(quote.id, quote.title)
                          }}
                          disabled={quote.status === 'ACCEPTED'}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          aria-label={t('deleteQuote', { title: quote.title })}
                          title={quote.status === 'ACCEPTED' ? t('cannotDeleteAccepted') : tCommon('delete')}
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
      <QuoteDetailModal
        quoteId={selectedQuoteId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedQuoteId(null)
          setSelectedQuoteData(null)
        }}
        initialData={selectedQuoteData || undefined}
      />

      {/* Form Modal */}
      <QuoteForm
        quote={selectedQuote || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedQuote) => {
          // Başarı bildirimi
          toast.success(
            selectedQuote ? t('rejectDialog.quoteUpdatedToast') : t('rejectDialog.quoteCreatedToast'),
            selectedQuote
              ? t('rejectDialog.quoteUpdatedMessage', { title: savedQuote.title })
              : t('rejectDialog.quoteCreatedMessage', { title: savedQuote.title })
          )
          
          // Optimistic update - yeni/güncellenmiş kaydı hemen cache'e ekle
          // ÖNEMLİ: Hem table hem kanban view için optimistic update yap
          
          if (selectedQuote) {
            // UPDATE: Mevcut kaydı güncelle
            const updatedQuotes = quotes.map((q) =>
              q.id === savedQuote.id ? savedQuote : q
            )
            
            // Table view için SWR cache'i güncelle - optimistic update
            if (viewMode === 'table') {
              await mutateQuotes(updatedQuotes, { revalidate: false })
              await Promise.all([
                mutate('/api/quotes', updatedQuotes, { revalidate: false }),
                mutate('/api/quotes?', updatedQuotes, { revalidate: false }),
                mutate(apiUrl, updatedQuotes, { revalidate: false }),
              ])
            }
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            const updatedQuotes = [savedQuote, ...quotes]
            
            // Table view için SWR cache'i güncelle - optimistic update
            // ÖNEMLİ: Her zaman table view cache'ini güncelle (viewMode ne olursa olsun)
            await mutateQuotes(updatedQuotes, { revalidate: false })
            await Promise.all([
              mutate('/api/quotes', updatedQuotes, { revalidate: false }),
              mutate('/api/quotes?', updatedQuotes, { revalidate: false }),
              mutate(apiUrl, updatedQuotes, { revalidate: false }),
            ])
          }
          
          // Kanban view için optimistic update - yeni kaydı kanban data'ya ekle
          // ÖNEMLİ: Her zaman kanban data'yı güncelle (viewMode ne olursa olsun)
          if (Array.isArray(kanbanData)) {
            const status = savedQuote.status || 'DRAFT'
            const updatedKanbanData = kanbanData.map((col: any) => {
              if (col.status === status) {
                if (selectedQuote) {
                  // UPDATE: Mevcut kaydı güncelle
                  const updatedQuotes = (col.quotes || []).map((q: any) =>
                    q.id === savedQuote.id ? savedQuote : q
                  )
                  const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                    const quoteValue = typeof q.total === 'string' ? parseFloat(q.total) || 0 : (q.total || 0)
                    return sum + quoteValue
                  }, 0)
                  return {
                    ...col,
                    quotes: updatedQuotes,
                    totalValue: updatedTotalValue, // Toplam tutarı güncelle
                  }
                } else {
                  // CREATE: Yeni kaydı bu kolona ekle - totalValue'yu da güncelle
                  const updatedQuotes = [savedQuote, ...(col.quotes || [])]
                  const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                    const quoteValue = typeof q.total === 'string' ? parseFloat(q.total) || 0 : (q.total || 0)
                    return sum + quoteValue
                  }, 0)
                  return {
                    ...col,
                    quotes: updatedQuotes,
                    count: (col.count || 0) + 1,
                    totalValue: updatedTotalValue, // Toplam tutarı güncelle
                  }
                }
              }
              return col
            })
            // Kanban query cache'ini güncelle
            queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId], updatedKanbanData)
          }
          
          // ✅ ÇÖZÜM: Sadece dashboard'daki diğer query'leri invalidate et (background'da, refetch olmadan)
          // ÖNEMLİ: kanban-quotes query'sini invalidate ETME - optimistic update'i koru
          // ÖNEMLİ: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
          // Sadece dashboard'daki diğer query'leri invalidate et - onlar kendi staleTime'larına göre refetch olur
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['quotes'] }), // Table view için
            queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }), // Stats için
            queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
            queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle
          ])
          
          // ✅ ÇÖZÜM: refetchQueries KULLANMA - staleTime nedeniyle gereksiz refetch tetikler
          // Optimistic update zaten yapıldı, invalidate yeterli - query'ler kendi staleTime'larına göre refetch olur
        }}
      />

      {/* Reddet Dialog - Sebep Sor */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('rejectDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('rejectDialog.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">{t('rejectDialog.reasonLabel')} *</Label>
              <Textarea
                id="rejectReason"
                placeholder={t('rejectDialog.reasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectReason('')
                setRejectingQuoteId(null)
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!rejectReason.trim()) {
                  toast.error(t('rejectDialog.reasonRequired'), t('rejectDialog.reasonRequiredMessage'))
                  return
                }

                if (!rejectingQuoteId) {
                  toast.error(t('rejectDialog.error'), t('rejectDialog.quoteIdNotFound'))
                  setRejectDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setRejectDialogOpen(false)
                const quoteId = rejectingQuoteId
                const reason = rejectReason.trim()
                setRejectReason('')
                setRejectingQuoteId(null)

                // Status güncelleme işlemini devam ettir - notes ile birlikte
                const quote = kanbanData
                  .flatMap((c: any) => c.quotes || [])
                  .find((q: any) => q.id === quoteId)
                const quoteTitle = quote?.title || 'Teklif'
                
                // Optimistic update
                const previousKanbanData = kanbanData
                
                const optimisticKanbanData = kanbanData.map((col: any) => {
                  // Eski status'den quote'u bul ve kaldır
                  const quoteIndex = (col.quotes || []).findIndex((q: any) => q.id === quoteId)
                  if (quoteIndex !== -1) {
                    const updatedQuotes = (col.quotes || []).filter((q: any) => q.id !== quoteId)
                    const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                      const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                      return sum + quoteValue
                    }, 0)
                    return {
                      ...col,
                      quotes: updatedQuotes,
                      count: Math.max(0, (col.count || 0) - 1),
                      totalValue: updatedTotalValue,
                    }
                  }
                  
                  // REJECTED kolonuna ekle
                  if (col.status === 'REJECTED' || col.status === 'DECLINED') {
                    const quote = previousKanbanData
                      .flatMap((c: any) => c.quotes || [])
                      .find((q: any) => q.id === quoteId)
                    
                    if (quote) {
                      const updatedQuote = { 
                        ...quote, 
                        status: 'REJECTED',
                        updatedAt: new Date().toISOString(),
                      }
                      const updatedQuotes = [updatedQuote, ...(col.quotes || [])]
                      const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                        const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                        return sum + quoteValue
                      }, 0)
                      return {
                        ...col,
                        quotes: updatedQuotes,
                        count: (col.count || 0) + 1,
                        totalValue: updatedTotalValue,
                      }
                    }
                  }
                  
                  return col
                })
                
                // Optimistic update'i state'e set et
                const optimisticKanbanDataWithNewRef = JSON.parse(JSON.stringify(optimisticKanbanData))
                setKanbanData(optimisticKanbanDataWithNewRef)
                
                // API çağrısı yap - notes ile birlikte
                try {
                  const res = await fetch(`/api/quotes/${quoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      status: 'REJECTED',
                      notes: `❌ REDDEDİLDİ - ${new Date().toLocaleDateString('tr-TR')}\nSebep: ${reason}`,
                    }),
                  })
                  
                  if (!res.ok) {
                    // Hata durumunda optimistic update'i geri al
                    setKanbanData(previousKanbanData)
                    const error = await res.json().catch(() => ({}))
                    throw new Error(error.error || 'Failed to reject quote')
                  }

                  const updatedQuote = await res.json()
                  
                  // Backend'den dönen güncellenmiş quote ile kanban data'yı güncelle
                  const updatedKanbanDataWithBackendData = previousKanbanData.map((col: any) => {
                    // Eski kolondan quote'u kaldır
                    if (col.quotes?.some((q: any) => q.id === quoteId)) {
                      const filteredQuotes = col.quotes.filter((q: any) => q.id !== quoteId)
                      const updatedTotalValue = filteredQuotes.reduce((sum: number, q: any) => {
                        const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                        return sum + quoteValue
                      }, 0)
                      return {
                        ...col,
                        quotes: filteredQuotes,
                        count: filteredQuotes.length,
                        totalValue: updatedTotalValue,
                      }
                    }
                    return col
                  }).map((col: any) => {
                    // REJECTED kolonuna güncellenmiş quote'u ekle
                    if (col.status === 'REJECTED' || col.status === 'DECLINED') {
                      const updatedQuoteForKanban = {
                        id: updatedQuote.id,
                        title: updatedQuote.title,
                        totalAmount: updatedQuote.totalAmount || 0,
                        dealId: updatedQuote.dealId,
                        createdAt: updatedQuote.createdAt,
                        updatedAt: updatedQuote.updatedAt,
                      }
                      const updatedQuotes = [updatedQuoteForKanban, ...(col.quotes || [])]
                      const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
                        const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
                        return sum + quoteValue
                      }, 0)
                      return {
                        ...col,
                        quotes: updatedQuotes,
                        count: updatedQuotes.length,
                        totalValue: updatedTotalValue,
                      }
                    }
                    return col
                  })
                  
                  // Backend'den dönen güncellenmiş data ile cache'i güncelle
                  queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId, normalizedFilterCompanyId, customerCompanyId], updatedKanbanDataWithBackendData)
                  
                  // Diğer query'leri invalidate et
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['quotes'] }),
                    queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
                    queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }),
                    queryClient.invalidateQueries({ queryKey: ['kpis'] }),
                  ])
                  
                  toast.success(t('quoteRejected'), t('quoteRejectedMessage'))
                } catch (error: any) {
                  console.error('Reject error:', error)
                  toast.error(t('rejectDialog.rejectFailed'), error?.message || t('quoteRejected'))
                }
              }}
              disabled={!rejectReason.trim()}
            >
              {t('rejectDialog.rejectButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
