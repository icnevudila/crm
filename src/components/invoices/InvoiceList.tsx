'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, Search, Edit, Trash2, Eye, FileText, LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import InvoiceForm from './InvoiceForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Lazy load büyük componentler - performans için
const InvoiceKanbanChart = dynamic(() => import('@/components/charts/InvoiceKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

interface Invoice {
  id: string
  title: string
  status: string
  totalAmount?: number
  quoteId?: string
  companyId?: string
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

// Invoice değerini almak için helper fonksiyon - totalAmount kullan (050 migration ile total → totalAmount olarak değiştirildi)
const getInvoiceValue = (invoice: Invoice): number => {
  const value = invoice?.totalAmount
  return typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-green-100 text-green-800',
  RECEIVED: 'bg-teal-100 text-teal-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyatı Yapıldı',
  RECEIVED: 'Mal Kabul Edildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

async function fetchKanbanInvoices(search: string, quoteId: string, invoiceType: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (quoteId) params.append('quoteId', quoteId)
  if (invoiceType && invoiceType !== 'ALL') params.append('invoiceType', invoiceType)

  const res = await fetch(`/api/analytics/invoice-kanban?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch kanban invoices')
  const data = await res.json()
  return data.kanban || []
}

export default function InvoiceList() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  // URL parametrelerinden filtreleri oku
  const statusFromUrl = searchParams.get('status') || ''
  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban') // Kanban default
  const [invoiceType, setInvoiceType] = useState<'SALES' | 'PURCHASE' | 'ALL'>('ALL') // Tab seçimi
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(statusFromUrl)
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  
  // URL'den gelen status parametresini state'e set et
  useEffect(() => {
    if (statusFromUrl && statusFromUrl !== status) {
      setStatus(statusFromUrl)
    }
  }, [statusFromUrl])
  const [quoteId, setQuoteId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
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
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status) // Status boş string ise tüm status'ler
  if (invoiceType && invoiceType !== 'ALL') params.append('invoiceType', invoiceType) // invoiceType filtresi
  if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId) // SuperAdmin için firma filtresi
  
  const apiUrl = `/api/invoices?${params.toString()}`
  const { data: invoices = [], isLoading, mutate: mutateInvoices } = useData<Invoice[]>(
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
  const { data: kanbanDataRaw = [], isLoading: isLoadingKanban } = useQuery({
    queryKey: ['kanban-invoices', debouncedSearch, quoteId, invoiceType],
    queryFn: () => fetchKanbanInvoices(debouncedSearch, quoteId, invoiceType),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Mount olduğunda refetch YAPMA - optimistic update'i koru
    refetchOnReconnect: false, // Reconnect'te refetch YAPMA - optimistic update'i koru
    placeholderData: (previousData) => previousData, // Optimistic update
    // enabled kaldırıldı - her zaman çalış (silme/güncelleme için gerekli)
  })

  // Kanban data'yı status filtresine göre filtrele
  const kanbanData = useMemo(() => {
    if (!status || !Array.isArray(kanbanDataRaw)) {
      return kanbanDataRaw
    }
    // Status filtresi varsa sadece o status'teki kolonu göster
    return kanbanDataRaw.filter((col: any) => col.status === status)
  }, [kanbanDataRaw, status])

  const handleEdit = useCallback((invoice: Invoice) => {
    // ÖNEMLİ: SHIPPED (Sevkiyatı Yapıldı) durumundaki faturalar düzenlenemez
    if (invoice.status === 'SHIPPED') {
      toast.warning('Bu fatura gönderildiği için düzenleyemezsiniz', 'Sevkiyat onaylandıktan sonra fatura değiştirilemez.')
      return
    }
    
    setSelectedInvoice(invoice)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string, title: string) => {
    // Çift tıklamayı önle
    if (deletingId === id) {
      return
    }

    if (!confirm(`${title} faturasını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeletingId(id)

    try {
      // ÖNCE optimistic update yap - UI anında güncellensin
      // Table view için optimistic update
      if (invoices.length > 0) {
        const updatedInvoices = invoices.filter((i) => i.id !== id)
        mutateInvoices(updatedInvoices, { revalidate: false })
        mutate('/api/invoices', updatedInvoices, { revalidate: false })
        mutate('/api/invoices?', updatedInvoices, { revalidate: false })
        mutate(apiUrl, updatedInvoices, { revalidate: false })
      }
      
      // Kanban view için optimistic update - silinen kaydı kanban data'dan kaldır
      if (Array.isArray(kanbanData) && kanbanData.length > 0) {
        const updatedKanbanData = kanbanData.map((col: any) => {
          const invoiceIndex = (col.invoices || []).findIndex((i: any) => i.id === id)
          if (invoiceIndex !== -1) {
            // Silinen invoice'u bu kolondan kaldır - totalValue'yu da güncelle
            const updatedInvoices = (col.invoices || []).filter((i: any) => i.id !== id)
            const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
              const value = i?.totalAmount
              const invoiceValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
              return sum + invoiceValue
            }, 0)
            return {
              ...col,
              invoices: updatedInvoices,
              count: Math.max(0, (col.count || 0) - 1),
              totalValue: updatedTotalValue, // Toplam tutarı güncelle
            }
          }
          return col
        })
        // Kanban query cache'ini güncelle - optimistic update (refetch yapmadan önce)
        // ÖNEMLİ: setQueryData ile cache'i güncelle, böylece kanbanData prop'u otomatik güncellenir
        queryClient.setQueryData(['kanban-invoices', debouncedSearch, quoteId], updatedKanbanData)
      }
      
      // SONRA API'ye DELETE isteği gönder
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        // Hata durumunda optimistic update'i geri al - eski veriyi geri getir
        mutateInvoices(undefined, { revalidate: true })
        queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] })
        queryClient.refetchQueries({ queryKey: ['kanban-invoices'] })
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete invoice')
      }
      
      // Başarı bildirimi
      toast.success(
        'Fatura silindi!',
        `${title} başarıyla silindi.`
      )
      
      // Başarılı silme sonrası - SADECE invalidate yap, refetch YAPMA (optimistic update zaten yapıldı)
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      // Ama kanban-invoices'i invalidate ve refetch YAPMA - optimistic update'i koru
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
        // kanban-invoices'i invalidate ETME - optimistic update'i koru
      ]).then(() => {
        // Background'da refetch yap - AMA kanban-invoices'i refetch YAPMA (optimistic update'i koru)
        queryClient.refetchQueries({ queryKey: ['invoice-kanban'] })
        queryClient.refetchQueries({ queryKey: ['kpis'] })
        mutateInvoices(undefined, { revalidate: true })
      })
      
      // ÖNEMLİ: kanban-invoices query'sini invalidate ve refetch ETME - optimistic update'i koru
      // setQueryData ile cache'i güncelledik, bu yeterli - invalidate etmek refetch tetikler ve eski veriyi geri getirir
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error('Silinemedi', error?.message)
    } finally {
      setDeletingId(null)
    }
  }, [invoices, mutateInvoices, apiUrl, kanbanData, debouncedSearch, quoteId, queryClient, deletingId])

  const handleAdd = useCallback(() => {
    setSelectedInvoice(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedInvoice(null)
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>('/api/stats/invoices', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  if ((isLoading && viewMode === 'table') || (isLoadingKanban && viewMode === 'kanban')) {
    return <SkeletonList />
  }

  // ModuleStats'ten gelen total değerini kullan - dashboard ile tutarlı olması için
  // ÖNEMLİ: Kanban view'da tüm kolonların count'larını topla (filtreleme yapılmışsa bile)
  const totalInvoices = stats?.total || (viewMode === 'table' 
    ? invoices.length 
    : kanbanDataRaw.reduce((sum: number, col: any) => sum + (col.count || 0), 0))

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats 
        module="invoices" 
        statsUrl="/api/stats/invoices"
        filterStatus={status}
        onFilterChange={(filter) => {
          if (filter.type === 'all') {
            setStatus('')
          } else if (filter.type === 'status' && filter.value) {
            // KPI'ya tıklayınca sadece o status'teki faturaları göster
            // ÖNEMLİ: UNPAID bir status değil, DRAFT + SENT + OVERDUE demek
            // UNPAID için özel filtreleme yapma (çünkü birden fazla status içeriyor)
            // Bunun yerine, kullanıcıya bilgi göster (filtreleme yapma)
            if (filter.value === 'UNPAID') {
              // UNPAID için filtreleme yapma - sadece bilgi göster
              // (Kullanıcı manuel olarak DRAFT, SENT veya OVERDUE filtrelerini seçebilir)
              setStatus('') // Filtreyi temizle
            } else {
              setStatus(filter.value)
            }
          } else if (filter.type === 'period' && filter.value === 'thisMonth') {
            // Bu ay filtresi için özel işlem (şimdilik status'u temizle)
            setStatus('')
          }
        }}
      />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title="Faturalar Modülü Otomasyonları"
        automations={[
          {
            action: 'Faturayı "Gönderildi" yaparsan',
            result: 'Otomatik olarak "Sevkiyatlar" sayfasında yeni bir sevkiyat kaydı açılır',
            details: [
              'Sevkiyat durumu "Beklemede" olarak ayarlanır',
              'Otomatik olarak müşteriye bildirim gönderilir (e-posta)',
              '"Aktiviteler" sayfasında gönderim kaydı görünür',
            ],
          },
          {
            action: 'Faturayı "Ödendi" yaparsan',
            result: 'Otomatik olarak "Finans" sayfasında yeni bir gelir kaydı açılır',
            details: [
              'Finans kaydı tutarı fatura tutarı ile aynı olur',
              'Finans kaydı tarihi bugün olarak ayarlanır',
              '"Ürünler" sayfasındaki ilgili ürünlerin stokları otomatik olarak düşer',
              'Rezerve edilmiş stoklar otomatik olarak serbest bırakılır',
              '"Aktiviteler" sayfasında ödeme kaydı görünür',
              'Bildirim gönderilir (müşteriye ve ekibe)',
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Faturalar</h1>
          <p className="mt-2 text-gray-600">Toplam {totalInvoices} fatura</p>
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
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura
          </Button>
        </div>
      </div>

      {/* Tab Navigation - Satış/Alış Faturaları */}
      <Tabs value={invoiceType} onValueChange={(value) => setInvoiceType(value as 'SALES' | 'PURCHASE' | 'ALL')}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="ALL">Tümü</TabsTrigger>
          <TabsTrigger value="SALES">Satış Faturaları</TabsTrigger>
          <TabsTrigger value="PURCHASE">Alış Faturaları</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
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
        {/* Status filtresi - hem table hem kanban view'da göster */}
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="SENT">Gönderildi</SelectItem>
            <SelectItem value="SHIPPED">Sevkiyatı Yapıldı</SelectItem>
            <SelectItem value="RECEIVED">Mal Kabul Edildi</SelectItem>
            <SelectItem value="PAID">Ödendi</SelectItem>
            <SelectItem value="OVERDUE">Vadesi Geçmiş</SelectItem>
            <SelectItem value="CANCELLED">İptal</SelectItem>
          </SelectContent>
        </Select>
        {/* Seçili filtre varsa temizle butonu */}
        {status && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus('')}
            className="text-xs"
          >
            Filtreyi Temizle
          </Button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <InvoiceKanbanChart
          key={`kanban-${kanbanData.reduce((sum: number, col: any) => sum + (col.invoices?.length || 0), 0)}-${kanbanData.reduce((sum: number, col: any) => sum + (col.totalValue || 0), 0)}`}
          data={kanbanData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={async (invoiceId: string, newStatus: string) => {
            // Invoice'ın status'unu güncelle
            try {
              const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              })
              
              if (!res.ok) {
                const error = await res.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to update invoice status')
              }

              const statusToastMap: Record<
                string,
                { type: 'success' | 'warning' | 'info'; title: string; description: string }
              > = {
                SENT: {
                  type: 'success',
                  title: 'Fatura gönderildi',
                  description: 'Sevkiyat hazırlıkları başladı ve ekipler bilgilendirildi.',
                },
                SHIPPED: {
                  type: 'success',
                  title: 'Sevkiyat onaylandı',
                  description: 'Stoktan düşüm tamamlandı. Sevkiyat detaylarını kontrol edebilirsiniz.',
                },
                RECEIVED: {
                  type: 'success',
                  title: 'Mal kabul edildi',
                  description: 'Stoğa giriş yapıldı. Ödeme sürecini başlatabilirsiniz.',
                },
                PAID: {
                  type: 'success',
                  title: 'Ödeme kaydedildi',
                  description: 'Finans kayıtları otomatik olarak güncellendi.',
                },
                OVERDUE: {
                  type: 'info',
                  title: 'Fatura vadesi geçti',
                  description: 'Müşteriye ödeme hatırlatması göndermeyi unutmayın.',
                },
                CANCELLED: {
                  type: 'warning',
                  title: 'Fatura iptal edildi',
                  description: 'İlgili sevkiyat ve stok işlemleri geri alındı.',
                },
              }

              const toastPayload = statusToastMap[newStatus]
              if (toastPayload) {
                if (toastPayload.type === 'success') {
                  toast.success(toastPayload.title, toastPayload.description)
                } else if (toastPayload.type === 'warning') {
                  toast.warning(toastPayload.title, toastPayload.description)
                } else if (typeof toast.info === 'function') {
                  toast.info(toastPayload.title, toastPayload.description)
                } else {
                  toast.success(toastPayload.title, toastPayload.description)
                }
              } else {
                toast.success('Fatura durumu güncellendi')
              }

              // Cache'i invalidate et - fresh data çek (hem table hem kanban hem stats)
              // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['invoices'] }),
                queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] }),
                queryClient.invalidateQueries({ queryKey: ['stats-invoices'] }),
                queryClient.invalidateQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
                queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
              ])
              
              // Refetch yap - anında güncel veri gelsin
              await Promise.all([
                queryClient.refetchQueries({ queryKey: ['invoices'] }),
                queryClient.refetchQueries({ queryKey: ['kanban-invoices'] }),
                queryClient.refetchQueries({ queryKey: ['stats-invoices'] }),
                queryClient.refetchQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
                queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
              ])
            } catch (error: any) {
              console.error('Status update error:', error)
              toast.error('Fatura durumu güncellenirken hata oluştu', error?.message)
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
                <TableHead>Teklif</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                    Fatura bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const isFromQuote = !!invoice.quoteId
                  const isShipped = invoice.status === 'SHIPPED'
                  const isReceived = invoice.status === 'RECEIVED'
                  const isLocked = isFromQuote || isShipped || isReceived
                  
                  return (
                    <TableRow 
                      key={invoice.id}
                      className={
                        isLocked 
                          ? isFromQuote 
                            ? 'bg-indigo-50/50 hover:bg-indigo-50' 
                            : isShipped
                            ? 'bg-green-50/50 hover:bg-green-50'
                            : 'bg-teal-50/50 hover:bg-teal-50'
                          : ''
                      }
                    >
                      <TableCell className="font-medium">
                        {invoice.title}
                        {isLocked && (
                          <span className="ml-2 text-xs font-semibold">
                            {isFromQuote 
                              ? '(Tekliften)' 
                              : isShipped
                              ? '(Sevkiyat Yapıldı)'
                              : '(Mal Kabul Edildi)'}
                          </span>
                        )}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {invoice.Company?.name || '-'}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={
                          isLocked 
                            ? isFromQuote 
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300' 
                              : isShipped
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-teal-100 text-teal-800 border-teal-300'
                            : (statusColors[invoice.status] || 'bg-gray-100')
                        }>
                          {statusLabels[invoice.status] || invoice.status}
                        </Badge>
                      </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(getInvoiceValue(invoice))}
                    </TableCell>
                    <TableCell>
                      {invoice.quoteId ? (
                        <Link 
                          href={`/${locale}/quotes/${invoice.quoteId}`}
                          className="text-primary-600 hover:underline"
                          prefetch={true}
                        >
                          Teklif #{invoice.quoteId.substring(0, 8)}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon" aria-label={`${invoice.title} faturasını görüntüle`}>
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </Link>
                        {/* Quote'tan oluşturulan, PAID, SHIPPED ve RECEIVED durumundaki faturalar için düzenle butonu gösterilmez */}
                        {!isFromQuote && !isShipped && !isReceived && invoice.status !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (invoice.status === 'PAID') {
                                toast.warning('Bu fatura ödendiği için değiştirilemez', 'Bu fatura ödendi ve finans kaydı oluşturuldu.')
                                return
                              }
                              handleEdit(invoice)
                            }}
                            disabled={invoice.status === 'PAID'}
                            aria-label={`${invoice.title} faturasını düzenle`}
                            title={invoice.status === 'PAID' ? 'Bu fatura ödendiği için değiştirilemez' : 'Düzenle'}
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </Button>
                        )}
                        {/* Quote'tan oluşturulan, PAID, SHIPPED ve RECEIVED durumundaki faturalar silinemez */}
                        {!isFromQuote && !isShipped && !isReceived && invoice.status !== 'PAID' && invoice.status !== 'SHIPPED' && invoice.status !== 'RECEIVED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (invoice.status === 'PAID') {
                                toast.warning('Bu fatura ödendiği için silemezsiniz', 'Bu fatura ödendi ve finans kaydı oluşturuldu. Faturayı silmek için önce ilgili finans kaydını silmeniz gerekir.')
                                return
                              }
                              if (invoice.status === 'SHIPPED') {
                                toast.warning('Bu fatura gönderildiği için silemezsiniz', 'Bu fatura için sevkiyat yapıldı ve stoktan düşüldü. Faturayı silmek için önce sevkiyatı iptal etmeniz ve stok işlemini geri almanız gerekir.')
                                return
                              }
                              if (invoice.status === 'RECEIVED') {
                                toast.warning('Bu fatura teslim alındığı için silemezsiniz', 'Bu fatura için mal kabul edildi ve stoğa girişi yapıldı. Faturayı silmek için önce mal kabul işlemini iptal etmeniz ve stok işlemini geri almanız gerekir.')
                                return
                              }
                              handleDelete(invoice.id, invoice.title)
                            }}
                            disabled={invoice.status === 'PAID' || invoice.status === 'SHIPPED' || invoice.status === 'RECEIVED'}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            aria-label={`${invoice.title} faturasını sil`}
                            title={
                              invoice.status === 'PAID' ? 'Bu fatura ödendiği için silemezsiniz' :
                              invoice.status === 'SHIPPED' ? 'Bu fatura gönderildiği için silemezsiniz' :
                              invoice.status === 'RECEIVED' ? 'Bu fatura teslim alındığı için silemezsiniz' :
                              'Sil'
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <InvoiceForm
        invoice={selectedInvoice || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedInvoice: Invoice) => {
          // Başarı bildirimi
          toast.success(
            selectedInvoice ? 'Fatura güncellendi!' : 'Fatura oluşturuldu!',
            selectedInvoice 
              ? `${savedInvoice.title || savedInvoice.invoiceNumber} başarıyla güncellendi.`
              : `${savedInvoice.title || savedInvoice.invoiceNumber} başarıyla oluşturuldu.`
          )
          
          // Optimistic update - yeni/güncellenmiş kaydı hemen cache'e ekle
          // ÖNEMLİ: Hem table hem kanban view için optimistic update yap
          
          if (selectedInvoice) {
            // UPDATE: Mevcut kaydı güncelle
            const updatedInvoices = invoices.map((i) =>
              i.id === savedInvoice.id ? savedInvoice : i
            )
            
            // Table view için SWR cache'i güncelle - optimistic update
            if (viewMode === 'table') {
              await mutateInvoices(updatedInvoices, { revalidate: false })
              await Promise.all([
                mutate('/api/invoices', updatedInvoices, { revalidate: false }),
                mutate('/api/invoices?', updatedInvoices, { revalidate: false }),
                mutate(apiUrl, updatedInvoices, { revalidate: false }),
              ])
            }
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            const updatedInvoices = [savedInvoice, ...invoices]
            
            // Table view için SWR cache'i güncelle - optimistic update
            // ÖNEMLİ: Her zaman table view cache'ini güncelle (viewMode ne olursa olsun)
            await mutateInvoices(updatedInvoices, { revalidate: false })
            await Promise.all([
              mutate('/api/invoices', updatedInvoices, { revalidate: false }),
              mutate('/api/invoices?', updatedInvoices, { revalidate: false }),
              mutate(apiUrl, updatedInvoices, { revalidate: false }),
            ])
          }
          
          // Kanban view için optimistic update - yeni kaydı kanban data'ya ekle
          // ÖNEMLİ: Her zaman kanban data'yı güncelle (viewMode ne olursa olsun)
          if (Array.isArray(kanbanData)) {
            const status = savedInvoice.status || 'DRAFT'
            const updatedKanbanData = kanbanData.map((col: any) => {
              if (col.status === status) {
                if (selectedInvoice) {
                  // UPDATE: Mevcut kaydı güncelle
                  const updatedInvoices = (col.invoices || []).map((i: any) =>
                    i.id === savedInvoice.id ? savedInvoice : i
                  )
                  const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
                    const invoiceValue = i?.totalAmount || i?.total || i?.grandTotal || 0
                    return sum + (typeof invoiceValue === 'string' ? parseFloat(invoiceValue) || 0 : invoiceValue)
                  }, 0)
                  return {
                    ...col,
                    invoices: updatedInvoices,
                    totalValue: updatedTotalValue, // Toplam tutarı güncelle
                  }
                } else {
                  // CREATE: Yeni kaydı bu kolona ekle - totalValue'yu da güncelle
                  const updatedInvoices = [savedInvoice, ...(col.invoices || [])]
                  const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
                    const invoiceValue = i?.totalAmount || i?.total || i?.grandTotal || 0
                    return sum + (typeof invoiceValue === 'string' ? parseFloat(invoiceValue) || 0 : invoiceValue)
                  }, 0)
                  return {
                    ...col,
                    invoices: updatedInvoices,
                    count: (col.count || 0) + 1,
                    totalValue: updatedTotalValue, // Toplam tutarı güncelle
                  }
                }
              }
              return col
            })
            // Kanban query cache'ini güncelle
            queryClient.setQueryData(['kanban-invoices', debouncedSearch, quoteId], updatedKanbanData)
          }
          
          // Hem table hem kanban view için query'leri invalidate et
          // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['invoices'] }),
            queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] }),
            queryClient.invalidateQueries({ queryKey: ['stats-invoices'] }),
            queryClient.invalidateQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
            queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
          ])
          
          // Refetch yap - anında güncel veri gelsin (background'da)
          await Promise.all([
            queryClient.refetchQueries({ queryKey: ['invoices'] }),
            queryClient.refetchQueries({ queryKey: ['kanban-invoices'] }),
            queryClient.refetchQueries({ queryKey: ['stats-invoices'] }),
            queryClient.refetchQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
            queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
          ])
          
          // Ekstra güvence: 500ms sonra tekrar refetch (sayfa yenilendiğinde kesinlikle fresh data gelsin)
          setTimeout(async () => {
            await Promise.all([
              mutateInvoices(undefined, { revalidate: true }),
              queryClient.refetchQueries({ queryKey: ['kanban-invoices'] }),
              queryClient.refetchQueries({ queryKey: ['invoice-kanban'] }),
            ])
          }, 500)
        }}
      />
    </div>
  )
}
