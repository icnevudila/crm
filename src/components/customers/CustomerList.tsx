'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, Upload, Download, CheckSquare, Square, Building2, Sparkles, Briefcase, FileText, Receipt, Calendar, Send } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Checkbox } from '@/components/ui/checkbox'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import EmptyState from '@/components/ui/EmptyState'
import BulkActions from '@/components/ui/BulkActions'
import Pagination from '@/components/ui/Pagination'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import RefreshButton from '@/components/ui/RefreshButton'
import dynamic from 'next/dynamic'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import QuickFilters from '@/components/filters/QuickFilters'
import FilterChips from '@/components/filters/FilterChips'
import CompactListView, { CompactListItem } from '@/components/layout/CompactListView'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('./CustomerForm'), {
  ssr: false,
  loading: () => null,
})
const CustomerDetailModal = dynamic(() => import('./CustomerDetailModal'), {
  ssr: false,
  loading: () => null,
})
const DealForm = dynamic(() => import('../deals/DealForm'), {
  ssr: false,
  loading: () => null,
})
const QuoteForm = dynamic(() => import('../quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})
const InvoiceForm = dynamic(() => import('../invoices/InvoiceForm'), {
  ssr: false,
  loading: () => null,
})
const TaskForm = dynamic(() => import('../tasks/TaskForm'), {
  ssr: false,
  loading: () => null,
})
const MeetingForm = dynamic(() => import('../meetings/MeetingForm'), {
  ssr: false,
  loading: () => null,
})
const ContextualWizard = dynamic(() => import('../dashboard/ContextualWizard'), {
  ssr: false,
  loading: () => null,
})
const BulkSendDialog = dynamic(() => import('../integrations/BulkSendDialog'), {
  ssr: false,
  loading: () => null,
})

interface CustomerListProps {
  isOpen?: boolean
}

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  sector?: string
  status: string
  createdAt: string
  companyId?: string
  customerCompanyId?: string
  logoUrl?: string
  Company?: {
    id: string
    name: string
  }
  CustomerCompany?: {
    id: string
    name: string
    sector?: string
    city?: string
  }
}

interface CustomersResponse {
  data: Customer[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export default function CustomerList({ isOpen = true }: CustomerListProps) {
  const locale = useLocale()
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { confirm } = useConfirm()

  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  // URL parametrelerinden filtreleri oku
  const cityFromUrl = searchParams.get('city') || ''
  const sectorFromUrl = searchParams.get('sector') || ''

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sector, setSector] = useState(sectorFromUrl)
  const [city, setCity] = useState(cityFromUrl)
  const [customerCompanyId, setCustomerCompanyId] = useState('') // Müşteri firması filtresi
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi

  // Mevcut filtreleri obje olarak topla
  const currentFilters = useMemo(() => {
    const filters: Record<string, any> = {}
    if (status) filters.status = status
    if (sector) filters.sector = sector
    if (city) filters.city = city
    if (customerCompanyId) filters.customerCompanyId = customerCompanyId
    if (isSuperAdmin && filterCompanyId) filters.filterCompanyId = filterCompanyId
    return filters
  }, [status, sector, city, customerCompanyId, isSuperAdmin, filterCompanyId])

  // Filtre değişikliği handler'ı
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setStatus(newFilters.status || '')
    setSector(newFilters.sector || '')
    setCity(newFilters.city || '')
    setCustomerCompanyId(newFilters.customerCompanyId || '')
    if (isSuperAdmin) {
      setFilterCompanyId(newFilters.filterCompanyId || '')
    }
    setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
  }, [isSuperAdmin])

  // Filtre kaldır
  const handleRemoveFilter = useCallback((key: string) => {
    if (key === 'status') setStatus('')
    else if (key === 'sector') setSector('')
    else if (key === 'city') setCity('')
    else if (key === 'customerCompanyId') setCustomerCompanyId('')
    else if (key === 'filterCompanyId') setFilterCompanyId('')
    setCurrentPage(1)
  }, [])

  // Tüm filtreleri temizle
  const handleClearAllFilters = useCallback(() => {
    setStatus('')
    setSector('')
    setCity('')
    setCustomerCompanyId('')
    setFilterCompanyId('')
    setCurrentPage(1)
  }, [])

  // State tanımlamaları - useEffect'lerden önce olmalı
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [quickAction, setQuickAction] = useState<{ type: 'deal' | 'quote' | 'invoice' | 'task' | 'meeting'; customer: Customer } | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomerData, setSelectedCustomerData] = useState<Customer | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Contextual wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [bulkSendOpen, setBulkSendOpen] = useState(false)

  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isOpen && isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) =>
    index === self.findIndex((c) => c.id === company.id)
  )

  // URL'den gelen parametreleri state'e set et
  useEffect(() => {
    if (cityFromUrl && cityFromUrl !== city) {
      setCity(cityFromUrl)
    }
    if (sectorFromUrl && sectorFromUrl !== sector) {
      setSector(sectorFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityFromUrl, sectorFromUrl, city, sector]) // URL parametrelerini ve state değişikliklerini dinle

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz

    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme (repo kurallarına uygun) - debounced search kullanıyoruz
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (sector) params.append('sector', sector)
    if (city) params.append('city', city)
    if (customerCompanyId) params.append('customerCompanyId', customerCompanyId)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())

    return `/api/customers?${params.toString()}`
  }, [
    isOpen,
    debouncedSearch,
    status,
    sector,
    city,
    customerCompanyId,
    isSuperAdmin,
    filterCompanyId,
    currentPage,
    pageSize,
  ])

  const { data: response, isLoading, error, mutate: mutateCustomers } = useData<CustomersResponse | Customer[]>(apiUrl, {
    dedupingInterval: 60000, // 60 saniye cache (performans için)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma (instant navigation)
    refreshInterval: 0, // Otomatik refresh yok
  })

  // API'den gelen response formatını kontrol et - hem { data: [...], pagination: {...} } hem de direkt array olabilir
  const { customers, pagination } = useMemo(() => {
    let customersData: Customer[] = []
    let paginationData = {
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 1,
    }

    if (response) {
      // Eğer response direkt array ise
      if (Array.isArray(response)) {
        customersData = response
      }
      // Eğer response { data: [...], pagination: {...} } formatında ise
      else if (response && typeof response === 'object' && 'data' in response) {
        const responseData = (response as CustomersResponse).data
        customersData = Array.isArray(responseData) ? responseData : []
        paginationData = (response as CustomersResponse).pagination || paginationData
      }
      // Eğer response { customers: [...] } formatında ise (bazı API'ler böyle dönebilir)
      else if (response && typeof response === 'object' && 'customers' in response) {
        const responseCustomers = (response as any).customers
        customersData = Array.isArray(responseCustomers) ? responseCustomers : []
      }
    }

    return {
      customers: customersData,
      pagination: paginationData,
    }
  }, [response])

  // İlk müşteri yoksa wizard'ı aç (customers tanımından sonra)
  useEffect(() => {
    if (!isOpen) return
    if (!isLoading && customers.length === 0 && !search && !status && !sector && !city) {
      const wizardCompleted = localStorage.getItem('contextual-wizard-first-customer-completed')
      if (!wizardCompleted) {
        // 1 saniye sonra wizard'ı aç (sayfa yüklendikten sonra)
        const timer = setTimeout(() => {
          setWizardOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, isLoading, customers.length, search, status, sector, city])

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateCustomers(undefined, { revalidate: true }),
      mutate('/api/customers', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/customers', undefined, { revalidate: true }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
    ])
  }

  // NOT: apiUrl currentPage'e bağlı olduğu için SWR otomatik refetch yapıyor
  // currentPage değiştiğinde apiUrl değişir ve SWR yeni URL'i otomatik fetch eder
  // Bu useEffect'e gerek yok, ama yine de ekstra güvence için bırakıyoruz (sadece log için)

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>(isOpen ? '/api/stats/customers' : null, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!(await confirm({
      title: t('deleteConfirmTitle', { name }),
      description: t('deleteConfirmMessage'),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      variant: 'destructive'
    }))) {
      return
    }

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete customer')
      }

      // Optimistic update - silinen kaydı listeden kaldır
      const updatedCustomers = customers.filter((c) => c.id !== id)
      const updatedPagination = {
        ...pagination,
        totalItems: pagination.totalItems - 1,
        totalPages: Math.ceil((pagination.totalItems - 1) / pagination.pageSize),
      }

      // Eğer sayfa boşaldıysa, önceki sayfaya git
      if (updatedCustomers.length === 0 && pagination.page > 1) {
        setCurrentPage(pagination.page - 1)
      }

      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateCustomers(
        {
          data: updatedCustomers,
          pagination: updatedPagination,
        },
        { revalidate: false }
      )

      // Tüm diğer customer URL'lerini de güncelle
      await Promise.all([
        mutate('/api/customers', {
          data: updatedCustomers,
          pagination: updatedPagination,
        }, { revalidate: false }),
        mutate('/api/customers?', {
          data: updatedCustomers,
          pagination: updatedPagination,
        }, { revalidate: false }),
        apiUrl
          ? mutate(apiUrl, {
            data: updatedCustomers,
            pagination: updatedPagination,
          }, { revalidate: false })
          : Promise.resolve(),
        // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle (silinen müşteri grafikten çıkarılmalı)
        queryClient.invalidateQueries({ queryKey: ['distribution'] }),
      ])

      // Dashboard'daki distribution query'sini refetch et
      await queryClient.refetchQueries({ queryKey: ['distribution'] })
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(tCommon('error'), { description: error?.message || 'Bir hata oluştu' })
    }
  }, [customers, pagination, mutateCustomers, apiUrl, queryClient, t, tCommon])

  const handleEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer)
    setFormOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setSelectedCustomer(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedCustomer(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
  }, [])

  const closeQuickAction = useCallback(() => {
    setQuickAction(null)
  }, [])

  // Bulk operations handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedIds(customers.map((c) => c.id))
    } else {
      setSelectedIds([])
    }
  }, [customers])

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
      const res = await fetch('/api/customers/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to bulk delete customers')
      }

      // Optimistic update - silinen kayıtları listeden kaldır
      const updatedCustomers = customers.filter((c) => !ids.includes(c.id))

      // Cache'i güncelle
      await mutateCustomers(
        {
          data: updatedCustomers,
          pagination: {
            ...pagination,
            totalItems: pagination.totalItems - ids.length,
          },
        },
        { revalidate: false }
      )

      // Tüm diğer customer URL'lerini de güncelle
      await Promise.all([
        mutate('/api/customers', {
          data: updatedCustomers,
          pagination: {
            ...pagination,
            totalItems: pagination.totalItems - ids.length,
          },
        }, { revalidate: false }),
        apiUrl
          ? mutate(apiUrl, {
            data: updatedCustomers,
            pagination: {
              ...pagination,
              totalItems: pagination.totalItems - ids.length,
            },
          }, { revalidate: false })
          : Promise.resolve(),
        // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle (silinen müşteriler grafikten çıkarılmalı)
        queryClient.invalidateQueries({ queryKey: ['distribution'] }),
      ])

      // Dashboard'daki distribution query'sini refetch et
      await queryClient.refetchQueries({ queryKey: ['distribution'] })

      setSelectedIds([])
      setSelectAll(false)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Bulk delete error:', error)
      }
      throw error
    }
  }, [customers, pagination, mutateCustomers, apiUrl, queryClient])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [])

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    setSelectedIds([])
    setSelectAll(false)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
    setSelectedIds([])
    setSelectAll(false)
  }, [])

  // Import handlers
  const handleImport = useCallback(async () => {
    if (!importFile) {
      toast.warning(t('noFileSelected'), { description: t('noFileSelectedMessage') || 'Lütfen bir dosya seçin' })
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const res = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || t('importFailed'))
      }

      const result = await res.json()
      toast.success(t('fileUploaded'), { description: t('customersImported', { count: result.importedCount }) })

      // Cache'i invalidate et - yeni verileri çek
      await Promise.all([
        mutateCustomers(undefined, { revalidate: true }),
        apiUrl,
        // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle (yeni import edilen müşteriler grafikte görünmeli)
        queryClient.invalidateQueries({ queryKey: ['distribution'] }),
      ])

      // Dashboard'daki distribution query'sini refetch et
      await queryClient.refetchQueries({ queryKey: ['distribution'] })

      setImportOpen(false)
      setImportFile(null)
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(t('importFailed'), { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setImporting(false)
    }
  }, [importFile, mutateCustomers, apiUrl, queryClient])

  // Export handler
  const handleExport = useCallback(async (format: 'excel' | 'csv') => {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (status) params.append('status', status)
      if (sector) params.append('sector', sector)
      params.append('format', format)

      const res = await fetch(`/api/customers/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${t('customersFileName')}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(t('exportFailed'), { description: t('exportFailedMessage') || 'Dışa aktarma işlemi başarısız oldu' })
    }
  }, [debouncedSearch, status, sector])

  // Select all checkbox kontrolü
  useEffect(() => {
    if (customers.length > 0 && selectedIds.length === customers.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedIds, customers])

  if (!isOpen) {
    return null
  }

  if (isLoading) {
    return <SkeletonList />
  }

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="customers" statsUrl="/api/stats/customers" />

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg ring-4 ring-indigo-100/50"
            >
              <Users className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 font-medium">
                {t('totalCustomers', { count: stats?.total || pagination.totalItems || customers.length })}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <RefreshButton onRefresh={handleRefresh} />
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                aria-label={t('import')}
                className="flex-1 sm:flex-initial"
              >
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('import')}</span>
                <span className="sm:hidden">İçe Aktar</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('excel')}
                aria-label={t('export')}
                className="flex-1 sm:flex-initial"
              >
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('export')}</span>
                <span className="sm:hidden">Dışa Aktar</span>
              </Button>
            </div>
            <Button
              onClick={handleAdd}
              className="bg-gradient-primary text-white w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('newCustomer')}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Filters & Filter Chips */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <QuickFilters
            module="customers"
            currentFilters={currentFilters}
            onFilterChange={handleFilterChange}
            quickFilterOptions={[]}
          />
        </div>
        <FilterChips
          filters={currentFilters}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          labels={{
            status: t('status'),
            sector: t('sector'),
            city: t('city'),
            customerCompanyId: t('customerCompany'),
            filterCompanyId: t('company'),
          }}
        />
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
          <Select value={filterCompanyId || 'all'} onValueChange={(value) => setFilterCompanyId(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('selectCompany')} />
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
        )}
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('active')}</SelectItem>
            <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sector || 'all'} onValueChange={(value) => setSector(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t('selectSector')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allSectors')}</SelectItem>
            <SelectItem value="Teknoloji">Teknoloji</SelectItem>
            <SelectItem value="Sağlık">Sağlık</SelectItem>
            <SelectItem value="Eğitim">Eğitim</SelectItem>
            <SelectItem value="İnşaat">İnşaat</SelectItem>
            <SelectItem value="Otomotiv">Otomotiv</SelectItem>
            <SelectItem value="Gıda">Gıda</SelectItem>
            <SelectItem value="Tekstil">Tekstil</SelectItem>
            <SelectItem value="Enerji">Enerji</SelectItem>
            <SelectItem value="Finans">Finans</SelectItem>
            <SelectItem value="Turizm">Turizm</SelectItem>
            <SelectItem value="Lojistik">Lojistik</SelectItem>
            <SelectItem value="Medya">Medya</SelectItem>
            <SelectItem value="Danışmanlık">Danışmanlık</SelectItem>
            <SelectItem value="E-ticaret">E-ticaret</SelectItem>
            <SelectItem value="İmalat">İmalat</SelectItem>
            <SelectItem value="Ticaret">Ticaret</SelectItem>
            <SelectItem value="Diğer">Diğer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="space-y-2">
          <BulkActions
            selectedIds={selectedIds}
            onBulkDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
            itemName={t('title').toLowerCase()}
          />
          <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
              {selectedIds.length} seçili
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkSendOpen(true)}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              <Send className="h-4 w-4 mr-2" />
              Toplu Mesaj Gönder
            </Button>
          </div>
        </div>
      )}

      {/* Kompakt Liste Görünümü - Monday.com tarzı */}
      <div className="space-y-2">
        {/* Select All Checkbox */}
        {handleSelectAll && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-200">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              aria-label={t('selectAll')}
            />
            <span className="text-xs text-gray-600 font-medium">
              {selectedIds.length > 0 ? `${selectedIds.length} seçili` : 'Tümünü seç'}
            </span>
          </div>
        )}

        <CompactListView
          items={customers.map((customer): CompactListItem => ({
            id: customer.id,
            title: customer.name,
            subtitle: customer.sector || customer.city || undefined,
            imageUrl: customer.logoUrl,
            badges: [
              ...(customer.sector
                ? [
                  {
                    label: customer.sector,
                    variant: 'outline' as const,
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                  },
                ]
                : []),
              {
                label: customer.status === 'ACTIVE' ? t('active') : t('inactive'),
                variant: 'outline' as const,
                className:
                  customer.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-red-100 text-red-800 border-red-200',
              },
              ...(isSuperAdmin && customer.Company?.name
                ? [
                  {
                    label: customer.Company.name,
                    variant: 'outline' as const,
                    className: 'bg-purple-50 text-purple-700 border-purple-200',
                  },
                ]
                : []),
            ],
            metadata: [
              ...(customer.email ? [{ label: 'E-posta', value: customer.email }] : []),
              ...(customer.phone ? [{ label: 'Telefon', value: customer.phone }] : []),
              ...(customer.city ? [{ label: 'Şehir', value: customer.city }] : []),
            ],
            actions: [
              {
                label: t('quickActions.createDeal'),
                icon: <Briefcase className="h-4 w-4" />,
                onClick: () => setQuickAction({ type: 'deal', customer }),
              },
              {
                label: t('quickActions.createQuote'),
                icon: <FileText className="h-4 w-4" />,
                onClick: () => setQuickAction({ type: 'quote', customer }),
              },
              {
                label: t('quickActions.createInvoice'),
                icon: <Receipt className="h-4 w-4" />,
                onClick: () => setQuickAction({ type: 'invoice', customer }),
              },
            ],
            onView: () => {
              setSelectedCustomerId(customer.id)
              setSelectedCustomerData(customer)
              setDetailModalOpen(true)
            },
            onEdit: () => handleEdit(customer),
            onDelete: () => handleDelete(customer.id, customer.name),
          }))}
          selectedIds={selectedIds}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          selectAll={selectAll}
          emptyState={{
            icon: <Users className="h-12 w-12" />,
            title: t('emptyStateTitle'),
            description: t('emptyStateDescription'),
            action: {
              label: t('emptyStateButton'),
              onClick: handleAdd,
            },
          }}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pt-2">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('importTitle')}</DialogTitle>
            <DialogDescription>
              {t('importDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                disabled={importing}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setImportOpen(false)
                  setImportFile(null)
                }}
                disabled={importing}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="bg-gradient-primary text-white"
              >
                {importing ? t('importing') : t('importButton')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedCustomerId(null)
          setSelectedCustomerData(null)
        }}
        initialData={selectedCustomerData || undefined}
      />

      {/* Form Modal */}
      <CustomerForm
        customer={selectedCustomer || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedCustomer: Customer) => {
          // Form'u kapat
          setFormOpen(false)
          setSelectedCustomer(null)

          if (selectedCustomer) {
            // UPDATE: Mevcut kaydı güncelle
            const updatedCustomers = customers.map((c) =>
              c.id === savedCustomer.id ? savedCustomer : c
            )

            // Optimistic update - cache'i güncelle
            await mutateCustomers(
              {
                data: updatedCustomers,
                pagination: pagination,
              },
              { revalidate: false }
            )

            // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle (sektör değişmiş olabilir)
            await queryClient.invalidateQueries({ queryKey: ['distribution'] })
            await queryClient.refetchQueries({ queryKey: ['distribution'] })

            // Background refetch yap
            setTimeout(async () => {
              await Promise.all([
                mutateCustomers(undefined, { revalidate: true }),
                apiUrl,
                // Dashboard'daki müşteri sektör dağılımı grafiğini tekrar güncelle
                queryClient.refetchQueries({ queryKey: ['distribution'] }),
              ])
            }, 500)
          } else {
            // CREATE: Yeni kayıt oluşturuldu
            // Yeni kayıt her zaman 1. sayfada olmalı (createdAt DESC sıralamasına göre)

            // 1. sayfa için yeni URL oluştur
            const firstPageParams = new URLSearchParams()
            if (debouncedSearch) firstPageParams.append('search', debouncedSearch)
            if (status) firstPageParams.append('status', status)
            if (sector) firstPageParams.append('sector', sector)
            if (customerCompanyId) firstPageParams.append('customerCompanyId', customerCompanyId)
            firstPageParams.append('page', '1')
            firstPageParams.append('pageSize', pageSize.toString())

            const firstPageUrl = `/api/customers?${firstPageParams.toString()}`

            // ÖNCE tüm cache'i temizle ve 1. sayfayı refetch et
            await Promise.all([
              mutate('/api/customers', undefined, { revalidate: true }),
              mutate('/api/customers?', undefined, { revalidate: true }),
              apiUrl,
              mutate(firstPageUrl, undefined, { revalidate: true }),
              // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle
              queryClient.invalidateQueries({ queryKey: ['distribution'] }),
            ])

            // Dashboard'daki distribution query'sini refetch et
            await queryClient.refetchQueries({ queryKey: ['distribution'] })

            // SONRA 1. sayfaya geç (apiUrl değişir ve SWR otomatik refetch yapar)
            setCurrentPage(1)

            // Ekstra güvence: 500ms sonra tekrar refetch (sayfa yenilendiğinde kesinlikle fresh data gelsin)
            setTimeout(async () => {
              await Promise.all([
                mutate(firstPageUrl, undefined, { revalidate: true }),
                mutateCustomers(undefined, { revalidate: true }),
                // Dashboard'daki müşteri sektör dağılımı grafiğini tekrar güncelle
                queryClient.refetchQueries({ queryKey: ['distribution'] }),
              ])
            }, 500)
          }
        }}
      />

      {/* Quick Action Forms */}
      <DealForm
        open={quickAction?.type === 'deal'}
        onClose={closeQuickAction}
        onSuccess={async (savedDeal) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <QuoteForm
        open={quickAction?.type === 'quote'}
        onClose={closeQuickAction}
        onSuccess={async (savedQuote) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <InvoiceForm
        open={quickAction?.type === 'invoice'}
        onClose={closeQuickAction}
        onSuccess={async (savedInvoice) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <TaskForm
        open={quickAction?.type === 'task'}
        onClose={closeQuickAction}
        onSuccess={async (savedTask) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerName={quickAction?.customer.name}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />

      {/* Contextual Wizard - İlk müşteri yoksa */}
      <ContextualWizard
        trigger="first-customer"
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      <BulkSendDialog
        open={bulkSendOpen}
        onClose={() => setBulkSendOpen(false)}
        customers={customers}
        selectedCustomerIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([])
          setSelectAll(false)
        }}
      />
    </div>
  )
}
