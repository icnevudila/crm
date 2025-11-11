'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/toast'
import { useLocale } from 'next-intl'
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
import TicketForm from './TicketForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

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

const statusLabels: Record<string, string> = {
  OPEN: 'Açık',
  IN_PROGRESS: 'Devam Ediyor',
  CLOSED: 'Kapalı',
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-red-100 text-red-800',
}

const priorityLabels: Record<string, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
}

export default function TicketList() {
  const locale = useLocale()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  
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
    if (!confirm(`${subject} destek talebini silmek istediğinize emin misiniz?`)) {
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
      toast.error('Silinemedi', error?.message)
    }
  }, [tickets, mutateTickets, apiUrl])

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
        title="Destek Talepleri Modülü Otomasyonları"
        automations={[
          {
            action: 'Destek talebini "Kapatıldı" yaparsan',
            result: 'Talep kapatılır ve arşivlenir',
            details: [
              '"Aktiviteler" sayfasında kapanış kaydı görünür',
              'Müşteri memnuniyeti takibi yapılabilir',
            ],
          },
          {
            action: 'Destek talebi yanıtlanmadığında (otomatik)',
            result: 'Yükseltme (escalation) bildirimi gönderilir',
            details: [
              'Belirli süre yanıtlanmayan talepler otomatik yükseltilir',
              'Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
              '"Aktiviteler" sayfasında yükseltme kaydı görünür',
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Destek Talepleri</h1>
          <p className="mt-2 text-gray-600">Toplam {tickets.length} talep</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Talep
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
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
        <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="OPEN">Açık</SelectItem>
            <SelectItem value="IN_PROGRESS">Devam Ediyor</SelectItem>
            <SelectItem value="CLOSED">Kapalı</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority || 'all'} onValueChange={(v) => setPriority(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Öncelik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="LOW">Düşük</SelectItem>
            <SelectItem value="MEDIUM">Orta</SelectItem>
            <SelectItem value="HIGH">Yüksek</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Konu</TableHead>
              {isSuperAdmin && <TableHead>Firma</TableHead>}
              <TableHead>Durum</TableHead>
              <TableHead>Öncelik</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Atanan</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                  Destek talebi bulunamadı
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
                        Müşteri #{ticket.customerId.substring(0, 8)}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.User?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/tickets/${ticket.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`${ticket.subject} destek talebini görüntüle`}>
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ticket)}
                        aria-label={`${ticket.subject} destek talebini düzenle`}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ticket.id, ticket.subject)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`${ticket.subject} destek talebini sil`}
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





