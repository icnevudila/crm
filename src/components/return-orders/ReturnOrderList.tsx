'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ReturnOrderForm from './ReturnOrderForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import RefreshButton from '@/components/ui/RefreshButton'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'

interface ReturnOrder {
  id: string
  returnNumber: string
  invoiceId?: string
  customerId?: string
  reason: string
  status: string
  totalAmount: number
  refundAmount: number
  returnDate: string
  invoice?: { id: string; invoiceNumber?: string; title?: string }
  customer?: { id: string; name?: string; email?: string }
  items?: Array<{
    id: string
    productId?: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product?: { id: string; name?: string; sku?: string }
  }>
  createdAt: string
}

export default function ReturnOrderList() {
  const locale = useLocale()
  const t = useTranslations('returnOrders')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<ReturnOrder | null>(null)
  const [invoiceId, setInvoiceId] = useState<string | null>(null) // Invoice'dan geliyorsa

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // URL'den invoiceId parametresini oku
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const invoiceIdParam = params.get('invoiceId')
      if (invoiceIdParam) {
        setInvoiceId(invoiceIdParam)
      }
    }
  }, [])

  // API URL'ini memoize et
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status) params.append('status', status)
    if (invoiceId) params.append('invoiceId', invoiceId)
    return `/api/return-orders?${params.toString()}`
  }, [debouncedSearch, status, invoiceId])

  const { data: returnOrders = [], isLoading, error, mutate: mutateReturnOrders } = useData<ReturnOrder[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
    refreshInterval: 0, // Auto refresh YOK
  })

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutateReturnOrders(undefined, { revalidate: true }),
      mutate('/api/return-orders', undefined, { revalidate: true }),
      mutate('/api/return-orders?', undefined, { revalidate: true }),
    ])
  }, [mutateReturnOrders])

  const handleEdit = (returnOrder: ReturnOrder) => {
    setSelectedReturnOrder(returnOrder)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, returnNumber: string) => {
    const confirmed = await confirm({
      title: t('deleteConfirm', { returnNumber, defaultMessage: 'İade Siparişini Sil?' }),
      description: t('deleteConfirm', { returnNumber, defaultMessage: `${returnNumber} iade siparişini silmek istediğinize emin misiniz?` }),
      confirmLabel: t('delete', { defaultMessage: 'Sil' }),
      cancelLabel: t('cancel', { defaultMessage: 'İptal' }),
      variant: 'destructive'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const res = await fetch(`/api/return-orders/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete return order')
      }
      
      // Optimistic update
      const updatedReturnOrders = returnOrders.filter((item) => item.id !== id)
      
      await mutateReturnOrders(updatedReturnOrders, { revalidate: false })
      
      await Promise.all([
        mutate('/api/return-orders', updatedReturnOrders, { revalidate: false }),
        mutate('/api/return-orders?', updatedReturnOrders, { revalidate: false }),
        mutate(apiUrl, updatedReturnOrders, { revalidate: false }),
      ])

      toast.success(t('deleteSuccess', { defaultMessage: 'İade siparişi silindi' }), { 
        description: t('deleteSuccessMessage', { returnNumber, defaultMessage: `${returnNumber} başarıyla silindi.` })
      })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(t('deleteFailed', { defaultMessage: 'Silme işlemi başarısız' }), { 
        description: error?.message || t('unknownError', { defaultMessage: 'Bir hata oluştu' })
      })
    }
  }

  const handleFormClose = () => {
    setSelectedReturnOrder(null)
    setFormOpen(false)
  }

  // onSuccess callback'ini memoize et - component'in en üst seviyesinde
  const handleFormSuccess = useCallback(async (savedReturnOrder: ReturnOrder) => {
    let updatedReturnOrders: ReturnOrder[]
    
    if (selectedReturnOrder) {
      updatedReturnOrders = returnOrders.map((item) =>
        item.id === savedReturnOrder.id ? savedReturnOrder : item
      )
    } else {
      updatedReturnOrders = [savedReturnOrder, ...returnOrders]
    }
    
    await mutateReturnOrders(updatedReturnOrders, { revalidate: false })
    
    await Promise.all([
      mutate('/api/return-orders', updatedReturnOrders, { revalidate: false }),
      mutate('/api/return-orders?', updatedReturnOrders, { revalidate: false }),
      mutate(apiUrl, updatedReturnOrders, { revalidate: false }),
    ])
  }, [selectedReturnOrder, returnOrders, mutateReturnOrders, apiUrl])

  // Otomasyon bilgilerini memoize et
  const automations = useMemo(() => [
    {
      action: t('automationApproved', { defaultMessage: 'İade siparişi "Onaylandı" olduğunda' }),
      result: t('automationApprovedResult', { defaultMessage: 'Ürün stoğu otomatik artırılır' }),
      details: [
        t('automationApprovedDetails1', { defaultMessage: 'İade edilen ürünler stoğa geri eklenir' }),
        t('automationApprovedDetails2', { defaultMessage: 'Stok hareketi kaydı oluşturulur' }),
      ],
    },
    {
      action: t('automationCompleted', { defaultMessage: 'İade siparişi "Tamamlandı" olduğunda' }),
      result: t('automationCompletedResult', { defaultMessage: 'Credit Note oluşturulabilir' }),
      details: [
        t('automationCompletedDetails1', { defaultMessage: 'İade işlemi tamamlandı' }),
        t('automationCompletedDetails2', { defaultMessage: 'Alacak dekontu oluşturma önerilir' }),
      ],
    },
  ], [t])

  // Stats URL'ini memoize et
  const statsUrl = useMemo(() => '/api/stats/return-orders', [])

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      {/* İstatistikler */}
      <ModuleStats module="return-orders" statsUrl={statsUrl} />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle', { defaultMessage: 'İade Siparişleri Otomasyonları' })}
        automations={automations}
      />

      {/* Filtreler ve Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 flex-1">
          <div className="flex-1">
            <Input
              placeholder={t('searchPlaceholder', { defaultMessage: 'İade no, sebep ara...' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('selectStatus', { defaultMessage: 'Durum' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses', { defaultMessage: 'Tüm Durumlar' })}</SelectItem>
              <SelectItem value="PENDING">{t('statusPending', { defaultMessage: 'Beklemede' })}</SelectItem>
              <SelectItem value="APPROVED">{t('statusApproved', { defaultMessage: 'Onaylandı' })}</SelectItem>
              <SelectItem value="REJECTED">{t('statusRejected', { defaultMessage: 'Reddedildi' })}</SelectItem>
              <SelectItem value="COMPLETED">{t('statusCompleted', { defaultMessage: 'Tamamlandı' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} />
          <Button 
            onClick={() => {
              setSelectedReturnOrder(null)
              setFormOpen(true)
            }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('newReturnOrder', { defaultMessage: 'Yeni İade' })}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.returnNumber', { defaultMessage: 'İade No' })}</TableHead>
              <TableHead>{t('tableHeaders.invoice', { defaultMessage: 'Fatura' })}</TableHead>
              <TableHead>{t('tableHeaders.customer', { defaultMessage: 'Müşteri' })}</TableHead>
              <TableHead>{t('tableHeaders.reason', { defaultMessage: 'Sebep' })}</TableHead>
              <TableHead>{t('tableHeaders.status', { defaultMessage: 'Durum' })}</TableHead>
              <TableHead>{t('tableHeaders.totalAmount', { defaultMessage: 'Toplam' })}</TableHead>
              <TableHead>{t('tableHeaders.returnDate', { defaultMessage: 'İade Tarihi' })}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions', { defaultMessage: 'İşlemler' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  {t('noReturnOrdersFound', { defaultMessage: 'İade siparişi bulunamadı' })}
                </TableCell>
              </TableRow>
            ) : (
              returnOrders.map((returnOrder) => (
                <TableRow key={returnOrder.id}>
                  <TableCell>
                    <div className="font-medium">{returnOrder.returnNumber}</div>
                  </TableCell>
                  <TableCell>
                    {returnOrder.invoice ? (
                      <Link 
                        href={`/${locale}/invoices/${returnOrder.invoice.id}`}
                        className="text-indigo-600 hover:underline"
                        prefetch={true}
                      >
                        {returnOrder.invoice.invoiceNumber || returnOrder.invoice.title || 'N/A'}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {returnOrder.customer?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={returnOrder.reason}>
                      {returnOrder.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(returnOrder.status)}>
                      {returnOrder.status === 'PENDING' ? t('statusPending', { defaultMessage: 'Beklemede' }) :
                       returnOrder.status === 'APPROVED' ? t('statusApproved', { defaultMessage: 'Onaylandı' }) :
                       returnOrder.status === 'REJECTED' ? t('statusRejected', { defaultMessage: 'Reddedildi' }) :
                       returnOrder.status === 'COMPLETED' ? t('statusCompleted', { defaultMessage: 'Tamamlandı' }) :
                       returnOrder.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(returnOrder.totalAmount || 0)}
                  </TableCell>
                  <TableCell>
                    {new Date(returnOrder.returnDate).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/return-orders/${returnOrder.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(returnOrder)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(returnOrder.id, returnOrder.returnNumber)}
                        className="text-red-600 hover:text-red-700"
                        disabled={returnOrder.status === 'COMPLETED'}
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
      </div>

      {/* Form Modal */}
      <ReturnOrderForm
        returnOrder={selectedReturnOrder || undefined}
        open={formOpen}
        onClose={handleFormClose}
        invoiceId={invoiceId || undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}


