'use client'





import { useState, useCallback, useMemo, useEffect } from 'react'


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'


import { useLocale, useTranslations } from 'next-intl'


import { useSearchParams, useRouter } from 'next/navigation'


import { useSession } from '@/hooks/useSession'


import { Plus, Search, Edit, Trash2, Eye, LayoutGrid, Table as TableIcon, Filter, Sparkles, FileText, Calendar, CheckSquare, Receipt, Mail, MessageSquare, MessageCircle, Download } from 'lucide-react'


import { useData } from '@/hooks/useData'
import RefreshButton from '@/components/ui/RefreshButton'
import InlineEditBadge from '@/components/ui/InlineEditBadge'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { mutate } from 'swr'
import BulkActions from '@/components/ui/BulkActions'
import { Checkbox } from '@/components/ui/checkbox'

import { Button } from '@/components/ui/button'


import { Input } from '@/components/ui/input'


import { toast, toastSuccess, toastError, toastWarning } from '@/lib/toast'
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


import { Card } from '@/components/ui/card'


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
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Textarea } from '@/components/ui/textarea'


import { Label } from '@/components/ui/label'


import SkeletonList from '@/components/skeletons/SkeletonList'


import ModuleStats from '@/components/stats/ModuleStats'


import Link from 'next/link'


import { formatCurrency } from '@/lib/utils'


import dynamic from 'next/dynamic'


import { AutomationInfo } from '@/components/automation/AutomationInfo'





// Lazy load büyük componentler - performans için


const DealForm = dynamic(() => import('./DealForm'), {


  ssr: false,


  loading: () => null,


})





const DealKanbanChart = dynamic(() => import('@/components/charts/DealKanbanChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-sm text-gray-600">Kanban yükleniyor...</p>
      </div>
    </div>
  ),


})





const DealDetailModal = dynamic(() => import('./DealDetailModal'), {


  ssr: false,


  loading: () => null,


})

const ContextualWizard = dynamic(() => import('../dashboard/ContextualWizard'), {
  ssr: false,
  loading: () => null,
})

const QuoteForm = dynamic(() => import('../quotes/QuoteForm'), { ssr: false, loading: () => null })

const InvoiceForm = dynamic(() => import('../invoices/InvoiceForm'), { ssr: false, loading: () => null })

const TaskForm = dynamic(() => import('../tasks/TaskForm'), { ssr: false, loading: () => null })

const MeetingForm = dynamic(() => import('../meetings/MeetingForm'), { ssr: false, loading: () => null })





interface DealListProps {


  isOpen?: boolean


}





interface Deal {


  id: string


  title: string


  stage: string


  value: number


  status: string


  customerId?: string


  companyId?: string


  priorityScore?: number // Lead scoring (migration 024)


  isPriority?: boolean // Lead scoring (migration 024)


  leadSource?: string // Lead source tracking (migration 025)


  leadScore?: {


    score: number


    temperature: string


  }[] // Lead scoring from LeadScore table


  Company?: {


    id: string


    name: string


  }


  createdAt: string


}





async function fetchDeals(


  stage: string,


  customerId: string,


  search: string,


  minValue: string,


  maxValue: string,


  startDate: string,


  endDate: string,


  leadSource?: string,


  filterCompanyId?: string


): Promise<Deal[]> {


  const params = new URLSearchParams()


  if (stage) params.append('stage', stage)


  if (customerId) params.append('customerId', customerId)


  if (search) params.append('search', search)


  if (minValue) params.append('minValue', minValue)


  if (maxValue) params.append('maxValue', maxValue)


  if (startDate) params.append('startDate', startDate)


  if (endDate) params.append('endDate', endDate)


  if (leadSource) params.append('leadSource', leadSource)


  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)





  // Cache headers - POST sonrası fresh data için cache'i kapat


  const res = await fetch(`/api/deals?${params.toString()}`, {


    cache: 'no-store', // POST sonrası fresh data için cache'i kapat


    headers: {


      'Cache-Control': 'no-store, must-revalidate',


    },


  })


  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Failed to fetch deals')
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.error || 'Failed to fetch deals')
    } catch {
      throw new Error(errorText || 'Failed to fetch deals')
    }
  }


  const data = await res.json()


  // Pagination format desteği: { data: [...], pagination: {...} } veya direkt array


  return Array.isArray(data) ? data : (data?.data || [])


}





async function fetchKanbanDeals(


  customerId: string,


  search: string,


  minValue: string,


  maxValue: string,


  startDate: string,


  endDate: string,


  filterCompanyId?: string,


  customerCompanyId?: string


) {


  const params = new URLSearchParams()


  if (customerId) params.append('customerId', customerId)


  if (customerCompanyId) params.append('customerCompanyId', customerCompanyId) // Firma bazlı filtreleme


  if (search) params.append('search', search)


  if (minValue) params.append('minValue', minValue)


  if (maxValue) params.append('maxValue', maxValue)


  if (startDate) params.append('startDate', startDate)


  if (endDate) params.append('endDate', endDate)


  if (filterCompanyId) params.append('filterCompanyId', filterCompanyId)





  // ✅ ÇÖZÜM: Cache'i kapat - refresh sonrası her zaman yeni data çek
  const res = await fetch(`/api/analytics/deal-kanban?${params.toString()}`, {
    cache: 'no-store', // ÇÖZÜM: Next.js cache'i kapat - her zaman fresh data çek
    headers: {
      'Cache-Control': 'no-store, must-revalidate', // ÇÖZÜM: Browser cache'i de kapat
    },
  })


  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Failed to fetch kanban deals')
    try {
      const errorJson = JSON.parse(errorText)
      throw new Error(errorJson.error || 'Failed to fetch kanban deals')
    } catch {
      throw new Error(errorText || 'Failed to fetch kanban deals')
    }
  }

  const data = await res.json()


  // Debug: Development'ta log ekle


  if (process.env.NODE_ENV === 'development') {


    console.log('fetchKanbanDeals response:', {


      hasKanban: !!data.kanban,


      kanbanLength: data.kanban?.length,


      kanban: data.kanban?.map((col: any) => ({


        stage: col.stage,


        count: col.count,


        totalValue: col.totalValue,


        dealsCount: col.deals?.length,


      })),


    })


  }


  return data.kanban || []


}





async function fetchCustomers() {


  // OPTİMİZE: Cache headers (veri çekme mantığı aynı)


  const res = await fetch('/api/customers?pageSize=1000', {


    next: { revalidate: 300 },


    cache: 'force-cache',


    headers: {


      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',


    },


  })


  if (!res.ok) throw new Error('Failed to fetch customers')


  const data = await res.json()


  // API'den dönen veri formatını kontrol et - array mi yoksa object mi?


  return Array.isArray(data) ? data : (data.data || data.customers || [])


}





const stageColors: Record<string, string> = {


  LEAD: 'bg-blue-100 text-blue-800',


  CONTACTED: 'bg-purple-100 text-purple-800',


  PROPOSAL: 'bg-yellow-100 text-yellow-800',


  NEGOTIATION: 'bg-orange-100 text-orange-800',


  WON: 'bg-green-100 text-green-800',


  LOST: 'bg-red-100 text-red-800',


}





const stageLabels: Record<string, string> = {


  LEAD: 'Potansiyel',


  CONTACTED: 'İletişimde',


  PROPOSAL: 'Teklif',


  NEGOTIATION: 'Pazarlık',


  WON: 'Kazanıldı',


  LOST: 'Kaybedildi',


}





