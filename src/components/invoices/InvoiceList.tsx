'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, FileText, LayoutGrid, Table as TableIcon, Sparkles, Calendar, CheckSquare, Package, Mail, MessageSquare, MessageCircle, Download, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
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
import BulkActions from '@/components/ui/BulkActions'
import { Checkbox } from '@/components/ui/checkbox'

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

import { Invoice } from '@/types/crm'

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
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const errorMessage = errorData?.error || `Failed to fetch kanban invoices (${res.status})`
    throw new Error(errorMessage)
  }
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
  const { confirm } = useConfirm()

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
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

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

  // Kanban view için SWR kullanıyoruz (kanban özel endpoint)
  // ÖNEMLİ: Her zaman çalıştır (viewMode ne olursa olsun) - silme/güncelleme için gerekli
  const kanbanApiUrl = useMemo(() => {
    if (!isOpen) return null
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (quoteId) params.append('quoteId', quoteId)
    if (invoiceType && invoiceType !== 'ALL') params.append('invoiceType', invoiceType)
    if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/analytics/invoice-kanban?${params.toString()}`
  }, [isOpen, debouncedSearch, quoteId, invoiceType, filterCompanyId])

  const { data: kanbanResponse, isLoading: isLoadingKanban, error: errorKanban, mutate: mutateKanban } = useData<{ kanban: any[] }>(
    kanbanApiUrl,
    {
      dedupingInterval: 5 * 60 * 1000, // 5 dakika cache
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  )

  const kanbanDataRaw = kanbanResponse?.kanban || []

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateInvoices(undefined, { revalidate: true }),
      mutate('/api/invoices', undefined, { revalidate: true }),
      mutate('/api/invoices?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/invoices', undefined, { revalidate: true }),
      mutateKanban(undefined, { revalidate: true }),
      mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', undefined, { revalidate: true }),
    ])
  }

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

    if (!(await confirm({
      title: t('deleteConfirmTitle', { title }),
      description: t('deleteConfirmMessage'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      variant: 'destructive'
    }))) {
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
        // Kanban cache'ini güncelle - optimistic update (refetch yapmadan önce)
        // ÖNEMLİ: mutate ile cache'i güncelle, böylece kanbanData prop'u otomatik güncellenir
        await mutateKanban({ kanban: updatedKanbanData }, { revalidate: false })
        await mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', { kanban: updatedKanbanData }, { revalidate: false })
      }

      // SONRA API'ye DELETE isteği gönder
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        // Hata durumunda optimistic update'i geri al - eski veriyi geri getir
        mutateInvoices(undefined, { revalidate: true })
        mutateKanban(undefined, { revalidate: true })
        mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', undefined, { revalidate: true })
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete invoice')
      }

      // Başarı bildirimi
      toast.success(t('invoiceDeleted'), {
        description: t('invoiceDeletedMessage', { title })
      })

      // Başarılı silme sonrası - SADECE invalidate yap, refetch YAPMA (optimistic update zaten yapıldı)
      // ÖNEMLİ: Dashboard'daki tüm ilgili cache'leri invalidate et (ana sayfada güncellensin)
      // Ama kanban cache'ini invalidate ve refetch YAPMA - optimistic update'i koru
      await Promise.all([
        mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }), // Dashboard'daki kanban chart'ı güncelle
        mutate('/api/analytics/kpis', undefined, { revalidate: true }), // Dashboard'daki KPIs güncelle
        mutateInvoices(undefined, { revalidate: true }),
      ])

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
  }, [invoices, mutateInvoices, apiUrl, kanbanData, debouncedSearch, quoteId, kanbanApiUrl, mutateKanban, deletingId, t, tCommon])

  const handleAdd = useCallback(() => {
    setSelectedInvoice(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedInvoice(null)
  }, [])

  // Bulk operations handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      // SHIPPED, RECEIVED, PAID invoice'ları seçme - immutable oldukları için
      const selectableInvoices = invoices.filter((i) => !['SHIPPED', 'RECEIVED', 'PAID'].includes(i.status))
      setSelectedIds(selectableInvoices.map((i) => i.id))
    } else {
      setSelectedIds([])
    }
  }, [invoices])

  const handleSelectItem = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id))
      setSelectAll(false)
    }
  }, [])

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    try {
      const res = await fetch('/api/invoices/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to bulk delete invoices')
      }

      // Optimistic update - silinen kayıtları listeden kaldır
      const updatedInvoices = invoices.filter((i) => !ids.includes(i.id))
      
      // Cache'i güncelle
      await mutateInvoices(updatedInvoices, { revalidate: false })
      
      // Tüm diğer invoice URL'lerini de güncelle
      await Promise.all([
        mutate('/api/invoices', updatedInvoices, { revalidate: false }),
        mutate('/api/invoices?', updatedInvoices, { revalidate: false }),
        mutate(apiUrl || '/api/invoices', updatedInvoices, { revalidate: false }),
      ])

      // Kanban cache'ini de güncelle
      mutateKanban(undefined, { revalidate: true })
      mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', undefined, { revalidate: true })

      toast.success(tCommon('bulkDeleteSuccess', { count: ids.length, item: tCommon('invoices') }), {
        description: tCommon('bulkDeleteSuccessMessage', { count: ids.length, item: tCommon('invoices') }),
      })

      // Seçimi temizle
      setSelectedIds([])
      setSelectAll(false)
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(tCommon('error'), { description: error?.message || 'Toplu silme işlemi başarısız oldu' })
    }
  }, [invoices, mutateInvoices, apiUrl, kanbanApiUrl, mutateKanban, tCommon])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [])

  // selectAll'u güncelle - tüm seçilebilir invoice'lar seçiliyse true
  useEffect(() => {
    const selectableInvoices = invoices.filter((i) => !['SHIPPED', 'RECEIVED', 'PAID'].includes(i.status))
    if (selectableInvoices.length > 0 && selectedIds.length === selectableInvoices.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedIds, invoices])

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
            {/* ✅ Export Butonu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Dışa Aktar">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Dışa Aktar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams()
                      if (debouncedSearch) params.append('search', debouncedSearch)
                      if (status) params.append('status', status)
                      if (invoiceType && invoiceType !== 'ALL') params.append('type', invoiceType)
                      params.append('format', 'excel')
                      
                      const res = await fetch(`/api/invoices/export?${params.toString()}`)
                      if (!res.ok) throw new Error('Export failed')
                      
                      const blob = await res.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `faturalar-${new Date().toISOString().split('T')[0]}.xlsx`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                      
                      toast.success('Dışa aktarma başarılı', {
                        description: 'Faturalar Excel formatında indirildi.',
                      })
                    } catch (error: any) {
                      toast.error('Dışa aktarma başarısız', {
                        description: error?.message || 'Bir hata oluştu',
                      })
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams()
                      if (debouncedSearch) params.append('search', debouncedSearch)
                      if (status) params.append('status', status)
                      if (invoiceType && invoiceType !== 'ALL') params.append('type', invoiceType)
                      params.append('format', 'csv')
                      
                      const res = await fetch(`/api/invoices/export?${params.toString()}`)
                      if (!res.ok) throw new Error('Export failed')
                      
                      const blob = await res.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `faturalar-${new Date().toISOString().split('T')[0]}.csv`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      window.URL.revokeObjectURL(url)
                      
                      toast.success('Dışa aktarma başarılı', {
                        description: 'Faturalar CSV formatında indirildi.',
                      })
                    } catch (error: any) {
                      toast.error('Dışa aktarma başarısız', {
                        description: error?.message || 'Bir hata oluştu',
                      })
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          {errorKanban && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-sm text-red-600 font-semibold mb-2">Kanban yüklenirken bir hata oluştu.</p>
                {errorKanban && (
                  <p className="text-xs text-red-500 mb-4">
                    {errorKanban instanceof Error ? errorKanban.message : 'Bilinmeyen hata'}
                  </p>
                )}
                <Button onClick={() => mutateKanban(undefined, { revalidate: true })} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}
          {!isLoadingKanban && !errorKanban && (
            <InvoiceKanbanChart
              onQuickAction={(type: 'shipment' | 'task' | 'meeting', invoice) => {
                setQuickAction({ type, invoice: invoice as any })
              }} // ✅ ÇÖZÜM: Quick action için callback (shipment, task, meeting)
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
                // ✅ ÇÖZÜM: "new" ID kontrolü - geçersiz ID'ler için hata göster
                if (invoiceId === 'new' || !invoiceId || invoiceId.trim() === '') {
                  mutateKanban(undefined, { revalidate: true })
                  toast.error('Geçersiz Fatura ID', {
                    description: 'Fatura ID geçersiz. Lütfen sayfayı yenileyin.',
                  })
                  return
                }

                const invoice = kanbanData
                  .flatMap((col: any) => col.invoices || [])
                  .find((i: any) => i.id === invoiceId)

                // ✅ SENT durumuna geçerken onay iste (satış faturaları için sevkiyat oluşturulacak)
                if (newStatus === 'SENT' && invoice) {
                  const invoiceType = invoice.invoiceType || 'SALES'
                  const hasProducts = invoice.invoiceItems?.length > 0 || invoice.items?.length > 0
                  
                  // Satış faturaları için sevkiyat oluşturulacak
                  if (invoiceType === 'SALES' && hasProducts) {
                    const confirmed = await confirm({
                      title: 'Faturayı Gönder?',
                      description: `Sevkiyat kaydı oluşturulacak.`,
                      confirmLabel: 'Gönder',
                      cancelLabel: 'İptal',
                      variant: 'default'
                    })
                    
                    if (!confirmed) {
                      return // İşlemi iptal et
                    }
                  }
                }

                // ✅ PAID durumuna geçerken onay iste
                if (newStatus === 'PAID' && invoice) {
                  const invoiceValue = getInvoiceValue(invoice)
                  const confirmed = await confirm({
                    title: 'Faturayı Ödendi Olarak İşaretle?',
                    description: `Finance kaydı oluşturulacak (${formatCurrency(invoiceValue)}).`,
                    confirmLabel: 'Ödendi',
                    cancelLabel: 'İptal',
                    variant: 'default'
                  })
                  
                  if (!confirmed) {
                    return // İşlemi iptal et
                  }
                }

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
                    await mutateKanban({ kanban: updatedKanbanData }, { revalidate: false })
                    await mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', { kanban: updatedKanbanData }, { revalidate: false })
                  }
                }

                // ✅ OPTİMİZASYON: API çağrısı - timeout ile hızlı hata yakalama
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout - daha hızlı hata yakalama
                
                try {
                  const res = await fetch(`/api/invoices/${invoiceId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                    signal: controller.signal,
                  })
                  
                  clearTimeout(timeoutId)

                  if (!res.ok) {
                    // Hata durumunda optimistic update'i geri al
                    mutateKanban(undefined, { revalidate: true })
                    mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', undefined, { revalidate: true })

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
                      toastTitle = `📤 Fatura Gönderildi!`
                      toastDescription = `"${invoiceTitle}" faturası gönderildi.`
                      if (automation.shipmentCreated && automation.shipmentId) {
                        toastDescription += ` Sevkiyat kaydı oluşturuldu (ID: ${automation.shipmentId.substring(0, 8)}...).`
                      }
                      break

                    case 'SHIPPED':
                      toastTitle = `🚚 Sevkiyat Yapıldı!`
                      toastDescription = `"${invoiceTitle}" faturası sevkiyat yapıldı.`
                      if (automation.shipmentId) {
                        toastDescription += ` Sevkiyat ID: ${automation.shipmentId.substring(0, 8)}...`
                      }
                      break

                    case 'RECEIVED':
                      toastTitle = `Mal Kabul Edildi`
                      toastDescription = automation.purchaseTransactionId ? `Stoğa giriş yapıldı.` : `İşlem tamamlandı.`
                      break

                    case 'PAID':
                      toastTitle = `💰 Fatura Ödendi!`
                      toastDescription = `"${invoiceTitle}" faturası ödendi.`
                      if (automation.financeCreated && automation.financeId) {
                        toastDescription += ` Finance kaydı oluşturuldu.`
                      }
                      break

                    case 'OVERDUE':
                      toastTitle = `Fatura Vadesi Geçti`
                      toastDescription = `Ödeme hatırlatması gönderildi.`
                      toastType = 'info'
                      break

                    case 'CANCELLED':
                      toastTitle = `Fatura İptal Edildi`
                      toastDescription = `"${invoiceTitle}" faturası iptal edildi.`
                      toastType = 'warning'
                      break

                    default:
                      toastTitle = `Durum Güncellendi`
                      toastDescription = `"${newStatus}" durumuna taşındı.`
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

                  // ✅ OPTİMİZASYON: Cache güncellemelerini background'da yap (blocking yapma)
                  Promise.all([
                    mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }), // Dashboard'daki kanban chart'ı güncelle
                    mutate('/api/analytics/kpis', undefined, { revalidate: true }), // Dashboard'daki KPIs güncelle
                    mutateKanban(undefined, { revalidate: true }),
                  ]).catch(() => {}) // Background'da hata olursa sessizce geç
                } catch (error: any) {
                  // Optimistic update'i geri al
                  mutateKanban(undefined, { revalidate: true })
                  mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', undefined, { revalidate: true })
                  
                  // ✅ OPTİMİZASYON: Timeout veya network hatası için özel mesaj
                  if (error.name === 'AbortError') {
                    toast.error('İşlem zaman aşımına uğradı', { 
                      description: 'Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
                      duration: 5000,
                    })
                  } else {
                    let errorMessage = 'Fatura durumu güncellenemedi'
                    if (error?.message && typeof error.message === 'string') {
                      errorMessage = error.message
                    }
                    toast.error('Fatura Güncellenemedi', {
                      description: errorMessage,
                      duration: 5000,
                    })
                  }
                  console.error('Status update error:', error)
                }
              }}
            />
          )}
        </>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <BulkActions
              selectedIds={selectedIds}
              onBulkDelete={handleBulkDelete}
              onClearSelection={handleClearSelection}
              itemName={t('title').toLowerCase()}
            />
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        aria-label={tCommon('selectAll')}
                      />
                    </TableHead>
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
                      <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                        {t('noInvoicesFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => {
                      const isFromQuote = !!invoice.quoteId
                      const isShipped = invoice.status === 'SHIPPED'
                      const isReceived = invoice.status === 'RECEIVED'
                      const isPaid = invoice.status === 'PAID'
                      const isLocked = isFromQuote || isShipped || isReceived || isPaid
                      const isSelected = selectedIds.includes(invoice.id)
                      const isImmutable = ['SHIPPED', 'RECEIVED', 'PAID'].includes(invoice.status)

                      return (
                        <TableRow
                          key={invoice.id}
                          className={
                            isLocked
                              ? isFromQuote
                                ? 'bg-indigo-50/50 hover:bg-indigo-50'
                                : isShipped
                                  ? 'bg-green-50/50 hover:bg-green-50'
                                  : isReceived
                                    ? 'bg-teal-50/50 hover:bg-teal-50'
                                    : 'bg-emerald-50/50 hover:bg-emerald-50'
                              : ''
                          }
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                if (!isImmutable) {
                                  handleSelectItem(invoice.id, checked as boolean)
                                }
                              }}
                              disabled={isImmutable}
                              aria-label={`${invoice.title} seç`}
                            />
                          </TableCell>
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
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
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
                                // ✅ SENT durumuna geçerken onay iste (satış faturaları için sevkiyat oluşturulacak)
                                if (newStatus === 'SENT') {
                                  const invoiceType = invoice.invoiceType || 'SALES'
                                  const hasProducts = invoice.invoiceItems?.length > 0 || invoice.items?.length > 0
                                  
                                  if (invoiceType === 'SALES' && hasProducts) {
                                    const confirmed = await confirm({
                                      title: 'Faturayı Göndermek İstediğinize Emin Misiniz?',
                                      description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturasını gönderdiğinizde otomatik olarak şu işlemler yapılacak:\n\n• Sevkiyat kaydı oluşturulacak (PENDING durumunda)\n• Sevkiyat numarası atanacak\n• Müşteri adresi sevkiyat adresi olarak ayarlanacak\n• Teslimat tarihi belirlenecek (vade tarihinden 3 gün sonra)\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                      confirmLabel: 'Evet, Gönder',
                                      cancelLabel: 'İptal',
                                      variant: 'default'
                                    })
                                    
                                    if (!confirmed) {
                                      return // İşlemi iptal et
                                    }
                                  }
                                }

                                // ✅ PAID durumuna geçerken onay iste
                                if (newStatus === 'PAID') {
                                  const invoiceValue = getInvoiceValue(invoice)
                                  const confirmed = await confirm({
                                    title: 'Faturayı Ödendi Olarak İşaretlemek İstediğinize Emin Misiniz?',
                                    description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturasını ödendi olarak işaretlediğinizde otomatik olarak şu işlemler yapılacak:\n\n• Finance kaydı oluşturulacak (GELİR - ${formatCurrency(invoiceValue)})\n• Finans raporları güncellenecek\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                    confirmLabel: 'Evet, Ödendi Olarak İşaretle',
                                    cancelLabel: 'İptal',
                                    variant: 'default'
                                  })
                                  
                                  if (!confirmed) {
                                    return // İşlemi iptal et
                                  }
                                }

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
                                  const automation = updatedInvoice?.automation || {}

                                  // Cache'i güncelle
                                  await Promise.all([
                                    mutate('/api/invoices', undefined, { revalidate: true }),
                                    mutate('/api/invoices?', undefined, { revalidate: true }),
                                    mutate((key: string) => typeof key === 'string' && key.startsWith('/api/invoices'), undefined, { revalidate: true }),
                                  ])

                                  // ✅ Detaylı toast mesajı
                                  if (newStatus === 'SENT') {
                                    const toastDescription = `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası gönderildi.\n\nOtomatik işlemler:\n${automation.shipmentCreated && automation.shipmentId ? `• Sevkiyat kaydı oluşturuldu (ID: ${automation.shipmentId.substring(0, 8)}...)\n• Sevkiyat numarası atandı\n• Müşteri adresi sevkiyat adresi olarak ayarlandı\n• Teslimat tarihi belirlendi\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                    toast.success('📤 Fatura Gönderildi!', {
                                      description: toastDescription,
                                      ...(automation.shipmentCreated && automation.shipmentId ? {
                                        action: {
                                          label: 'Sevkiyatı Görüntüle',
                                          onClick: () => {
                                            window.location.href = `/${locale}/shipments/${automation.shipmentId}`
                                          }
                                        }
                                      } : {})
                                    })
                                  } else if (newStatus === 'PAID') {
                                    const invoiceAmount = updatedInvoice?.totalAmount || 0
                                    toast.success('💰 Fatura Ödendi!', {
                                      description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası ödendi olarak işaretlendi.\n\nOtomatik işlemler:\n${automation.financeCreated ? `• Finance kaydı oluşturuldu (ID: ${automation.financeId?.substring(0, 8)}...)\n• Gelir kaydı eklendi (${formatCurrency(invoiceAmount)})\n• Finans raporları güncellendi\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                    })
                                  } else {
                                  toast.success('Durum güncellendi', { description: `Fatura "${statusLabels[newStatus] || newStatus}" durumuna taşındı.` })
                                  }
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
                                  {/* SHIPPED invoice'lar için Sevkiyatı Görüntüle */}
                                  {(invoice.status === 'SHIPPED' || invoice.status === 'SENT') && invoice.shipmentId && (
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        toast.info('Sevkiyata Yönlendiriliyor', { description: 'Sevkiyat detay sayfasına yönlendiriliyor...' })
                                        window.location.href = `/${locale}/shipments/${invoice.shipmentId}`
                                      }}
                                    >
                                      <Truck className="h-4 w-4" />
                                      Sevkiyatı Görüntüle
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onSelect={() => setQuickAction({ type: 'shipment', invoice })}
                                    disabled={invoice.status !== 'PAID' || invoice.status === 'SHIPPED'}
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
                    className={`bg-white rounded-lg border p-4 shadow-sm ${isLocked
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
                              // ✅ SENT durumuna geçerken onay iste (satış faturaları için sevkiyat oluşturulacak)
                              if (newStatus === 'SENT') {
                                const invoiceType = invoice.invoiceType || 'SALES'
                                const hasProducts = invoice.invoiceItems?.length > 0 || invoice.items?.length > 0
                                
                                if (invoiceType === 'SALES' && hasProducts) {
                                  const confirmed = await confirm({
                                    title: 'Faturayı Göndermek İstediğinize Emin Misiniz?',
                                    description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturasını gönderdiğinizde otomatik olarak şu işlemler yapılacak:\n\n• Sevkiyat kaydı oluşturulacak (PENDING durumunda)\n• Sevkiyat numarası atanacak\n• Müşteri adresi sevkiyat adresi olarak ayarlanacak\n• Teslimat tarihi belirlenecek (vade tarihinden 3 gün sonra)\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                    confirmLabel: 'Evet, Gönder',
                                    cancelLabel: 'İptal',
                                    variant: 'default'
                                  })
                                  
                                  if (!confirmed) {
                                    return // İşlemi iptal et
                                  }
                                }
                              }

                              // ✅ PAID durumuna geçerken onay iste
                              if (newStatus === 'PAID') {
                                const invoiceValue = getInvoiceValue(invoice)
                                const confirmed = await confirm({
                                  title: 'Faturayı Ödendi Olarak İşaretlemek İstediğinize Emin Misiniz?',
                                  description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturasını ödendi olarak işaretlediğinizde otomatik olarak şu işlemler yapılacak:\n\n• Finance kaydı oluşturulacak (GELİR - ${formatCurrency(invoiceValue)})\n• Finans raporları güncellenecek\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                  confirmLabel: 'Evet, Ödendi Olarak İşaretle',
                                  cancelLabel: 'İptal',
                                  variant: 'default'
                                })
                                
                                if (!confirmed) {
                                  return // İşlemi iptal et
                                }
                              }

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
                                const automation = updatedInvoice?.automation || {}

                                await Promise.all([
                                  mutate('/api/invoices', undefined, { revalidate: true }),
                                  mutate('/api/invoices?', undefined, { revalidate: true }),
                                ])

                                // ✅ Detaylı toast mesajı
                                if (newStatus === 'SENT') {
                                  toast.success('📤 Fatura Gönderildi!', {
                                    description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası gönderildi.\n\nOtomatik işlemler:\n${automation.shipmentCreated && automation.shipmentId ? `• Sevkiyat kaydı oluşturuldu (ID: ${automation.shipmentId.substring(0, 8)}...)\n• Sevkiyat numarası atandı\n• Müşteri adresi sevkiyat adresi olarak ayarlandı\n• Teslimat tarihi belirlendi\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                  })
                                } else if (newStatus === 'PAID') {
                                  const invoiceAmount = updatedInvoice?.totalAmount || 0
                                  toast.success('💰 Fatura Ödendi!', {
                                    description: `"${invoice.title || invoice.invoiceNumber || 'Fatura'}" faturası ödendi olarak işaretlendi.\n\nOtomatik işlemler:\n${automation.financeCreated ? `• Finance kaydı oluşturuldu (ID: ${automation.financeId?.substring(0, 8)}...)\n• Gelir kaydı eklendi (${formatCurrency(invoiceAmount)})\n• Finans raporları güncellendi\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                  })
                                } else {
                                toast.success('Durum güncellendi', { description: `Fatura "${statusLabels[newStatus] || newStatus}" durumuna taşındı.` })
                                }
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
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
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
            // Kanban cache'ini güncelle
            await mutateKanban({ kanban: updatedKanbanData }, { revalidate: false })
            await mutate(kanbanApiUrl || '/api/analytics/invoice-kanban', { kanban: updatedKanbanData }, { revalidate: false })
          }

          // Hem table hem kanban view için cache'leri invalidate et
          // ÖNEMLİ: Dashboard'daki tüm ilgili cache'leri invalidate et (ana sayfada güncellensin)
          await Promise.all([
            mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }), // Dashboard'daki kanban chart'ı güncelle
            mutate('/api/analytics/kpis', undefined, { revalidate: true }), // Dashboard'daki KPIs güncelle
            mutateKanban(undefined, { revalidate: true }),
            mutateInvoices(undefined, { revalidate: true }),
          ])

          // Ekstra güvence: 500ms sonra tekrar refetch (sayfa yenilendiğinde kesinlikle fresh data gelsin)
          setTimeout(async () => {
            await Promise.all([
              mutateInvoices(undefined, { revalidate: true }),
              mutateKanban(undefined, { revalidate: true }),
              mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }),
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
        invoice={quickAction?.invoice} // ✅ ÇÖZÜM: Invoice objesini direkt geç - API çağrısı yapmadan
        customerCompanyId={quickAction?.invoice.companyId}
      />
      <TaskForm
        open={quickAction?.type === 'task'}
        onClose={closeQuickAction}
        onSuccess={async (savedTask) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        defaultTitle={quickAction?.invoice.title}
        invoice={quickAction?.invoice} // ✅ ÇÖZÜM: Invoice objesini direkt geç - API çağrısı yapmadan
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        invoiceId={quickAction?.invoice.id}
        invoice={quickAction?.invoice} // ✅ ÇÖZÜM: Invoice objesini direkt geç - API çağrısı yapmadan
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
