'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast, toastSuccess, toastError, confirm } from '@/lib/toast'
import { Plus, Search, Edit, Trash2, Eye, CheckCircle, MoreVertical, Calendar, FileText, PackageCheck, BarChart3, X } from 'lucide-react'
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
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Lazy load InvoiceForm - performans için
const InvoiceForm = dynamic(() => import('../invoices/InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

interface PurchaseShipment {
  id: string
  status: string
  invoiceId?: string
  createdAt: string
  updatedAt?: string
  Invoice?: {
    id: string
    title: string
    invoiceNumber?: string
    total: number
    createdAt: string
    Vendor?: {
      id: string
      name: string
      email?: string
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
      incomingQuantity?: number
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
  }>
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
}

// statusLabels will be defined inside component to use translations

const statusRowColors: Record<string, string> = {
  DRAFT: 'bg-gray-50/50 border-l-4 border-gray-400',
  APPROVED: 'bg-green-50/30 border-l-4 border-green-400',
  CANCELLED: 'bg-red-50/30 border-l-4 border-red-400',
}

export default function PurchaseShipmentList() {
  const locale = useLocale()
  const t = useTranslations('purchaseShipments')
  const tCommon = useTranslations('common')
  const [search, setSearch] = useState('')
  
  const statusLabels: Record<string, string> = {
    DRAFT: t('statusDraft'),
    APPROVED: t('statusApproved'),
    CANCELLED: t('statusCancelled'),
  }
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailPurchaseShipment, setDetailPurchaseShipment] = useState<PurchaseShipment | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false)

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
  
  const apiUrl = `/api/purchase-shipments?${params.toString()}`
  const { data: purchaseShipmentsData = [], isLoading, error, mutate: mutatePurchaseShipments } = useData<PurchaseShipment[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const purchaseShipments = useMemo(() => {
    return Array.isArray(purchaseShipmentsData) ? purchaseShipmentsData : []
  }, [purchaseShipmentsData])

  // Durum bazlı istatistikler
  const stats = useMemo(() => {
    const draft = purchaseShipments.filter(s => s.status === 'DRAFT').length
    const approved = purchaseShipments.filter(s => s.status === 'APPROVED').length
    const cancelled = purchaseShipments.filter(s => s.status === 'CANCELLED').length
    
    return {
      total: purchaseShipments.length,
      draft,
      approved,
      cancelled,
    }
  }, [purchaseShipments])

  // Onaylama
  const handleApprove = useCallback(async (id: string) => {
    setApprovingId(id)
    try {
      const res = await fetch(`/api/purchase-shipments/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || t('approveFailed'))
      }

      const result = await res.json()

      // Optimistic update
      const updated = purchaseShipments.map(s =>
        s.id === id ? { ...s, status: 'APPROVED', ...result } : s
      )

      await mutatePurchaseShipments(updated, { revalidate: false })
      await Promise.all([
        mutate('/api/purchase-shipments', updated, { revalidate: false }),
        mutate('/api/purchase-shipments?', updated, { revalidate: false }),
        mutate(apiUrl, updated, { revalidate: false }),
        mutate('/api/products', undefined, { revalidate: true }), // Ürün stokları güncellendi
        // ÖNEMLİ: Mal kabul onaylandığında fatura durumu değiştiği için invoice cache'lerini de invalidate et
        mutate('/api/invoices', undefined, { revalidate: true }),
        mutate('/api/invoices?', undefined, { revalidate: true }),
        mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }),
      ])
      
      // ÖNEMLİ: Sayfa yenilendiğinde fresh data çekmek için cache'i invalidate et
      // Ama hemen değil, biraz bekleyerek (optimistic update'in görünmesi için)
      setTimeout(async () => {
        // Tüm cache'leri invalidate et - sayfa yenilendiğinde fresh data çekilir
        await mutatePurchaseShipments(undefined, { revalidate: true })
        await Promise.all([
          mutate('/api/purchase-shipments', undefined, { revalidate: true }),
          mutate('/api/purchase-shipments?', undefined, { revalidate: true }),
          mutate(apiUrl, undefined, { revalidate: true }),
          // ÖNEMLİ: Mal kabul onaylandığında fatura durumu değiştiği için invoice cache'lerini de invalidate et
          mutate('/api/invoices', undefined, { revalidate: true }),
          mutate('/api/invoices?', undefined, { revalidate: true }),
          mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }),
        ])
      }, 500) // 500ms sonra revalidate (optimistic update görünür, sonra fresh data çekilir)

      toast.success(
        t('approveSuccess'),
        result.message || t('approveSuccessMessage', { id: id.substring(0, 8) })
      )
    } catch (error: any) {
      console.error('Approve error:', error)
      toast.error(
        t('approveFailed'),
        error?.message || t('approveFailedMessage')
      )
    } finally {
      setApprovingId(null)
    }
  }, [purchaseShipments, mutatePurchaseShipments, apiUrl])

  // Detay modal aç
  const handleViewDetail = useCallback(async (purchaseShipment: PurchaseShipment) => {
    try {
      const res = await fetch(`/api/purchase-shipments/${purchaseShipment.id}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || t('errorLoadingDetails') || 'Satın alma detayı yüklenemedi')
      }
      const detail = await res.json()
      setDetailPurchaseShipment(detail)
      setDetailModalOpen(true)
    } catch (error: any) {
      console.error('Detail fetch error:', error)
      toast.error(
        t('errorLoadingDetails'),
        error?.message || t('errorLoadingDetailsMessage')
      )
    }
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (!(await confirm(t('deleteConfirm')))) {
      return
    }

    try {
      const res = await fetch(`/api/purchase-shipments/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete purchase shipment')
      }
      
      const updated = purchaseShipments.filter((s) => s.id !== id)
      await mutatePurchaseShipments(updated, { revalidate: false })
      await Promise.all([
        mutate('/api/purchase-shipments', updated, { revalidate: false }),
        mutate('/api/purchase-shipments?', updated, { revalidate: false }),
        mutate(apiUrl, updated, { revalidate: false }),
      ])
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(
        t('deleteFailed'),
        error?.message || t('deleteFailedMessage')
      )
    }
  }, [purchaseShipments, mutatePurchaseShipments, apiUrl])

  // Tedarikçi adını al
  const getVendorName = useCallback((purchaseShipment: PurchaseShipment) => {
    return purchaseShipment.Invoice?.Vendor?.name || '-'
  }, [])

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Satın alma sevkiyatları yüklenirken bir hata oluştu.</p>
        <Button onClick={() => mutatePurchaseShipments()}>Yeniden Dene</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalRecords', { count: stats.total })}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setInvoiceFormOpen(true)}
            className="bg-gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Satın Alma Talebi
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('reports')}
          </Button>
        </div>
      </div>

      {/* Üst Panel - Durum Bazlı KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow"
          onClick={() => setStatusFilter('')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('stats.total')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <PackageCheck className="h-8 w-8 text-indigo-500" />
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
      </div>

      {/* Filtreleme */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="DRAFT">{t('statusDraft')}</SelectItem>
            <SelectItem value="APPROVED">{t('statusApproved')}</SelectItem>
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
              <TableHead>{t('tableHeaders.id')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.invoice')}</TableHead>
              <TableHead>{t('tableHeaders.vendor')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseShipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {t('noRecordsFound')}
                </TableCell>
              </TableRow>
            ) : (
              purchaseShipments.map((purchaseShipment, index) => (
                <motion.tr
                  key={purchaseShipment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`border-b hover:bg-gray-50 transition-colors ${statusRowColors[purchaseShipment.status] || ''}`}
                >
                  <TableCell className="font-medium font-mono">
                    {purchaseShipment.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[purchaseShipment.status] || 'bg-gray-100'}>
                      {statusLabels[purchaseShipment.status] || purchaseShipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {purchaseShipment.invoiceId && purchaseShipment.Invoice ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link 
                              href={`/${locale}/invoices/${purchaseShipment.invoiceId}`}
                              className="text-indigo-600 hover:underline font-medium"
                              prefetch={true}
                            >
                              {purchaseShipment.Invoice.title || purchaseShipment.Invoice.invoiceNumber || `Fatura #${purchaseShipment.invoiceId.substring(0, 8)}`}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent className="bg-gray-900 text-white p-3">
                            <div className="space-y-1 text-sm">
                              <p><strong>{t('tooltip.invoiceNumber')}:</strong> {purchaseShipment.Invoice.invoiceNumber || purchaseShipment.invoiceId.substring(0, 8)}</p>
                              <p><strong>{t('tooltip.title')}:</strong> {purchaseShipment.Invoice.title || '-'}</p>
                              <p><strong>{t('tooltip.vendor')}:</strong> {getVendorName(purchaseShipment)}</p>
                              <p><strong>{t('tooltip.total')}:</strong> {formatCurrency(purchaseShipment.Invoice.totalAmount || 0)}</p>
                              <p><strong>{t('tooltip.date')}:</strong> {new Date(purchaseShipment.Invoice.createdAt).toLocaleDateString('tr-TR')}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {getVendorName(purchaseShipment)}
                  </TableCell>
                  <TableCell>
                    {new Date(purchaseShipment.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(purchaseShipment)}
                          aria-label={t('viewDetails')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {purchaseShipment.status === 'DRAFT' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(purchaseShipment.id)}
                          disabled={approvingId === purchaseShipment.id}
                          className="text-green-600 hover:text-green-700"
                          aria-label={t('approve')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetail(purchaseShipment)}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('view')}
                          </DropdownMenuItem>
                          {purchaseShipment.invoiceId && (
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/invoices/${purchaseShipment.invoiceId}`} className="flex items-center">
                                <FileText className="mr-2 h-4 w-4" />
                                {t('goToInvoice')}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {purchaseShipment.status === 'DRAFT' && (
                            <DropdownMenuItem
                              onClick={() => handleApprove(purchaseShipment.id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('approve')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(purchaseShipment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('delete')}
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
      </div>

      {/* Detay Modalı */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('modal.title', { id: detailPurchaseShipment?.id.substring(0, 8) })}
            </DialogTitle>
            <DialogDescription>
              {t('modal.description')}
            </DialogDescription>
          </DialogHeader>
          
          {detailPurchaseShipment && (
            <div className="space-y-6">
              {/* Mal Kabul Bilgileri */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">{t('modal.infoTitle')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('modal.status')}</p>
                    <Badge className={statusColors[detailPurchaseShipment.status] || 'bg-gray-100'}>
                      {statusLabels[detailPurchaseShipment.status] || detailPurchaseShipment.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t('modal.createdAt')}</p>
                    <p>{new Date(detailPurchaseShipment.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </Card>

              {/* Fatura Bilgisi */}
              {detailPurchaseShipment.Invoice && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t('modal.relatedInvoice')}</h3>
                  <Link
                    href={`/${locale}/invoices/${detailPurchaseShipment.Invoice.id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {detailPurchaseShipment.Invoice.title} - {formatCurrency(detailPurchaseShipment.Invoice.totalAmount || 0)}
                  </Link>
                </Card>
              )}

              {/* Ürün Listesi */}
              {detailPurchaseShipment.invoiceItems && detailPurchaseShipment.invoiceItems.length > 0 ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t('modal.contentTitle')}</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('modal.product')}</TableHead>
                          <TableHead>{t('modal.skuBarcode')}</TableHead>
                          <TableHead>{t('modal.quantity')}</TableHead>
                          <TableHead>{t('modal.unitPrice')}</TableHead>
                          <TableHead>{t('modal.total')}</TableHead>
                          <TableHead>{t('modal.expectedIncoming')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailPurchaseShipment.invoiceItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.Product?.name || '-'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {item.Product?.sku && <div>SKU: {item.Product.sku}</div>}
                                {item.Product?.barcode && <div className="font-mono text-xs">Barkod: {item.Product.barcode}</div>}
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity} {item.Product?.unit || 'ADET'}</TableCell>
                            <TableCell>{formatCurrency(item.unitPrice || 0)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(item.total || 0)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {item.Product?.incomingQuantity || 0} {item.Product?.unit || 'ADET'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t('modal.contentTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('modal.noProducts')}</p>
                </Card>
              )}

              {/* Stok Hareketleri */}
              {detailPurchaseShipment.stockMovements && detailPurchaseShipment.stockMovements.length > 0 ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t('modal.stockMovements')}</h3>
                  <div className="space-y-2">
                    {detailPurchaseShipment.stockMovements.map((movement: any) => (
                      <div key={movement.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{movement.Product?.name || '-'}</p>
                          <p className="text-xs text-gray-500">
                            {movement.type === 'IN' ? t('modal.stockIn') : t('modal.stockOut')} - {movement.reason || '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +{Math.abs(movement.quantity)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(movement.createdAt).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">{t('modal.stockMovements')}</h3>
                  <p className="text-sm text-gray-500">{t('modal.noStockMovements')}</p>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Yeni Satın Alma Talebi Formu (PURCHASE Faturası) */}
      <InvoiceForm
        open={invoiceFormOpen}
        onClose={() => setInvoiceFormOpen(false)}
        defaultInvoiceType="PURCHASE"
        onSuccess={async (newInvoice) => {
          // Fatura oluşturuldu - otomatik PurchaseTransaction oluşturulacak (SENT olduğunda)
          // Cache'leri güncelle
          await Promise.all([
            mutate('/api/purchase-shipments', undefined, { revalidate: true }),
            mutate('/api/purchase-shipments?', undefined, { revalidate: true }),
            mutate(apiUrl, undefined, { revalidate: true }),
            mutate('/api/invoices', undefined, { revalidate: true }),
            mutate('/api/invoices?', undefined, { revalidate: true }),
            mutate('/api/analytics/invoice-kanban', undefined, { revalidate: true }),
          ])
          
          toastSuccess(
            'Satın Alma Talebi Oluşturuldu',
            `${newInvoice.title} faturası oluşturuldu. Faturayı "Gönderildi" durumuna taşıdığınızda otomatik olarak satın alma kaydı oluşturulacak.`
          )
          
          setInvoiceFormOpen(false)
        }}
      />
    </div>
  )
}