export default function DealList({ isOpen = true }: DealListProps) {
  const { confirm } = useConfirm()


  const locale = useLocale()


  const t = useTranslations('deals')


  const tCommon = useTranslations('common')


  const router = useRouter()


  const searchParams = useSearchParams()


  const { data: session } = useSession()
  

  


  // SuperAdmin kontrolü


  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'


  

  
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')

  // ✅ DEBUG: isOpen ve viewMode durumunu logla
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DealList] Debug:', {
        isOpen,
        viewMode,
        isSuperAdmin,
        sessionUser: session?.user?.email,
      })
    }
  }, [isOpen, viewMode, isSuperAdmin, session])


  const [stage, setStage] = useState('')
  const [dealType, setDealType] = useState('')

  const [customerId, setCustomerId] = useState('')


  const [search, setSearch] = useState('')


  const [debouncedSearch, setDebouncedSearch] = useState('') // Debounced search - performans için


  const [minValue, setMinValue] = useState('')


  const [maxValue, setMaxValue] = useState('')


  const [startDate, setStartDate] = useState('')


  const [endDate, setEndDate] = useState('')


  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi


  const [customerCompanyId, setCustomerCompanyId] = useState('') // Firma bazlı filtreleme


  const [leadSourceFilter, setLeadSourceFilter] = useState('')


  const [showFilters, setShowFilters] = useState(false)


  const [formOpen, setFormOpen] = useState(false)


  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)


  const [detailModalOpen, setDetailModalOpen] = useState(false)


  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)


  const [selectedDealData, setSelectedDealData] = useState<Deal | null>(null)
  
  // Contextual wizard state
  const [wizardOpen, setWizardOpen] = useState(false)

  const [quickAction, setQuickAction] = useState<{ type: 'quote' | 'invoice' | 'task' | 'meeting'; deal: Deal } | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false)
  const [selectedDealForCommunication, setSelectedDealForCommunication] = useState<Deal | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const [lostDialogOpen, setLostDialogOpen] = useState(false)


  const [losingDealId, setLosingDealId] = useState<string | null>(null)


  const [lostReason, setLostReason] = useState('')

  const queryClient = useQueryClient()
  
  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['deals'] }),
      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
      queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
      queryClient.invalidateQueries({ queryKey: ['customers'] }),
    ])
  }, [queryClient])

  // SuperAdmin için firmaları çek


  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(


    isSuperAdmin ? '/api/superadmin/companies' : null,


    { dedupingInterval: 60000, revalidateOnFocus: false }


  )


  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir


  const companies = (companiesData?.companies || []).filter((company, index, self) => 


    index === self.findIndex((c) => c.id === company.id)


  )





  // Debounced search - kullanıcı yazmayı bitirdikten 300ms sonra arama yap


  useEffect(() => {


    const timer = setTimeout(() => {


      setDebouncedSearch(search)


    }, 300)


    return () => clearTimeout(timer)


  }, [search])





  useEffect(() => {


    if (!isOpen) return


    // URL parametrelerinden filtreleri oku


    const leadSourceFromUrl = searchParams.get('leadSource') || ''


    const stageFromUrl = searchParams.get('stage') || ''


    const customerCompanyIdFromUrl = searchParams.get('customerCompanyId') || ''


    

    
    // URL'den gelen stage parametresini state'e set et


    if (stageFromUrl && stageFromUrl !== stage) {


      setStage(stageFromUrl)


    }


    if (leadSourceFromUrl !== leadSourceFilter) {


      setLeadSourceFilter(leadSourceFromUrl)


    }


    // URL'den gelen customerCompanyId parametresini state'e set et


    if (customerCompanyIdFromUrl && customerCompanyIdFromUrl !== customerCompanyId) {


      setCustomerCompanyId(customerCompanyIdFromUrl)


    }


  }, [isOpen, searchParams, stage, leadSourceFilter, customerCompanyId])





  // OPTİMİZE: Agresif cache + placeholder data (veri çekme mantığı aynı)


  // Her zaman veri çek - viewMode değiştiğinde de veri hazır olsun


  // DÜZELTME: Liste'de stage filtresi yoksa tüm stage'ler gösterilmeli (kanban ile aynı)


  // DÜZELTME: enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)


  // DÜZELTME: refetchOnMount: true - sayfa yüklendiğinde veri çek (table view için)


  // OPTİMİZE: debouncedSearch kullan - her harfte arama yapılmaz


  const dealsQuery = useQuery({


    queryKey: ['deals', stage, customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId],


    queryFn: () => fetchDeals(stage || '', customerId, debouncedSearch, minValue, maxValue, startDate, endDate, leadSourceFilter, filterCompanyId || undefined), // debouncedSearch kullan


    staleTime: 5 * 60 * 1000, // 5 dakika cache


    gcTime: 10 * 60 * 1000,


    refetchOnWindowFocus: false,


    refetchOnMount: true, // Sayfa yüklendiğinde veri çek (table view için)


    placeholderData: (previousData) => previousData, // Optimistic update


    // enabled kaldırıldı - her zaman veri çek (viewMode değiştiğinde anında göster)


  })





  // SuperAdmin için filterCompanyId'yi normalize et - boş string yerine undefined kullan
  const normalizedFilterCompanyId = filterCompanyId && filterCompanyId !== '' ? filterCompanyId : undefined
  const kanbanQuery = useQuery({


    queryKey: ['kanban-deals', customerId, debouncedSearch, minValue, maxValue, startDate, endDate, normalizedFilterCompanyId, customerCompanyId, isSuperAdmin],


    queryFn: () => fetchKanbanDeals(customerId, debouncedSearch, minValue, maxValue, startDate, endDate, normalizedFilterCompanyId, customerCompanyId || undefined), // debouncedSearch kullan


    staleTime: 0, // ✅ ÇÖZÜM: Cache'i kapat - SuperAdmin için her zaman fresh data


    gcTime: 0, // ✅ ÇÖZÜM: Garbage collection'ı kapat - cache'i hemen temizle


    refetchOnWindowFocus: false, // Focus'ta refetch yapma


    refetchOnMount: true, // ✅ ÇÖZÜM: Mount'ta refetch YAP - SuperAdmin için veri göster


    placeholderData: (previousData) => previousData, // Optimistic update


    enabled: isOpen && viewMode === 'kanban', // Sadece kanban view'da çalış
  })

  // ✅ ÇÖZÜM: useQuery'den gelen data'yı state'e kopyala - optimistic update için
  // ÖNEMLİ: State-based optimistic update - React Query cache'inden bağımsız
  const [kanbanData, setKanbanData] = useState<any[]>(Array.isArray(kanbanQuery.data) ? kanbanQuery.data : [])

  // ✅ DEBUG: kanbanQuery durumunu logla
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const queryData = Array.isArray(kanbanQuery.data) ? kanbanQuery.data : []
      console.log('[DealList] KanbanQuery Debug:', {
        enabled: isOpen && viewMode === 'kanban',
        isLoading: kanbanQuery.isLoading,
        isError: kanbanQuery.isError,
        error: kanbanQuery.error,
        dataLength: queryData.length,
        kanbanDataLength: kanbanData.length,
        isOpen,
        viewMode,
      })
    }
  }, [kanbanQuery.isLoading, kanbanQuery.isError, kanbanQuery.error, kanbanQuery.data, kanbanData, isOpen, viewMode])
  const [isInitialLoad, setIsInitialLoad] = useState(true) // ✅ ÇÖZÜM: Initial load kontrolü
  
  // useQuery'den gelen data değiştiğinde state'i güncelle (sadece initial load'da)
  // ÖNEMLİ: Bu useEffect sadece initial load'da çalışır - optimistic update'ler bu useEffect'i bypass eder
  // ÖNEMLİ: Refresh sonrası API'den eski data gelirse state'i override etmemek için initial load kontrolü var
  useEffect(() => {
    if (!isOpen || viewMode !== 'kanban') return
    const queryData = Array.isArray(kanbanQuery.data) ? kanbanQuery.data : []
    if (!isInitialLoad && queryData.length === 0) {
      return
    }

    if (queryData.length > 0) {
      setKanbanData(queryData)
      setIsInitialLoad(false)
    }
  }, [kanbanQuery.data, isInitialLoad, isOpen, viewMode])

  // ÖNEMLİ: kanbanData her zaman array olmalı (undefined kontrolü)
  const hasKanbanData = Array.isArray(kanbanData) && kanbanData.length > 0

  // İlk fırsat yoksa wizard'ı aç
  useEffect(() => {
    if (!isOpen) return
    if (viewMode === 'kanban' && !hasKanbanData && !isInitialLoad) {
      const wizardCompleted = localStorage.getItem('contextual-wizard-first-deal-completed')
      if (!wizardCompleted) {
        const timer = setTimeout(() => {
          setWizardOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    } else if (viewMode === 'table' && (!dealsQuery.data || dealsQuery.data.length === 0) && !search && !stage && !customerId) {
      const wizardCompleted = localStorage.getItem('contextual-wizard-first-deal-completed')
      if (!wizardCompleted) {
        const timer = setTimeout(() => {
          setWizardOpen(true)
        }, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, viewMode, hasKanbanData, isInitialLoad, dealsQuery.data, search, stage, customerId])





  const { data: customers } = useQuery({


    queryKey: ['customers', { scope: 'deals' }],


    queryFn: fetchCustomers,


    staleTime: 5 * 60 * 1000, // 5 dakika cache


    gcTime: 10 * 60 * 1000,


    refetchOnWindowFocus: false,


    refetchOnMount: false,


    placeholderData: (previousData) => previousData,


    enabled: isOpen,


  })





  // customers'ı array olarak garanti et


  const customersArray = Array.isArray(customers) ? customers : []





  const deleteMutation = useMutation({


    mutationFn: async (id: string) => {


      const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' })


      if (!res.ok) {


        const error = await res.json().catch(() => ({ error: 'Failed to delete deal' }))


        throw new Error(error.error || 'Failed to delete deal')


      }


      return res.json()


    },


    onSuccess: () => {


      // Hem table hem kanban view için query'leri invalidate et


      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)


      queryClient.invalidateQueries({ queryKey: ['deals'] })


      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })


      queryClient.invalidateQueries({ queryKey: ['stats-deals'] })


      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı güncelle


      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)


      // Optimistic update için cache'i temizle


      queryClient.refetchQueries({ queryKey: ['deals'] })


      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })


      queryClient.refetchQueries({ queryKey: ['stats-deals'] })


      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı refetch et


      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)


    },


    onError: (error: any) => {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      
      // Hata toast mesajı göster
      toastError('Fırsat silinemedi', error?.message || 'Silme işlemi başarısız oldu')
    },


  })





  const closeQuickAction = useCallback(() => {
    setQuickAction(null)
  }, [])

  const handleEdit = useCallback((deal: Deal) => {


    setSelectedDeal(deal)


    setFormOpen(true)


  }, [])





  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: t('deleteConfirmTitle'),
      description: t('deleteConfirm', { title }),
      confirmLabel: t('delete'),
      cancelLabel: t('cancel'),
      variant: 'destructive',
    })
    
    if (!confirmed) {
      return
    }





    try {


      await deleteMutation.mutateAsync(id)
      

      


      // Başarı bildirimi
      toast.success(t('dealDeleted'), {
        description: t('dealDeletedMessage', { title })
      })


      


      // Kanban ve table view için query'leri invalidate et


      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)


      queryClient.invalidateQueries({ queryKey: ['deals'] })


      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })


      queryClient.invalidateQueries({ queryKey: ['stats-deals'] })


      queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı güncelle


      queryClient.invalidateQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)


      // Refetch yap - anında güncel veri gelsin


      queryClient.refetchQueries({ queryKey: ['deals'] })


      queryClient.refetchQueries({ queryKey: ['kanban-deals'] })


      queryClient.refetchQueries({ queryKey: ['stats-deals'] })


      queryClient.refetchQueries({ queryKey: ['deal-kanban'] }) // Dashboard'daki kanban chart'ı refetch et


      queryClient.refetchQueries({ queryKey: ['kpis'] }) // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)


    } catch (error: any) {


      toast.error(tCommon('error'), { description: String(error?.message || 'Bir hata oluştu') })


    }


  }

  // Bulk operations handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      // WON, LOST deal'ları seçme - immutable oldukları için
      const selectableDeals = dealsQuery.data?.filter((d) => !['WON', 'LOST'].includes(d.stage)) || []
      setSelectedIds(selectableDeals.map((d) => d.id))
    } else {
      setSelectedIds([])
    }
  }, [dealsQuery.data])

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
      const res = await fetch('/api/deals/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to bulk delete deals')
      }

      // Optimistic update - silinen kayıtları listeden kaldır
      const updatedDeals = (dealsQuery.data || []).filter((d) => !ids.includes(d.id))
      
      // Cache'i güncelle
      queryClient.setQueryData(['deals', { search, stage, dealType, customerId, filterCompanyId }], updatedDeals)
      
      // Tüm diğer deal URL'lerini de güncelle
      await Promise.all([
        mutate('/api/deals', updatedDeals, { revalidate: false }),
        mutate('/api/deals?', updatedDeals, { revalidate: false }),
      ])

      // Kanban cache'ini de güncelle
      queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })

      toast.success(tCommon('bulkDeleteSuccess', { count: ids.length, item: tCommon('deals') }), {
        description: tCommon('bulkDeleteSuccessMessage', { count: ids.length, item: tCommon('deals') }),
      })

      // Seçimi temizle
      setSelectedIds([])
      setSelectAll(false)
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error(tCommon('error'), { description: error?.message || 'Toplu silme işlemi başarısız oldu' })
    }
  }, [dealsQuery.data, search, stage, dealType, customerId, filterCompanyId, queryClient, tCommon])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
    setSelectAll(false)
  }, [])

  // selectAll'u güncelle - tüm seçilebilir deal'lar seçiliyse true
  useEffect(() => {
    const selectableDeals = dealsQuery.data?.filter((d) => !['WON', 'LOST'].includes(d.stage)) || []
    if (selectableDeals.length > 0 && selectedIds.length === selectableDeals.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [selectedIds, dealsQuery.data])





  // OPTİMİZE: Sadece ilk yüklemede ve hiç veri yoksa skeleton göster (veri çekme aynı)


  // Cache'de veri varsa anında göster, skeleton engellemez


  // Stats verisini çek - toplam sayı için


  const { data: stats } = useQuery({


    queryKey: ['stats-deals'],


    queryFn: async () => {


      const res = await fetch('/api/stats/deals')


      if (!res.ok) throw new Error('Failed to fetch deal stats')


      return res.json()


    },


    staleTime: 5 * 60 * 1000,


    refetchOnWindowFocus: false,


  })





  const tableDeals = dealsQuery.data ?? []





  const kanbanTotal = useMemo(() => {


    if (!Array.isArray(kanbanQuery.data) || kanbanQuery.data.length === 0) return 0


    return kanbanQuery.data.reduce((sum: number, col: any) => sum + (col.count || 0), 0)


  }, [kanbanQuery.data])





  const totalDeals = useMemo(() => {


    return stats?.total || (viewMode === 'table' ? tableDeals.length : kanbanTotal)


  }, [stats?.total, viewMode, tableDeals.length, kanbanTotal])





  // Skeleton göster - hook'lardan SONRA (early return)


  // ✅ ÇÖZÜM: isOpen kontrolünü kaldırdık - AccordionContent zaten accordion kapalıyken render edilmiyor
  // Query'ler enabled prop'u ile isOpen kontrolü yapıyor, bu yeterli





  if (dealsQuery.isLoading && viewMode === 'table') {


    return <SkeletonList />


  }





  return (


    <div className="space-y-6">


      {/* İstatistikler */}


      <ModuleStats module="deals" statsUrl="/api/stats/deals" />





      <AutomationInfo


        title={t('automationTitle')}


        automations={[


          {


            action: t('automationWon'),


            result: t('automationWonResult'),


            details: [


              t('automationWonDetails1'),


              t('automationWonDetails2'),


            ],


          },


          {


            action: t('automationLost'),


            result: t('automationLostResult'),


            details: [


              t('automationLostDetails1'),


              t('automationLostDetails2'),


            ],


          },


          {


            action: t('automationNegotiation'),


            result: t('automationNegotiationResult'),


            details: [


              t('automationNegotiationDetails1'),


              t('automationNegotiationDetails2'),


            ],


          },


        ]}


      />





      {/* Header */}


      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">


        <div>


          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>


          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">{t('totalDeals', { count: totalDeals })}</p>


        </div>


        <div className="flex gap-2 w-full sm:w-auto">
          <div className="flex gap-2 flex-1 sm:flex-initial">
            <RefreshButton onRefresh={handleRefresh} />
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setViewMode('table')
              // Table view'a geçildiğinde veri çek
              queryClient.refetchQueries({ queryKey: ['deals'] })
            }}
          >


            <TableIcon className="h-4 w-4" />


          </Button>


          <Button


            variant={viewMode === 'kanban' ? 'default' : 'outline'}


            size="icon"


            onClick={() => {


              setViewMode('kanban')


                // Kanban view'a geçildiğinde veri çek


              queryClient.refetchQueries({ queryKey: ['kanban-deals'] })


            }}


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
                    if (stage) params.append('stage', stage)
                    params.append('format', 'excel')
                    
                    const res = await fetch(`/api/deals/export?${params.toString()}`)
                    if (!res.ok) throw new Error('Export failed')
                    
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `firsatlar-${new Date().toISOString().split('T')[0]}.xlsx`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    
                    toast.success('Dışa aktarma başarılı', {
                      description: 'Fırsatlar Excel formatında indirildi.',
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
                    if (stage) params.append('stage', stage)
                    params.append('format', 'csv')
                    
                    const res = await fetch(`/api/deals/export?${params.toString()}`)
                    if (!res.ok) throw new Error('Export failed')
                    
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `firsatlar-${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    window.URL.revokeObjectURL(url)
                    
                    toast.success('Dışa aktarma başarılı', {
                      description: 'Fırsatlar CSV formatında indirildi.',
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
            onClick={() => {
              setSelectedDeal(null)
              setFormOpen(true)
            }}
            className="bg-gradient-primary text-white w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newDeal')}
          </Button>


        </div>


      </div>





      {/* Filters */}


      <div className="space-y-4">


        <div className="flex items-center gap-2">


          <Button


            variant="outline"


            size="sm"


            onClick={() => setShowFilters(!showFilters)}


          >


            <Filter className="mr-2 h-4 w-4" />


            {t('filters')}


          </Button>


        </div>





        {showFilters && (


          <Card className="p-4">


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">


              {/* Search */}


              <div className="space-y-2">


                <label className="text-sm font-medium">{t('searchLabel')}</label>


                <div className="relative">


                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />


                  <Input


                    type="search"


                    placeholder={t('searchPlaceholder')}


                    value={search}


                    onChange={(e) => setSearch(e.target.value)}


                    className="pl-10"


                  />


                </div>


              </div>





              {/* SuperAdmin Firma Filtresi */}


              {isSuperAdmin && (


                <div className="space-y-2">


                  <label className="text-sm font-medium">{t('companyLabel')}</label>


                  <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>


                    <SelectTrigger>


                      <SelectValue placeholder={t('allCompanies')} />


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


                </div>


              )}





              {/* Customer */}


              <div className="space-y-2">


                <label className="text-sm font-medium">{t('customerLabel')}</label>


                <Select value={customerId || 'all'} onValueChange={(v) => setCustomerId(v === 'all' ? '' : v)}>


                  <SelectTrigger>


                    <SelectValue placeholder={tCommon('filters.all')} />


                  </SelectTrigger>


                  <SelectContent>


                    <SelectItem value="all">{tCommon('filters.all')}</SelectItem>


                    {customersArray.map((customer: any) => (


                      <SelectItem key={customer.id} value={customer.id}>


                        {customer.name}


                      </SelectItem>


                    ))}


                  </SelectContent>


                </Select>


              </div>





              {/* Stage (sadece table view için) */}


              {viewMode === 'table' && (


                <div className="space-y-2">


                  <label className="text-sm font-medium">{t('stageLabel')}</label>


                  <Select value={stage || 'all'} onValueChange={(v) => setStage(v === 'all' ? '' : v)}>


                    <SelectTrigger>


                      <SelectValue placeholder={t('allStages')} />


                    </SelectTrigger>


                    <SelectContent>


                      <SelectItem value="all">Tümü</SelectItem>


                      <SelectItem value="LEAD">Potansiyel</SelectItem>


                      <SelectItem value="CONTACTED">İletişimde</SelectItem>


                      <SelectItem value="PROPOSAL">Teklif</SelectItem>


                      <SelectItem value="NEGOTIATION">Pazarlık</SelectItem>


                      <SelectItem value="WON">Kazanıldı</SelectItem>


                      <SelectItem value="LOST">Kaybedildi</SelectItem>


                    </SelectContent>


                  </Select>


                </div>


              )}





              {/* Lead Source Filter */}


              {viewMode === 'table' && (


                <div className="space-y-2">


                  <label className="text-sm font-medium">Kaynak</label>


                  <Select value={leadSourceFilter || 'all'} onValueChange={(v) => {


                    const params = new URLSearchParams(searchParams.toString())


                    if (v === 'all') {


                      params.delete('leadSource')


                      setLeadSourceFilter('')


                    } else {


                      params.set('leadSource', v)


                      setLeadSourceFilter(v)


                    }


                    router.push(`?${params.toString()}`)


                  }}>


                    <SelectTrigger>


                      <SelectValue placeholder="Tümü" />


                    </SelectTrigger>


                    <SelectContent>


                      <SelectItem value="all">Tümü</SelectItem>


                      <SelectItem value="WEB">Web Sitesi</SelectItem>


                      <SelectItem value="EMAIL">E-posta</SelectItem>


                      <SelectItem value="PHONE">Telefon</SelectItem>


                      <SelectItem value="REFERRAL">Referans</SelectItem>


                      <SelectItem value="SOCIAL">Sosyal Medya</SelectItem>


                      <SelectItem value="OTHER">Diğer</SelectItem>


                    </SelectContent>


                  </Select>


                </div>


              )}





              {/* Min Value */}


              <div className="space-y-2">


                <label className="text-sm font-medium">Min Değer (₺)</label>


                <Input


                  type="number"


                  placeholder="0"


                  value={minValue}


                  onChange={(e) => setMinValue(e.target.value)}


                />


              </div>





              {/* Max Value */}


              <div className="space-y-2">


                <label className="text-sm font-medium">Max Değer (₺)</label>


                <Input


                  type="number"


                  placeholder="1000000"


                  value={maxValue}


                  onChange={(e) => setMaxValue(e.target.value)}


                />


              </div>





              {/* Start Date */}


              <div className="space-y-2">


                <label className="text-sm font-medium">{t('startDateLabel')}</label>


                <Input


                  type="date"


                  value={startDate}


                  onChange={(e) => setStartDate(e.target.value)}


                />


              </div>





              {/* End Date */}


              <div className="space-y-2">


                <label className="text-sm font-medium">{t('endDateLabel')}</label>


                <Input


                  type="date"


                  value={endDate}


                  onChange={(e) => setEndDate(e.target.value)}


                />


              </div>


            </div>





            {/* Clear Filters & Apply Date Filters */}


            <div className="mt-4 flex justify-end gap-2">


              <Button


                variant="default"


                size="sm"


                onClick={() => {


                  // Tarih filtrelerini uygula - query'leri yeniden fetch et
                  queryClient.invalidateQueries({ queryKey: ['deals'] })
                  queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })


                }}


              >


                Tarihleri Uygula


              </Button>


              <Button


                variant="outline"


                size="sm"


                onClick={() => {


                  setStage('')


                  setCustomerId('')


                  setSearch('')


                  setMinValue('')


                  setMaxValue('')


                  setStartDate('')


                  setEndDate('')


                  setFilterCompanyId('')


                  const params = new URLSearchParams(searchParams)


                  params.delete('leadSource')


                  router.push(`?${params.toString()}`)


                  // Filtreleri temizledikten sonra query'leri yeniden fetch et
                  queryClient.invalidateQueries({ queryKey: ['deals'] })
                  queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })


                }}


              >


                Filtreleri Temizle


              </Button>


            </div>


          </Card>


        )}


      </div>





      {/* Content */}

      {/* ✅ DEBUG: isOpen ve viewMode kontrolü */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 text-xs rounded">
          <strong>Debug:</strong> isOpen={String(isOpen)}, viewMode={viewMode}, 
          enabled={String(isOpen && viewMode === 'kanban')}, 
          isLoading={String(kanbanQuery.isLoading)}, 
          isError={String(kanbanQuery.isError)}, 
          dataLength={kanbanQuery.data?.length || 0}
        </div>
      )}

      {viewMode === 'kanban' ? (
        <>
          {/* ✅ DEBUG: Query durumu */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-2 p-2 bg-blue-100 text-xs rounded">
              <strong>Query Status:</strong> enabled={String(isOpen && viewMode === 'kanban')}, 
              isLoading={String(kanbanQuery.isLoading)}, 
              isError={String(kanbanQuery.isError)}, 
              isFetching={String(kanbanQuery.isFetching)},
              dataLength={Array.isArray(kanbanQuery.data) ? kanbanQuery.data.length : 0}
            </div>
          )}
          {kanbanQuery.isLoading && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">Kanban yükleniyor...</p>
              </div>
            </div>
          )}
          {kanbanQuery.isError && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <p className="text-sm text-red-600">Kanban yüklenirken bir hata oluştu.</p>
                <p className="text-xs text-red-500 mt-2">{String(kanbanQuery.error)}</p>
                <Button onClick={() => kanbanQuery.refetch()} className="mt-4">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}
          {!kanbanQuery.isLoading && !kanbanQuery.isError && (
            <DealKanbanChart 


              data={kanbanData || []} 


          onEdit={handleEdit}


          onDelete={handleDelete}
          
          onView={(dealId) => {
            setSelectedDealId(dealId)
            setDetailModalOpen(true)
          }} // ✅ ÇÖZÜM: Modal açmak için callback
          
          onQuickAction={(type: 'task' | 'meeting' | 'invoice' | 'quote', deal) => {
            setQuickAction({ type, deal })
          }}

          onStageChange={async (dealId: string, newStage: string) => {
            // ✅ ÇÖZÜM: "new" ID kontrolü - geçersiz ID'ler için hata göster
            if (dealId === 'new' || !dealId || dealId.trim() === '') {
              queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })
              toast.error('Geçersiz Fırsat ID', {
                description: 'Fırsat ID geçersiz. Lütfen sayfayı yenileyin.',
              })
              return
            }

            // ✅ LOST durumuna geçerken önce onay iste, sonra sebep sor
            if (newStage === 'LOST') {
              const deal = kanbanData
                .flatMap((col: any) => col.deals || [])
                .find((d: any) => d.id === dealId) || 
                tableDeals.find((d: any) => d.id === dealId)

              if (deal) {
                const confirmed = await confirm({
                  title: 'Fırsatı Kaybedildi Olarak İşaretle?',
                  description: `Analiz görevi oluşturulacak.`,
                  confirmLabel: 'Kaybedildi',
                  cancelLabel: 'İptal',
                  variant: 'destructive'
                })

                if (!confirmed) {
                  return // İşlemi iptal et
                }

                // Onay verildikten sonra sebep dialog'unu aç
                setLosingDealId(dealId)
                setLostDialogOpen(true)
                return // Dialog açıldı, işlem dialog'dan devam edecek
              }
            }

            // ✅ WON durumuna geçerken onay iste
            if (newStage === 'WON') {
              const deal = kanbanData
                .flatMap((col: any) => col.deals || [])
                .find((d: any) => d.id === dealId) || 
                tableDeals.find((d: any) => d.id === dealId)

              if (deal) {
                const confirmed = await confirm({
                  title: 'Fırsatı Kazanıldı Olarak İşaretle?',
                  description: `Sözleşme oluşturulacak.`,
                  confirmLabel: 'Kazanıldı',
                  cancelLabel: 'İptal',
                  variant: 'default'
                })

                if (!confirmed) {
                  return // İşlemi iptal et
                }
              }
            }

            


            // Deal'ın stage'ini güncelle
            // ✅ OPTİMİZASYON: Timeout ve AbortController ile hızlı hata yakalama
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout - daha hızlı hata yakalama
            
            try {
              const res = await fetch(`/api/deals/${dealId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage }),
                signal: controller.signal,
              })
              
              clearTimeout(timeoutId)


              

              
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                
                // Güvenli hata mesajı oluştur
                let errorMessage: string = 'Fırsat aşaması güncellenemedi'
                
                if (errorData?.message && typeof errorData.message === 'string') {
                  errorMessage = errorData.message
                } else if (errorData?.error && typeof errorData.error === 'string') {
                  errorMessage = errorData.error
                }
                
                // Toast ile hata göster - doğru format
                toast.error('Fırsat Güncellenemedi', {
                  description: errorMessage,
                })
                
                throw new Error(errorMessage)
              }





              const responseData = await res.json()


              const automation = responseData?.automation || {}
              

              


              // Fırsat başlığını al


              const dealTitle = responseData?.title || 'Fırsat'


              


              // Detaylı toast mesajları oluştur


              let toastTitle = ''


              let toastDescription = ''


              let toastType: 'success' | 'warning' | 'info' = 'success'


              

              
              switch (newStage) {


                case 'WON':
                  toastTitle = `🎉 Fırsat Kazanıldı!`
                  toastDescription = `"${dealTitle}" fırsatı kazanıldı olarak işaretlendi.`

                  if (automation.contractCreated && automation.contractId) {
                    const contractId = automation.contractId
                    toastDescription = `Sözleşme oluşturuldu. ${automation.contractTitle ? `"${automation.contractTitle}"` : ''}`
                    toast.success(toastTitle, {
                      description: toastDescription,
                      action: {
                        label: 'Sözleşmeyi Gör',
                        onClick: () => {
                          window.location.href = `/${locale}/contracts/${contractId}`
                        },
                      },
                      duration: 5000,
                    })
                  } else {
                    toastDescription = `İşlem tamamlandı.`
                    toast.success(toastTitle, { description: toastDescription })
                  }
                  break
                  

                  


                case 'LOST':
                  toastTitle = `Fırsat Kaybedildi`
                  toastDescription = automation.taskCreated ? `Analiz görevi oluşturuldu.` : `Kayıp sebebi kaydedildi.`
                  toastType = 'warning'
                  break
                  

                  


                default:


                  const currentStageName = stageLabels[newStage] || newStage


                  toastTitle = `Fırsat aşaması güncellendi: "${dealTitle}"`


                  toastDescription = `Fırsat "${currentStageName}" aşamasına taşındı.`


              }





              if (toastType === 'success') {
                toast.success(toastTitle, { description: toastDescription })
              } else if (toastType === 'warning') {
                toast.warning(toastTitle, { description: toastDescription })
              } else {
                toast.success(toastTitle, { description: toastDescription })
              }





              // ✅ OPTİMİZASYON: Cache güncellemelerini background'da yap (blocking yapma)
              Promise.all([
                queryClient.invalidateQueries({ queryKey: ['deals'] }),
                queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
                queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
                queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
                queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle
              ]).catch(() => {}) // Background'da hata olursa sessizce geç
            } catch (error: any) {
              // Optimistic update'i geri al
              queryClient.invalidateQueries({ queryKey: ['kanban-deals'] })
              queryClient.refetchQueries({ queryKey: ['kanban-deals'] })
              
              // ✅ OPTİMİZASYON: Timeout veya network hatası için özel mesaj
              if (error.name === 'AbortError') {
                toast.error('İşlem zaman aşımına uğradı', { 
                  description: 'Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
                  duration: 5000,
                })
              } else {
                // Güvenli hata mesajı oluştur
                let errorMessage: string = 'Fırsat aşaması güncellenemedi'
                
                if (error?.message && typeof error.message === 'string') {
                  errorMessage = error.message
                } else if (error?.error && typeof error.error === 'string') {
                  errorMessage = error.error
                } else if (typeof error === 'string') {
                  errorMessage = error
                }
                
                // Toast ile hata göster - doğru format
                toast.error('Fırsat Güncellenemedi', {
                  description: errorMessage,
                  duration: 5000,
                })
              }
              
              console.error('Stage update error:', error)
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

          <div className="bg-white rounded-lg shadow-card overflow-hidden">


          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
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


              <TableHead>{t('tableHeaders.stage')}</TableHead>


              <TableHead>{t('tableHeaders.value')}</TableHead>


              <TableHead>{t('tableHeaders.customer')}</TableHead>


              <TableHead>{t('tableHeaders.status')}</TableHead>


              <TableHead>Lead Score</TableHead>


              <TableHead>Öncelik Skoru</TableHead>


              <TableHead>Kaynak</TableHead>


              <TableHead>{t('tableHeaders.date')}</TableHead>


              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>


            </TableRow>


          </TableHeader>


          <TableBody>


            {tableDeals.length === 0 ? (


              <TableRow>


                <TableCell colSpan={isSuperAdmin ? 12 : 11} className="text-center py-8 text-gray-500">


                  {t('noDealsFound')}


                </TableCell>


              </TableRow>


            ) : (
              Array.isArray(tableDeals) && tableDeals.length > 0 ? (
                tableDeals.map((deal) => {
                  const isSelected = selectedIds.includes(deal.id)
                  const isImmutable = ['WON', 'LOST'].includes(deal.stage)
                  return (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (!isImmutable) {
                            handleSelectItem(deal.id, checked as boolean)
                          }
                        }}
                        disabled={isImmutable}
                        aria-label={`${deal.title} seç`}
                      />
                    </TableCell>
                  <TableCell className="font-medium">{deal.title}</TableCell>


                  {isSuperAdmin && (


                    <TableCell>


                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">


                        {deal.Company?.name || '-'}


                      </Badge>


                    </TableCell>


                  )}


                  <TableCell>
                    <InlineEditBadge
                      value={deal.stage}
                      options={[
                        { value: 'LEAD', label: stageLabels['LEAD'] || 'Potansiyel' },
                        { value: 'CONTACTED', label: stageLabels['CONTACTED'] || 'İletişim Kuruldu' },
                        { value: 'PROPOSAL', label: stageLabels['PROPOSAL'] || 'Teklif' },
                        { value: 'NEGOTIATION', label: stageLabels['NEGOTIATION'] || 'Pazarlık' },
                        { value: 'WON', label: stageLabels['WON'] || 'Kazanıldı' },
                        { value: 'LOST', label: stageLabels['LOST'] || 'Kaybedildi' },
                      ]}
                      onSave={async (newStage) => {
                        // ✅ WON durumuna geçerken onay iste
                        if (newStage === 'WON') {
                          const confirmed = await confirm({
                            title: 'Fırsatı Kazanıldı Olarak İşaretlemek İstediğinize Emin Misiniz?',
                            description: `"${deal.title}" fırsatını kazanıldı olarak işaretlediğinizde otomatik olarak şu işlemler yapılacak:\n\n• Sözleşme oluşturulacak (Contract)\n• Sözleşme fırsat bilgileriyle doldurulacak\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                            confirmLabel: 'Evet, Kazanıldı Olarak İşaretle',
                            cancelLabel: 'İptal',
                            variant: 'default'
                          })

                          if (!confirmed) {
                            return // İşlemi iptal et
                          }
                        }

                        try {
                          const res = await fetch(`/api/deals/${deal.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stage: newStage }),
                          })
                          if (!res.ok) {
                            const error = await res.json().catch(() => ({}))
                            throw new Error(error.error || 'Aşama güncellenemedi')
                          }
                          const updatedDeal = await res.json()
                          const automation = updatedDeal?.automation || {}
                          
                          // Cache'i güncelle
                          await Promise.all([
                            mutate('/api/deals', undefined, { revalidate: true }),
                            mutate('/api/deals?', undefined, { revalidate: true }),
                            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/deals'), undefined, { revalidate: true }),
                          ])
                          
                          // ✅ Detaylı toast mesajı
                          if (newStage === 'WON') {
                            toast.success('🎉 Fırsat Kazanıldı!', {
                              description: `"${deal.title}" fırsatı kazanıldı olarak işaretlendi.\n\nOtomatik işlemler:\n${automation.contractCreated ? `• Sözleşme oluşturuldu (ID: ${automation.contractId?.substring(0, 8)}...)\n• Sözleşme numarası: ${automation.contractNumber || 'Oluşturuluyor...'}\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                            })
                          } else {
                            toast.success('Aşama güncellendi', { description: `Fırsat "${stageLabels[newStage] || newStage}" aşamasına taşındı.` })
                          }
                        } catch (error: any) {
                          toast.error('Aşama güncellenemedi', { description: String(error?.message || 'Bir hata oluştu.') })
                          throw error
                        }
                      }}
                      disabled={deal.stage === 'WON' || deal.stage === 'LOST'}
                    />
                  </TableCell>


                  <TableCell className="font-semibold">


                    {formatCurrency(deal.value || 0)}


                  </TableCell>


                  <TableCell>


                    {deal.customerId ? (


                      <Link 


                        href={`/${locale}/customers/${deal.customerId}`}


                        className="text-primary-600 hover:underline"


                        prefetch={true}


                      >


                        {t('customerPrefix')}{deal.customerId.substring(0, 8)}


                      </Link>


                    ) : (


                      '-'


                    )}


                  </TableCell>


                  <TableCell>
                    <InlineEditBadge
                      value={deal.stage}
                      options={[
                        { value: 'LEAD', label: 'Potansiyel' },
                        { value: 'CONTACTED', label: 'İletişim Kuruldu' },
                        { value: 'PROPOSAL', label: 'Teklif' },
                        { value: 'NEGOTIATION', label: 'Pazarlık' },
                        { value: 'WON', label: 'Kazanıldı' },
                        { value: 'LOST', label: 'Kaybedildi' },
                      ]}
                          onSave={async (newStage) => {
                            // ✅ WON durumuna geçerken onay iste
                            if (newStage === 'WON') {
                              const confirmed = await confirm({
                                title: 'Fırsatı Kazanıldı Olarak İşaretlemek İstediğinize Emin Misiniz?',
                                description: `"${deal.title}" fırsatını kazanıldı olarak işaretlediğinizde otomatik olarak şu işlemler yapılacak:\n\n• Sözleşme oluşturulacak (Contract)\n• Sözleşme fırsat bilgileriyle doldurulacak\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                confirmLabel: 'Evet, Kazanıldı Olarak İşaretle',
                                cancelLabel: 'İptal',
                                variant: 'default'
                              })

                              if (!confirmed) {
                                return // İşlemi iptal et
                              }
                            }

                            try {
                              const res = await fetch(`/api/deals/${deal.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stage: newStage }),
                              })
                              if (!res.ok) {
                                const error = await res.json().catch(() => ({}))
                                throw new Error(error.error || 'Aşama güncellenemedi')
                              }
                              const updatedDeal = await res.json()
                              const automation = updatedDeal?.automation || {}
                              
                              // Cache'i güncelle
                              await Promise.all([
                                mutate('/api/deals', undefined, { revalidate: true }),
                                mutate('/api/deals?', undefined, { revalidate: true }),
                                mutate((key: string) => typeof key === 'string' && key.startsWith('/api/deals'), undefined, { revalidate: true }),
                              ])
                              
                              // ✅ Detaylı toast mesajı
                              if (newStage === 'WON') {
                                toast.success('🎉 Fırsat Kazanıldı!', {
                                  description: `"${deal.title}" fırsatı kazanıldı olarak işaretlendi.\n\nOtomatik işlemler:\n${automation.contractCreated ? `• Sözleşme oluşturuldu (ID: ${automation.contractId?.substring(0, 8)}...)\n• Sözleşme numarası: ${automation.contractNumber || 'Oluşturuluyor...'}\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                })
                              } else {
                                toast.success('Aşama güncellendi', { description: `Fırsat "${newStage}" aşamasına taşındı.` })
                              }
                            } catch (error: any) {
                              toast.error('Aşama güncellenemedi', { description: String(error?.message || 'Bir hata oluştu.') })
                              throw error
                            }
                          }}
                      disabled={deal.stage === 'WON' || deal.stage === 'LOST'}
                    />
                  </TableCell>


                  <TableCell>


                    <div className="flex items-center gap-2">


                      {deal.leadScore && deal.leadScore.length > 0 ? (


                        <>


                          <span className="font-semibold text-lg">


                            {deal.leadScore && Array.isArray(deal.leadScore) && deal.leadScore.length > 0 ? deal.leadScore[0].score : '-'}


                          </span>


                          <Badge 


                            className={


                              deal.leadScore && Array.isArray(deal.leadScore) && deal.leadScore.length > 0 && deal.leadScore[0]?.temperature === 'HOT' 


                                ? 'bg-red-100 text-red-800' 


                                : deal.leadScore && Array.isArray(deal.leadScore) && deal.leadScore.length > 0 && deal.leadScore[0]?.temperature === 'WARM'


                                ? 'bg-orange-100 text-orange-800'


                                : 'bg-blue-100 text-blue-800'


                            }


                          >


                            {deal.leadScore && Array.isArray(deal.leadScore) && deal.leadScore.length > 0 && deal.leadScore[0]?.temperature === 'HOT' ? '🔥 Sıcak' :


                             deal.leadScore[0].temperature === 'WARM' ? '☀️ Ilık' :


                             ' Soğuk'}


                          </Badge>


                        </>


                      ) : (


                        <span className="text-gray-400">-</span>


                      )}


                    </div>


                  </TableCell>


                  <TableCell>
                    <div className="flex items-center gap-2">
                      {deal.priorityScore !== undefined && deal.priorityScore !== null ? (
                        <span className="font-semibold text-indigo-600">
                          {Math.round(deal.priorityScore)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {deal.isPriority && (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          🔥 Öncelikli
                        </Badge>
                      )}
                    </div>
                  </TableCell>


                  <TableCell>


                    {deal.leadSource ? (


                      <Badge className="bg-blue-100 text-blue-800">


                        {deal.leadSource === 'WEB' ? 'Web Sitesi' :


                         deal.leadSource === 'EMAIL' ? 'E-posta' :


                         deal.leadSource === 'PHONE' ? 'Telefon' :


                         deal.leadSource === 'REFERRAL' ? 'Referans' :


                         deal.leadSource === 'SOCIAL' ? 'Sosyal Medya' :


                         deal.leadSource === 'OTHER' ? 'Diğer' :


                         deal.leadSource}


                      </Badge>


                    ) : (


                      <span className="text-gray-400">-</span>


                    )}


                  </TableCell>


                  <TableCell>


                    {new Date(deal.createdAt).toLocaleDateString('tr-TR')}


                  </TableCell>


                  <TableCell className="text-right">


                    <div className="flex justify-end gap-2">

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('quickActions.open', { name: deal.title })}
                          >
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>{t('quickActions.title')}</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'quote', deal })}
                          >
                            <FileText className="h-4 w-4" />
                            {t('quickActions.createQuote')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'invoice', deal })}
                          >
                            <Receipt className="h-4 w-4" />
                            {t('quickActions.createInvoice')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'task', deal })}
                          >
                            <CheckSquare className="h-4 w-4" />
                            {t('quickActions.createTask')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setQuickAction({ type: 'meeting', deal })}
                          >
                            <Calendar className="h-4 w-4" />
                            {t('quickActions.scheduleMeeting')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Email/SMS/WhatsApp Butonları */}
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (deal.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.email) {
                                      setSelectedDealForCommunication(deal)
                                      setSelectedCustomer(customer)
                                      setEmailDialogOpen(true)
                                    } else {
                                      toast.error('E-posta adresi yok', { description: 'Müşterinin e-posta adresi bulunamadı' })
                                    }
                                  }
                                } catch (error) {
                                  console.error('Customer fetch error:', error)
                                }
                              } else {
                                toast.error('Müşteri yok', { description: 'Bu fırsat için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!deal.customerId}
                          >
                            <Mail className="h-4 w-4" />
                            E-posta Gönder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (deal.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.phone) {
                                      setSelectedDealForCommunication(deal)
                                      setSelectedCustomer(customer)
                                      setSmsDialogOpen(true)
                                    } else {
                                      toast.error('Telefon numarası yok', { description: 'Müşterinin telefon numarası bulunamadı' })
                                    }
                                  }
                                } catch (error) {
                                  console.error('Customer fetch error:', error)
                                }
                              } else {
                                toast.error('Müşteri yok', { description: 'Bu fırsat için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!deal.customerId}
                          >
                            <MessageSquare className="h-4 w-4" />
                            SMS Gönder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (deal.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${deal.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.phone) {
                                      setSelectedDealForCommunication(deal)
                                      setSelectedCustomer(customer)
                                      setWhatsAppDialogOpen(true)
                                    } else {
                                      toast.error('Telefon numarası yok', { description: 'Müşterinin telefon numarası bulunamadı' })
                                    }
                                  }
                                } catch (error) {
                                  console.error('Customer fetch error:', error)
                                }
                              } else {
                                toast.error('Müşteri yok', { description: 'Bu fırsat için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!deal.customerId}
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


                          setSelectedDealId(deal.id)


                          setSelectedDealData(deal)


                          setDetailModalOpen(true)


                        }}


                        aria-label={t('viewDeal', { title: deal.title })}


                      >


                        <Eye className="h-4 w-4 text-gray-600" />


                      </Button>


                      <Button


                        variant="ghost"


                        size="icon"


                        onClick={() => handleEdit(deal)}


                        aria-label={t('editDealAction', { title: deal.title })}


                      >


                        <Edit className="h-4 w-4 text-gray-600" />


                      </Button>


                      <Button


                        variant="ghost"


                        size="icon"


                        onClick={() => {


                          if (deal.stage === 'WON') {


                            toast.warning(t('cannotDeleteWon'), { description: t('cannotDeleteWonMessage') })


                            return


                          }


                          if (deal.status === 'CLOSED') {


                            toast.warning(t('cannotDeleteClosed'), { description: t('cannotDeleteClosedMessage') })


                            return


                          }


                          handleDelete(deal.id, deal.title)


                        }}


                        disabled={deal.stage === 'WON' || deal.status === 'CLOSED'}


                        className="text-red-600 hover:text-red-700 disabled:opacity-50"


                        aria-label={t('deleteDealAction', { title: deal.title })}


                        title={


                          deal.stage === 'WON' ? t('cannotDeleteWon') :


                          deal.status === 'CLOSED' ? t('cannotDeleteClosed') :


                          tCommon('delete')


                        }


                      >


                        <Trash2 className="h-4 w-4 text-red-600" />


                      </Button>


                    </div>


                  </TableCell>


                </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 11 : 10} className="text-center py-8 text-gray-500">
                    {t('noDealsFound')}
                  </TableCell>
                </TableRow>
              )
            )}


              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {!Array.isArray(tableDeals) || tableDeals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('noDealsFound')}
              </div>
            ) : (
              tableDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{deal.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <InlineEditBadge
                          value={deal.stage}
                          options={[
                            { value: 'LEAD', label: stageLabels['LEAD'] || 'Potansiyel' },
                            { value: 'CONTACTED', label: stageLabels['CONTACTED'] || 'İletişim Kuruldu' },
                            { value: 'PROPOSAL', label: stageLabels['PROPOSAL'] || 'Teklif' },
                            { value: 'NEGOTIATION', label: stageLabels['NEGOTIATION'] || 'Pazarlık' },
                            { value: 'WON', label: stageLabels['WON'] || 'Kazanıldı' },
                            { value: 'LOST', label: stageLabels['LOST'] || 'Kaybedildi' },
                          ]}
                          onSave={async (newStage) => {
                            // ✅ WON durumuna geçerken onay iste
                            if (newStage === 'WON') {
                              const confirmed = await confirm({
                                title: 'Fırsatı Kazanıldı Olarak İşaretlemek İstediğinize Emin Misiniz?',
                                description: `"${deal.title}" fırsatını kazanıldı olarak işaretlediğinizde otomatik olarak şu işlemler yapılacak:\n\n• Sözleşme oluşturulacak (Contract)\n• Sözleşme fırsat bilgileriyle doldurulacak\n• Bildirim gönderilecek\n• Aktivite geçmişine kaydedilecek\n\nBu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                                confirmLabel: 'Evet, Kazanıldı Olarak İşaretle',
                                cancelLabel: 'İptal',
                                variant: 'default'
                              })

                              if (!confirmed) {
                                return // İşlemi iptal et
                              }
                            }

                            try {
                              const res = await fetch(`/api/deals/${deal.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stage: newStage }),
                              })
                              if (!res.ok) {
                                const error = await res.json().catch(() => ({}))
                                throw new Error(error.error || 'Aşama güncellenemedi')
                              }
                              const updatedDeal = await res.json()
                              const automation = updatedDeal?.automation || {}
                              
                              await Promise.all([
                                mutate('/api/deals', undefined, { revalidate: true }),
                                mutate('/api/deals?', undefined, { revalidate: true }),
                              ])
                              
                              // ✅ Detaylı toast mesajı
                              if (newStage === 'WON') {
                                toast.success('🎉 Fırsat Kazanıldı!', {
                                  description: `"${deal.title}" fırsatı kazanıldı olarak işaretlendi.\n\nOtomatik işlemler:\n${automation.contractCreated ? `• Sözleşme oluşturuldu (ID: ${automation.contractId?.substring(0, 8)}...)\n• Sözleşme numarası: ${automation.contractNumber || 'Oluşturuluyor...'}\n` : ''}• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                                })
                              } else {
                                toastSuccess('Aşama güncellendi', `Fırsat "${stageLabels[newStage] || newStage}" aşamasına taşındı.`)
                              }
                            } catch (error: any) {
                              toastError('Aşama güncellenemedi', error?.message || 'Bir hata oluştu.')
                              throw error
                            }
                          }}
                          disabled={deal.stage === 'WON' || deal.stage === 'LOST'}
                        />
                        <Badge className="font-semibold text-xs">
                          {formatCurrency(deal.value || 0)}
                        </Badge>
                        {isSuperAdmin && deal.Company?.name && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                            {deal.Company.name}
                          </Badge>
                        )}
                      </div>
                      {deal.customerId && (
                        <Link 
                          href={`/${locale}/customers/${deal.customerId}`}
                          className="text-xs text-primary-600 hover:underline mt-1 block"
                          prefetch={true}
                        >
                          {t('customerPrefix')}{deal.customerId.substring(0, 8)}
                        </Link>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-indigo-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => {
                          setSelectedDealId(deal.id)
                          setDetailModalOpen(true)
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          {t('view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(deal)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(deal.id, deal.title)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>


        </div>
        </>
      )}





      {/* Detail Modal */}


      <DealDetailModal


        dealId={selectedDealId}


        open={detailModalOpen}


        onClose={() => {


          setDetailModalOpen(false)


          setSelectedDealId(null)


          setSelectedDealData(null)


        }}


        initialData={selectedDealData || undefined}


      />





      {/* Form Modal */}


      <DealForm


        deal={selectedDeal || undefined}


        open={formOpen}


        onClose={() => {


          setFormOpen(false)


          setSelectedDeal(null)


        }}


        onSuccess={async (savedDeal) => {


          // Başarı bildirimi


          toast.success(
            selectedDeal ? 'Fırsat güncellendi!' : 'Fırsat oluşturuldu!',
            {
              description: selectedDeal 
                ? `${savedDeal.title} başarıyla güncellendi.`
                : `${savedDeal.title} başarıyla oluşturuldu.`
            }
          )


          


          // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster


          // Böylece form kapanmadan önce fırsat listede görünür


          


          // Table view için optimistic update


          if (viewMode === 'table') {


            let updatedDeals: Deal[]


            

            
            if (selectedDeal) {


              // UPDATE: Mevcut kaydı güncelle


              updatedDeals = dealsQuery.data.map((d) =>


                d.id === savedDeal.id ? savedDeal : d


              )


            } else {


              // CREATE: Yeni kaydı listenin başına ekle


              updatedDeals = [savedDeal, ...dealsQuery.data]


            }


            


            // React Query cache'ini güncelle


            queryClient.setQueryData(['deals', stage, customerId, search, minValue, maxValue, startDate, endDate], updatedDeals)


          }


          


          // Tüm query'leri invalidate et - fresh data çek (hem table hem kanban)


          await Promise.all([


            queryClient.invalidateQueries({ queryKey: ['deals'] }),


            queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),


            queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),


          ])


          


          // Refetch yap - anında güncel veri gelsin


          await Promise.all([


            queryClient.refetchQueries({ queryKey: ['deals'] }),


            queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),


            queryClient.refetchQueries({ queryKey: ['stats-deals'] }),


          ])


        }}


      />





      {/* LOST Dialog - Kayıp sebebi sor */}


      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>


        <DialogContent className="sm:max-w-[500px]">


          <DialogHeader>


            <DialogTitle>{t('lostDialog.title')}</DialogTitle>


            <DialogDescription>


              {t('lostDialog.description')}


            </DialogDescription>


          </DialogHeader>


          

          
          <div className="space-y-4 py-4">


            <div className="space-y-2">


              <Label htmlFor="lostReason">{t('lostDialog.reasonLabel')} *</Label>


              <Textarea


                id="lostReason"


                placeholder={t('lostDialog.reasonPlaceholder')}


                value={lostReason}


                onChange={(e) => setLostReason(e.target.value)}


                rows={4}


                className="resize-none"


              />


            </div>


          </div>





          <DialogFooter>


            <Button


              variant="outline"


              onClick={() => {


                setLostDialogOpen(false)


                setLostReason('')


                setLosingDealId(null)


              }}


            >


              {t('lostDialog.cancel')}


            </Button>


            <Button


              variant="destructive"


              onClick={async () => {


                if (!lostReason.trim()) {


                  toast.error(t('lostDialog.reasonRequired'), { description: t('lostDialog.reasonRequiredMessage') })


                  return


                }





                if (!losingDealId) {


                  toast.error(tCommon('error'), { description: t('lostDialog.error') })


                  setLostDialogOpen(false)


                  return


                }





                // Dialog'u kapat


                setLostDialogOpen(false)


                const dealId = losingDealId


                const reason = lostReason.trim()


                setLostReason('')


                setLosingDealId(null)





                // API çağrısı yap - lostReason ile birlikte


                try {


                  const res = await fetch(`/api/deals/${dealId}`, {


                    method: 'PUT',


                    headers: { 'Content-Type': 'application/json' },


                    body: JSON.stringify({ 


                      stage: 'LOST',


                      lostReason: reason,


                    }),


                  })


                  

                  
                  if (!res.ok) {


                    const error = await res.json().catch(() => ({}))


                    throw new Error(error.error || 'Failed to mark deal as lost')


                  }





                  const updatedDeal = await res.json()
                  

                  


                  // Toast mesajı - analiz görevi oluşturulduğunu bildir


                  // ✅ Detaylı toast mesajı - analiz görevi ve bildirim bilgileri
                  const automation = updatedDeal?.automation || {}
                  const dealTitle = updatedDeal?.title || 'Fırsat'
                  
                  let toastDescription = `"${dealTitle}" fırsatı kaybedildi olarak işaretlendi.`
                  
                  if (automation.taskCreated && automation.taskId) {
                    toastDescription += `\n\nOtomatik işlemler:\n• Analiz görevi oluşturuldu (ID: ${automation.taskId.substring(0, 8)}...)\n• Kayıp sebebi not olarak kaydedildi\n• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                  } else {
                    toastDescription += `\n\nOtomatik işlemler:\n• Kayıp sebebi not olarak kaydedildi\n• Bildirim gönderildi\n• Aktivite geçmişine kaydedildi`
                  }

                  toast.warning('⚠️ Fırsat Kaybedildi', {
                    description: toastDescription,
                    action: automation.taskCreated && automation.taskId ? {
                      label: t('lostDialog.goToTasksPage'),
                      onClick: () => window.location.href = `/${locale}/tasks`,
                    } : undefined
                  })





                  // Cache'i invalidate et


                  await Promise.all([


                    queryClient.invalidateQueries({ queryKey: ['deals'] }),


                    queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),


                    queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),


                    queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }),


                    queryClient.invalidateQueries({ queryKey: ['kpis'] }),


                  ])


                  

                  
                  // Refetch yap


                  await Promise.all([


                    queryClient.refetchQueries({ queryKey: ['deals'] }),


                    queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),


                    queryClient.refetchQueries({ queryKey: ['stats-deals'] }),


                    queryClient.refetchQueries({ queryKey: ['deal-kanban'] }),


                    queryClient.refetchQueries({ queryKey: ['kpis'] }),


                  ])


                } catch (error: any) {


                  console.error('Lost error:', error)


                  toast.error(t('lostDialog.markAsLostFailed'), { description: String(error?.message || t('lostDialog.markAsLostFailedMessage')) })


                }


              }}


              disabled={!lostReason.trim()}


            >


              {t('lostDialog.markAsLost')}


            </Button>


          </DialogFooter>


        </DialogContent>


      </Dialog>

      {/* Contextual Wizard - İlk fırsat yoksa */}
      <ContextualWizard
        trigger="first-deal"
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />

      {/* Quick Action Form Modals */}
      <QuoteForm
        open={quickAction?.type === 'quote'}
        onClose={closeQuickAction}
        onSuccess={async (savedQuote) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
          // Form zaten kendi içinde onClose() çağırıyor, bu da closeQuickAction'ı tetikliyor
          // closeQuickAction() tekrar çağrılırsa sonsuz döngü oluşur (Maximum update depth exceeded)
          // Form başarıyla kaydedildi - form'un kendi onClose'u closeQuickAction'ı zaten çağıracak
        }}
        deal={quickAction?.deal}
        customerCompanyId={quickAction?.deal?.companyId}
      />
      <InvoiceForm
        open={quickAction?.type === 'invoice'}
        onClose={closeQuickAction}
        onSuccess={async (savedInvoice) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        customerCompanyId={quickAction?.deal?.companyId}
      />
      <TaskForm
        open={quickAction?.type === 'task'}
        onClose={closeQuickAction}
        onSuccess={async (savedTask) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        deal={quickAction?.deal}
        defaultTitle={quickAction?.deal?.title}
      />
      <MeetingForm
        open={quickAction?.type === 'meeting'}
        onClose={closeQuickAction}
        onSuccess={async (savedMeeting) => {
          // CRITICAL FIX: onSuccess içinde closeQuickAction çağrılmasın
        }}
        deal={quickAction?.deal}
        customerCompanyId={quickAction?.deal?.companyId}
      />

      {/* Email/SMS/WhatsApp Dialog'ları */}
      {emailDialogOpen && selectedDealForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="email"
          options={{
            entityType: 'DEAL',
            entityId: selectedDealForCommunication.id,
            entityTitle: selectedDealForCommunication.title,
            customerEmail: selectedCustomer.email,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultSubject: `Fırsat Bilgisi: ${selectedDealForCommunication.title}`,
            defaultMessage: `Merhaba ${selectedCustomer.name},\n\nFırsat bilgisi: ${selectedDealForCommunication.title}\n\nDeğer: ${selectedDealForCommunication.value ? `₺${selectedDealForCommunication.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}\nAşama: ${selectedDealForCommunication.stage || 'LEAD'}`,
            defaultHtml: `<p>Merhaba ${selectedCustomer.name},</p><p>Fırsat bilgisi: <strong>${selectedDealForCommunication.title}</strong></p><p>Değer: ${selectedDealForCommunication.value ? `₺${selectedDealForCommunication.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p><p>Aşama: ${selectedDealForCommunication.stage || 'LEAD'}</p>`,
            onSent: () => {
              toast.success('E-posta gönderildi', { description: 'Müşteriye deal bilgisi gönderildi' })
            },
          }}
          open={emailDialogOpen}
          onClose={() => {
            setEmailDialogOpen(false)
            setSelectedDealForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {smsDialogOpen && selectedDealForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="sms"
          options={{
            entityType: 'DEAL',
            entityId: selectedDealForCommunication.id,
            entityTitle: selectedDealForCommunication.title,
            customerEmail: selectedCustomer.email,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Fırsat bilgisi: ${selectedDealForCommunication.title}. Değer: ${selectedDealForCommunication.value ? `₺${selectedDealForCommunication.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('SMS gönderildi', { description: 'Müşteriye deal bilgisi gönderildi' })
            },
          }}
          open={smsDialogOpen}
          onClose={() => {
            setSmsDialogOpen(false)
            setSelectedDealForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {whatsAppDialogOpen && selectedDealForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="whatsapp"
          options={{
            entityType: 'DEAL',
            entityId: selectedDealForCommunication.id,
            entityTitle: selectedDealForCommunication.title,
            customerEmail: selectedCustomer.email,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Fırsat bilgisi: ${selectedDealForCommunication.title}. Değer: ${selectedDealForCommunication.value ? `₺${selectedDealForCommunication.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('WhatsApp mesajı gönderildi', { description: 'Müşteriye deal bilgisi gönderildi' })
            },
          }}
          open={whatsAppDialogOpen}
          onClose={() => {
            setWhatsAppDialogOpen(false)
            setSelectedDealForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}





