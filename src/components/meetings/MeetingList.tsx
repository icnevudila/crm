'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Calendar, Building2, User, FileText, Download, FileSpreadsheet, FileText as FileTextIcon, AlertCircle } from 'lucide-react'
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
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

// Lazy load MeetingForm - performans için
const MeetingForm = dynamic(() => import('./MeetingForm'), {
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
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [userId, setUserId] = useState('all') // Admin filtreleme için
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [expenseWarningOpen, setExpenseWarningOpen] = useState(false)
  const [newMeetingId, setNewMeetingId] = useState<string | null>(null)

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme - debounced search kullanıyoruz
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (dateFrom) params.append('dateFrom', dateFrom)
  if (dateTo) params.append('dateTo', dateTo)
  if (userId && (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN')) {
    params.append('userId', userId)
  }
  
  const apiUrl = `/api/meetings?${params.toString()}`
  const { data: meetings = [], isLoading, error, mutate: mutateMeetings } = useData<Meeting[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
    keepPreviousData: true, // Hata durumunda önceki veriyi göster
    fallbackData: [], // İlk yüklemede boş array göster
  })

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
    if (!confirm(`${title} görüşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete meeting')
      }
      
      // Optimistic update
      const updatedMeetings = meetings.filter((m) => m.id !== id)
      await mutateMeetings(updatedMeetings, { revalidate: false })
      
      await Promise.all([
        mutate('/api/meetings', updatedMeetings, { revalidate: false }),
        mutate('/api/meetings?', updatedMeetings, { revalidate: false }),
        mutate(apiUrl, updatedMeetings, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silinemedi', error?.message)
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
      toast.warning(t('exportFailed'))
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">
            {t('totalMeetings', { count: meetings.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAdd}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('newMeeting')}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
          >
            <FileTextIcon className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
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

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.company')}</TableHead>
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
                  <TableCell colSpan={8}>
                    <div className="h-12 bg-gray-100 animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <MeetingForm
        meeting={selectedMeeting || undefined}
        open={formOpen}
        onClose={handleFormClose}
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
                  window.location.href = `/${locale}/finance?relatedTo=Meeting&relatedId=${newMeetingId}`
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
    </div>
  )
}

