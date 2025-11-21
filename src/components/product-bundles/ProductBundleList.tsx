'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ProductBundleForm from './ProductBundleForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { useTranslations } from 'next-intl'

interface ProductBundle {
  id: string
  name: string
  description?: string
  totalPrice: number
  discount: number
  finalPrice: number
  status: string
  items?: Array<{
    id: string
    quantity: number
    product?: { id: string; name?: string; sku?: string; price?: number }
  }>
  createdAt: string
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
}

export default function ProductBundleList() {
  const locale = useLocale()
  const t = useTranslations('productBundles')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<ProductBundle | null>(null)

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
  
  const apiUrl = `/api/product-bundles?${params.toString()}`
  const { data: bundles = [], isLoading, error, mutate: mutateBundles } = useData<ProductBundle[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const handleEdit = (bundle: ProductBundle) => {
    setSelectedBundle(bundle)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Ürün Paketini Sil?',
      description: `${name} paketini silmek istediğinize emin misiniz?`,
      confirmLabel: 'Sil',
      cancelLabel: 'İptal',
      variant: 'destructive'
    })
    
    if (!confirmed) {
      return
    }

    try {
      const res = await fetch(`/api/product-bundles/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete bundle')
      }
      
      // Optimistic update
      const updatedBundles = bundles.filter((item) => item.id !== id)
      await mutateBundles(updatedBundles, { revalidate: false })
      
      await Promise.all([
        mutate('/api/product-bundles', updatedBundles, { revalidate: false }),
        mutate('/api/product-bundles?', updatedBundles, { revalidate: false }),
        mutate(apiUrl, updatedBundles, { revalidate: false }),
      ])

      toast.success(t('deleteSuccess') || 'Paket silindi')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error?.message || t('deleteFailed'))
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedBundle(null)
  }

  if (isLoading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        {t('errorLoading') || 'Veriler yüklenirken bir hata oluştu.'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <Button
          onClick={() => {
            setSelectedBundle(null)
            setFormOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('newBundle')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{statusLabels.ACTIVE}</SelectItem>
            <SelectItem value="INACTIVE">{statusLabels.INACTIVE}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {bundles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('noBundlesFound')}</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableHeaders.name')}</TableHead>
                <TableHead>{t('tableHeaders.items')}</TableHead>
                <TableHead>{t('tableHeaders.totalPrice')}</TableHead>
                <TableHead>{t('tableHeaders.discount')}</TableHead>
                <TableHead>{t('tableHeaders.finalPrice')}</TableHead>
                <TableHead>{t('tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="font-medium">{bundle.name}</TableCell>
                  <TableCell>
                    {bundle.items && bundle.items.length > 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {bundle.items.length} {bundle.items.length === 1 ? 'ürün' : 'ürün'}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(bundle.totalPrice)}</TableCell>
                  <TableCell>
                    {bundle.discount > 0 ? (
                      <span className="text-green-600">%{bundle.discount}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(bundle.finalPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(bundle.status)}>
                      {statusLabels[bundle.status] || bundle.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/product-bundles/${bundle.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(bundle)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(bundle.id, bundle.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Modal */}
      <ProductBundleForm
        bundle={selectedBundle || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedBundle: ProductBundle) => {
          let updatedBundles: ProductBundle[]
          
          if (selectedBundle) {
            updatedBundles = bundles.map((item) =>
              item.id === savedBundle.id ? savedBundle : item
            )
          } else {
            updatedBundles = [savedBundle, ...bundles]
          }
          
          await mutateBundles(updatedBundles, { revalidate: false })
          
          await Promise.all([
            mutate('/api/product-bundles', updatedBundles, { revalidate: false }),
            mutate('/api/product-bundles?', updatedBundles, { revalidate: false }),
            mutate(apiUrl, updatedBundles, { revalidate: false }),
          ])
        }}
      />
    </div>
  )
}


