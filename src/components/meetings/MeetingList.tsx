'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast, confirm } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Calendar, Building2, User, FileText, Download, FileSpreadsheet, FileText as FileTextIcon, AlertCircle, Mail, MessageSquare, MessageCircle, Sparkles, List, CalendarDays } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useSession } from '@/hooks/useSession'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import RefreshButton from '@/components/ui/RefreshButton'

// Lazy load MeetingForm - performans için
const MeetingForm = dynamic(() => import('./MeetingForm'), {
  ssr: false,
  loading: () => null,
})

const MeetingDetailModal = dynamic(() => import('./MeetingDetailModal'), {
  ssr: false,
  loading: () => null,
})

const MeetingCalendar = dynamic(() => import('./MeetingCalendar'), {
  ssr: false,
  loading: () => <SkeletonList />,
})

const FinanceForm = dynamic(() => import('@/components/finance/FinanceForm'), {
  ssr: false,
  loading: () => null,
})

interface Meeting {
  id: string
  title: string
  description?: string
  meetingDate: string
  meetingDuration?: number
  location?: string
  status: string
  expenseWarning?: boolean
  companyId: string
  customerId?: string
  dealId?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  Customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  Deal?: {
    id: string
    title: string
    stage?: string
  }
  CreatedBy?: {
    id: string
    name: string
    email?: string
  }
  Company?: {
    id: string
    name: string
  }
  expenses?: any[]
  expenseBreakdown?: {
    fuel: number
    accommodation: number
    food: number
    other: number
    total: number
  }
  totalExpense?: number
}

