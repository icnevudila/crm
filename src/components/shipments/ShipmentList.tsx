'use client'







import { useState, useEffect, useCallback, useMemo } from 'react'



import { toast, confirm } from '@/lib/toast'



import { useLocale, useTranslations } from 'next-intl'



import { useSession } from '@/hooks/useSession'



import { Plus, Search, Edit, Trash2, Eye, CheckCircle, MoreVertical, Calendar, FileText, Truck, BarChart3, X } from 'lucide-react'



import { motion } from 'framer-motion'



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



  Dialog,



  DialogContent,



  DialogDescription,



  DialogHeader,



  DialogTitle,



} from '@/components/ui/dialog'



import {



  DropdownMenu,



  DropdownMenuContent,



  DropdownMenuItem,



  DropdownMenuLabel,



  DropdownMenuSeparator,



  DropdownMenuTrigger,



} from '@/components/ui/dropdown-menu'



import {



  Tooltip,



  TooltipContent,



  TooltipProvider,



  TooltipTrigger,



} from '@/components/ui/tooltip'



import ShipmentForm from './ShipmentForm'



import SkeletonList from '@/components/skeletons/SkeletonList'



import { AutomationInfo } from '@/components/automation/AutomationInfo'



import Link from 'next/link'



import { useData } from '@/hooks/useData'



import { mutate } from 'swr'



import { formatCurrency } from '@/lib/utils'



import { Card } from '@/components/ui/card'







interface Shipment {



  id: string



  tracking: string



  status: string



  invoiceId?: string



  companyId?: string



  Company?: {



    id: string



    name: string



  }



  createdAt: string



  updatedAt?: string



  estimatedDelivery?: string



  Invoice?: {



    id: string



    title: string



    invoiceNumber?: string



    total: number



    createdAt: string



    Customer?: {



      id: string



      name: string



      email?: string



    }



    Quote?: {



      Deal?: {



        Customer?: {



          id: string



          name: string



          email?: string



        }



      }



    }



  }



  invoiceItems?: Array<{



    id: string



    quantity: number



    unitPrice: number



    total: number



    Product?: {



      id: string



      name: string



      sku?: string



      barcode?: string



      stock?: number



      unit?: string



    }



  }>



  stockMovements?: Array<{



    id: string



    type: string



    quantity: number



    reason?: string



    createdAt: string



    Product?: {



      id: string



      name: string



    }



    User?: {



      id: string



      name: string



      email?: string



    }



  }>



  activities?: Array<{



    id: string



    action: string



    description: string



    createdAt: string



    User?: {



      name: string



      email: string



    }



  }>



}







const statusColors: Record<string, string> = {



  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',



  PENDING: 'bg-gray-100 text-gray-800 border-gray-300',



  APPROVED: 'bg-green-100 text-green-800 border-green-300',



  IN_TRANSIT: 'bg-blue-100 text-blue-800 border-blue-300',



  DELIVERED: 'bg-green-100 text-green-800 border-green-300',



  CANCELLED: 'bg-red-100 text-red-800 border-red-300',



}







const statusRowColors: Record<string, string> = {



  DRAFT: 'bg-gray-50 border-l-4 border-gray-400',



  PENDING: 'bg-amber-50 border-l-4 border-amber-400',



  APPROVED: 'bg-green-100 border-l-4 border-green-600', // Onaylandığında belirgin yeşil - her zaman görünür



  IN_TRANSIT: 'bg-blue-50 border-l-4 border-blue-500',



  DELIVERED: 'bg-emerald-100 border-l-4 border-emerald-600',



  CANCELLED: 'bg-red-50 border-l-4 border-red-500',



}







