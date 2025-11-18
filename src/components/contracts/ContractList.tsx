'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, FileText, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Pagination from '@/components/ui/Pagination'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { toast, confirm } from '@/lib/toast'
import dynamic from 'next/dynamic'

// Lazy load ContractForm ve ContractDetailModal - performans için
const ContractForm = dynamic(() => import('./ContractForm'), {
  ssr: false,
  loading: () => null,
})
const ContractDetailModal = dynamic(() => import('./ContractDetailModal'), {
  ssr: false,
  loading: () => null,
})

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
  const t = useTranslations('contracts')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  
  // SuperAdmin kontrolü
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [selectedContractData, setSelectedContractData] = useState<Contract | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  const companies = (companiesData?.companies || []).filter(
    (company, index, self) => index === self.findIndex((c) => c.id === company.id)
  )

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Arama değiştiğinde ilk sayfaya dön
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (type) params.append('type', type)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    params.append('page', currentPage.toString())
    params.append('pageSize', pageSize.toString())
    return `/api/contracts?${params.toString()}`
  }, [debouncedSearch, status, type, isSuperAdmin, filterCompanyId, currentPage, pageSize])
  
  interface ContractsResponse {
    data: Contract[]
    pagination: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }
  
  const { data: response, isLoading, error, mutate: mutateContracts } = useData<ContractsResponse>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const contracts = response?.data || []
  const pagination = response?.pagination || null

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
    if (!(await confirm(t('deleteConfirm', { title })))) {
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
      
      // Success toast göster
      toast.success('Sözleşme silindi', { description: `${title} başarıyla silindi.` })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed'), { description: error?.message || 'Bir hata oluştu' })
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
      DRAFT: t('statusDraft'),
      ACTIVE: t('statusActive'),
      EXPIRED: t('statusExpired'),
      CANCELLED: t('statusCancelled'),
      RENEWED: t('statusRenewed'),
      SUSPENDED: t('statusSuspended'),
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
      SERVICE: t('typeService'),
      PRODUCT: t('typeProduct'),
      SUBSCRIPTION: t('typeSubscription'),
      MAINTENANCE: t('typeMaintenance'),
      LICENSE: t('typeLicense'),
      CONSULTING: t('typeConsulting'),
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
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Sözleşmeler yüklenirken bir hata oluştu.</p>
        <Button onClick={() => mutateContracts()}>Yeniden Dene</Button>
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
            action: t('automationActive'),
            result: t('automationActiveResult'),
            details: [
              t('automationActiveDetails1'),
              t('automationActiveDetails2'),
              t('automationActiveDetails3'),
            ],
          },
          {
            action: t('automationExpired'),
            result: t('automationExpiredResult'),
            details: [
              t('automationExpiredDetails1'),
              t('automationExpiredDetails2'),
              t('automationExpiredDetails3'),
              t('automationExpiredDetails4'),
            ],
          },
          {
            action: t('automationRenewal'),
            result: t('automationRenewalResult'),
            details: [
              t('automationRenewalDetails1'),
              t('automationRenewalDetails2'),
              t('automationRenewalDetails3'),
              t('automationRenewalDetails4'),
            ],
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('totalContracts', { count: contracts.length })}
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('newContract')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isSuperAdmin && (
          <Select value={filterCompanyId || 'all'} onValueChange={(value) => {
            setFilterCompanyId(value === 'all' ? '' : value)
            setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
          }}>
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
        )}
        <Select value={status || 'all'} onValueChange={(value) => {
          setStatus(value === 'all' ? '' : value)
          setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="DRAFT">{t('statusDraft')}</SelectItem>
            <SelectItem value="ACTIVE">{t('statusActive')}</SelectItem>
            <SelectItem value="EXPIRED">{t('statusExpired')}</SelectItem>
            <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
            <SelectItem value="RENEWED">{t('statusRenewed')}</SelectItem>
            <SelectItem value="SUSPENDED">{t('statusSuspended')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type || 'all'} onValueChange={(value) => {
          setType(value === 'all' ? '' : value)
          setCurrentPage(1) // Filtre değiştiğinde ilk sayfaya dön
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('selectType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allTypes')}</SelectItem>
            <SelectItem value="SERVICE">{t('typeService')}</SelectItem>
            <SelectItem value="PRODUCT">{t('typeProduct')}</SelectItem>
            <SelectItem value="SUBSCRIPTION">{t('typeSubscription')}</SelectItem>
            <SelectItem value="MAINTENANCE">{t('typeMaintenance')}</SelectItem>
            <SelectItem value="LICENSE">{t('typeLicense')}</SelectItem>
            <SelectItem value="CONSULTING">{t('typeConsulting')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.contractNumber')}</TableHead>
              <TableHead>{t('tableHeaders.title')}</TableHead>
              <TableHead>{t('tableHeaders.customer')}</TableHead>
              <TableHead>{t('tableHeaders.type')}</TableHead>
              <TableHead>{t('tableHeaders.value')}</TableHead>
              <TableHead>{t('tableHeaders.startDate')}</TableHead>
              <TableHead>{t('tableHeaders.endDate')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {t('noContractsFound')}
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
                          🔄 {t('autoRenewal')}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedContractId(contract.id)
                            setSelectedContractData(contract)
                            setDetailModalOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </Button>
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

      {/* Detail Modal */}
      <ContractDetailModal
        contractId={selectedContractId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedContractId(null)
          setSelectedContractData(null)
        }}
        initialData={selectedContractData || undefined}
      />

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