export default function MeetingList() {
  const locale = useLocale()
  const t = useTranslations('meetings')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userId, setUserId] = useState('all') // Admin filtreleme için
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
  const [selectedMeetingData, setSelectedMeetingData] = useState<Meeting | null>(null)
  const [expenseWarningOpen, setExpenseWarningOpen] = useState(false)
  const [newMeetingId, setNewMeetingId] = useState<string | null>(null)
  const [financeFormOpen, setFinanceFormOpen] = useState(false)
  const [financeFormMeetingId, setFinanceFormMeetingId] = useState<string | null>(null)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false)
  const [selectedMeetingForCommunication, setSelectedMeetingForCommunication] = useState<Meeting | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedDateForForm, setSelectedDateForForm] = useState<Date | null>(null)

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Arama değiştiğinde ilk sayfaya dön
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

  // SWR ile veri çekme - debounced search kullanıyoruz
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (dateFrom) params.append('dateFrom', dateFrom)
    if (dateTo) params.append('dateTo', dateTo)
    if (userId && (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN')) {
      params.append('userId', userId)
    }
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    return `/api/meetings?${params.toString()}`
  }, [debouncedSearch, status, dateFrom, dateTo, userId, session?.user?.role, isSuperAdmin, filterCompanyId, currentPage, pageSize])

  interface MeetingsResponse {
    data: Meeting[]
    pagination: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }
  
  const { data: meetingsData, isLoading, error, mutate: mutateMeetings } = useData<Meeting[] | MeetingsResponse>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })
  
  const meetings = useMemo(() => {
    if (Array.isArray(meetingsData)) return meetingsData
    if (meetingsData && typeof meetingsData === 'object' && 'data' in meetingsData) {
      return (meetingsData as MeetingsResponse).data || []
    }
    return []
  }, [meetingsData])
  
  const pagination = useMemo(() => {
    if (!meetingsData || Array.isArray(meetingsData)) return null
    if (meetingsData && typeof meetingsData === 'object' && 'pagination' in meetingsData) {
      return (meetingsData as MeetingsResponse).pagination || null
    }
    return null
  }, [meetingsData])

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  const handleRefresh = async () => {
    await Promise.all([
      mutateMeetings(undefined, { revalidate: true }),
      mutate('/api/meetings', undefined, { revalidate: true }),
      mutate('/api/meetings?', undefined, { revalidate: true }),
      mutate(apiUrl || '/api/meetings', undefined, { revalidate: true }),
    ])
  }

  // Kullanıcı listesi (Admin filtreleme için) - sadece admin için çek
  const shouldFetchUsers = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
  const { data: users = [] } = useData<any[]>(
    shouldFetchUsers ? '/api/users' : null,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
    }
  )

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    PLANNED: 'Planlandı',
    DONE: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  }

  const handleDelete = async (id: string, title: string) => {
    const tCommon = useTranslations('common')
    if (!(await confirm(tCommon('deleteConfirm', { name: title, item: 'görüşme' })))) {
      return
    }

    const toastId = toast.loading('Siliniyor...')
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız oldu')
      }
      
      // Optimistic update
      const updatedMeetings = meetings.filter((m) => m.id !== id)
      await mutateMeetings(updatedMeetings, { revalidate: false })
      
      await Promise.all([
        mutate('/api/meetings', updatedMeetings, { revalidate: false }),
        mutate('/api/meetings?', updatedMeetings, { revalidate: false }),
        mutate(apiUrl, updatedMeetings, { revalidate: false }),
      ])

      toast.dismiss(toastId)
      toast.success(tCommon('meetingDeletedSuccess'), { description: tCommon('meetingDeletedSuccessMessage') })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.dismiss(toastId)
      toast.error('Silme başarısız', { description: error?.message || 'Silme işlemi sırasında bir hata oluştu.' })
    }
  }

  const handleEdit = useCallback((meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setFormOpen(true)
  }, [])

  const handleAdd = useCallback(() => {
    setSelectedMeeting(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedMeeting(null)
  }, [])

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    try {
      const exportParams = new URLSearchParams()
      if (dateFrom) exportParams.append('dateFrom', dateFrom)
      if (dateTo) exportParams.append('dateTo', dateTo)
      if (status) exportParams.append('status', status)
      
      const res = await fetch(`/api/meetings/export?format=${format}&${exportParams.toString()}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gorusmeler.${format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.warning(t('exportFailed'), { description: t('exportFailedMessage') || 'Dışa aktarma işlemi başarısız oldu' })
    }
  }

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Görüşmeler yüklenirken bir hata oluştu.</p>
        <Button onClick={() => mutateMeetings()}>Yeniden Dene</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationCreated'),
            result: t('automationCreatedResult'),
            details: [
              t('automationCreatedDetails1'),
              t('automationCreatedDetails2'),
            ],
          },
          {
            action: t('automationCompleted'),
            result: t('automationCompletedResult'),
            details: [
              t('automationCompletedDetails1'),
              t('automationCompletedDetails2'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            {t('totalMeetings', { count: meetings.length })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex gap-2 border rounded-lg p-1 bg-gray-50">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-indigo-600 text-white' : ''}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-indigo-600 text-white' : ''}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Takvim
            </Button>
          </div>
          <div className="flex gap-2">
            <RefreshButton onRefresh={handleRefresh} />
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              className="flex-1 sm:flex-initial"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              className="flex-1 sm:flex-initial"
            >
              <FileTextIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newMeeting')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="sm:col-span-2">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="PLANNED">{t('statusPlanned')}</SelectItem>
            <SelectItem value="DONE">{t('statusDone')}</SelectItem>
            <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          placeholder={t('startDate')}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          type="date"
          placeholder={t('endDate')}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      {/* Admin: Kullanıcı Filtresi */}
      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">{t('user')}:</label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('allUsers')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allUsers')}</SelectItem>
              {users.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* SuperAdmin: Firma Filtresi */}
      {isSuperAdmin && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Firma:</label>
          <Select value={filterCompanyId || 'all'} onValueChange={(value) => setFilterCompanyId(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tüm Firmalar" />
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
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <MeetingCalendar
          meetings={meetings}
          onDateClick={(date) => {
            // Tarih tıklandığında yeni meeting formu aç
            setSelectedMeeting(null)
            setSelectedDateForForm(date)
            setFormOpen(true)
          }}
          onMeetingClick={(meeting) => {
            // Meeting tıklandığında detay sayfasına git
            router.push(`/${locale}/meetings/${meeting.id}`)
          }}
          onCreateMeeting={(date) => {
            // Tarih seçildiğinde yeni meeting formu aç
            setSelectedMeeting(null)
            setSelectedDateForForm(date)
            setFormOpen(true)
          }}
        />
      )}

      {/* List View */}
      {viewMode === 'list' && (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.company')}</TableHead>
              {isSuperAdmin && <TableHead>Firma</TableHead>}
              <TableHead>{t('tableHeaders.customer')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.expense')}</TableHead>
              <TableHead>{t('tableHeaders.createdBy')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && meetings.length === 0 ? (
              // Loading skeleton - her satır için
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell colSpan={isSuperAdmin ? 9 : 8}>
                    <div className="h-12 bg-gray-100 animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-gray-500">
                  {t('noMeetingsFound')}
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((meeting) => (
                <motion.tr
                  key={meeting.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${
                    meeting.status === 'DONE' ? 'bg-gray-50' : ''
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <TableCell>
                    {new Date(meeting.meetingDate).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/${locale}/meetings/${meeting.id}`}
                      className="text-primary-600 hover:underline font-medium"
                      prefetch={true}
                    >
                      {meeting.title}
                    </Link>
                    {meeting.expenseWarning && (
                      <AlertCircle className="inline-block ml-2 h-4 w-4 text-amber-600" />
                    )}
                  </TableCell>
                  <TableCell>
                    {meeting.Company ? (
                      <Link
                        href={`/${locale}/companies/${meeting.companyId}`}
                        className="text-primary-600 hover:underline"
                      >
                        {meeting.Company.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      {meeting.Company ? (
                        <Badge variant="outline">{meeting.Company.name}</Badge>
                      ) : '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    {meeting.Customer ? (
                      <Link
                        href={`/${locale}/customers/${meeting.customerId}`}
                        className="text-primary-600 hover:underline"
                      >
                        {meeting.Customer.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[meeting.status] || meeting.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {meeting.totalExpense && meeting.totalExpense > 0 ? (
                      <span className="font-semibold text-green-600">
                        {formatCurrency(meeting.totalExpense)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {meeting.CreatedBy ? (
                      <span className="text-sm text-gray-600">{meeting.CreatedBy.name}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/meetings/${meeting.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || meeting.createdBy === session?.user?.id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(meeting)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(meeting.id, meeting.title)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Hızlı İşlemler">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Hızlı İşlemler</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (meeting.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${meeting.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.email) {
                                      setSelectedMeetingForCommunication(meeting)
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
                                toast.error('Müşteri yok', { description: 'Bu toplantı için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!meeting.customerId}
                          >
                            <Mail className="h-4 w-4" />
                            E-posta Gönder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (meeting.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${meeting.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.phone) {
                                      setSelectedMeetingForCommunication(meeting)
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
                                toast.error('Müşteri yok', { description: 'Bu toplantı için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!meeting.customerId}
                          >
                            <MessageSquare className="h-4 w-4" />
                            SMS Gönder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              if (meeting.customerId) {
                                try {
                                  const customerRes = await fetch(`/api/customers/${meeting.customerId}`)
                                  if (customerRes.ok) {
                                    const customer = await customerRes.json()
                                    if (customer?.phone) {
                                      setSelectedMeetingForCommunication(meeting)
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
                                toast.error('Müşteri yok', { description: 'Bu toplantı için müşteri bilgisi bulunamadı' })
                              }
                            }}
                            disabled={!meeting.customerId}
                          >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp Gönder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        )}
      </div>
      )}

      {/* Form Modal */}
      <MeetingForm
        meeting={selectedMeeting || undefined}
        open={formOpen}
        onClose={() => {
          handleFormClose()
          setSelectedDateForForm(null)
        }}
        initialDate={selectedDateForForm || undefined}
        onSuccess={async (savedMeeting: Meeting) => {
          // Optimistic update
          let updatedMeetings: Meeting[]
          
          if (selectedMeeting) {
            // UPDATE
            updatedMeetings = meetings.map((m) =>
              m.id === savedMeeting.id ? savedMeeting : m
            )
          } else {
            // CREATE
            updatedMeetings = [savedMeeting, ...meetings]
            
            // Gider uyarısı kontrolü
            if (savedMeeting.expenseWarning) {
              setNewMeetingId(savedMeeting.id)
              setExpenseWarningOpen(true)
            }
            
            // Yeni görüşme oluşturulduğunda detay sayfasına yönlendir
            router.push(`/${locale}/meetings/${savedMeeting.id}`)
          }
          
          // Cache'i güncelle
          await mutateMeetings(updatedMeetings, { revalidate: false })
          
          // Tüm ilgili URL'leri güncelle
          await Promise.all([
            mutate('/api/meetings', updatedMeetings, { revalidate: false }),
            mutate('/api/meetings?', updatedMeetings, { revalidate: false }),
            mutate(apiUrl, updatedMeetings, { revalidate: false }),
          ])
        }}
      />

      {/* Detail Modal */}
      {selectedMeetingId && (
        <MeetingDetailModal
          meetingId={selectedMeetingId}
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false)
            setSelectedMeetingId(null)
            setSelectedMeetingData(null)
          }}
          initialData={selectedMeetingData || undefined}
        />
      )}

      {/* Gider Uyarısı Modal */}
      {expenseWarningOpen && newMeetingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
              <h3 className="text-lg font-semibold">Gider Uyarısı</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Bu görüşme için operasyon gideri girilmemiş görünüyor. Gider eklemek ister misiniz?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setExpenseWarningOpen(false)
                  setNewMeetingId(null)
                }}
              >
                Daha Sonra
              </Button>
              <Button
                onClick={() => {
                  setExpenseWarningOpen(false)
                  setFinanceFormMeetingId(newMeetingId)
                  setFinanceFormOpen(true)
                  setNewMeetingId(null)
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Gider Ekle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Finance Form Modal - Operasyon Gideri Ekleme */}
      {financeFormOpen && financeFormMeetingId && (
        <FinanceForm
          open={financeFormOpen}
          onClose={() => {
            setFinanceFormOpen(false)
            setFinanceFormMeetingId(null)
          }}
          onSuccess={async (savedFinance: any) => {
            // Finance kaydı başarıyla oluşturuldu
            // Meeting listesini yenile
            await mutateMeetings(undefined, { revalidate: true })
            await Promise.all([
              mutate('/api/meetings', undefined, { revalidate: true }),
              mutate('/api/meetings?', undefined, { revalidate: true }),
              mutate(apiUrl || '/api/meetings', undefined, { revalidate: true }),
            ])
            
            // Modal'ı kapat
            setFinanceFormOpen(false)
            setFinanceFormMeetingId(null)
            
            // Başarı mesajı göster
            toast.success('Başarılı', { description: 'Operasyon gideri başarıyla eklendi!' })
            
            // Finans sayfasına yönlendir (yeni sekmede açılması için)
            setTimeout(() => {
              window.open(`/${locale}/finance?relatedTo=Meeting&relatedId=${financeFormMeetingId}`, '_blank')
            }, 500)
          }}
          relatedTo="Meeting"
          relatedId={financeFormMeetingId}
        />
      )}
      
      {/* Communication Modals */}
      {emailDialogOpen && selectedMeetingForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="email"
          options={{
            entityType: 'MEETING',
            entityId: selectedMeetingForCommunication.id,
            entityTitle: selectedMeetingForCommunication.title,
            customerEmail: selectedCustomer.email,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultSubject: `Toplantı: ${selectedMeetingForCommunication.title}`,
            defaultMessage: `Merhaba ${selectedCustomer.name},\n\nToplantı bilgisi: ${selectedMeetingForCommunication.title}\n\nTarih: ${selectedMeetingForCommunication.meetingDate ? new Date(selectedMeetingForCommunication.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}\nLokasyon: ${selectedMeetingForCommunication.location || 'Belirtilmemiş'}`,
            defaultHtml: `<p>Merhaba ${selectedCustomer.name},</p><p>Toplantı bilgisi: <strong>${selectedMeetingForCommunication.title}</strong></p><p>Tarih: ${selectedMeetingForCommunication.meetingDate ? new Date(selectedMeetingForCommunication.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}</p><p>Lokasyon: ${selectedMeetingForCommunication.location || 'Belirtilmemiş'}</p>`,
            onSent: () => {
              toast.success('E-posta gönderildi', { description: 'Müşteriye meeting bilgisi gönderildi' })
            },
          }}
          open={emailDialogOpen}
          onClose={() => {
            setEmailDialogOpen(false)
            setSelectedMeetingForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {smsDialogOpen && selectedMeetingForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="sms"
          options={{
            entityType: 'MEETING',
            entityId: selectedMeetingForCommunication.id,
            entityTitle: selectedMeetingForCommunication.title,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Toplantı: ${selectedMeetingForCommunication.title}. Tarih: ${selectedMeetingForCommunication.meetingDate ? new Date(selectedMeetingForCommunication.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('SMS gönderildi', { description: 'Müşteriye meeting bilgisi gönderildi' })
            },
          }}
          open={smsDialogOpen}
          onClose={() => {
            setSmsDialogOpen(false)
            setSelectedMeetingForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
      
      {whatsAppDialogOpen && selectedMeetingForCommunication && selectedCustomer && (
        <AutomationConfirmationModal
          type="whatsapp"
          options={{
            entityType: 'MEETING',
            entityId: selectedMeetingForCommunication.id,
            entityTitle: selectedMeetingForCommunication.title,
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.name,
            defaultMessage: `Merhaba ${selectedCustomer.name}, Toplantı: ${selectedMeetingForCommunication.title}. Tarih: ${selectedMeetingForCommunication.meetingDate ? new Date(selectedMeetingForCommunication.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}`,
            onSent: () => {
              toast.success('WhatsApp mesajı gönderildi', { description: 'Müşteriye meeting bilgisi gönderildi' })
            },
          }}
          open={whatsAppDialogOpen}
          onClose={() => {
            setWhatsAppDialogOpen(false)
            setSelectedMeetingForCommunication(null)
            setSelectedCustomer(null)
          }}
        />
      )}
    </div>
  )
}

