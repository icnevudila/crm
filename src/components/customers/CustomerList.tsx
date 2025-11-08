'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Upload, Download, CheckSquare, Square, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('./CustomerForm'), {
  ssr: false,
  loading: () => null,
})

interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  city?: string
  sector?: string
  status: string
  createdAt: string
  customerCompanyId?: string
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

export default function CustomerList() {
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sector, setSector] = useState('')
  const [customerCompanyId, setCustomerCompanyId] = useState('') // Müşteri firması filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
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
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (sector) params.append('sector', sector)
  if (customerCompanyId) params.append('customerCompanyId', customerCompanyId) // Müşteri firması filtresi
  params.append('page', currentPage.toString())
  params.append('pageSize', pageSize.toString())
  
  const apiUrl = `/api/customers?${params.toString()}`
  const { data: response, isLoading, error, mutate: mutateCustomers } = useData<CustomersResponse | Customer[]>(apiUrl, {
    dedupingInterval: 0, // Cache'i kapat - her zaman fresh data çek
    revalidateOnFocus: true, // Focus'ta yeniden fetch yap
    revalidateOnMount: true, // Mount'ta yeniden fetch yap
    revalidateOnReconnect: true, // Reconnect'te yeniden fetch yap
    refreshInterval: 0, // Otomatik refresh yok
    keepPreviousData: false, // Önceki veriyi tutma - fresh data göster
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
  const { data: stats } = useData<any>('/api/stats/customers', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`${name} müşterisini silmek istediğinize emin misiniz?`)) {
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
        mutate(apiUrl, {
          data: updatedCustomers,
          pagination: updatedPagination,
        }, { revalidate: false }),
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
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }, [customers, pagination, mutateCustomers, apiUrl, queryClient])

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
        mutate(apiUrl, {
          data: updatedCustomers,
          pagination: {
            ...pagination,
            totalItems: pagination.totalItems - ids.length,
          },
        }, { revalidate: false }),
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
      alert('Lütfen bir dosya seçin')
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
        throw new Error(errorData.error || 'Import işlemi başarısız oldu')
      }

      const result = await res.json()
      alert(`${result.importedCount} müşteri başarıyla import edildi`)

      // Cache'i invalidate et - yeni verileri çek
      await Promise.all([
        mutateCustomers(undefined, { revalidate: true }),
        mutate(apiUrl, undefined, { revalidate: true }),
        // Dashboard'daki müşteri sektör dağılımı grafiğini güncelle (yeni import edilen müşteriler grafikte görünmeli)
        queryClient.invalidateQueries({ queryKey: ['distribution'] }),
      ])
      
      // Dashboard'daki distribution query'sini refetch et
      await queryClient.refetchQueries({ queryKey: ['distribution'] })

      setImportOpen(false)
      setImportFile(null)
    } catch (error: any) {
      console.error('Import error:', error)
      alert(error?.message || 'Import işlemi başarısız oldu')
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
      a.download = `musteriler.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Export error:', error)
      alert('Export işlemi başarısız oldu')
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
          <h1 className="text-3xl font-bold text-gray-900">Müşteriler</h1>
          <p className="mt-2 text-gray-600">
            Toplam {stats?.total || pagination.totalItems || customers.length} müşteri
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            aria-label="Müşteri import et"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            aria-label="Excel olarak export et"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="İsim, e-posta veya telefon ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sector || 'all'} onValueChange={(value) => setSector(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sektör" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Sektörler</SelectItem>
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
          itemName="müşteri"
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
                  aria-label="Tümünü seç"
                />
              </TableHead>
              <TableHead>İsim</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Şehir</TableHead>
              <TableHead>Sektör</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="Henüz müşteri yok"
                    description="Yeni müşteri ekleyerek başlayın"
                    action={{
                      label: 'Yeni Müşteri Ekle',
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
                      aria-label={`${customer.name} müşterisini seç`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
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
                      variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'}
                    >
                      {customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/customers/${customer.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`${customer.name} müşterisini görüntüle`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(customer)}
                        aria-label={`${customer.name} müşterisini düzenle`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(customer.id, customer.name)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`${customer.name} müşterisini sil`}
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
            <DialogTitle>Müşteri Import Et</DialogTitle>
            <DialogDescription>
              Excel (.xlsx, .xls) veya CSV dosyası yükleyin. Dosya formatı:
              Müşteri Adı, E-posta, Telefon, Şehir, Sektör, Durum
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
                İptal
              </Button>
              <Button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="bg-gradient-primary text-white"
              >
                {importing ? 'Import ediliyor...' : 'Import Et'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                mutate(apiUrl, undefined, { revalidate: true }),
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
              mutate(apiUrl, undefined, { revalidate: true }),
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
    </div>
  )
}
