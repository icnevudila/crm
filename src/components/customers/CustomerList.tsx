'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Eye, Upload, Download, CheckSquare, Square, Building2, Sparkles, Briefcase, FileText, Receipt, Calendar } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useQueryClient } from '@tanstack/react-query'
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
import dynamic from 'next/dynamic'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  }, [cityFromUrl, sectorFromUrl, city, sector])
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

  // NOT: apiUrl currentPage'e bağlı olduğu için SWR otomatik refetch yapıyor
  // currentPage değiştiğinde apiUrl değişir ve SWR yeni URL'i otomatik fetch eder
  // Bu useEffect'e gerek yok, ama yine de ekstra güvence için bırakıyoruz (sadece log için)

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

    // Güvenlik kontrolü - customers her zaman array olmalı
    if (!Array.isArray(customersData)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('CustomerList: customers is not an array, defaulting to empty array', { response, customersData })
      }
      customersData = []
    }

    return { customers: customersData, pagination: paginationData }
  }, [response])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>(isOpen ? '/api/stats/customers' : null, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!(await confirm(t('deleteConfirm', { name })))) {
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
      toast.error(tCommon('error'), error?.message)
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
      toast.warning(t('noFileSelected'))
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
      toast.success(t('fileUploaded'), t('customersImported', { count: result.importedCount }))

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
      toast.error(t('importFailed'), error?.message)
    } finally{
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
      toast.error(t('exportFailed'))
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('totalCustomers', { count: stats?.total || pagination.totalItems || customers.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            aria-label={t('import')}
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('import')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            aria-label={t('export')}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('export')}
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newCustomer')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(value) => setFilterCompanyId(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('active')}</SelectItem>
            <SelectItem value="INACTIVE">{t('inactive')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sector || 'all'} onValueChange={(value) => setSector(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-48">
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
        <BulkActions
          selectedIds={selectedIds}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          itemName={t('title').toLowerCase()}
        />
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label={t('selectAll')}
                />
              </TableHead>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              {isSuperAdmin && <TableHead>{t('company')}</TableHead>}
              <TableHead>{t('tableHeaders.email')}</TableHead>
              <TableHead>{t('tableHeaders.phone')}</TableHead>
              <TableHead>{t('tableHeaders.city')}</TableHead>
              <TableHead>{t('tableHeaders.sector')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 9 : 8} className="p-0">
                  <EmptyState
                    icon={Users}
                    title={t('emptyStateTitle')}
                    description={t('emptyStateDescription')}
                    action={{
                      label: t('emptyStateButton'),
                      onClick: handleAdd,
                    }}
                    className="border-0 shadow-none"
                  />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(customer.id)}
                      onCheckedChange={(checked) => handleSelectItem(customer.id, checked as boolean)}
                      aria-label={t('selectCustomer', { name: customer.name })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {customer.logoUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                          <Image
                            src={customer.logoUrl}
                            alt={customer.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized={customer.logoUrl.startsWith('blob:') || customer.logoUrl.startsWith('data:')}
                          />
                        </div>
                      )}
                      <span>{customer.name}</span>
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {customer.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{customer.city || '-'}</TableCell>
                  <TableCell>
                    {customer.sector ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {customer.sector}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        customer.status === 'ACTIVE'
                          ? 'bg-green-600 text-white border-green-700'
                          : 'bg-red-600 text-white border-red-700'
                      }
                    >
                      {customer.status === 'ACTIVE' ? t('active') : t('inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('quickActions.open', { name: customer.name })}
                          >
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{t('quickActions.title')}</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'deal', customer })}
                          >
                            <Briefcase className="h-4 w-4" />
                            {t('quickActions.createDeal')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'quote', customer })}
                          >
                            <FileText className="h-4 w-4" />
                            {t('quickActions.createQuote')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'invoice', customer })}
                          >
                            <Receipt className="h-4 w-4" />
                            {t('quickActions.createInvoice')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'task', customer })}
                          >
                            <CheckSquare className="h-4 w-4" />
                            {t('quickActions.createTask')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'meeting', customer })}
                          >
                            <Calendar className="h-4 w-4" />
                            {t('quickActions.scheduleMeeting')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCustomerId(customer.id)
                          setSelectedCustomerData(customer) // Liste sayfasÄ±ndaki veriyi hemen gÃ¶ster (hÄ±zlÄ± aÃ§Ä±lÄ±ÅŸ)
                          setDetailModalOpen(true)
                        }}
                        aria-label={t('viewCustomer', { name: customer.name })}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(customer)}
                        aria-label={t('editCustomer', { name: customer.name })}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={t('deleteCustomer', { name: customer.name })}
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
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
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
            // UPDATE: Mevcut kaydÄ± gÃ¼ncelle
            const updatedCustomers = customers.map((c) =>
              c.id === savedCustomer.id ? savedCustomer : c
            )
            
            // Optimistic update - cache'i gÃ¼ncelle
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
                // Dashboard'daki mÃ¼ÅŸteri sektÃ¶r daÄŸÄ±lÄ±mÄ± grafiÄŸini tekrar gÃ¼ncelle
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
            
            // Ã–NCE tÃ¼m cache'i temizle ve 1. sayfayÄ± refetch et
            await Promise.all([
              mutate('/api/customers', undefined, { revalidate: true }),
              mutate('/api/customers?', undefined, { revalidate: true }),
              apiUrl,
              mutate(firstPageUrl, undefined, { revalidate: true }),
              // Dashboard'daki mÃ¼ÅŸteri sektÃ¶r daÄŸÄ±lÄ±mÄ± grafiÄŸini gÃ¼ncelle
              queryClient.invalidateQueries({ queryKey: ['distribution'] }),
            ])
            
            // Dashboard'daki distribution query'sini refetch et
            await queryClient.refetchQueries({ queryKey: ['distribution'] })
            
            // SONRA 1. sayfaya geÃ§ (apiUrl deÄŸiÅŸir ve SWR otomatik refetch yapar)
            setCurrentPage(1)
            
            // Ekstra gÃ¼vence: 500ms sonra tekrar refetch (sayfa yenilendiÄŸinde kesinlikle fresh data gelsin)
            setTimeout(async () => {
              await Promise.all([
                mutate(firstPageUrl, undefined, { revalidate: true }),
                mutateCustomers(undefined, { revalidate: true }),
                // Dashboard'daki mÃ¼ÅŸteri sektÃ¶r daÄŸÄ±lÄ±mÄ± grafiÄŸini tekrar gÃ¼ncelle
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
          // CRITICAL FIX: onSuccess iÃ§inde closeQuickAction Ã§aÄŸrÄ±lmasÄ±n
          // Form zaten kendi iÃ§inde onClose() Ã§aÄŸÄ±rÄ±yor, bu da closeQuickAction'Ä± tetikliyor
          // closeQuickAction() tekrar Ã§aÄŸrÄ±lÄ±rsa sonsuz dÃ¶ngÃ¼ oluÅŸur (Maximum update depth exceeded)
          // Form baÅŸarÄ±yla kaydedildi - form'un kendi onClose'u closeQuickAction'Ä± zaten Ã§aÄŸÄ±racak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <QuoteForm
        open={quickAction?.type === 'quote'}
        onClose={closeQuickAction}
        onSuccess={async (savedQuote) => {
          // CRITICAL FIX: onSuccess iÃ§inde closeQuickAction Ã§aÄŸrÄ±lmasÄ±n
          // Form zaten kendi iÃ§inde onClose() Ã§aÄŸÄ±rÄ±yor, bu da closeQuickAction'Ä± tetikliyor
          // closeQuickAction() tekrar Ã§aÄŸrÄ±lÄ±rsa sonsuz dÃ¶ngÃ¼ oluÅŸur (Maximum update depth exceeded)
          // Form baÅŸarÄ±yla kaydedildi - form'un kendi onClose'u closeQuickAction'Ä± zaten Ã§aÄŸÄ±racak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <InvoiceForm
        open={quickAction?.type === 'invoice'}
        onClose={closeQuickAction}
        onSuccess={async (savedInvoice) => {
          // CRITICAL FIX: onSuccess iÃ§inde closeQuickAction Ã§aÄŸrÄ±lmasÄ±n
          // Form zaten kendi iÃ§inde onClose() Ã§aÄŸÄ±rÄ±yor, bu da closeQuickAction'Ä± tetikliyor
          // closeQuickAction() tekrar Ã§aÄŸrÄ±lÄ±rsa sonsuz dÃ¶ngÃ¼ oluÅŸur (Maximum update depth exceeded)
          // Form baÅŸarÄ±yla kaydedildi - form'un kendi onClose'u closeQuickAction'Ä± zaten Ã§aÄŸÄ±racak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
      <TaskForm
        open={quickAction?.type === 'task'}
        onClose={closeQuickAction}
        onSuccess={async (savedTask) => {
          // CRITICAL FIX: onSuccess iÃ§inde closeQuickAction Ã§aÄŸrÄ±lmasÄ±n
          // Form zaten kendi iÃ§inde onClose() Ã§aÄŸÄ±rÄ±yor, bu da closeQuickAction'Ä± tetikliyor
          // closeQuickAction() tekrar Ã§aÄŸrÄ±lÄ±rsa sonsuz dÃ¶ngÃ¼ oluÅŸur (Maximum update depth exceeded)
          // Form baÅŸarÄ±yla kaydedildi - form'un kendi onClose'u closeQuickAction'Ä± zaten Ã§aÄŸÄ±racak
        }}
        customerName={quickAction?.customer.name}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess iÃ§inde closeQuickAction Ã§aÄŸrÄ±lmasÄ±n
          // Form zaten kendi iÃ§inde onClose() Ã§aÄŸÄ±rÄ±yor, bu da closeQuickAction'Ä± tetikliyor
          // closeQuickAction() tekrar Ã§aÄŸrÄ±lÄ±rsa sonsuz dÃ¶ngÃ¼ oluÅŸur (Maximum update depth exceeded)
          // Form baÅŸarÄ±yla kaydedildi - form'un kendi onClose'u closeQuickAction'Ä± zaten Ã§aÄŸÄ±racak
        }}
        customerCompanyId={quickAction?.customer.customerCompanyId}
        customerCompanyName={quickAction?.customer.CustomerCompany?.name}
        customerId={quickAction?.customer.id}
      />
    </div>
  )
}
