'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, FileText, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  total: number
  dealId?: string
  createdAt: string
}

async function fetchKanbanQuotes(search: string, dealId: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (dealId) params.append('dealId', dealId)

  const res = await fetch(`/api/analytics/quote-kanban?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch kanban quotes')
  const data = await res.json()
  return data.kanban || []
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  DECLINED: 'Reddedildi',
  WAITING: 'Beklemede',
}

export default function QuoteList() {
  const locale = useLocale()
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban') // Kanban default
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
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

  // SWR ile veri çekme (CustomerList pattern'i) - Table view için
  // DÜZELTME: Status filtresi yoksa tüm status'ler gösterilmeli (kanban ile aynı)
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status) // Status boş string ise tüm status'ler
  
  const apiUrl = `/api/quotes?${params.toString()}`
  const { data: quotes = [], isLoading, mutate: mutateQuotes } = useData<Quote[]>(
    viewMode === 'table' ? apiUrl : null, // Sadece table view'da çalış
    {
      dedupingInterval: 0, // Cache'i kapat - her zaman fresh data
      revalidateOnFocus: true, // Focus'ta refetch yap
      revalidateOnMount: true, // Mount'ta refetch yap
      revalidateOnReconnect: true, // Reconnect'te refetch yap
      refreshInterval: 0, // Auto refresh YOK
      keepPreviousData: false, // Önceki data'yı tutma
    }
  )

  // Kanban view için TanStack Query kullanıyoruz (kanban özel endpoint)
  // ÖNEMLİ: Her zaman çalıştır (viewMode ne olursa olsun) - silme/güncelleme için gerekli
  const queryClient = useQueryClient()
  const { data: kanbanData = [], isLoading: isLoadingKanban } = useQuery({
    queryKey: ['kanban-quotes', debouncedSearch, dealId],
    queryFn: () => fetchKanbanQuotes(debouncedSearch, dealId),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Mount olduğunda refetch YAPMA - optimistic update'i koru
    refetchOnReconnect: false, // Reconnect'te refetch YAPMA - optimistic update'i koru
    placeholderData: (previousData) => previousData, // Optimistic update
    // enabled kaldırıldı - her zaman çalış (silme/güncelleme için gerekli)
  })

  const handleEdit = useCallback((quote: Quote) => {
    setSelectedQuote(quote)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string, title: string) => {
    // Çift tıklamayı önle
    if (deletingId === id) {
      return
    }

    if (!confirm(`${title} teklifini silmek istediğinize emin misiniz?`)) {
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
              const quoteValue = typeof q.total === 'string' ? parseFloat(q.total) || 0 : (q.total || 0)
              return sum + quoteValue
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
      
      // Başarılı silme sonrası - SADECE invalidate yap, refetch YAPMA (optimistic update zaten yapıldı)
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      // Ama kanban-quotes'i invalidate ve refetch YAPMA - optimistic update'i koru
      // ÖNEMLİ: kanban-quotes query'sini invalidate ETME - sadece setQueryData ile güncelledik, invalidate etmek refetch tetikler
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
        // kanban-quotes'i invalidate ETME - optimistic update'i koru
      ]).then(() => {
        // Background'da refetch yap - AMA kanban-quotes'i refetch YAPMA (optimistic update'i koru)
        queryClient.refetchQueries({ queryKey: ['quote-kanban'] })
        queryClient.refetchQueries({ queryKey: ['kpis'] })
        mutateQuotes(undefined, { revalidate: true })
      })
      
      // ÖNEMLİ: kanban-quotes query'sini invalidate ve refetch ETME - optimistic update'i koru
      // setQueryData ile cache'i güncelledik, bu yeterli - invalidate etmek refetch tetikler ve eski veriyi geri getirir
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      alert(error?.message || 'Silme işlemi başarısız oldu')
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
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
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
          key={`kanban-${kanbanData.reduce((sum: number, col: any) => sum + (col.quotes?.length || 0), 0)}-${kanbanData.reduce((sum: number, col: any) => sum + (col.totalValue || 0), 0)}`}
          data={kanbanData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={async (quoteId: string, newStatus: string) => {
            // Quote'ın status'unu güncelle
            try {
              const res = await fetch(`/api/quotes/${quoteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              })
              
              if (!res.ok) {
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to update quote status')
              }

              // Cache'i invalidate et - fresh data çek (hem table hem kanban hem stats)
              // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['quotes'] }),
                queryClient.invalidateQueries({ queryKey: ['kanban-quotes'] }),
                queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
                queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
                queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
              ])
              
              // Refetch yap - anında güncel veri gelsin
              await Promise.all([
                queryClient.refetchQueries({ queryKey: ['quotes'] }),
                queryClient.refetchQueries({ queryKey: ['kanban-quotes'] }),
                queryClient.refetchQueries({ queryKey: ['stats-quotes'] }),
                queryClient.refetchQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
                queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
              ])
            } catch (error: any) {
              console.error('Status update error:', error)
              alert(error?.message || 'Teklif durumu güncellenirken bir hata oluştu')
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
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Teklif bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.title}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
                        {statusLabels[quote.status] || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(quote.total || 0)}
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
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(quote)}
                          aria-label={`${quote.title} teklifini düzenle`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quote.id, quote.title)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`${quote.title} teklifini sil`}
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
      )}

      {/* Form Modal */}
      <QuoteForm
        quote={selectedQuote || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedQuote) => {
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
          
          // Hem table hem kanban view için query'leri invalidate et
          // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['quotes'] }),
            queryClient.invalidateQueries({ queryKey: ['kanban-quotes'] }),
            queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
            queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
            queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
          ])
          
          // Refetch yap - anında güncel veri gelsin (background'da)
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ['quotes'] }),
            queryClient.refetchQueries({ queryKey: ['kanban-quotes'] }),
            queryClient.refetchQueries({ queryKey: ['stats-quotes'] }),
            queryClient.refetchQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
            queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
          ])
          
          // Ekstra güvence: 500ms sonra tekrar refetch (sayfa yenilendiğinde kesinlikle fresh data gelsin)
          setTimeout(async () => {
            await Promise.all([
              mutateQuotes(undefined, { revalidate: true }),
              queryClient.refetchQueries({ queryKey: ['kanban-quotes'] }),
              queryClient.refetchQueries({ queryKey: ['quote-kanban'] }),
            ])
          }, 500)
        }}
      />
    </div>
  )
}
