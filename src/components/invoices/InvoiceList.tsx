'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, FileText, LayoutGrid, Table as TableIcon, Sparkles, Calendar, CheckSquare, Package, Mail, MessageSquare, MessageCircle } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import RefreshButton from '@/components/ui/RefreshButton'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import dynamic from 'next/dynamic'
import InlineEditBadge from '@/components/ui/InlineEditBadge'
import { getStatusBadgeClass } from '@/lib/crm-colors'

// Lazy load büyük componentler - performans için
const InvoiceForm = dynamic(() => import('./InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

const InvoiceKanbanChart = dynamic(() => import('@/components/charts/InvoiceKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded" />,
})

const InvoiceDetailModal = dynamic(() => import('./InvoiceDetailModal'), {
  ssr: false,
  loading: () => null,
})

const ShipmentForm = dynamic(() => import('../shipments/ShipmentForm'), { ssr: false, loading: () => null })

const TaskForm = dynamic(() => import('../tasks/TaskForm'), { ssr: false, loading: () => null })

const MeetingForm = dynamic(() => import('../meetings/MeetingForm'), { ssr: false, loading: () => null })

interface InvoiceListProps {
  isOpen?: boolean
}

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

async function fetchKanbanInvoices(search: string, quoteId: string, invoiceType: string, filterCompanyId?: string) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (quoteId) params.append('quoteId', quoteId)
  if (invoiceType && invoiceType !== 'ALL') params.append('invoiceType', invoiceType)
  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)

  const res = await fetch(`/api/analytics/invoice-kanban?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch kanban invoices')
  const data = await res.json()
  return data.kanban || []
}

export default function InvoiceList({ isOpen = true }: InvoiceListProps) {
  const locale = useLocale()
  const t = useTranslations('invoices')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const statusLabels: Record<string, string> = {
    DRAFT: tStatus('draft'),
    SENT: tStatus('sent'),
    SHIPPED: t('statusLabels.shipped'),
    RECEIVED: t('statusLabels.received'),
    PAID: tStatus('paid'),
    OVERDUE: tStatus('overdue'),
    CANCELLED: tStatus('cancelled'),
  }
  
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
  }, [statusFromUrl, status])
  const [quoteId, setQuoteId] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<Invoice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [quickAction, setQuickAction] = useState<{ type: 'shipment' | 'task' | 'meeting'; invoice: Invoice } | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false)
  const [selectedInvoiceForCommunication, setSelectedInvoiceForCommunication] = useState<Invoice | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

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
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (invoiceType && invoiceType !== 'ALL') params.append('invoiceType', invoiceType)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/invoices?${params.toString()}`
  }, [
    isOpen,
    debouncedSearch,
    status,
    invoiceType,
    isSuperAdmin,
    filterCompanyId,
  ])

  const { data: invoicesResponse, isLoading, mutate: mutateInvoices } = useData<any>(
    isOpen && viewMode === 'table' && apiUrl ? apiUrl : null,
    {
      dedupingInterval: 60000, // 60 saniye cache (performans için)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
      refreshInterval: 0,
    }
  )

  // Pagination format desteği: { data: [...], pagination: {...} } veya direkt array
  const invoices = useMemo(() => {
    if (!invoicesResponse) return []
    if (Array.isArray(invoicesResponse)) return invoicesResponse
    if (invoicesResponse?.data && Array.isArray(invoicesResponse.data)) return invoicesResponse.data
    return []
  }, [invoicesResponse])

  // Kanban view için TanStack Query kullanıyoruz (kanban özel endpoint)
  // ÖNEMLİ: Her zaman çalıştır (viewMode ne olursa olsun) - silme/güncelleme için gerekli
  const queryClient = useQueryClient()

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateInvoices(undefined, { revalidate: true }),
      mutate('/api/invoices', undefined, { revalidate: true }),
      mutate('/api/invoices?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/invoices', undefined, { revalidate: true }),
      queryClient.invalidateQueries({ queryKey: ['invoice-kanban'] }),
      queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] }),
    ])
  }
  const { data: kanbanDataRaw = [], isLoading: isLoadingKanban, isError: isErrorKanban, error: errorKanban, refetch: refetchKanban } = useQuery({
    queryKey: ['kanban-invoices', debouncedSearch, quoteId, invoiceType, filterCompanyId],
    queryFn: () => fetchKanbanInvoices(debouncedSearch, quoteId, invoiceType, filterCompanyId),
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Mount olduğunda refetch YAPMA - optimistic update'i koru
    refetchOnReconnect: false, // Reconnect'te refetch YAPMA - optimistic update'i koru
    placeholderData: (previousData) => previousData, // Optimistic update
    // enabled kaldırıldı - her zaman çalış (silme/güncelleme için gerekli)
    enabled: isOpen,
  })

  // Kanban data'yı status filtresine göre filtrele
  const kanbanData = useMemo(() => {
    if (!status || !Array.isArray(kanbanDataRaw)) {
      return kanbanDataRaw
    }
    // Status filtresi varsa sadece o status'teki kolonu göster
    return kanbanDataRaw.filter((col: any) => col.status === status)
  }, [kanbanDataRaw, status])

  const closeQuickAction = useCallback(() => {
    setQuickAction(null)
  }, [])

  const handleEdit = useCallback((invoice: Invoice) => {
    // ÖNEMLİ: SHIPPED (Sevkiyatı Yapıldı) durumundaki faturalar düzenlenemez
    if (invoice.status === 'SHIPPED') {
      toast.warning(t('cannotEditShipped'), { description: t('cannotEditShippedMessage') })
      return
    }
    
    setSelectedInvoice(invoice)
    setFormOpen(true)
  }, [t])

  const handleDelete = useCallback(async (id: string, title: string) => {
    // Çift tıklamayı önle
    if (deletingId === id) {
      return
    }

    if (!(await confirm(t('deleteConfirm', { title })))) {
      return
    }

    setDeletingId(id)

    try {
      // ÖNCE optimistic update yap - UI anında güncellensin
      // Table view için optimistic update
      if (invoices.length > 0) {
        const updatedInvoices = invoices.filter((i) => i.id !== id)
        mutateInvoices(updatedInvoices, { revalidate: false })
        mutate(apiUrl, updatedInvoices, { revalidate: false })
        mutate('/api/invoices?', updatedInvoices, { revalidate: false })
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
      toast.success(t('invoiceDeleted'), {
        description: t('invoiceDeletedMessage', { title })
      })
      
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
      toast.error(tCommon('error'), { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeletingId(null)
    }
  }, [invoices, mutateInvoices, apiUrl, kanbanData, debouncedSearch, quoteId, queryClient, deletingId, t, tCommon])

  const handleAdd = useCallback(() => {
    setSelectedInvoice(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedInvoice(null)
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>(
    isOpen ? `/api/stats/invoices?invoiceType=${invoiceType}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  if (!isOpen) {
    return null
  }

  if (viewMode === 'table' && isLoading) {
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
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationShipped'),
            result: t('automationShippedResult'),
            details: [
              t('automationShippedDetails1'),
              t('automationShippedDetails2'),
            ],
          },
          {
            action: t('automationPaid'),
            result: t('automationPaidResult'),
            details: [
              t('automationPaidDetails1'),
              t('automationPaidDetails2'),
              t('automationPaidDetails3'),
              t('automationPaidDetails4'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Faturalar</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Toplam {totalInvoices} fatura</p>
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
            onClick={handleAdd}
            className="bg-gradient-primary text-white w-full sm:w-auto"
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex-1 relative w-full sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="SENT">Gönderildi</SelectItem>
            <SelectItem value="SHIPPED">Sevkiyatı Yapıldı</SelectItem>
            <SelectItem value="RECEIVED">Satın Alma Onaylandı</SelectItem>
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
        <>
          {isLoadingKanban && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">Kanban yükleniyor...</p>
              </div>
            </div>
          )}
          {isErrorKanban && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-sm text-red-600">Kanban yüklenirken bir hata oluştu.</p>
                <Button onClick={() => refetchKanban()} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}
          {!isLoadingKanban && !isErrorKanban && (
            <InvoiceKanbanChart
              onView={(invoiceId) => {
                // DEBUG: Invoice ID kontrolü
                if (process.env.NODE_ENV === 'development') {
                  console.log('[InvoiceList] onView called:', {
                    invoiceId,
                    invoiceIdType: typeof invoiceId,
                    invoiceIdLength: invoiceId?.length,
                  })
                }
                setSelectedInvoiceId(invoiceId)
                setDetailModalOpen(true)
              }} // ✅ ÇÖZÜM: Modal açmak için callback
          key={`kanban-${kanbanData.reduce((sum: number, col: any) => sum + (col.invoices?.length || 0), 0)}-${kanbanData.reduce((sum: number, col: any) => sum + (col.totalValue || 0), 0)}`}
          data={kanbanData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={async (invoiceId: string, newStatus: string) => {
            // ÖNCE optimistic update yap - Kanban'da hemen görünsün
            if (Array.isArray(kanbanData) && kanbanData.length > 0) {
              // İptal edilen invoice'u bul
              let invoiceToMove: any = null
              let sourceColumnIndex = -1
              
              kanbanData.forEach((col: any, colIndex: number) => {
                const invoiceIndex = (col.invoices || []).findIndex((i: any) => i.id === invoiceId)
                if (invoiceIndex !== -1) {
                  invoiceToMove = col.invoices[invoiceIndex]
                  sourceColumnIndex = colIndex
                }
              })
              
              if (invoiceToMove && sourceColumnIndex !== -1) {
                // Optimistic update - hemen UI'da göster
                const updatedKanbanData = kanbanData.map((col: any, colIndex: number) => {
                  if (colIndex === sourceColumnIndex) {
                    // Eski kolondan kaldır
                    const updatedInvoices = (col.invoices || []).filter((i: any) => i.id !== invoiceId)
                    const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
                      const value = i?.totalAmount
                      const invoiceValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
                      return sum + invoiceValue
                    }, 0)
                    return {
                      ...col,
                      invoices: updatedInvoices,
                      count: Math.max(0, (col.count || 0) - 1),
                      totalValue: updatedTotalValue,
                    }
                  }
                  if (col.status === newStatus) {
                    // Yeni kolona ekle
                    const updatedInvoice = { ...invoiceToMove, status: newStatus }
                    const updatedInvoices = [updatedInvoice, ...(col.invoices || [])]
                    const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
                      const value = i?.totalAmount
                      const invoiceValue = typeof value === 'string' ? parseFloat(value) || 0 : (value || 0)
                      return sum + invoiceValue
                    }, 0)
                    return {
                      ...col,
                      invoices: updatedInvoices,
                      count: (col.count || 0) + 1,
                      totalValue: updatedTotalValue,
                    }
                  }
                  return col
                })
                
                // Cache'i güncelle - optimistic update
                queryClient.setQueryData(
                  ['kanban-invoices', debouncedSearch, quoteId, invoiceType],
                  updatedKanbanData
                )
              }
            }
            
            // SONRA API'ye status güncelleme isteği gönder
            try {
              const res = await fetch(`/api/invoices/${invoiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
              })
              
              if (!res.ok) {
                // Hata durumunda optimistic update'i geri al
                queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] })
                queryClient.refetchQueries({ queryKey: ['kanban-invoices'] })
                
                const errorData = await res.json().catch(() => ({}))
                
                // Detaylı hata mesajı oluştur - güvenli kontrol - HER ZAMAN STRING OLMALI
                let errorMessage: string = 'Fatura durumu güncellenemedi'
                
                if (errorData?.message && typeof errorData.message === 'string') {
                  errorMessage = String(errorData.message)
                } else if (errorData?.error && typeof errorData.error === 'string') {
                  errorMessage = String(errorData.error)
                }
                
                // Status validation hatası ise daha açıklayıcı mesaj göster
                if (errorData?.reason === 'INVALID_STATUS_TRANSITION') {
                  const currentStatus = String(errorData?.currentStatus || 'Bilinmiyor')
                  const attemptedStatus = String(errorData?.attemptedStatus || 'Bilinmiyor')
                  errorMessage = errorData?.message && typeof errorData.message === 'string' 
                    ? String(errorData.message)
                    : `Geçersiz durum geçişi: "${currentStatus}" → "${attemptedStatus}"`
                  
                  if (Array.isArray(errorData?.allowedTransitions) && errorData.allowedTransitions.length > 0) {
                    errorMessage += `\n\nİzin verilen geçişler: ${errorData.allowedTransitions.join(', ')}`
                  }
                }
                
                // ✅ GÜVENLİK: errorMessage'ın her zaman string olduğundan emin ol
                errorMessage = String(errorMessage || 'Fatura durumu güncellenemedi')
                
                // Toast ile hata göster - doğru format
                toast.error('Fatura Güncellenemedi', {
                  description: errorMessage,
                })
                
                throw new Error(errorMessage)
              }

              const responseData = await res.json()
              const automation = responseData?.automation || {}
              
              // Fatura başlığını al
              const invoiceTitle = responseData?.title || 'Fatura'
              
              // Detaylı toast mesajları oluştur
              let toastTitle = ''
              let toastDescription = ''
              let toastType: 'success' | 'warning' | 'info' = 'success'
              
              switch (newStatus) {
                case 'SENT':
                  toastTitle = `Fatura gönderildi: "${invoiceTitle}"`
                  toastDescription = `Fatura "Gönderildi" durumuna taşındı.`
                  
                  // Hizmet faturaları için özel mesaj
                  if (responseData?.invoiceType === 'SERVICE_SALES' || responseData?.invoiceType === 'SERVICE_PURCHASE') {
                    toastDescription += `\n\nHizmet faturası işlemleri:\n• Bildirim gönderildi`
                    if (automation.emailSent) {
                      toastDescription += `\n• E-posta gönderildi`
                    }
                    if (automation.notificationSent) {
                      toastDescription += `\n• İlgili ekipler bilgilendirildi`
                    }
                  } else if (automation.shipmentCreated && automation.shipmentId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Sevkiyat kaydı oluşturuldu (ID: ${automation.shipmentId.substring(0, 8)}...)\n• Ürünler rezerve edildi\n• Sevkiyat ekibi bilgilendirildi`
                  } else if (automation.purchaseTransactionCreated && automation.purchaseTransactionId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Mal kabul kaydı oluşturuldu (ID: ${automation.purchaseTransactionId.substring(0, 8)}...)\n• Ürünler bekleyen stok olarak işaretlendi\n• Satın alma ekibi bilgilendirildi`
                  }
                  break
                  
                case 'SHIPPED':
                  toastTitle = `Sevkiyat onaylandı: "${invoiceTitle}"`
                  toastDescription = `Fatura "Sevkiyat Yapıldı" durumuna taşındı.`
                  
                  if (automation.shipmentId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Sevkiyat kaydı onaylandı (ID: ${automation.shipmentId.substring(0, 8)}...)\n• Stoktan düşüm yapıldı\n• Ürünler sevk edildi olarak işaretlendi`
                  }
                  break
                  
                case 'RECEIVED':
                  toastTitle = `Mal kabul edildi: "${invoiceTitle}"`
                  toastDescription = `Fatura "Mal Kabul Edildi" durumuna taşındı.`
                  
                  if (automation.purchaseTransactionId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Mal kabul kaydı onaylandı (ID: ${automation.purchaseTransactionId.substring(0, 8)}...)\n• Stoğa giriş yapıldı\n• Ürünler stokta olarak işaretlendi`
                  }
                  break
                  
                case 'PAID':
                  toastTitle = `Ödeme kaydedildi: "${invoiceTitle}"`
                  toastDescription = `Fatura "Ödendi" durumuna taşındı.`
                  
                  if (automation.financeCreated && automation.financeId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Finance kaydı oluşturuldu (ID: ${automation.financeId.substring(0, 8)}...)\n• Gelir kaydı eklendi\n• Finans raporları güncellendi`
                  }
                  break
                  
                case 'OVERDUE':
                  toastTitle = `Fatura vadesi geçti: "${invoiceTitle}"`
                  toastDescription = `Fatura "Vadesi Geçti" durumuna taşındı.\n\nÖnemli:\n• Müşteriye ödeme hatırlatması gönderildi\n• Takip görevi oluşturuldu`
                  toastType = 'info'
                  break
                  
                case 'CANCELLED':
                  toastTitle = `Fatura iptal edildi: "${invoiceTitle}"`
                  toastDescription = `Fatura "İptal Edildi" durumuna taşındı.`
                  
                  const cancelledItems: string[] = []
                  if (automation.shipmentCancelled && automation.shipmentId) {
                    cancelledItems.push(`• Sevkiyat iptal edildi (ID: ${automation.shipmentId.substring(0, 8)}...)`)
                    cancelledItems.push(`• Rezerve edilen ürünler geri alındı`)
                  }
                  if (automation.purchaseTransactionCancelled && automation.purchaseTransactionId) {
                    cancelledItems.push(`• Mal kabul iptal edildi (ID: ${automation.purchaseTransactionId.substring(0, 8)}...)`)
                    cancelledItems.push(`• Bekleyen stok işlemleri geri alındı`)
                  }
                  
                  if (cancelledItems.length > 0) {
                    toastDescription += `\n\nGeri alınan işlemler:\n${cancelledItems.join('\n')}`
                  } else {
                    toastDescription += `\n\nBu fatura için sevkiyat/mal kabul kaydı bulunmuyordu.`
                  }
                  
                  toastType = 'warning'
                  break
                  
                default:
                  toastTitle = `Fatura durumu güncellendi: "${invoiceTitle}"`
                  toastDescription = `Fatura durumu "${newStatus}" olarak güncellendi.`
              }

              if (toastType === 'success') {
                toast.success(toastTitle, { description: toastDescription })
              } else if (toastType === 'warning') {
                toast.warning(toastTitle, { description: toastDescription })
              } else if (toastType === 'info') {
                if (typeof toast.info === 'function') {
                  toast.info(toastTitle, { description: toastDescription })
                } else {
                  toast.success(toastTitle, { description: toastDescription })
                }
              } else {
                toast.success(toastTitle, { description: toastDescription })
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
              toast.error('Fatura durumu güncellenemedi', {
                description: String(error?.message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
              })
              throw error
            }
          }}
            />
          )}
        </>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.title')}</TableHead>
                {isSuperAdmin && <TableHead>{t('tableHeaders.company')}</TableHead>}
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead>{t('tableHeaders.total')}</TableHead>
                <TableHead>{t('tableHeaders.quote')}</TableHead>
                <TableHead>{t('tableHeaders.date')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                    {t('noInvoicesFound')}
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
                              ? t('fromQuote')
                              : isShipped
                              ? `(${statusLabels.SHIPPED})`
                              : `(${statusLabels.RECEIVED})`}
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
                        <InlineEditBadge
                          value={invoice.status}
                          options={[
                            { value: 'DRAFT', label: statusLabels['DRAFT'] || 'Taslak' },
                            { value: 'SENT', label: statusLabels['SENT'] || 'Gönderildi' },
                            { value: 'SHIPPED', label: statusLabels['SHIPPED'] || 'Gönderildi' },
                            { value: 'RECEIVED', label: statusLabels['RECEIVED'] || 'Alındı' },
                            { value: 'PAID', label: statusLabels['PAID'] || 'Ödendi' },
                            { value: 'OVERDUE', label: statusLabels['OVERDUE'] || 'Vadesi Geçti' },
                            { value: 'CANCELLED', label: statusLabels['CANCELLED'] || 'İptal Edildi' },
                          ]}
                          onSave={async (newStatus) => {
                            try {
                              const res = await fetch(`/api/invoices/${invoice.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              })
                              if (!res.ok) {
                                const error = await res.json().catch(() => ({}))
                                throw new Error(error.error || 'Durum güncellenemedi')
                              }
                              const updatedInvoice = await res.json()
                              
                              // Cache'i güncelle
                              await Promise.all([
                                mutate('/api/invoices', undefined, { revalidate: true }),
                                mutate('/api/invoices?', undefined, { revalidate: true }),
                                mutate((key: string) => typeof key === 'string' && key.startsWith('/api/invoices'), undefined, { revalidate: true }),
                              ])
                              
                              toast.success('Durum güncellendi', { description: `Fatura "${statusLabels[newStatus] || newStatus}" durumuna taşındı.` })
                            } catch (error: any) {
                              toast.error('Durum güncellenemedi', { description: error?.message || 'Bir hata oluştu.' })
                              throw error
                            }
                          }}
                          disabled={invoice.status === 'PAID' || invoice.status === 'SHIPPED' || invoice.status === 'RECEIVED' || !!invoice.quoteId}
                        />
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
                          {t('tableHeaders.quote')} #{invoice.quoteId.substring(0, 8)}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t('quickActions.open', { name: invoice.title })}
                            >
                              <Sparkles className="h-4 w-4 text-indigo-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>{t('quickActions.title')}</DropdownMenuLabel>
                            <DropdownMenuItem
                              onSelect={() => setQuickAction({ type: 'shipment', invoice })}
                              disabled={invoice.status !== 'PAID'}
                            >
                              <Package className="h-4 w-4" />
                              {t('quickActions.createShipment')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setQuickAction({ type: 'task', invoice })}
                            >
                              <CheckSquare className="h-4 w-4" />
                              {t('quickActions.createTask')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setQuickAction({ type: 'meeting', invoice })}
                            >
                              <Calendar className="h-4 w-4" />
                              {t('quickActions.scheduleMeeting')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Email/SMS/WhatsApp Butonları */}
                            <DropdownMenuItem
                              onSelect={async () => {
                                // Quote, Deal ve Customer bilgisini çek
                                if (invoice.quoteId) {
                                  try {
                                    const quoteRes = await fetch(`/api/quotes/${invoice.quoteId}`)
                                    if (quoteRes.ok) {
                                      const quote = await quoteRes.json()
                                      if (quote?.dealId) {
                                        const dealRes = await fetch(`/api/deals/${quote.dealId}`)
                                        if (dealRes.ok) {
                                          const deal = await dealRes.json()
                                          if (deal?.customerId) {
                                            const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                            if (customerRes.ok) {
                                              const customer = await customerRes.json()
                                              if (customer?.email) {
                                                setSelectedInvoiceForCommunication(invoice)
                                                setSelectedCustomer(customer)
                                                setEmailDialogOpen(true)
                                              } else {
                                                toast.error('E-posta adresi yok', { description: 'Müşterinin e-posta adresi bulunamadı' })
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Customer fetch error:', error)
                                  }
                                } else {
                                  toast.error('Teklif yok', { description: 'Bu fatura için teklif bilgisi bulunamadı' })
                                }
                              }}
                              disabled={!invoice.quoteId}
                            >
                              <Mail className="h-4 w-4" />
                              E-posta Gönder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={async () => {
                                if (invoice.quoteId) {
                                  try {
                                    const quoteRes = await fetch(`/api/quotes/${invoice.quoteId}`)
                                    if (quoteRes.ok) {
                                      const quote = await quoteRes.json()
                                      if (quote?.dealId) {
                                        const dealRes = await fetch(`/api/deals/${quote.dealId}`)
                                        if (dealRes.ok) {
                                          const deal = await dealRes.json()
                                          if (deal?.customerId) {
                                            const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                            if (customerRes.ok) {
                                              const customer = await customerRes.json()
                                              if (customer?.phone) {
                                                setSelectedInvoiceForCommunication(invoice)
                                                setSelectedCustomer(customer)
                                                setSmsDialogOpen(true)
                                              } else {
                                                toast.error('Telefon numarası yok', { description: 'Müşterinin telefon numarası bulunamadı' })
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Customer fetch error:', error)
                                  }
                                } else {
                                  toast.error('Teklif yok', { description: 'Bu fatura için teklif bilgisi bulunamadı' })
                                }
                              }}
                              disabled={!invoice.quoteId}
                            >
                              <MessageSquare className="h-4 w-4" />
                              SMS Gönder
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={async () => {
                                if (invoice.quoteId) {
                                  try {
                                    const quoteRes = await fetch(`/api/quotes/${invoice.quoteId}`)
                                    if (quoteRes.ok) {
                                      const quote = await quoteRes.json()
                                      if (quote?.dealId) {
                                        const dealRes = await fetch(`/api/deals/${quote.dealId}`)
                                        if (dealRes.ok) {
                                          const deal = await dealRes.json()
                                          if (deal?.customerId) {
                                            const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                            if (customerRes.ok) {
                                              const customer = await customerRes.json()
                                              if (customer?.phone) {
                                                setSelectedInvoiceForCommunication(invoice)
                                                setSelectedCustomer(customer)
                                                setWhatsAppDialogOpen(true)
                                              } else {
                                                toast.error('Telefon numarası yok', { description: 'Müşterinin telefon numarası bulunamadı' })
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Customer fetch error:', error)
                                  }
                                } else {
                                  toast.error('Teklif yok', { description: 'Bu fatura için teklif bilgisi bulunamadı' })
                                }
                              }}
                              disabled={!invoice.quoteId}
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp Gönder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id)
                            setSelectedInvoiceData(invoice)
                            setDetailModalOpen(true)
                          }}
                          aria-label={t('viewInvoice', { title: invoice.title })}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                        {/* Quote'tan oluşturulan, PAID, SHIPPED ve RECEIVED durumundaki faturalar için düzenle butonu gösterilmez */}
                        {!isFromQuote && !isShipped && !isReceived && invoice.status !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (invoice.status === 'PAID') {
                                toast.warning(t('cannotEditPaid'), { description: t('cannotDeletePaidMessage') })
                                return
                              }
                              handleEdit(invoice)
                            }}
                            disabled={invoice.status === 'PAID'}
                            aria-label={t('editInvoice', { title: invoice.title })}
                            title={invoice.status === 'PAID' ? t('cannotEditPaid') : tCommon('edit')}
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
                                toast.warning(t('cannotDeletePaid'), { description: t('cannotDeletePaidMessage') })
                                return
                              }
                              if (invoice.status === 'SHIPPED') {
                                toast.warning(t('cannotDeleteShipped'), { description: t('cannotDeleteShippedMessage') })
                                return
                              }
                              if (invoice.status === 'RECEIVED') {
                                toast.warning(t('cannotDeleteReceived'), { description: t('cannotDeleteReceivedMessage') })
                                return
                              }
                              handleDelete(invoice.id, invoice.title)
                            }}
                            disabled={invoice.status === 'PAID' || invoice.status === 'SHIPPED' || invoice.status === 'RECEIVED'}
                            className="text-red-600 hover:text-red-700 disabled:opacity-50"
                            aria-label={t('deleteInvoice', { title: invoice.title })}
                            title={
                              invoice.status === 'PAID' ? t('cannotDeletePaid') :
                              invoice.status === 'SHIPPED' ? t('cannotDeleteShipped') :
                              invoice.status === 'RECEIVED' ? t('cannotDeleteReceived') :
                              tCommon('delete')
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('noInvoicesFound')}
              </div>
            ) : (
              invoices.map((invoice) => {
                const isFromQuote = !!invoice.quoteId
                const isShipped = invoice.status === 'SHIPPED'
                const isReceived = invoice.status === 'RECEIVED'
                const isLocked = isFromQuote || isShipped || isReceived
                
                return (
                  <div
                    key={invoice.id}
                    className={`bg-white rounded-lg border p-4 shadow-sm ${
                      isLocked 
                        ? isFromQuote 
                          ? 'border-indigo-200 bg-indigo-50/50' 
                          : isShipped
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-teal-200 bg-teal-50/50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {invoice.title}
                          {isLocked && (
                            <span className="ml-2 text-xs font-semibold">
                              {isFromQuote 
                                ? t('fromQuote')
                                : isShipped
                                ? `(${statusLabels.SHIPPED})`
                                : `(${statusLabels.RECEIVED})`}
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <InlineEditBadge
                            value={invoice.status}
                            options={[
                              { value: 'DRAFT', label: statusLabels['DRAFT'] || 'Taslak' },
                              { value: 'SENT', label: statusLabels['SENT'] || 'Gönderildi' },
                              { value: 'SHIPPED', label: statusLabels['SHIPPED'] || 'Gönderildi' },
                              { value: 'RECEIVED', label: statusLabels['RECEIVED'] || 'Alındı' },
                              { value: 'PAID', label: statusLabels['PAID'] || 'Ödendi' },
                              { value: 'OVERDUE', label: statusLabels['OVERDUE'] || 'Vadesi Geçti' },
                              { value: 'CANCELLED', label: statusLabels['CANCELLED'] || 'İptal Edildi' },
                            ]}
                            onSave={async (newStatus) => {
                              try {
                                const res = await fetch(`/api/invoices/${invoice.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus }),
                                })
                                if (!res.ok) {
                                  const error = await res.json().catch(() => ({}))
                                  throw new Error(error.error || 'Durum güncellenemedi')
                                }
                                await Promise.all([
                                  mutate('/api/invoices', undefined, { revalidate: true }),
                                  mutate('/api/invoices?', undefined, { revalidate: true }),
                                ])
                                toast.success('Durum güncellendi', { description: `Fatura "${statusLabels[newStatus] || newStatus}" durumuna taşındı.` })
                              } catch (error: any) {
                                toast.error('Durum güncellenemedi', { description: error?.message || 'Bir hata oluştu.' })
                                throw error
                              }
                            }}
                            disabled={invoice.status === 'PAID' || invoice.status === 'SHIPPED' || invoice.status === 'RECEIVED' || !!invoice.quoteId}
                          />
                          <Badge className="font-semibold text-xs">
                            {formatCurrency(getInvoiceValue(invoice))}
                          </Badge>
                          {isSuperAdmin && invoice.Company?.name && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                              {invoice.Company.name}
                            </Badge>
                          )}
                        </div>
                        {invoice.quoteId && (
                          <Link 
                            href={`/${locale}/quotes/${invoice.quoteId}`}
                            className="text-xs text-primary-600 hover:underline mt-1 block"
                            prefetch={true}
                          >
                            Teklif: {invoice.quoteId.substring(0, 8)}
                          </Link>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedInvoiceId(invoice.id)
                            setSelectedInvoiceData(invoice)
                            setDetailModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(invoice)}
                          disabled={isLocked}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDelete(invoice.id, invoice.title)}
                          disabled={invoice.status === 'PAID' || invoice.status === 'SHIPPED' || invoice.status === 'RECEIVED'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedInvoiceId(null)
          setSelectedInvoiceData(null)
        }}
        initialData={selectedInvoiceData || undefined}
      />
      
      {/* DEBUG: Invoice ID kontrolü */}
      {process.env.NODE_ENV === 'development' && detailModalOpen && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-xs z-50 max-w-xs">
          <p className="font-semibold text-yellow-800">Debug Info:</p>
          <p>selectedInvoiceId: {selectedInvoiceId || 'null'}</p>
          <p>detailModalOpen: {String(detailModalOpen)}</p>
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
            selectedInvoice ? t('statusUpdated') : t('invoiceCreated'),
            {
              description: selectedInvoice 
                ? t('invoiceUpdatedMessage', { title: savedInvoice.title })
                : t('invoiceCreatedMessage', { title: savedInvoice.title })
            }
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
                mutate(apiUrl, updatedInvoices, { revalidate: false }),
                mutate('/api/invoices?', updatedInvoices, { revalidate: false }),
              ])
            }
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            const updatedInvoices = [savedInvoice, ...invoices]
            
            // Table view için SWR cache'i güncelle - optimistic update
            // ÖNEMLİ: Her zaman table view cache'ini güncelle (viewMode ne olursa olsun)
            await mutateInvoices(updatedInvoices, { revalidate: false })
            await Promise.all([
              mutate(apiUrl, updatedInvoices, { revalidate: false }),
              mutate('/api/invoices?', updatedInvoices, { revalidate: false }),
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

      {/* Quick Action Form Modals */}
      <ShipmentForm
        open={quickAction?.type === 'shipment'}
        onClose={closeQuickAction}
        onSuccess={async (savedShipment) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        invoiceId={quickAction?.invoice.id}
        customerCompanyId={quickAction?.invoice.companyId}
      />
      <TaskForm
        open={quickAction?.type === 'task'}
        onClose={closeQuickAction}
        onSuccess={async (savedTask) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        defaultTitle={quickAction?.invoice.title}
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        invoiceId={quickAction?.invoice.id}
        customerCompanyId={quickAction?.invoice.companyId}
      />
      
      {/* Communication Modals */}
      {emailDialogOpen && selectedInvoiceForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="email"
          options={{
            entityType: 'INVOICE',
            entityId: selectedInvoiceForCommunication.id,
            entityTitle: selectedInvoiceForCommunication.title,
            customerEmail: selectedCustomer.email,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultSubject: `Fatura: ${selectedInvoiceForCommunication.title}`,
            defaultMessage: `Merhaba ${selectedCustomer.name},\n\nFatura bilgisi: ${selectedInvoiceForCommunication.title}\n\nTutar: ${selectedInvoiceForCommunication.totalAmount ? `₺${selectedInvoiceForCommunication.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}\nDurum: ${selectedInvoiceForCommunication.status || 'DRAFT'}`,
            defaultHtml: `<p>Merhaba ${selectedCustomer.name},</p><p>Fatura bilgisi: <strong>${selectedInvoiceForCommunication.title}</strong></p><p>Tutar: ${selectedInvoiceForCommunication.totalAmount ? `₺${selectedInvoiceForCommunication.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p><p>Durum: ${selectedInvoiceForCommunication.status || 'DRAFT'}</p>`,
            onSent: () => {
              toast.success('E-posta gönderildi', { description: 'Müşteriye invoice bilgisi gönderildi' })
            },
          }}
          open={emailDialogOpen}
          onClose={() => {
            setEmailDialogOpen(false)
            setSelectedInvoiceForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {smsDialogOpen && selectedInvoiceForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="sms"
          options={{
            entityType: 'INVOICE',
            entityId: selectedInvoiceForCommunication.id,
            entityTitle: selectedInvoiceForCommunication.title,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Fatura: ${selectedInvoiceForCommunication.title}. Tutar: ${selectedInvoiceForCommunication.totalAmount ? `₺${selectedInvoiceForCommunication.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('SMS gönderildi', { description: 'Müşteriye invoice bilgisi gönderildi' })
            },
          }}
          open={smsDialogOpen}
          onClose={() => {
            setSmsDialogOpen(false)
            setSelectedInvoiceForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {whatsAppDialogOpen && selectedInvoiceForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="whatsapp"
          options={{
            entityType: 'INVOICE',
            entityId: selectedInvoiceForCommunication.id,
            entityTitle: selectedInvoiceForCommunication.title,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Fatura: ${selectedInvoiceForCommunication.title}. Tutar: ${selectedInvoiceForCommunication.totalAmount ? `₺${selectedInvoiceForCommunication.totalAmount.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('WhatsApp mesajı gönderildi', { description: 'Müşteriye invoice bilgisi gönderildi' })
            },
          }}
          open={whatsAppDialogOpen}
          onClose={() => {
            setWhatsAppDialogOpen(false)
            setSelectedInvoiceForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}
