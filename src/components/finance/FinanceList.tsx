'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Eye, RefreshCw, AlertCircle, Info, Search, Download, Calendar, ArrowUpDown, BarChart3, PieChart, LineChart } from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Pagination from '@/components/ui/Pagination'
import { formatCurrency } from '@/lib/utils'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'

// Lazy load grafikler ve form - performans için
const FinanceForm = dynamic(() => import('./FinanceForm'), {
  ssr: false,
  loading: () => null,
})

const FinanceTrendChart = dynamic(() => import('./charts/FinanceTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const FinanceCategoryChart = dynamic(() => import('./charts/FinanceCategoryChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const FinanceDetailModal = dynamic(() => import('./FinanceDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface FinanceListProps {
  isOpen?: boolean
}

interface Finance {
  id: string
  type: string
  amount: number
  category?: string
  description?: string
  relatedTo?: string
  relatedEntityType?: string
  relatedEntityId?: string
  customerCompanyId?: string
  companyId?: string
  paymentMethod?: string
  paymentDate?: string
  isRecurring?: boolean
  customerCompany?: {
    id: string
    name: string
  }
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

interface CustomerCompany {
  id: string
  name: string
}

export default function FinanceList({ isOpen = true }: FinanceListProps) {
  const locale = useLocale()
  const t = useTranslations('finance')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  
  // Kategori etiketleri - locale desteği ile
  const categoryLabels: Record<string, string> = {
    // Gider kategorileri
    FUEL: t('categoryFuel'),
    ACCOMMODATION: t('categoryAccommodation'),
    FOOD: t('categoryFood'),
    TRANSPORT: t('categoryTransport'),
    OFFICE: t('categoryOffice'),
    MARKETING: t('categoryMarketing'),
    // Gelir kategorileri
    INVOICE_INCOME: t('categoryInvoiceIncome'),
    SERVICE: t('categoryService'),
    PRODUCT_SALE: t('categoryProductSale'),
    OTHER: t('categoryOther'),
  }
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [customerCompanyId, setCustomerCompanyId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCharts, setShowCharts] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedFinance, setSelectedFinance] = useState<Finance | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedFinanceId, setSelectedFinanceId] = useState<string | null>(null)
  const [selectedFinanceData, setSelectedFinanceData] = useState<Finance | null>(null)
  const [missingCount, setMissingCount] = useState<number | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [checking, setChecking] = useState(false) // Kontrol butonu için loading state
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isOpen && isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )
  
  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // Müşteri firmalarını çek (filtreleme için)
  const { data: customerCompanies = [] } = useData<CustomerCompany[]>(
    isOpen ? '/api/customer-companies' : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )

  // SWR ile veri çekme (repo kurallarına uygun) - debounced search kullanıyoruz
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (category) params.append('category', category)
    if (customerCompanyId) params.append('customerCompanyId', customerCompanyId)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/finance?${params.toString()}`
  }, [
    isOpen,
    type,
    category,
    customerCompanyId,
    startDate,
    endDate,
    debouncedSearch,
    isSuperAdmin,
    filterCompanyId,
  ])

  const { data: financeRecords = [], isLoading, error, mutate: mutateFinance } = useData<Finance[]>(
    apiUrl,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  )

  // Filtrelenmiş ve sıralanmış kayıtlar
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = [...financeRecords]
    
    // Sıralama
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      
      if (sortBy === 'date') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      } else if (sortBy === 'amount') {
        aValue = a.amount || 0
        bValue = b.amount || 0
      } else if (sortBy === 'category') {
        aValue = (a.category || '').toLowerCase()
        bValue = (b.category || '').toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }, [financeRecords, sortBy, sortOrder])

  // Pagination için kayıtlar
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredAndSortedRecords.slice(startIndex, endIndex)
  }, [filteredAndSortedRecords, currentPage, pageSize])

  // Pagination bilgileri
  const pagination = useMemo(() => {
    const totalItems = filteredAndSortedRecords.length
    const totalPages = Math.ceil(totalItems / pageSize)
    return {
      page: currentPage,
      totalPages,
      pageSize,
      totalItems,
    }
  }, [filteredAndSortedRecords.length, currentPage, pageSize])

  // Karşılaştırma: Geçen ay vs Bu ay
  const monthlyComparison = useMemo(() => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Bu ay
    const thisMonthStart = new Date(currentYear, currentMonth, 1)
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    
    // Geçen ay
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
    
    const thisMonthRecords = financeRecords.filter((f) => {
      const date = new Date(f.createdAt)
      return date >= thisMonthStart && date <= thisMonthEnd
    })
    
    const lastMonthRecords = financeRecords.filter((f) => {
      const date = new Date(f.createdAt)
      return date >= lastMonthStart && date <= lastMonthEnd
    })
    
    const thisMonthIncome = thisMonthRecords
      .filter((f) => f.type === 'INCOME')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    
    const thisMonthExpense = thisMonthRecords
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    
    const lastMonthIncome = lastMonthRecords
      .filter((f) => f.type === 'INCOME')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    
    const lastMonthExpense = lastMonthRecords
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    
    const incomeChange = lastMonthIncome > 0 
      ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
      : 0
    
    const expenseChange = lastMonthExpense > 0 
      ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100 
      : 0
    
    return {
      thisMonth: {
        income: thisMonthIncome,
        expense: thisMonthExpense,
        net: thisMonthIncome - thisMonthExpense,
      },
      lastMonth: {
        income: lastMonthIncome,
        expense: lastMonthExpense,
        net: lastMonthIncome - lastMonthExpense,
      },
      incomeChange,
      expenseChange,
    }
  }, [financeRecords])

  // Toplam hesaplama - useMemo ile optimize et (detaylı breakdown ile)
  const { totalIncome, totalExpense, netProfit, incomeBreakdown, expenseBreakdown, automationStats } = useMemo(() => {
    const income = financeRecords
      .filter((f) => f.type === 'INCOME')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    const expense = financeRecords
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + (f.amount || 0), 0)
    
    // Kategori bazlı breakdown
    const incomeByCategory: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}
    
    // Otomasyon istatistikleri
    let autoIncomeCount = 0 // Invoice PAID'den otomatik oluşan
    let autoExpenseCount = 0 // Shipment DELIVERED'den otomatik oluşan
    let recurringCount = 0 // Tekrarlayan giderler
    let manualIncomeCount = 0
    let manualExpenseCount = 0
    
    financeRecords.forEach((f) => {
      const category = f.category || 'KATEGORİSİZ'
      const amount = f.amount || 0
      
      if (f.type === 'INCOME') {
        incomeByCategory[category] = (incomeByCategory[category] || 0) + amount
        
        // Otomasyon kontrolü
        if (f.relatedEntityType === 'INVOICE' || f.relatedTo?.includes('Invoice:')) {
          autoIncomeCount++
        } else {
          manualIncomeCount++
        }
      } else {
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount
        
        // Otomasyon kontrolü
        if (f.relatedEntityType === 'SHIPMENT' || f.relatedTo?.includes('Shipment:')) {
          autoExpenseCount++
        } else if (f.isRecurring) {
          recurringCount++
        } else {
          manualExpenseCount++
        }
      }
    })
    
    return {
      totalIncome: income,
      totalExpense: expense,
      netProfit: income - expense,
      incomeBreakdown: incomeByCategory,
      expenseBreakdown: expenseByCategory,
      automationStats: {
        autoIncomeCount,
        autoExpenseCount,
        recurringCount,
        manualIncomeCount,
        manualExpenseCount,
        totalRecords: financeRecords.length,
      },
    }
  }, [filteredAndSortedRecords, financeRecords])
  
  // Hızlı tarih filtreleri
  const setQuickDateFilter = useCallback((period: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date()
    let start: Date
    let end: Date = new Date(today)
    
    if (period === 'today') {
      start = new Date(today)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'week') {
      start = new Date(today)
      start.setDate(today.getDate() - 7)
      start.setHours(0, 0, 0, 0)
    } else if (period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
    } else if (period === 'year') {
      start = new Date(today.getFullYear(), 0, 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(today.getFullYear(), 11, 31)
      end.setHours(23, 59, 59, 999)
    } else {
      return
    }
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])
  
  // Export handler
  const handleExport = useCallback(async (format: 'excel' | 'csv') => {
    try {
      const exportParams = new URLSearchParams()
      if (type) exportParams.append('type', type)
      if (category) exportParams.append('category', category)
      if (customerCompanyId) exportParams.append('customerCompanyId', customerCompanyId)
      if (startDate) exportParams.append('startDate', startDate)
      if (endDate) exportParams.append('endDate', endDate)
      if (debouncedSearch) exportParams.append('search', debouncedSearch)
      
      const res = await fetch(`/api/finance/export?format=${format}&${exportParams.toString()}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finans.${format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast.error(t('exportFailed'), error?.message || tCommon('unknownError'))
    }
  }, [type, category, customerCompanyId, startDate, endDate, debouncedSearch])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Bu finans kaydını silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete finance record')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedFinance = financeRecords.filter((f) => f.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateFinance(updatedFinance, { revalidate: false })
      
      // Tüm diğer finance URL'lerini de güncelle
      await Promise.all([
        mutate('/api/finance', updatedFinance, { revalidate: false }),
        mutate('/api/finance?', updatedFinance, { revalidate: false }),
        apiUrl ? mutate(apiUrl, updatedFinance, { revalidate: false }) : Promise.resolve(),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(t('deleteFailed'), error?.message)
    }
  }, [financeRecords, mutateFinance, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedFinance(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((finance: Finance) => {
    setSelectedFinance(finance)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedFinance(null)
  }, [])

  // Eksik kayıtları kontrol et
  const checkMissing = useCallback(async () => {
    setChecking(true) // Loading state başlat
    
    // Loading toast göster
    const loadingToast = toast.loading(t('checkingMissing'))
    
    try {
      // Cache bypass için timestamp ekle (fresh data için)
      const res = await fetch(`/api/finance/check-missing?t=${Date.now()}`)
      
      // Network hatası kontrolü
      if (!res) {
        throw new Error('Network hatası - sunucuya bağlanılamadı')
      }
      
      if (!res.ok) {
        // JSON parse hatası olabilir - try-catch ile yakala
        let errorData: any = {}
        try {
          errorData = await res.json()
        } catch (parseError) {
          // JSON parse edilemezse status text kullan
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'Bilinmeyen hata'}`)
        }
        throw new Error(errorData.error || `HTTP ${res.status}: Kontrol yapılamadı`)
      }
      
      const data = await res.json()
      
      // Response validation
      if (typeof data.missingCount !== 'number') {
        console.warn('Invalid response format:', data)
        setMissingCount(0)
        toast.dismiss(loadingToast)
        toast.warning(t('invalidResponse'), t('invalidResponseMessage'))
        return
      }
      
      const previousCount = missingCount
      setMissingCount(data.missingCount || 0)
      
      // Başarı toast'ı göster
      toast.dismiss(loadingToast)
      
      if (data.missingCount > 0) {
        toast.success(
          t('missingRecordsFound', { count: data.missingCount }),
          previousCount !== null && previousCount !== data.missingCount
            ? t('missingRecordsFoundPrevious', { previous: previousCount, current: data.missingCount })
            : undefined
        )
      } else {
        toast.success(t('noMissingRecords'), t('noMissingRecordsMessage'))
      }
    } catch (error: any) {
      // Hata mesajını daha açıklayıcı yap
      const errorMessage = error?.message || 'Bilinmeyen hata'
      console.error('Check missing error:', error)
      
      // Hata toast'ı göster
      toast.dismiss(loadingToast)
      toast.error(t('checkFailed'), errorMessage)
      
      // Hata durumunda missingCount'u null yap (buton gösterilmesin)
      setMissingCount(null)
    } finally {
      setChecking(false) // Loading state bitir
    }
  }, [missingCount])

  // Eksik kayıtları senkronize et
  const syncMissing = useCallback(async () => {
    // Toast ile işlemi başlat (modal yerine - daha iyi UX)
    setSyncing(true)
    
    // Loading toast göster
    const loadingToast = toast.loading(t('syncingMissing'))
    
    try {
      const res = await fetch('/api/finance/sync-missing', {
        method: 'POST',
      })
  
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to sync missing records')
      }
      
      const data = await res.json()
      
      // Cache'i güncelle - yeni kayıtları göster
      await mutateFinance()
      await Promise.all([
        mutate('/api/finance'),
        mutate('/api/finance?'),
        apiUrl ? mutate(apiUrl) : Promise.resolve(),
      ])
      
      setMissingCount(0)
      
      // Başarı toast'ı göster
      toast.dismiss(loadingToast)
      toast.success(t('syncSuccess', { count: data.created || 0 }))
    } catch (error: any) {
      console.error('Sync missing error:', error)
      toast.dismiss(loadingToast)
      toast.error(t('syncFailed'), error?.message || tCommon('unknownError'))
    } finally {
      setSyncing(false)
    }
  }, [mutateFinance, apiUrl])

  // İlk yüklemede eksik kayıtları kontrol et (sadece bir kez)
  useEffect(() => {
    // Sadece component mount olduğunda bir kez çalıştır
    checkMissing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Boş dependency array - sadece mount'ta çalışır

  // Error handling
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{t('errorLoading')}</p>
          <p className="text-red-600 text-sm mt-1">{error.message || tCommon('unknownError')}</p>
          <Button
            onClick={() => mutateFinance()}
            variant="outline"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {tCommon('retry')}
          </Button>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return null
  }

  if (isLoading) {
    return <SkeletonList />
  }

  return (
      <div className="space-y-6">
        {/* Otomasyon Bilgileri */}
        <AutomationInfo
          title={t('automationTitle')}
          automations={[
            {
              action: t('automationInvoicePaid'),
              result: t('automationInvoicePaidResult'),
              details: [
                t('automationInvoicePaidDetails1'),
                t('automationInvoicePaidDetails2'),
                t('automationInvoicePaidDetails3'),
                t('automationInvoicePaidDetails4'),
              ],
            },
            {
              action: t('automationManual'),
              result: t('automationManualResult'),
              details: [
                t('automationManualDetails1'),
                t('automationManualDetails2'),
                t('automationManualDetails3'),
              ],
            },
          ]}
        />

        {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalRecords', { count: financeRecords.length })}</p>
        </div>
        <div className="flex gap-2">
          {/* Eksik Kayıt Uyarısı ve Senkronize Butonu */}
          {missingCount !== null && missingCount > 0 && (
            <Button
              onClick={syncMissing}
              disabled={syncing}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              {syncing ? t('syncing') : t('missingRecords', { count: missingCount })}
            </Button>
          )}
          <Button
            onClick={checkMissing}
            variant="outline"
            disabled={syncing || checking}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Kontrol Ediliyor...' : t('check')}
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newRecord')}
          </Button>
        </div>
      </div>

      {/* Summary Cards with Tooltips */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Toplam Gelir - Tooltip ile */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600">Toplam Gelir</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white p-3 text-xs">
                      <div className="font-semibold mb-2 text-sm">💰 Gelir Bilgileri</div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <div>
                            <div className="font-medium">Toplam {financeRecords.filter(f => f.type === 'INCOME').length} gelir kaydı</div>
                            <div className="text-gray-300 text-[10px] mt-0.5">Finance tablosundan çekiliyor</div>
                          </div>
                        </div>
                        {automationStats.autoIncomeCount > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <div>
                              <div className="font-medium">{automationStats.autoIncomeCount} otomatik gelir</div>
                              <div className="text-gray-300 text-[10px] mt-0.5">Fatura ödendiğinde otomatik oluşuyor</div>
                            </div>
                          </div>
                        )}
                        {automationStats.manualIncomeCount > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-400">•</span>
                            <div>
                              <div className="font-medium">{automationStats.manualIncomeCount} manuel gelir</div>
                              <div className="text-gray-300 text-[10px] mt-0.5">Kullanıcı tarafından ekleniyor</div>
                            </div>
                          </div>
                        )}
                        {Object.keys(incomeBreakdown).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="font-semibold mb-1.5 text-xs">Kategorilere Göre:</div>
                            <div className="space-y-1">
                              {Object.entries(incomeBreakdown).slice(0, 3).map(([cat, amount]) => (
                                <div key={cat} className="flex justify-between items-center text-[10px]">
                                  <span className="truncate mr-2">{categoryLabels[cat] || cat}</span>
                                  <span className="text-green-400 font-medium whitespace-nowrap">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(incomeBreakdown).length > 3 && (
                                <div className="text-gray-400 text-[10px]">+ {Object.keys(incomeBreakdown).length - 3} kategori daha</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Toplam Gider - Tooltip ile */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600">Toplam Gider</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white p-3 text-xs">
                      <div className="font-semibold mb-2 text-sm">💸 Gider Bilgileri</div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <div>
                            <div className="font-medium">Toplam {financeRecords.filter(f => f.type === 'EXPENSE').length} gider kaydı</div>
                            <div className="text-gray-300 text-[10px] mt-0.5">Finance tablosundan çekiliyor</div>
                          </div>
                        </div>
                        {automationStats.autoExpenseCount > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400">•</span>
                            <div>
                              <div className="font-medium">{automationStats.autoExpenseCount} otomatik gider</div>
                              <div className="text-gray-300 text-[10px] mt-0.5">Sevkiyat teslim edildiğinde otomatik oluşuyor</div>
                            </div>
                          </div>
                        )}
                        {automationStats.recurringCount > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <div>
                              <div className="font-medium">{automationStats.recurringCount} tekrarlayan gider</div>
                              <div className="text-gray-300 text-[10px] mt-0.5">Her ayın 1&#39;inde otomatik oluşuyor</div>
                            </div>
                          </div>
                        )}
                        {automationStats.manualExpenseCount > 0 && (
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-400">•</span>
                            <div>
                              <div className="font-medium">{automationStats.manualExpenseCount} manuel gider</div>
                              <div className="text-gray-300 text-[10px] mt-0.5">Kullanıcı tarafından ekleniyor</div>
                            </div>
                          </div>
                        )}
                        {Object.keys(expenseBreakdown).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="font-semibold mb-1.5 text-xs">Kategorilere Göre:</div>
                            <div className="space-y-1">
                              {Object.entries(expenseBreakdown).slice(0, 3).map(([cat, amount]) => (
                                <div key={cat} className="flex justify-between items-center text-[10px]">
                                  <span className="truncate mr-2">{categoryLabels[cat] || cat}</span>
                                  <span className="text-red-400 font-medium whitespace-nowrap">{formatCurrency(amount)}</span>
                                </div>
                              ))}
                              {Object.keys(expenseBreakdown).length > 3 && (
                                <div className="text-gray-400 text-[10px]">+ {Object.keys(expenseBreakdown).length - 3} kategori daha</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          {/* Net Kar - Tooltip ile */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-gray-600">Net Kar/Zarar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white p-3 text-xs">
                      <div className="font-semibold mb-2 text-sm">📈 Net Kar Bilgileri</div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <div>
                            <div className="font-medium">Gelir: {formatCurrency(totalIncome)}</div>
                            <div className="text-gray-300 text-[10px] mt-0.5">Tüm gelir kayıtlarının toplamı</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <div>
                            <div className="font-medium">Gider: {formatCurrency(totalExpense)}</div>
                            <div className="text-gray-300 text-[10px] mt-0.5">Tüm gider kayıtlarının toplamı</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className={netProfit >= 0 ? "text-green-400" : "text-red-400"}>•</span>
                          <div>
                            <div className="font-medium">Net: {formatCurrency(netProfit)}</div>
                            <div className="text-gray-300 text-[10px] mt-0.5">Gelir - Gider</div>
                          </div>
                        </div>
                        {totalIncome > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-xs">Kar Marjı:</span>
                              <span className={`font-semibold text-sm ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {((netProfit / totalIncome) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Karşılaştırma: Geçen Ay vs Bu Ay */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2">Bu Ay Gelir</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyComparison.thisMonth.income)}
          </div>
          {monthlyComparison.lastMonth.income > 0 && (
            <div className={`text-xs mt-1 ${monthlyComparison.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyComparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(monthlyComparison.incomeChange).toFixed(1)}% 
              <span className="text-gray-500 ml-1">geçen aya göre</span>
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2">Bu Ay Gider</div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(monthlyComparison.thisMonth.expense)}
          </div>
          {monthlyComparison.lastMonth.expense > 0 && (
            <div className={`text-xs mt-1 ${monthlyComparison.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyComparison.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(monthlyComparison.expenseChange).toFixed(1)}% 
              <span className="text-gray-500 ml-1">geçen aya göre</span>
            </div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-2">Bu Ay Net Kar</div>
          <div className={`text-2xl font-bold ${monthlyComparison.thisMonth.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyComparison.thisMonth.net)}
          </div>
          {monthlyComparison.lastMonth.net !== 0 && (
            <div className={`text-xs mt-1 ${monthlyComparison.thisMonth.net >= monthlyComparison.lastMonth.net ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyComparison.thisMonth.net >= monthlyComparison.lastMonth.net ? '↑' : '↓'} 
              {formatCurrency(Math.abs(monthlyComparison.thisMonth.net - monthlyComparison.lastMonth.net))}
              <span className="text-gray-500 ml-1">geçen aya göre</span>
            </div>
          )}
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Arama */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Açıklama, tutar veya kategori ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button
            onClick={() => handleExport('excel')}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Excel İndir
          </Button>
        </div>

        {/* Filtreler */}
        <div className="flex flex-wrap gap-4">
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
          <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('selectType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="INCOME">Gelir</SelectItem>
              <SelectItem value="EXPENSE">Gider</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('selectCategory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerCompanyId || 'all'} onValueChange={(v) => setCustomerCompanyId(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Firma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Firmalar</SelectItem>
              {customerCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Hızlı Tarih Filtreleri */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('today')}
              className="text-xs"
            >
              <Calendar className="mr-1 h-3 w-3" />
              Bugün
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('week')}
              className="text-xs"
            >
              Bu Hafta
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('month')}
              className="text-xs"
            >
              Bu Ay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter('year')}
              className="text-xs"
            >
              Bu Yıl
            </Button>
          </div>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Başlangıç Tarihi"
            className="w-48"
          />
          
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Bitiş Tarihi"
            className="w-48"
          />
        </div>

        {/* Sıralama */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sırala:</span>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Tarih</SelectItem>
              <SelectItem value="amount">Tutar</SelectItem>
              <SelectItem value="category">Kategori</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? 'Artan' : 'Azalan'}
          </Button>
        </div>
      </div>

      {/* Grafikler veya Tablo */}
      {showCharts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gelir/Gider Trendi</h3>
            <FinanceTrendChart data={financeRecords} />
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Kategori Dağılımı</h3>
            <FinanceCategoryChart 
              incomeData={incomeBreakdown} 
              expenseData={expenseBreakdown}
              categoryLabels={categoryLabels}
            />
          </Card>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Kategori</TableHead>
                  {isSuperAdmin && <TableHead>Firma</TableHead>}
                  <TableHead>Müşteri Firma</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>İlişkili</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-gray-500">
                      Finans kaydı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((finance) => (
                <TableRow key={finance.id}>
                  <TableCell>
                    <Badge
                      className={
                        finance.type === 'INCOME'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {finance.type === 'INCOME' ? 'Gelir' : 'Gider'}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${
                      finance.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {finance.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(finance.amount || 0)}
                  </TableCell>
                  <TableCell>
                    {finance.category ? (
                      <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
                        {categoryLabels[finance.category] || finance.category}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {finance.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-sm text-gray-600">
                    {finance.customerCompany?.name || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={finance.description}>
                    {finance.description || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {finance.relatedEntityType && finance.relatedEntityId ? (
                      <span className="text-sm">
                        {finance.relatedEntityType}: {finance.relatedEntityId.substring(0, 8)}...
                      </span>
                    ) : finance.relatedTo ? (
                      <span className="text-sm text-gray-500">{finance.relatedTo}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(finance.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFinanceId(finance.id)
                          setSelectedFinanceData(finance)
                          setDetailModalOpen(true)
                        }}
                        aria-label={`Finans kaydını görüntüle`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(finance)}
                        aria-label="Finans kaydını düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(finance.id)}
                        className="text-red-600 hover:text-red-700"
                        aria-label="Finans kaydını sil"
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
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      <FinanceDetailModal
        financeId={selectedFinanceId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedFinanceId(null)
          setSelectedFinanceData(null)
        }}
        initialData={selectedFinanceData || undefined}
      />

      {/* Form Modal */}
      <FinanceForm
        finance={selectedFinance || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedFinance: Finance) => {
          let updatedFinance: Finance[]
          
          if (selectedFinance) {
            updatedFinance = financeRecords.map((f) =>
              f.id === savedFinance.id ? savedFinance : f
            )
          } else {
            updatedFinance = [savedFinance, ...financeRecords]
          }
          
          await mutateFinance(updatedFinance, { revalidate: false })
          
          await Promise.all([
            mutate('/api/finance', updatedFinance, { revalidate: false }),
            mutate('/api/finance?', updatedFinance, { revalidate: false }),
            apiUrl ? mutate(apiUrl, updatedFinance, { revalidate: false }) : Promise.resolve(),
          ])
        }}
      />
    </div>
  )
}





