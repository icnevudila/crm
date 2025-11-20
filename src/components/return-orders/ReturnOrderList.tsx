'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ReturnOrderForm from './ReturnOrderForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'

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

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
}

export default function ReturnOrderList() {
  const locale = useLocale()
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

  // SWR ile veri çekme
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (status) params.append('status', status)
  if (invoiceId) params.append('invoiceId', invoiceId)
  
  const apiUrl = `/api/return-orders?${params.toString()}`
  const { data: returnOrders = [], isLoading, error, mutate: mutateReturnOrders } = useData<ReturnOrder[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleEdit = (returnOrder: ReturnOrder) => {
    setSelectedReturnOrder(returnOrder)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, returnNumber: string) => {
    if (!confirm(`${returnNumber} iade siparişini silmek istediğinize emin misiniz?`)) {
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

      toast.success('İade siparişi silindi', { description: `${returnNumber} başarıyla silindi.` })
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    }
  }

  const handleFormClose = () => {
    setSelectedReturnOrder(null)
    setFormOpen(false)
  }

  if (isLoading) return <SkeletonList />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">İade Siparişleri</h1>
          <p className="text-gray-500 mt-1">Fatura iadelerini yönetin</p>
        </div>
        <Button 
          onClick={() => {
            setSelectedReturnOrder(null)
            setFormOpen(true)
          }} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni İade
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="İade no, sebep ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="PENDING">Beklemede</SelectItem>
            <SelectItem value="APPROVED">Onaylandı</SelectItem>
            <SelectItem value="REJECTED">Reddedildi</SelectItem>
            <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İade No</TableHead>
              <TableHead>Fatura</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Sebep</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Toplam</TableHead>
              <TableHead>İade Tarihi</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  İade siparişi bulunamadı
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
                      {statusLabels[returnOrder.status] || returnOrder.status}
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
        onSuccess={async (savedReturnOrder: ReturnOrder) => {
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
        }}
      />
    </div>
  )
}