export default function ShipmentList() {



  const locale = useLocale()



  const t = useTranslations('shipments')



  const tCommon = useTranslations('common')



  const { data: session } = useSession()



  



  const statusLabels: Record<string, string> = {



    DRAFT: t('statusDraft'),



    PENDING: t('statusPending'),



    APPROVED: t('statusApproved'),



    IN_TRANSIT: t('statusInTransit'),



    DELIVERED: t('statusDelivered'),



    CANCELLED: t('statusCancelled'),



  }



  



  // SuperAdmin kontrolü



  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'



  



  const [search, setSearch] = useState('')



  const [statusFilter, setStatusFilter] = useState('')



  const [dateFrom, setDateFrom] = useState('')



  const [dateTo, setDateTo] = useState('')



  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi



  const [formOpen, setFormOpen] = useState(false)



  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)



  const [detailModalOpen, setDetailModalOpen] = useState(false)



  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null)



  const [reportModalOpen, setReportModalOpen] = useState(false)



  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)



  



  // SuperAdmin için firmaları çek



  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(



    isSuperAdmin ? '/api/superadmin/companies' : null,



    { dedupingInterval: 60000, revalidateOnFocus: false }



  )



  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir



  const companies = (companiesData?.companies || []).filter((company, index, self) => 



    index === self.findIndex((c) => c.id === company.id)



  )







  // Debounced search



  const [debouncedSearch, setDebouncedSearch] = useState(search)



  



  useEffect(() => {



    const timer = setTimeout(() => {



      setDebouncedSearch(search)



    }, 300)



    



    return () => clearTimeout(timer)



  }, [search])







  // SWR ile veri çekme



  const params = new URLSearchParams()



  if (debouncedSearch) params.append('search', debouncedSearch)



  if (statusFilter) params.append('status', statusFilter)



  if (dateFrom) params.append('dateFrom', dateFrom)



  if (dateTo) params.append('dateTo', dateTo)



  if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId) // SuperAdmin için firma filtresi



  



  const apiUrl = `/api/shipments?${params.toString()}`



  const { data: shipmentsData = [], isLoading, error, mutate: mutateShipments } = useData<Shipment[]>(apiUrl, {



    dedupingInterval: 5000,



    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma (optimistic update'i koru)



  })







  // API'den dönen veriyi parse et



  const shipments = useMemo(() => {



    return Array.isArray(shipmentsData) ? shipmentsData : []



  }, [shipmentsData])







  // Durum bazlı istatistikler



  const stats = useMemo(() => {



    const draft = shipments.filter(s => s.status === 'DRAFT').length



    const inTransit = shipments.filter(s => s.status === 'IN_TRANSIT').length



    const delivered = shipments.filter(s => s.status === 'DELIVERED').length



    const cancelled = shipments.filter(s => s.status === 'CANCELLED').length



    const approved = shipments.filter(s => s.status === 'APPROVED').length



    const pending = shipments.filter(s => s.status === 'PENDING').length



    



    return {



      total: shipments.length,



      draft,



      pending,



      approved,



      inTransit,



      delivered,



      cancelled,



    }



  }, [shipments])







  // Durum değiştirme



  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {



    // Onaylı sevkiyatlar iptal edilemez



    const currentShipment = shipments.find(s => s.id === id)



    if (currentShipment?.status?.toUpperCase() === 'APPROVED' && newStatus === 'CANCELLED') {



      toast.warning(



        t('cannotCancelApproved'),



        t('cannotCancelApprovedMessage')



      )



      return



    }



    



    setStatusChangingId(id)



    try {



      const res = await fetch(`/api/shipments/${id}/status`, {



        method: 'PUT',



        headers: { 'Content-Type': 'application/json' },



        body: JSON.stringify({ status: newStatus }),



      })







      if (!res.ok) {



        const error = await res.json()



        throw new Error(error.error || t('statusUpdateFailed'))



      }







      const result = await res.json()







      // Debug: API'den dönen veriyi kontrol et



      console.log('API Response:', result)



      console.log('Requested status:', newStatus)



      console.log('Result status:', (result as any)?.status)







      // API'den dönen güncel veriyi kullan (status, estimatedDelivery vb.)



      // result objesi içinde status, updatedAt, estimatedDelivery vb. alanlar var



      // ÖNEMLİ: API'den dönen status'ü kullan, eğer yoksa newStatus kullan



      const updatedStatus = (result as any)?.status || newStatus



      



      console.log('Final updated status:', updatedStatus)



      



      // Optimistic update - API'den dönen veriyi kullan



      // ÖNEMLİ: result objesi içindeki tüm alanları kullan (status, updatedAt, estimatedDelivery vb.)



      const currentShipment = shipments.find(s => s.id === id)



      const updatedShipment = {



        ...currentShipment, // Mevcut sevkiyat verilerini al



        ...(result as any), // API'den dönen tüm güncel verileri üzerine yaz



        status: updatedStatus, // Status'ü kesinlikle güncelle (API'den gelen veya newStatus)



      }



      



      console.log('Updated shipment:', updatedShipment)



      



      const updatedShipments = shipments.map(s =>



        s.id === id ? updatedShipment : s



      )







      // Cache'i güncelle - optimistic update ile (hemen UI'da görünsün)



      // ÖNEMLİ: Önce optimistic update yap (hemen UI'da görünsün)



      await mutateShipments(updatedShipments, { revalidate: false })



      await Promise.all([



        mutate('/api/shipments', updatedShipments, { revalidate: false }),



        mutate('/api/shipments?', updatedShipments, { revalidate: false }),



        mutate(apiUrl, updatedShipments, { revalidate: false }),



      ])



      



      // ÖNEMLİ: Sayfa yenilendiğinde fresh data çekmek için cache'i invalidate et



      // Ama hemen değil, biraz bekleyerek (optimistic update'in görünmesi için)



      // 500ms sonra background'da revalidate yap (sayfa yenilendiğinde fresh data çekilir)



      setTimeout(async () => {



        // Tüm cache'leri invalidate et - sayfa yenilendiğinde fresh data çekilir



        await mutateShipments(undefined, { revalidate: true })



        await Promise.all([



          mutate('/api/shipments', undefined, { revalidate: true }),



          mutate('/api/shipments?', undefined, { revalidate: true }),



          mutate(apiUrl, undefined, { revalidate: true }),



          // ÖNEMLİ: Sevkiyat onaylandığında fatura durumu değiştiği için invoice cache'lerini de invalidate et



          mutate('/api/invoices', undefined, { revalidate: true }),



          mutate('/api/invoices?', undefined, { revalidate: true }),



          mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }),



        ])



      }, 500) // 500ms sonra revalidate (optimistic update görünür, sonra fresh data çekilir)







      // Kullanıcı dostu bildirim mesajı



      const shipmentName = updatedShipment.tracking || updatedShipment.Invoice?.title || `Sevkiyat #${id.substring(0, 8)}`



      const statusLabel = statusLabels[newStatus] || newStatus



      



      let message = ''



      if (newStatus === 'APPROVED') {



        message = `${shipmentName} sevkiyatı başarıyla onaylandı ve ürünler stoktan düşüldü. Faturaya "Sevk Edildi" bildirimi gönderildi.`



        toast.success('Sevkiyat onaylandı!', message)



      } else {



        message = `${shipmentName} sevkiyatının durumu "${statusLabel}" olarak değiştirildi.`



        toast.success('Durum güncellendi!', message)



      }



    } catch (error: any) {



      console.error('Status change error:', error)



      toast.error(



        'Durum güncellenemedi',



        error?.message || 'Sevkiyat durumu değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.'



      )



    } finally {



      setStatusChangingId(null)



    }



  }, [shipments, mutateShipments, apiUrl])







  // Detay modal aç



  const handleViewDetail = useCallback(async (shipment: Shipment) => {



    try {



      // ÖNEMLİ: Önce liste sayfasındaki veriyi kullan (hızlı açılış)



      // Sonra API'den detaylı bilgileri çek (background'da)



      setDetailShipment(shipment) // Hemen modal'ı aç (liste sayfasındaki veri ile)



      setDetailModalOpen(true)



      



      // Background'da detaylı bilgileri çek



      try {



        const res = await fetch(`/api/shipments/${shipment.id}`)



        if (res.ok) {



          const detail = await res.json()



          



          // Debug: API'den gelen veriyi kontrol et



          if (process.env.NODE_ENV === 'development') {



            console.log('Shipment detail from API:', detail)



            console.log('Invoice data from API:', detail.Invoice)



            console.log('InvoiceId from shipment:', detail.invoiceId)



            console.log('Invoice from list page:', shipment.Invoice)



          }



          



          // Eğer API'den Invoice gelmediyse ama liste sayfasında varsa, onu kullan



          if (!detail.Invoice && shipment.Invoice) {



            detail.Invoice = shipment.Invoice



            if (process.env.NODE_ENV === 'development') {



              console.log('Using Invoice from list page:', detail.Invoice)



            }



          }



          



          // invoiceId varsa ama Invoice yoksa, liste sayfasındaki Invoice'ı kullan



          if (detail.invoiceId && !detail.Invoice && shipment.Invoice) {



            detail.Invoice = shipment.Invoice



            if (process.env.NODE_ENV === 'development') {



              console.log('Using Invoice from list page (fallback):', detail.Invoice)



            }



          }



          



          // Detaylı veriyi güncelle (modal zaten açık, veri güncellenir)



          setDetailShipment(detail)



        } else {



          // API hatası - liste sayfasındaki veri ile devam et



          const errorData = await res.json().catch(() => ({}))



          if (process.env.NODE_ENV === 'development') {



            console.warn('Shipment detail API error:', errorData.error || 'Sevkiyat detayları yüklenemedi')



            console.warn('Using list page data instead')



          }



          // Liste sayfasındaki veri ile devam et (zaten setDetailShipment(shipment) yapıldı)



        }



      } catch (fetchError: any) {



        // API hatası - liste sayfasındaki veri ile devam et



        if (process.env.NODE_ENV === 'development') {



          console.warn('Shipment detail fetch error:', fetchError)



          console.warn('Using list page data instead')



        }



        // Liste sayfasındaki veri ile devam et (zaten setDetailShipment(shipment) yapıldı)



      }



    } catch (error: any) {



      console.error('Detail modal error:', error)



      // Hata olsa bile modal'ı kapatma (liste sayfasındaki veri ile açıldı)



    }



  }, [])







  const handleDelete = useCallback(async (id: string, tracking: string, status?: string) => {



    // Onaylı sevkiyatlar silinemez



    if (status?.toUpperCase() === 'APPROVED') {



      toast.warning(



        t('cannotDeleteApproved'),



        t('cannotDeleteApprovedMessage')



      )



      return



    }







    if (!(await confirm(t('deleteConfirm', { tracking: tracking || t('thisShipment') })))) {



      return



    }







    try {



      const res = await fetch(`/api/shipments/${id}`, {



        method: 'DELETE',



      })



      



      if (!res.ok) {



        const errorData = await res.json().catch(() => ({}))



        throw new Error(errorData.error || 'Failed to delete shipment')



      }



      



      // Optimistic update - silinen kaydı listeden kaldır



      const updatedShipments = shipments.filter((s) => s.id !== id)



      



      // Cache'i güncelle - yeni listeyi hemen göster



      await mutateShipments(updatedShipments, { revalidate: false })



      



      // Tüm diğer shipment URL'lerini de güncelle



      await Promise.all([



        mutate('/api/shipments', updatedShipments, { revalidate: false }),



        mutate('/api/shipments?', updatedShipments, { revalidate: false }),



        mutate(apiUrl, updatedShipments, { revalidate: false }),



      ])



      



      // Success toast göster



      toast.success('Sevkiyat silindi', `${tracking || 'Sevkiyat'} başarıyla silindi.`)



      



      // ÖNEMLİ: Background'da cache'i invalidate et (sayfa yenilendiğinde fresh data çekilir)



      setTimeout(async () => {



        await mutateShipments(undefined, { revalidate: true })



        await Promise.all([



          mutate('/api/shipments', undefined, { revalidate: true }),



          mutate('/api/shipments?', undefined, { revalidate: true }),



          mutate(apiUrl, undefined, { revalidate: true }),



        ])



      }, 500)



    } catch (error: any) {



        console.error('Delete error:', error)



      toast.error(



        t('shipmentDeleteFailed'),



        error?.message || t('shipmentDeleteFailedMessage')



      )



    }



  }, [shipments, mutateShipments, apiUrl])







  const handleAdd = useCallback(() => {



    setSelectedShipment(null)



    setFormOpen(true)



  }, [])







  const handleEdit = useCallback((shipment: Shipment) => {



    // Onaylı sevkiyatlar düzenlenemez



    if (shipment.status?.toUpperCase() === 'APPROVED') {



      toast.warning(



        t('cannotEditApproved'),



        t('cannotEditApprovedMessage')



      )



      return



    }



    setSelectedShipment(shipment)



    setFormOpen(true)



  }, [])







  const handleFormClose = useCallback(() => {



    setFormOpen(false)



    setSelectedShipment(null)



  }, [])







  // Müşteri adını al (Invoice'dan)



  const getCustomerName = useCallback((shipment: Shipment) => {



    if (shipment.Invoice?.Customer?.name) {



      return shipment.Invoice.Customer.name



    }



    if (shipment.Invoice?.Quote?.Deal?.Customer?.name) {



      return shipment.Invoice.Quote.Deal.Customer.name



    }



    return '-'



  }, [])







  if (isLoading) {



    return <SkeletonList />



  }







  return (



    <div className="space-y-6">



      {/* Header */}



      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">



        <div>



          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>



          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">{t('totalShipments', { count: stats.total })}</p>



        </div>



        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">



          <Button



            variant="outline"



            onClick={() => setReportModalOpen(true)}



            className="w-full sm:w-auto"
          >



            <BarChart3 className="mr-2 h-4 w-4" />



            {t('reports')}



          </Button>



        <Button



          onClick={handleAdd}



          className="bg-gradient-primary text-white w-full sm:w-auto"



        >



          <Plus className="mr-2 h-4 w-4" />



          {t('newShipment')}



        </Button>



        </div>



      </div>







      {/* 1️⃣ Üst Panel - Durum Bazlı KPI Kartları */}



      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">



        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow"



          onClick={() => setStatusFilter('')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('total')}</p>



              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>



            </div>



            <Truck className="h-8 w-8 text-indigo-500" />



          </div>



        </motion.div>







        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3, delay: 0.1 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 border-gray-400"



          onClick={() => setStatusFilter('DRAFT')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('stats.draft')}</p>



              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>



            </div>



            <FileText className="h-8 w-8 text-gray-500" />



          </div>



        </motion.div>







        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3, delay: 0.2 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 border-blue-400"



          onClick={() => setStatusFilter('IN_TRANSIT')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('stats.inTransit')}</p>



              <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>



            </div>



            <Truck className="h-8 w-8 text-blue-500" />



          </div>



        </motion.div>







        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3, delay: 0.3 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 border-green-400"



          onClick={() => setStatusFilter('DELIVERED')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('stats.delivered')}</p>



              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>



            </div>



            <CheckCircle className="h-8 w-8 text-green-500" />



          </div>



        </motion.div>







        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3, delay: 0.4 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 border-green-400"



          onClick={() => setStatusFilter('APPROVED')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('stats.approved')}</p>



              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>



            </div>



            <CheckCircle className="h-8 w-8 text-green-500" />



          </div>



        </motion.div>







        <motion.div



          initial={{ opacity: 0, y: 20 }}



          animate={{ opacity: 1, y: 0 }}



          transition={{ duration: 0.3, delay: 0.5 }}



          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow border-l-4 border-red-400"



          onClick={() => setStatusFilter('CANCELLED')}



        >



          <div className="flex items-center justify-between">



            <div>



              <p className="text-sm text-gray-600 mb-1">{t('stats.cancelled')}</p>



              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>



            </div>



            <X className="h-8 w-8 text-red-500" />



          </div>



        </motion.div>



      </div>







      {/* Otomasyon Bilgileri */}



      <AutomationInfo



        title={t('automationTitle')}



        automations={[



          {



            action: t('automationApproved'),



            result: t('automationApprovedResult'),



            details: [



              t('automationApprovedDetails'),



            ],



          },



          {



            action: t('automationShipped'),



            result: t('automationShippedResult'),



            details: [



              t('automationShippedDetails1'),



              t('automationShippedDetails2'),



              t('automationShippedDetails3'),



            ],



          },



          {



            action: t('automationDelivered'),



            result: t('automationDeliveredResult'),



            details: [



              t('automationDeliveredDetails1'),



              t('automationDeliveredDetails2'),



              t('automationDeliveredDetails3'),



            ],



          },



        ]}



      />







      {/* 4️⃣ Gelişmiş Filtreleme */}



      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">



        <div className="flex-1 relative w-full sm:min-w-[200px]">



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



          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>



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



        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>



          <SelectTrigger className="w-48">



            <SelectValue placeholder={t('selectStatus')} />



          </SelectTrigger>



          <SelectContent>



            <SelectItem value="all">{t('allStatuses')}</SelectItem>



            <SelectItem value="DRAFT">{t('statusDraft')}</SelectItem>



            <SelectItem value="PENDING">{t('statusPending')}</SelectItem>



            <SelectItem value="APPROVED">{t('statusApproved')}</SelectItem>



            <SelectItem value="IN_TRANSIT">{t('statusInTransit')}</SelectItem>



            <SelectItem value="DELIVERED">{t('statusDelivered')}</SelectItem>



            <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>



          </SelectContent>



        </Select>



        <div className="flex gap-2">



          <Input



            type="date"



            placeholder={t('startDate')}



            value={dateFrom}



            onChange={(e) => setDateFrom(e.target.value)}



            className="w-40"



          />



          <Input



            type="date"



            placeholder={t('endDate')}



            value={dateTo}



            onChange={(e) => setDateTo(e.target.value)}



            className="w-40"



          />



        </div>



      </div>







      {/* Table */}



      <div className="bg-white rounded-lg shadow-card overflow-hidden">



        <Table>



          <TableHeader>



            <TableRow>



              <TableHead>{t('tableHeaders.shipmentName')}</TableHead>



              {isSuperAdmin && <TableHead>{t('tableHeaders.company')}</TableHead>}



              <TableHead>{t('tableHeaders.tracking')}</TableHead>



              <TableHead>{t('tableHeaders.status')}</TableHead>



              <TableHead>{t('tableHeaders.invoice')}</TableHead>



              <TableHead>{t('tableHeaders.customer')}</TableHead>



              <TableHead>{t('tableHeaders.date')}</TableHead>



              <TableHead>{t('tableHeaders.estimatedDelivery')}</TableHead>



              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>



            </TableRow>



          </TableHeader>



          <TableBody>



            {shipments.length === 0 ? (



              <TableRow>



                <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-gray-500">



                  {t('noShipmentsFound')}



                </TableCell>



              </TableRow>



            ) : (



              shipments.map((shipment, index) => {



                // Sevkiyat ismini faturaya göre oluştur



                const shipmentName = shipment.Invoice?.title 



                  ? `${shipment.Invoice.title} faturasına ait Sevkiyat`



                  : shipment.Invoice?.invoiceNumber



                  ? `Fatura #${shipment.Invoice.invoiceNumber} sevkiyatı`



                  : shipment.invoiceId



                  ? `Fatura #${shipment.invoiceId.substring(0, 8)} sevkiyatı`



                  : `Sevkiyat #${shipment.tracking || shipment.id.substring(0, 8)}`



                



                return (



                <motion.tr



                  key={shipment.id}



                  initial={{ opacity: 0, y: 10 }}



                  animate={{ opacity: 1, y: 0 }}



                  transition={{ duration: 0.2, delay: index * 0.02 }}



                  className={`border-b transition-colors ${statusRowColors[shipment.status] || 'bg-white'}`}



                >



                  <TableCell className="font-medium">



                    <div className="flex flex-col">



                      <span className="text-gray-900">{shipmentName}</span>



                      {shipment.tracking && (



                        <span className="text-xs text-gray-500 font-mono mt-1">



                          Takip: {shipment.tracking}



                        </span>



                      )}



                    </div>



                  </TableCell>



                  {isSuperAdmin && (



                    <TableCell>



                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">



                        {shipment.Company?.name || '-'}



                      </Badge>



                    </TableCell>



                  )}



                  <TableCell className="font-medium font-mono text-sm text-gray-600">



                    {shipment.tracking || shipment.id.substring(0, 8)}



                  </TableCell>



                  <TableCell>



                    <div className="flex items-center gap-2">



                      {/* 2️⃣ Inline Durum Dropdown - APPROVED durumunda disabled */}



                      {/* Status'ü uppercase yaparak kontrol et (güvenlik için) */}



                      {shipment.status?.toUpperCase() === 'APPROVED' ? (



                        // Onaylandıktan sonra sadece badge göster (değiştirilemez)



                        <Badge className={statusColors[shipment.status] || 'bg-green-100'}>



                      {statusLabels[shipment.status] || shipment.status}



                    </Badge>



                      ) : (



                        // Onaylanmamış sevkiyatlar için dropdown



                        <>



                          <Select



                            value={shipment.status}



                            onValueChange={(newStatus) => handleStatusChange(shipment.id, newStatus)}



                            disabled={statusChangingId === shipment.id}



                          >



                            <SelectTrigger className="w-32 h-8">



                              <SelectValue />



                            </SelectTrigger>



                            <SelectContent>



                              <SelectItem value="DRAFT">{t('statusDraft')}</SelectItem>



                              <SelectItem value="PENDING">{t('statusPending')}</SelectItem>



                              <SelectItem value="APPROVED">{t('statusApproved')}</SelectItem>



                              <SelectItem value="IN_TRANSIT">{t('statusInTransit')}</SelectItem>



                              <SelectItem value="DELIVERED">{t('statusDelivered')}</SelectItem>



                              <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>



                            </SelectContent>



                          </Select>



                          {/* Onayla Butonu - Sadece DRAFT veya PENDING durumunda */}



                          {/* Status'ü uppercase yaparak kontrol et (güvenlik için) */}



                          {(shipment.status?.toUpperCase() === 'DRAFT' || shipment.status?.toUpperCase() === 'PENDING') && (



                            <Button



                              size="sm"



                              onClick={() => handleStatusChange(shipment.id, 'APPROVED')}



                              disabled={statusChangingId === shipment.id}



                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3"



                            >



                              <CheckCircle className="mr-1 h-3 w-3" />



                              {t('approveButton')}



                            </Button>



                          )}



                        </>



                      )}



                    </div>



                  </TableCell>



                  <TableCell>



                    {/* 3️⃣ Fatura Hover Tooltip */}



                    {shipment.invoiceId ? (



                      shipment.Invoice ? (



                        <TooltipProvider>



                          <Tooltip>



                            <TooltipTrigger asChild>



                              <Link 



                                href={`/${locale}/invoices/${shipment.invoiceId}`}



                                className="text-indigo-600 hover:underline font-medium"



                                prefetch={true}



                              >



                                {shipment.Invoice.title || shipment.Invoice.invoiceNumber || `Fatura #${shipment.invoiceId.substring(0, 8)}`}



                              </Link>



                            </TooltipTrigger>



                            <TooltipContent className="bg-gray-900 text-white p-3">



                              <div className="space-y-1 text-sm">



                                <p><strong>Fatura No:</strong> {shipment.Invoice.invoiceNumber || shipment.invoiceId.substring(0, 8)}</p>



                                <p><strong>Başlık:</strong> {shipment.Invoice.title || '-'}</p>



                                <p><strong>Müşteri:</strong> {getCustomerName(shipment)}</p>



                                <p><strong>Toplam:</strong> {formatCurrency(shipment.Invoice.total || 0)}</p>



                                <p><strong>Tarih:</strong> {new Date(shipment.Invoice.createdAt).toLocaleDateString('tr-TR')}</p>



                              </div>



                            </TooltipContent>



                          </Tooltip>



                        </TooltipProvider>



                      ) : (



                      <Link 



                        href={`/${locale}/invoices/${shipment.invoiceId}`}



                          className="text-indigo-600 hover:underline font-medium"



                        prefetch={true}



                      >



                        Fatura #{shipment.invoiceId.substring(0, 8)}



                      </Link>



                      )



                    ) : (



                      '-'



                    )}



                  </TableCell>



                  <TableCell>



                    {getCustomerName(shipment)}



                  </TableCell>



                  <TableCell>



                    {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}



                  </TableCell>



                  <TableCell>



                    {/* 9️⃣ Otomatik Teslim Tarihi */}



                    {shipment.estimatedDelivery ? (



                      <div className="flex items-center gap-1 text-sm text-gray-600">



                        <Calendar className="h-4 w-4" />



                        {new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')}



                      </div>



                    ) : (



                      <span className="text-gray-400">-</span>



                    )}



                  </TableCell>



                  <TableCell className="text-right">



                    <div className="flex justify-end gap-2">



                      {/* 7️⃣ Context Menü (3-dot) - Onaylı sevkiyatlar için sadece görüntüle */}



                      {shipment.status?.toUpperCase() === 'APPROVED' ? (



                        // Onaylı sevkiyatlar için sadece görüntüle butonu (tek göz ikonu)



                        <Button



                          variant="ghost"



                          size="icon"



                          onClick={() => handleViewDetail(shipment)}



                          aria-label="Detayları görüntüle"



                        >



                          <Eye className="h-4 w-4 text-gray-600" />



                        </Button>



                      ) : (



                        // Onaylanmamış sevkiyatlar için göz ikonu + context menü



                        <>



                          {/* 5️⃣ Göz İkonu - Detay Modal */}



                          <Button



                            variant="ghost"



                            size="icon"



                            onClick={() => handleViewDetail(shipment)}



                            aria-label="Detayları görüntüle"



                          >



                            <Eye className="h-4 w-4 text-gray-600" />



                          </Button>



                          



                          {/* Context Menü (3-dot) */}



                          <DropdownMenu>



                            <DropdownMenuTrigger asChild>



                              <Button variant="ghost" size="icon">



                                <MoreVertical className="h-4 w-4 text-gray-600" />



                              </Button>



                            </DropdownMenuTrigger>



                            <DropdownMenuContent align="end">



                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>



                              <DropdownMenuSeparator />



                              <DropdownMenuItem onClick={() => handleEdit(shipment)}>



                                <Edit className="mr-2 h-4 w-4" />



                                Düzenle



                              </DropdownMenuItem>



                              <DropdownMenuItem onClick={() => handleViewDetail(shipment)}>



                                <Eye className="mr-2 h-4 w-4" />



                                Görüntüle



                              </DropdownMenuItem>



                              {shipment.invoiceId && (



                                <DropdownMenuItem asChild>



                                  <Link href={`/${locale}/invoices/${shipment.invoiceId}`} className="flex items-center">



                                    <FileText className="mr-2 h-4 w-4" />



                                    Faturaya Git



                                  </Link>



                                </DropdownMenuItem>



                              )}



                              {/* Onaylı sevkiyatlar için iptal butonu gösterilmez */}



                              {shipment.status?.toUpperCase() !== 'APPROVED' && (



                                <DropdownMenuItem 



                                  onClick={() => handleStatusChange(shipment.id, 'CANCELLED')}



                                  className="text-red-600"



                                >



                                  <X className="mr-2 h-4 w-4" />



                                  İptal Et



                                </DropdownMenuItem>



                              )}



                              <DropdownMenuSeparator />



                              <DropdownMenuItem 



                                onClick={() => {



                                  if (shipment.status === 'DELIVERED') {



                                    toast.warning(



                                      'Teslim edilmiş sevkiyat silinemez',



                                      'Bu sevkiyat müşteriye teslim edildi ve işlem tamamlandı. Silmek için önce sevkiyat durumunu değiştirin.'



                                    )



                                    return



                                  }



                                  handleDelete(shipment.id, shipment.tracking || '', shipment.status)



                                }}



                                disabled={shipment.status === 'DELIVERED'}



                                className="text-red-600 disabled:opacity-50"



                              >



                                <Trash2 className="mr-2 h-4 w-4" />



                                Sil



                              </DropdownMenuItem>



                            </DropdownMenuContent>



                          </DropdownMenu>



                        </>



                      )}



                    </div>



                  </TableCell>



                </motion.tr>



                )



              })



            )}



          </TableBody>



        </Table>



      </div>







      {/* 5️⃣ Sevkiyat Detay Modalı */}



      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>



        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">



          <DialogHeader>



            <DialogTitle>



              {(() => {



                const shipmentName = detailShipment?.Invoice?.title 



                  ? `${detailShipment.Invoice.title} faturasına ait Sevkiyat`



                  : detailShipment?.Invoice?.invoiceNumber



                  ? `Fatura #${detailShipment.Invoice.invoiceNumber} sevkiyatı`



                  : detailShipment?.invoiceId



                  ? `Fatura #${detailShipment.invoiceId.substring(0, 8)} sevkiyatı`



                  : `Sevkiyat #${detailShipment?.tracking || detailShipment?.id.substring(0, 8)}`



                return shipmentName



              })()}



            </DialogTitle>



            <DialogDescription>



              Sevkiyat detayları, ürün listesi ve stok hareketleri



            </DialogDescription>



          </DialogHeader>



          



          {detailShipment && (



            <div className="space-y-6">



              {/* Sevkiyat Bilgileri */}



              <Card className="p-4">



                <div className="flex items-center justify-between mb-3">



                  <h3 className="font-semibold">Sevkiyat Bilgileri</h3>



                  {/* Onay Butonu - Sadece DRAFT veya PENDING durumunda göster */}



                  {/* APPROVED durumunda buton görünmez (onaylandıktan sonra değiştirilemez) */}



                  {(detailShipment.status === 'DRAFT' || detailShipment.status === 'PENDING') && (



                    <Button



                      onClick={() => handleStatusChange(detailShipment.id, 'APPROVED')}



                      disabled={statusChangingId === detailShipment.id}



                      className="bg-green-600 hover:bg-green-700 text-white"



                    >



                      <CheckCircle className="mr-2 h-4 w-4" />



                      {statusChangingId === detailShipment.id ? 'Onaylanıyor...' : 'Onayla'}



                    </Button>



                  )}



                  {/* Onaylandıktan sonra durum badge'i göster */}



                  {detailShipment.status === 'APPROVED' && (



                    <Badge className={statusColors[detailShipment.status] || 'bg-green-100'}>



                      <CheckCircle className="mr-1 h-3 w-3" />



                      {statusLabels[detailShipment.status] || detailShipment.status}



                    </Badge>



                  )}



                </div>



                <div className="grid grid-cols-2 gap-4">



                  <div>



                    <p className="text-sm text-gray-600">Durum</p>



                    <Badge className={statusColors[detailShipment.status] || 'bg-gray-100'}>



                      {statusLabels[detailShipment.status] || detailShipment.status}



                    </Badge>



                  </div>



                  <div>



                    <p className="text-sm text-gray-600">Takip Numarası</p>



                    <p className="font-mono">{detailShipment.tracking || '-'}</p>



                  </div>



                  <div>



                    <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>



                    <p>{new Date(detailShipment.createdAt).toLocaleString('tr-TR')}</p>



                  </div>



                  {detailShipment.estimatedDelivery && (



                    <div>



                      <p className="text-sm text-gray-600">Tahmini Teslim Tarihi</p>



                      <p>{new Date(detailShipment.estimatedDelivery).toLocaleDateString('tr-TR')}</p>



                    </div>



                  )}



                </div>



              </Card>







              {/* Fatura Bilgisi */}



              {detailShipment.Invoice ? (



                <Card className="p-4">



                  <h3 className="font-semibold mb-3">İlgili Fatura</h3>



                  <div className="space-y-3">



                    <div className="flex items-center justify-between">



                      <div className="flex-1">



                        <Link



                          href={`/${locale}/invoices/${detailShipment.Invoice.id}`}



                          className="text-indigo-600 hover:underline font-medium text-lg"



                        >



                          {detailShipment.Invoice.title || 'Fatura'}



                        </Link>



                        {detailShipment.Invoice.invoiceNumber && (



                          <p className="text-sm text-gray-500 mt-1">



                            Fatura No: {detailShipment.Invoice.invoiceNumber}



                          </p>



                        )}



                      </div>



                      <Badge className={statusColors[(detailShipment.Invoice as any).status] || 'bg-gray-100'}>



                        {(detailShipment.Invoice as any).status || 'DRAFT'}



                      </Badge>



                    </div>



                    {/* Fatura Detayları - KDV, İndirim, Ara Toplam */}



                    {(() => {



                      const taxRate = (detailShipment.Invoice as any).taxRate || 18



                      const invoiceItems = detailShipment.invoiceItems || []



                      const itemsTotal = invoiceItems.reduce(



                        (sum: number, item: any) =>



                          sum + ((item.unitPrice || item.price || 0) * (item.quantity || 0)),



                        0



                      )



                      const discount = (detailShipment.Invoice as any).discount || 0



                      const subtotal = itemsTotal - discount



                      const taxAmount = (subtotal * taxRate) / 100



                      const totalWithTax = subtotal + taxAmount



                      // Invoice'dan gelen total'ı kullan (eğer varsa), yoksa hesaplanan total'ı kullan



                      const finalTotal = (detailShipment.Invoice as any).total || totalWithTax







                      return (



                        <div className="space-y-3 pt-3 border-t">



                          <div className="grid grid-cols-2 gap-4">



                            <div>



                              <p className="text-sm text-gray-600">Ara Toplam (KDV Hariç)</p>



                              <p className="text-lg font-semibold text-gray-900">



                                {formatCurrency(itemsTotal)}



                              </p>



                            </div>



                            <div>



                              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>



                              <p className="text-sm text-gray-900">



                                {new Date(detailShipment.Invoice.createdAt).toLocaleDateString('tr-TR', {



                                  year: 'numeric',



                                  month: 'long',



                                  day: 'numeric',



                                  hour: '2-digit',



                                  minute: '2-digit',



                                })}



                              </p>



                            </div>



                          </div>



                          {discount > 0 && (



                            <div className="pt-2 border-t">



                              <div className="flex justify-between items-center">



                                <p className="text-sm text-gray-600">İndirim</p>



                                <p className="text-sm font-semibold text-red-600">



                                  -{formatCurrency(discount)}



                                </p>



                              </div>



                            </div>



                          )}



                          <div className="pt-2 border-t">



                            <div className="flex justify-between items-center">



                              <p className="text-sm text-gray-600">Ara Toplam (İndirim Sonrası)</p>



                              <p className="text-sm font-semibold text-gray-700">



                                {formatCurrency(subtotal)}



                              </p>



                            </div>



                          </div>



                          <div className="pt-2 border-t">



                            <div className="flex justify-between items-center">



                              <p className="text-sm text-gray-600">KDV (%{taxRate})</p>



                              <p className="text-sm font-semibold text-gray-700">



                                {formatCurrency(taxAmount)}



                              </p>



                            </div>



                          </div>



                          <div className="pt-2 border-t">



                            <div className="flex justify-between items-center">



                              <p className="text-sm font-semibold text-gray-900">Genel Toplam (KDV Dahil)</p>



                              <p className="text-xl font-bold text-indigo-600">



                                {formatCurrency(finalTotal)}



                              </p>



                            </div>



                          </div>



                        </div>



                      )



                    })()}



                    {detailShipment.Invoice.Customer && (



                      <div className="pt-3 border-t">



                        <p className="text-sm text-gray-600 mb-1">Müşteri</p>



                        <p className="font-medium">{detailShipment.Invoice.Customer.name}</p>



                        {detailShipment.Invoice.Customer.email && (



                          <p className="text-sm text-gray-500">{detailShipment.Invoice.Customer.email}</p>



                        )}



                      </div>



                    )}



                    <div className="pt-3 border-t">



                      <Link



                        href={`/${locale}/invoices/${detailShipment.Invoice.id}`}



                        className="text-sm text-indigo-600 hover:underline inline-flex items-center gap-1"



                      >



                        Fatura detay sayfasına git →



                      </Link>



                    </div>



                  </div>



                </Card>



              ) : (



                <Card className="p-4">



                  <h3 className="font-semibold mb-3">İlgili Fatura</h3>



                  <p className="text-sm text-gray-500">



                    Bu sevkiyat için fatura bulunamadı.



                  </p>



                </Card>



              )}







              {/* Ürün Listesi - InvoiceItem'ları göster */}



              <Card className="p-4">



                <h3 className="font-semibold mb-3">Sevkiyat İçeriği</h3>



                {detailShipment.invoiceItems && detailShipment.invoiceItems.length > 0 ? (



                  <div className="overflow-x-auto">



                    <Table>



                      <TableHeader>



                        <TableRow>



                          <TableHead>Ürün</TableHead>



                          <TableHead>SKU/Barkod</TableHead>



                          <TableHead className="text-right">Miktar</TableHead>



                          <TableHead className="text-right">Birim Fiyat</TableHead>



                          <TableHead className="text-right">Toplam</TableHead>



                          <TableHead className="text-right">Stok</TableHead>



                        </TableRow>



                      </TableHeader>



                      <TableBody>



                        {detailShipment.invoiceItems.map((item: any) => (



                          <TableRow key={item.id}>



                            <TableCell className="font-medium">



                              {item.Product?.name || 'Ürün bulunamadı'}



                            </TableCell>



                            <TableCell className="text-sm text-gray-500 font-mono">



                              {item.Product?.sku || item.Product?.barcode || '-'}



                            </TableCell>



                            <TableCell className="text-right">



                              {item.quantity} {item.Product?.unit || 'adet'}



                            </TableCell>



                            <TableCell className="text-right">



                              {formatCurrency(item.unitPrice || item.price || 0)}



                            </TableCell>



                            <TableCell className="text-right font-semibold">



                              {formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 0))}



                            </TableCell>



                            <TableCell className="text-right">



                              <Badge variant={item.Product?.stock && item.Product.stock < (item.Product.minStock || 0) ? 'destructive' : 'secondary'}>



                                {item.Product?.stock !== undefined ? item.Product.stock : '-'}



                              </Badge>



                            </TableCell>



                          </TableRow>



                        ))}



                      </TableBody>



                    </Table>



                    <div className="mt-4 pt-4 border-t">



                      <div className="flex justify-end">



                        <div className="w-full max-w-md space-y-2 text-sm">



                          {(() => {



                            const invoice = detailShipment.Invoice as any



                            const taxRate = invoice?.taxRate || 18



                            const itemsTotal = detailShipment.invoiceItems.reduce(



                              (sum: number, item: any) =>



                                sum + ((item.unitPrice || item.price || 0) * (item.quantity || 0)),



                              0



                            )



                            const discount = invoice?.discount || 0



                            const subtotal = itemsTotal - discount



                            const taxAmount = (subtotal * taxRate) / 100



                            const totalWithTax = subtotal + taxAmount



                            



                            return (



                              <>



                                <div className="flex justify-between text-gray-600">



                                  <span>Ara Toplam (KDV Hariç):</span>



                                  <span className="font-medium">{formatCurrency(itemsTotal)}</span>



                                </div>



                                {discount > 0 && (



                                  <div className="flex justify-between text-red-600">



                                    <span>İndirim:</span>



                                    <span className="font-medium">-{formatCurrency(discount)}</span>



                                  </div>



                                )}



                                <div className="flex justify-between text-gray-600">



                                  <span>KDV (%{taxRate}):</span>



                                  <span className="font-medium">{formatCurrency(taxAmount)}</span>



                                </div>



                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">



                                  <span>Genel Toplam (KDV Dahil):</span>



                                  <span>{formatCurrency(totalWithTax)}</span>



                                </div>



                              </>



                            )



                          })()}



                        </div>



                      </div>



                    </div>



                  </div>



                ) : (



                  <p className="text-sm text-gray-500">



                    Bu sevkiyat için ürün bulunamadı. Ürün listesi fatura detay sayfasından görüntülenebilir.



                  </p>



                )}



              </Card>







              {/* Stok Hareketleri - StockMovement'ları göster */}



              <Card className="p-4">



                <h3 className="font-semibold mb-3">Stok Hareketleri</h3>



                {detailShipment.stockMovements && detailShipment.stockMovements.length > 0 ? (



                  <div className="overflow-x-auto">



                    <Table>



                      <TableHeader>



                        <TableRow>



                          <TableHead>Ürün</TableHead>



                          <TableHead>Hareket Tipi</TableHead>



                          <TableHead className="text-right">Miktar</TableHead>



                          <TableHead>Neden</TableHead>



                          <TableHead>Kullanıcı</TableHead>



                          <TableHead>Tarih</TableHead>



                        </TableRow>



                      </TableHeader>



                      <TableBody>



                        {detailShipment.stockMovements.map((movement: any) => (



                          <TableRow key={movement.id}>



                            <TableCell className="font-medium">



                              {movement.Product?.name || 'Ürün bulunamadı'}



                            </TableCell>



                            <TableCell>



                              <Badge



                                variant={movement.type === 'IN' ? 'default' : 'destructive'}



                                className={



                                  movement.type === 'IN'



                                    ? 'bg-green-100 text-green-800'



                                    : 'bg-red-100 text-red-800'



                                }



                              >



                                {movement.type === 'IN' ? 'Giriş' : 'Çıkış'}



                              </Badge>



                            </TableCell>



                            <TableCell className="text-right font-semibold">



                              {movement.type === 'IN' ? '+' : '-'}



                              {Math.abs(movement.quantity || 0)}



                            </TableCell>



                            <TableCell className="text-sm text-gray-600">



                              {movement.reason || '-'}



                            </TableCell>



                            <TableCell className="text-sm text-gray-600">



                              {movement.User?.name || '-'}



                            </TableCell>



                            <TableCell className="text-sm text-gray-500">



                              {new Date(movement.createdAt).toLocaleString('tr-TR')}



                            </TableCell>



                          </TableRow>



                        ))}



                      </TableBody>



                    </Table>



                  </div>



                ) : (



                  <p className="text-sm text-gray-500">



                    Bu sevkiyat için stok hareketi bulunamadı. Stok hareketleri ürün detay sayfasından görüntülenebilir.



                  </p>



                )}



              </Card>



            </div>



          )}



        </DialogContent>



      </Dialog>







      {/* 1️⃣0️⃣ Raporlama Modalı */}



      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>



        <DialogContent className="max-w-2xl">



          <DialogHeader>



            <DialogTitle>Sevkiyat Raporları</DialogTitle>



            <DialogDescription>



              Sevkiyat istatistikleri ve analizler



            </DialogDescription>



          </DialogHeader>



          



          <div className="space-y-4">



            <Card className="p-4">



              <h3 className="font-semibold mb-3">Özet İstatistikler</h3>



              <div className="grid grid-cols-2 gap-4">



                <div>



                  <p className="text-sm text-gray-600">Toplam Sevkiyat</p>



                  <p className="text-2xl font-bold">{stats.total}</p>



                </div>



                <div>



                  <p className="text-sm text-gray-600">Teslim Edilen</p>



                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>



                </div>



                <div>



                  <p className="text-sm text-gray-600">Yolda</p>



                  <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>



                </div>



                <div>



                  <p className="text-sm text-gray-600">İptal Oranı</p>



                  <p className="text-2xl font-bold text-red-600">



                    {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}%



                  </p>



                </div>



              </div>



            </Card>



          </div>



        </DialogContent>



      </Dialog>







      {/* Form Modal */}



      <ShipmentForm



        shipment={selectedShipment || undefined}



        open={formOpen}



        onClose={handleFormClose}



        onSuccess={async (savedShipment: Shipment) => {



          let updatedShipments: Shipment[]



          



          if (selectedShipment) {



            updatedShipments = shipments.map((s) =>



              s.id === savedShipment.id ? savedShipment : s



            )



          } else {



            updatedShipments = [savedShipment, ...shipments]



          }



          



          await mutateShipments(updatedShipments, { revalidate: false })



          await Promise.all([



            mutate('/api/shipments', updatedShipments, { revalidate: false }),



            mutate('/api/shipments?', updatedShipments, { revalidate: false }),



            mutate(apiUrl, updatedShipments, { revalidate: false }),



          ])



        }}



      />



    </div>



  )



}



