'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import RefreshButton from '@/components/ui/RefreshButton'

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

export default function ProductBundleList() {
  const locale = useLocale()
  const t = useTranslations('productBundles')
  const { confirm } = useConfirm()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState<ProductBundle | null>(null)

  // Debounced search - performans için (kullanıcı yazmayı bitirdikten 300ms sonra arama)
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300) // 300ms debounce - her harfte arama yapılmaz
    
    return () => clearTimeout(timer)
  }, [search])

  // API URL'ini memoize et - her render'da yeni string oluşturma
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (status && status !== 'all') params.append('status', status)
    return `/api/product-bundles?${params.toString()}`
  }, [debouncedSearch, status])

  // Stats URL'ini memoize et
  const statsUrl = useMemo(() => '/api/stats/product-bundles', [])

  const { data: bundles = [], isLoading, error, mutate: mutateBundles } = useData<ProductBundle[]>(apiUrl, {
    dedupingInterval: 5000, // 5 saniye cache (daha kısa - güncellemeler daha hızlı)
    revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
    refreshInterval: 0, // Auto refresh YOK - manual refresh
  })

  // Refresh handler - tüm cache'leri invalidate et ve yeniden fetch yap
  // ÖNEMLİ: apiUrl'i dependency'den çıkar - sadece base URL'leri invalidate et
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutateBundles(undefined, { revalidate: true }),
      mutate('/api/product-bundles', undefined, { revalidate: true }),
      mutate('/api/product-bundles?', undefined, { revalidate: true }),
      mutate('/api/stats/product-bundles', undefined, { revalidate: true }),
      // apiUrl'i burada kullanma - her değiştiğinde callback yeniden oluşur
    ])
  }, [mutateBundles]) // Sadece mutateBundles dependency - callback sabit kalır

  const handleEdit = (bundle: ProductBundle) => {
    setSelectedBundle(bundle)
    setFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: t('deleteConfirm') || 'Ürün Paketini Sil?',
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
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedBundles = bundles.filter((item) => item.id !== id)
      
      // Cache'i güncelle - yeni listeyi hemen göster
      await mutateBundles(updatedBundles, { revalidate: false })
      
      // Tüm diğer product-bundles URL'lerini de güncelle
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

  // onSuccess callback'i dışarı taşı - React Hooks hatası için
  const onSuccess = useCallback(async (savedBundle: ProductBundle) => {
    // Optimistic update - yeni/güncellenmiş kaydı hemen cache'e ekle ve UI'da göster
    // Böylece form kapanmadan önce bundle listede görünür
    
    let updatedBundles: ProductBundle[]
    
    if (selectedBundle) {
      // UPDATE: Mevcut kaydı güncelle
      updatedBundles = bundles.map((item) =>
        item.id === savedBundle.id ? savedBundle : item
      )
    } else {
      // CREATE: Yeni kaydı listenin başına ekle
      updatedBundles = [savedBundle, ...bundles]
    }
    
    // Cache'i güncelle - optimistic update'i hemen uygula ve koru
    // revalidate: false = background refetch yapmaz, optimistic update korunur
    await mutateBundles(updatedBundles, { revalidate: false })
    
    // Tüm diğer product-bundles URL'lerini de güncelle (optimistic update)
    await Promise.all([
      mutate('/api/product-bundles', updatedBundles, { revalidate: false }),
      mutate('/api/product-bundles?', updatedBundles, { revalidate: false }),
      mutate(apiUrl, updatedBundles, { revalidate: false }),
    ])
  }, [bundles, selectedBundle, mutateBundles, apiUrl])

  // Automation bilgileri - memoize et
  const automations = useMemo(() => [
    {
      title: t('automationTitle') || 'Ürün Paketleri Otomasyonları',
      items: [
        {
          trigger: t('automationQuote') || 'Teklif oluşturulduğunda',
          result: t('automationQuoteResult') || 'Paket ürünleri otomatik eklenir',
          details: [
            t('automationQuoteDetails1') || 'Paket içindeki tüm ürünler teklife eklenir',
            t('automationQuoteDetails2') || 'Toplam fiyat otomatik hesaplanır',
          ],
        },
        {
          trigger: t('automationInvoice') || 'Fatura oluşturulduğunda',
          result: t('automationInvoiceResult') || 'Paket ürünleri otomatik eklenir',
          details: [
            t('automationInvoiceDetails1') || 'Paket içindeki tüm ürünler faturaya eklenir',
            t('automationInvoiceDetails2') || 'Stok otomatik düşer',
          ],
        },
      ],
    },
  ], [t])

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
      {/* Header - Actions only (title removed, shown in parent page) */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
        <div className="flex gap-2">
          <RefreshButton onRefresh={handleRefresh} />
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
      </div>

      {/* Module Stats */}
      <ModuleStats
        module="product-bundles"
        statsUrl={statsUrl}
        filterStatus={status !== 'all' ? status : undefined}
        onFilterChange={(filter) => {
          if (filter.type === 'status') {
            setStatus(filter.value || 'all')
          }
        }}
      />

      {/* Automation Info */}
      <AutomationInfo automations={automations} />

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
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('statusActive') || 'Aktif'}</SelectItem>
            <SelectItem value="INACTIVE">{t('statusInactive') || 'Pasif'}</SelectItem>
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
                      {bundle.status === 'ACTIVE' ? (t('statusActive') || 'Aktif') : 
                       bundle.status === 'INACTIVE' ? (t('statusInactive') || 'Pasif') : 
                       bundle.status}
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
        onSuccess={onSuccess}
      />
    </div>
  )
}


