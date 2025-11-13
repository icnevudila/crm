'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'

// Lazy load TicketForm ve TicketDetailModal - performans için
const TicketForm = dynamic(() => import('./TicketForm'), {
  ssr: false,
  loading: () => null,
})
const TicketDetailModal = dynamic(() => import('./TicketDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  customerId?: string
  assignedTo?: string
  companyId?: string
  User?: { name: string; email: string }
  Company?: {
    id: string
    name: string
  }
  createdAt: string
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-green-100 text-green-800',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-red-100 text-red-800',
}

export default function TicketList() {
  const locale = useLocale()
  const t = useTranslations('tickets')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const statusLabels: Record<string, string> = {
    OPEN: t('statusOpen'),
    IN_PROGRESS: t('statusInProgress'),
    CLOSED: t('statusClosed'),
  }
  
  const priorityLabels: Record<string, string> = {
    LOW: t('priorityLow'),
    MEDIUM: t('priorityMedium'),
    HIGH: t('priorityHigh'),
  }
  
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [selectedTicketData, setSelectedTicketData] = useState<Ticket | null>(null)
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynı id'ye sahip kayıtları tekilleştir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // SWR ile veri çekme (repo kurallarına uygun)
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (priority) params.append('priority', priority)
  if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId) // SuperAdmin için firma filtresi
  
  const apiUrl = `/api/tickets?${params.toString()}`
  const { data: tickets = [], isLoading, error, mutate: mutateTickets } = useData<Ticket[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
  })

  const handleDelete = useCallback(async (id: string, subject: string) => {
    if (!confirm(t('deleteConfirm', { subject }))) {
      return
    }

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete ticket')
      }
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedTickets = tickets.filter((t) => t.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateTickets(updatedTickets, { revalidate: false })
      
      // Tüm diğer ticket URL'lerini de güncelle
      await Promise.all([
        mutate('/api/tickets', updatedTickets, { revalidate: false }),
        mutate('/api/tickets?', updatedTickets, { revalidate: false }),
        mutate(apiUrl, updatedTickets, { revalidate: false }),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(tCommon('error'), error?.message)
    }
  }, [tickets, mutateTickets, apiUrl, t, tCommon])

  const handleAdd = useCallback(() => {
    setSelectedTicket(null)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket)
    setFormOpen(true)
  }, [])

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedTicket(null)
    // Form kapanırken cache'i güncelleme yapılmaz - onSuccess callback'te zaten yapılıyor
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
            action: t('automationClosed'),
            result: t('automationClosedResult'),
            details: [
              t('automationClosedDetails1'),
              t('automationClosedDetails2'),
            ],
          },
          {
            action: t('automationHighPriority'),
            result: t('automationHighPriorityResult'),
            details: [
              t('automationHighPriorityDetails1'),
              t('automationHighPriorityDetails2'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalTickets', { count: tickets.length })}</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('newTicket')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(v) => setFilterCompanyId(v === 'all' ? '' : v)}>
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
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="OPEN">{t('statusOpen')}</SelectItem>
            <SelectItem value="IN_PROGRESS">{t('statusInProgress')}</SelectItem>
            <SelectItem value="CLOSED">{t('statusClosed')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectPriority')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allPriorities')}</SelectItem>
            <SelectItem value="LOW">{t('priorityLow')}</SelectItem>
            <SelectItem value="MEDIUM">{t('priorityMedium')}</SelectItem>
            <SelectItem value="HIGH">{t('priorityHigh')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.subject')}</TableHead>
              {isSuperAdmin && <TableHead>{t('tableHeaders.company')}</TableHead>}
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.priority')}</TableHead>
              <TableHead>{t('tableHeaders.customer')}</TableHead>
              <TableHead>{t('tableHeaders.assignedTo')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                  {t('noTicketsFound')}
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {ticket.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={statusColors[ticket.status] || 'bg-gray-100'}>
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[ticket.priority] || 'bg-gray-100'}>
                      {priorityLabels[ticket.priority] || ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.customerId ? (
                      <Link 
                        href={`/${locale}/customers/${ticket.customerId}`}
                        className="text-primary-600 hover:underline"
                        prefetch={true}
                      >
                        {tCommon('customers')} #{ticket.customerId.substring(0, 8)}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.User?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedTicketId(ticket.id)
                          setSelectedTicketData(ticket)
                          setDetailModalOpen(true)
                        }}
                        aria-label={t('viewTicket', { subject: ticket.subject })}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ticket)}
                        aria-label={t('editTicket', { subject: ticket.subject })}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ticket.id, ticket.subject)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={t('deleteTicket', { subject: ticket.subject })}
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
      </div>

      {/* Detail Modal */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedTicketId(null)
          setSelectedTicketData(null)
        }}
        initialData={selectedTicketData || undefined}
      />

      {/* Form Modal */}
      <TicketForm
        ticket={selectedTicket || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedTicket: Ticket) => {
          // Optimistic update - yeni/ güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
          // Böylece form kapanmadan önce destek talebi listede görünür
          
          let updatedTickets: Ticket[]
          
          if (selectedTicket) {
            // UPDATE: Mevcut kaydı güncelle
            updatedTickets = tickets.map((t) =>
              t.id === savedTicket.id ? savedTicket : t
            )
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            updatedTickets = [savedTicket, ...tickets]
          }
          
          // Cache'i güncelle - optimistic update'i hemen uygula ve koru
          // revalidate: false = background refetch yapmaz, optimistic update korunur
          await mutateTickets(updatedTickets, { revalidate: false })
          
          // Tüm diğer ticket URL'lerini de güncelle (optimistic update)
          await Promise.all([
            mutate('/api/tickets', updatedTickets, { revalidate: false }),
            mutate('/api/tickets?', updatedTickets, { revalidate: false }),
            mutate(apiUrl, updatedTickets, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}





