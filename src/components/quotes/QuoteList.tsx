'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
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

// Lazy load büyük componentler - performans için
const QuoteForm = dynamic(() => import('./QuoteForm'), {
  ssr: false,
  loading: () => null,
})

const QuoteKanbanChart = dynamic(() => import('@/components/charts/QuoteKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

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

async function fetchKanbanQuotes(search: string, dealId: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (dealId) params.append('dealId', dealId)

  // ✅ ÇÖZÜM: Cache'i kapat - refresh sonrası her zaman yeni data çek
  const res = await fetch(`/api/analytics/quote-kanban?${params.toString()}`, {
    cache: 'no-store', // ✅ ÇÖZÜM: Next.js cache'i kapat - her zaman fresh data çek
    headers: {
      'Cache-Control': 'no-store, must-revalidate', // ✅ ÇÖZÜM: Browser cache'i de kapat
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

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  DECLINED: 'Reddedildi',
  WAITING: 'Beklemede',
}

export default function QuoteList() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  // URL parametrelerinden filtreleri oku
  const statusFromUrl = searchParams.get('status') || ''
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban') // Kanban default
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(statusFromUrl)
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  
  // URL'den gelen status parametresini state'e set et
  useEffect(() => {
    if (statusFromUrl && statusFromUrl !== status) {
      setStatus(statusFromUrl)
    }
  }, [statusFromUrl])
  const [dealId, setDealId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
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
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )
  
  // SWR ile veri çekme (CustomerList pattern'i) - Table view için
  // DÜZELTME: Status filtresi yoksa tüm status'ler gösterilmeli (kanban ile aynı)
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status) // Status boş string ise tüm status'ler
  if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId) // SuperAdmin için firma filtresi
  
  const apiUrl = `/api/quotes?${params.toString()}`
  const { data: quotes = [], isLoading, mutate: mutateQuotes } = useData<Quote[]>(
    viewMode === 'table' ? apiUrl : null, // Sadece table view'da çalış
    {
      dedupingInterval: 0, // Cache'i kapat - her zaman fresh data
      revalidateOnFocus: true, // Focus'ta refetch yap
      refreshInterval: 0, // Auto refresh YOK
    }
  )

  // Kanban view için TanStack Query kullanıyoruz (kanban özel endpoint)
  // ÖNEMLİ: Her zaman çalıştır (viewMode ne olursa olsun) - silme/güncelleme için gerekli
  const queryClient = useQueryClient()
  const { data: kanbanDataFromQuery = [], isLoading: isLoadingKanban } = useQuery({
    queryKey: ['kanban-quotes', debouncedSearch, dealId],
    queryFn: () => fetchKanbanQuotes(debouncedSearch, dealId),
    staleTime: 0, // ✅ ÇÖZÜM: Cache'i kapat - refresh sonrası her zaman yeni data çek
    gcTime: 0, // ✅ ÇÖZÜM: Garbage collection'ı kapat - cache'i hemen temizle
    refetchOnWindowFocus: false,
    refetchOnMount: true, // ✅ ÇÖZÜM: Mount olduğunda refetch YAP - refresh sonrası yeni data çek
    refetchOnReconnect: false, // Reconnect'te refetch YAPMA - optimistic update'i koru
    placeholderData: (previousData) => previousData, // Optimistic update
    structuralSharing: false, // ÖNEMLİ: Structural sharing'i kapat - referans değişikliğini algıla
    notifyOnChangeProps: 'all', // ✅ ÇÖZÜM: Tüm değişiklikleri notify et - setQueryData değişikliklerini algıla
    // ÖNEMLİ: setQueryData ile cache güncellenince otomatik olarak güncellenir
    // enabled kaldırıldı - her zaman çalış (silme/güncelleme için gerekli)
  })

  // ✅ ÇÖZÜM: useQuery'den gelen data'yı state'e kopyala - optimistic update için
  // ÖNEMLİ: State-based optimistic update - React Query cache'inden bağımsız
  const [kanbanData, setKanbanData] = useState<any[]>(kanbanDataFromQuery)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // ✅ ÇÖZÜM: Initial load kontrolü
  
  // useQuery'den gelen data değiştiğinde state'i güncelle (sadece initial load'da)
  // ÖNEMLİ: Bu useEffect sadece initial load'da çalışır - optimistic update'ler bu useEffect'i bypass eder
  // ÖNEMLİ: Refresh sonrası API'den eski data gelirse state'i override etmemek için initial load kontrolü var
  useEffect(() => {
    if (isInitialLoad && kanbanDataFromQuery && kanbanDataFromQuery.length > 0) {
      // Sadece initial load'da state'i güncelle
      setKanbanData(kanbanDataFromQuery)
      setIsInitialLoad(false) // Initial load tamamlandı
    }
  }, [kanbanDataFromQuery, isInitialLoad]) // ✅ Sadece initial load'da çalışır

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
      `${title} teklifini silmek istediğinize emin misiniz?`,
      'Bu işlem geri alınamaz.'
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
        queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId], updatedKanbanData)
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
        'Teklif silindi!',
        `${title} başarıyla silindi.`
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
      toast.error('Silinemedi', error?.message)
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
  const { data: stats } = useData<any>('/api/stats/quotes', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  if ((isLoading && viewMode === 'table') || (isLoadingKanban && viewMode === 'kanban')) {
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teklifler</h1>
          <p className="mt-2 text-gray-600">Toplam {totalQuotes} teklif</p>
        </div>
        <div className="flex gap-2">
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
          <Button
            onClick={() => {
              setSelectedQuote(null)
              setFormOpen(true)
            }}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Teklif
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Firma Seç" />
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
        )}
        {viewMode === 'table' && (
          <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="DRAFT">Taslak</SelectItem>
              <SelectItem value="SENT">Gönderildi</SelectItem>
              <SelectItem value="ACCEPTED">Kabul Edildi</SelectItem>
              <SelectItem value="DECLINED">Reddedildi</SelectItem>
              <SelectItem value="WAITING">Beklemede</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <QuoteKanbanChart
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
            const quoteTitle = quote?.title || 'Teklif'
            
            const confirmed = await confirm(
              `${quoteTitle} teklifini "${statusLabel}" durumuna taşımak istediğinize emin misiniz?`,
              'Durum değişikliği yapılacak.'
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
            
            // ✅ ÇÖZÜM: Optimistic update - kart anında taşınır
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
            
            // ✅ ÇÖZÜM: Optimistic update'i state'e set et - kart anında taşınır
            const optimisticKanbanDataWithNewRef = JSON.parse(JSON.stringify(optimisticKanbanData))
            setKanbanData(optimisticKanbanDataWithNewRef)
            
            // ✅ ÇÖZÜM: API çağrısı yap - backend'de güncelleme yapılsın
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

              // ✅ %100 KESİN ÇÖZÜM: API'den dönen güncellenmiş quote'u al
              // ÖNEMLİ: Backend'den dönen gerçek data'yı kullan - updatedAt ve diğer alanlar güncel olacak
              const updatedQuote = await res.json()
              
              // ✅ %100 KESİN ÇÖZÜM: Backend'den dönen güncellenmiş quote ile kanban data'yı güncelle
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
                  // ✅ ÇÖZÜM: Backend'den dönen güncellenmiş quote'u kullan
                  const updatedQuoteForKanban = {
                    id: updatedQuote.id,
                    title: updatedQuote.title,
                    totalAmount: updatedQuote.totalAmount || 0,
                    dealId: updatedQuote.dealId,
                    createdAt: updatedQuote.createdAt,
                    updatedAt: updatedQuote.updatedAt, // ✅ ÇÖZÜM: Backend'den dönen güncel updatedAt
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
              
              // ✅ %100 KESİN ÇÖZÜM: Backend'den dönen güncellenmiş data ile cache'i güncelle
              const updatedKanbanDataWithNewRef = JSON.parse(JSON.stringify(updatedKanbanDataWithBackendData))
              
              // ✅ %100 KESİN ÇÖZÜM: Backend'den dönen gerçek data ile cache'i güncelle
              // ÖNEMLİ: Backend'den dönen gerçek data ile cache güncelleniyor - refresh sonrası güncel data görünecek
              queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId], updatedKanbanDataWithNewRef)
              
              // ✅ %100 KESİN ÇÖZÜM: State'i de güncelle - backend'den dönen gerçek data ile
              setKanbanData(updatedKanbanDataWithNewRef)
              
              // ✅ %100 KESİN ÇÖZÜM: Cache'i tamamen temizle - refresh sonrası kesinlikle yeni data çekilsin
              // ÖNEMLİ: removeQueries ile cache'i tamamen temizle - refresh sonrası kesinlikle API'den yeni data çekilecek
              queryClient.removeQueries({ 
                queryKey: ['kanban-quotes'],
              })
              
              // ✅ %100 KESİN ÇÖZÜM: Cache'i backend'den dönen gerçek data ile tekrar set et
              // ÖNEMLİ: removeQueries sonrası cache'i tekrar set et - refresh sonrası cache'den güncel data gelsin
              queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId], updatedKanbanDataWithNewRef)
              
              // ✅ %100 KESİN ÇÖZÜM: Query'yi invalidate et ve manuel refetch yap - refresh sonrası API'den yeni data çekilsin
              // ÖNEMLİ: staleTime: 0 ve gcTime: 0 nedeniyle refresh sonrası kesinlikle yeni data çekilecek
              await queryClient.invalidateQueries({ 
                queryKey: ['kanban-quotes', debouncedSearch, dealId],
                exact: true,
              })
              
              // ✅ %100 KESİN ÇÖZÜM: Manuel refetch yap - kesinlikle fresh data çek
              // ÖNEMLİ: invalidateQueries sonrası manuel refetch yap - kesinlikle API'den yeni data çekilsin
              await queryClient.refetchQueries({ 
                queryKey: ['kanban-quotes', debouncedSearch, dealId],
                exact: true,
              })
              
              // ✅ %100 KESİN ÇÖZÜM: isInitialLoad'i false yap - useEffect'in state'i override etmesini engelle
              setIsInitialLoad(false)

              // ✅ ÇÖZÜM: Sadece dashboard'daki diğer query'leri invalidate et (background'da, refetch olmadan)
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
              toast.error('Teklif durumu güncellenirken hata oluştu', error?.message)
              throw error
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
                <TableHead>Durum</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Fırsat</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                    Teklif bulunamadı
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
                        <Link href={`/${locale}/quotes/${quote.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon" aria-label={`${quote.title} teklifini görüntüle`}>
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quote.status === 'ACCEPTED') {
                              toast.warning('Bu teklif onaylandığı için değiştirilemez', 'Bu teklif kabul edildi ve fatura oluşturuldu.')
                              return
                            }
                            handleEdit(quote)
                          }}
                          disabled={quote.status === 'ACCEPTED'}
                          aria-label={`${quote.title} teklifini düzenle`}
                          title={quote.status === 'ACCEPTED' ? 'Bu teklif onaylandığı için değiştirilemez' : 'Düzenle'}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (quote.status === 'ACCEPTED') {
                              toast.warning('Bu teklif onaylandığı için silemezsiniz', 'Bu teklif kabul edildi ve fatura oluşturuldu. Teklifi silmek için önce oluşturulan faturayı silmeniz gerekir.')
                              return
                            }
                            handleDelete(quote.id, quote.title)
                          }}
                          disabled={quote.status === 'ACCEPTED'}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50"
                          aria-label={`${quote.title} teklifini sil`}
                          title={quote.status === 'ACCEPTED' ? 'Bu teklif onaylandığı için silemezsiniz' : 'Sil'}
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
      <QuoteForm
        quote={selectedQuote || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedQuote) => {
          // Başarı bildirimi
          toast.success(
            selectedQuote ? 'Teklif güncellendi!' : 'Teklif oluşturuldu!',
            selectedQuote 
              ? `${savedQuote.title} başarıyla güncellendi.`
              : `${savedQuote.title} başarıyla oluşturuldu.`
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
            queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId], updatedKanbanData)
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
            <DialogTitle>Teklifi Reddet</DialogTitle>
            <DialogDescription>
              Teklifi reddetmek için lütfen sebep belirtin. Bu sebep teklif detay sayfasında not olarak görünecektir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reddetme Sebebi *</Label>
              <Textarea
                id="rejectReason"
                placeholder="Örn: Fiyat uygun değil, Müşteri ihtiyacı değişti, Teknik uyumsuzluk..."
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
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!rejectReason.trim()) {
                  toast.error('Sebep gerekli', 'Lütfen reddetme sebebini belirtin.')
                  return
                }

                if (!rejectingQuoteId) {
                  toast.error('Hata', 'Teklif ID bulunamadı.')
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
                      notes: `🔴 REDDEDİLDİ - ${new Date().toLocaleDateString('tr-TR')}\nSebep: ${reason}`,
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
                  queryClient.setQueryData(['kanban-quotes', debouncedSearch, dealId], updatedKanbanDataWithBackendData)
                  
                  // Diğer query'leri invalidate et
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['quotes'] }),
                    queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
                    queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }),
                    queryClient.invalidateQueries({ queryKey: ['kpis'] }),
                  ])
                  
                  toast.success('Teklif reddedildi', 'Teklif reddedildi ve sebep not olarak eklendi.')
                } catch (error: any) {
                  console.error('Reject error:', error)
                  toast.error('Reddetme başarısız', error?.message || 'Teklif reddedilemedi.')
                }
              }}
              disabled={!rejectReason.trim()}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
