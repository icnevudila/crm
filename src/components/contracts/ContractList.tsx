'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ContractForm from './ContractForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast } from '@/lib/toast'

interface Contract {
  id: string
  contractNumber: string
  title: string
  type: string
  status: string
  value: number
  currency: string
  startDate: string
  endDate: string
  renewalType: string
  autoRenewEnabled: boolean
  customer?: {
    id: string
    name: string
  }
  customerCompany?: {
    id: string
    name: string
  }
  createdAt: string
}

export default function ContractList() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

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
  if (status) params.append('status', status)
  if (type) params.append('type', type)
  
  const apiUrl = `/api/contracts?${params.toString()}`
  const { data: response, isLoading, error, mutate: mutateContracts } = useData<{ data: Contract[] }>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const contracts = response?.data || []

  // Handlers
  const handleAdd = () => {
    setSelectedContract(null)
    setFormOpen(true)
  }

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedContract(null)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`${title} sözleşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete contract')
      }
      
      // Optimistic update
      const updatedContracts = contracts.filter((item) => item.id !== id)
      
      await mutateContracts({ data: updatedContracts }, { revalidate: false })
      
      await Promise.all([
        mutate('/api/contracts', { data: updatedContracts }, { revalidate: false }),
        mutate('/api/contracts?', { data: updatedContracts }, { revalidate: false }),
        mutate(apiUrl, { data: updatedContracts }, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silinemedi', error?.message)
    }
  }

  // Status badge renkleri
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
      RENEWED: 'bg-blue-100 text-blue-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
    }
    const labels: Record<string, string> = {
      DRAFT: 'Taslak',
      ACTIVE: 'Aktif',
      EXPIRED: 'Süresi Dolmuş',
      CANCELLED: 'İptal',
      RENEWED: 'Yenilendi',
      SUSPENDED: 'Askıda',
    }
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {labels[status] || status}
      </Badge>
    )
  }

  // Type badge
  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      SERVICE: 'Hizmet',
      PRODUCT: 'Ürün',
      SUBSCRIPTION: 'Abonelik',
      MAINTENANCE: 'Bakım',
      LICENSE: 'Lisans',
      CONSULTING: 'Danışmanlık',
    }
    return labels[type] || type
  }

  // Format currency
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
    }).format(value)
  }

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR')
  }

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) return <SkeletonList />

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Sözleşmeler yüklenirken hata oluştu
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title="Sözleşmeler Modülü Otomasyonları"
        automations={[
          {
            action: 'Sözleşmeyi "Aktif" yaparsan',
            result: 'Sözleşme başlar ve takip edilir',
            details: [
              'Sözleşme başlangıç tarihi bugün olarak ayarlanır',
              'Yenileme bildirimleri aktif olur (30 gün önce)',
              '"Aktiviteler" sayfasında aktivasyon kaydı görünür',
            ],
          },
          {
            action: 'Sözleşme süresi dolduğunda (otomatik)',
            result: 'Sözleşme otomatik olarak "Süresi Doldu" durumuna geçer',
            details: [
              'Sistem günlük kontrol eder (cron job)',
              'Süresi dolan sözleşmeler otomatik "Süresi Doldu" yapılır',
              'Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
              '"Aktiviteler" sayfasında süre dolma kaydı görünür',
            ],
          },
          {
            action: 'Otomatik yenileme aktifse (autoRenewEnabled = true)',
            result: 'Sözleşme otomatik olarak yenilenir',
            details: [
              'Yeni sözleşme kaydı otomatik oluşturulur (Taslak durumunda)',
              'Eski sözleşme "Yenilendi" durumuna geçer',
              'Sistem içi kullanıcılara (Admin, Sales) bildirim gönderilir',
              '"Aktiviteler" sayfasında yenileme kaydı görünür',
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sözleşmeler</h1>
          <p className="text-gray-600 mt-1">
            {contracts.length} sözleşme bulundu
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Sözleşme
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Sözleşme ara (numara, başlık)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="DRAFT">Taslak</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="EXPIRED">Süresi Dolmuş</SelectItem>
            <SelectItem value="CANCELLED">İptal</SelectItem>
            <SelectItem value="RENEWED">Yenilendi</SelectItem>
            <SelectItem value="SUSPENDED">Askıda</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type || 'all'} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="SERVICE">Hizmet</SelectItem>
            <SelectItem value="PRODUCT">Ürün</SelectItem>
            <SelectItem value="SUBSCRIPTION">Abonelik</SelectItem>
            <SelectItem value="MAINTENANCE">Bakım</SelectItem>
            <SelectItem value="LICENSE">Lisans</SelectItem>
            <SelectItem value="CONSULTING">Danışmanlık</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sözleşme No</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Henüz sözleşme bulunmuyor
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => {
                const daysRemaining = getDaysRemaining(contract.endDate)
                const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30 && contract.status === 'ACTIVE'
                
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {contract.contractNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{contract.title}</div>
                      {contract.autoRenewEnabled && (
                        <Badge variant="outline" className="mt-1 text-xs text-gray-700 border-gray-300">
                          🔄 Otomatik Yenileme
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.customer?.name || contract.customerCompany?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-gray-700 border-gray-300">
                        {getTypeBadge(contract.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">
                          {formatCurrency(contract.value, contract.currency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {formatDate(contract.startDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contract.endDate)}
                        {isExpiringSoon && (
                          <div className="text-xs text-orange-600 mt-1">
                            ⚠️ {daysRemaining} gün kaldı
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/${locale}/contracts/${contract.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contract)}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contract.id, contract.title)}
                          className="text-red-600 hover:text-red-700"
                          disabled={contract.status === 'ACTIVE'}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <ContractForm
        contract={selectedContract || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedContract: Contract) => {
          let updatedContracts: Contract[]
          
          if (selectedContract) {
            updatedContracts = contracts.map((item) =>
              item.id === savedContract.id ? savedContract : item
            )
          } else {
            updatedContracts = [savedContract, ...contracts]
          }
          
          await mutateContracts({ data: updatedContracts }, { revalidate: false })
          
          await Promise.all([
            mutate('/api/contracts', { data: updatedContracts }, { revalidate: false }),
            mutate('/api/contracts?', { data: updatedContracts }, { revalidate: false }),
            mutate(apiUrl, { data: updatedContracts }, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}



