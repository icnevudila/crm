'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from '@/lib/toast'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
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
import ModuleStats from '@/components/stats/ModuleStats'
import { AutomationInfo } from '@/components/automation/AutomationInfo'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Lazy load ProductForm ve ProductDetailModal - performans için
const ProductForm = dynamic(() => import('./ProductForm'), {
  ssr: false,
  loading: () => null,
})
const ProductDetailModal = dynamic(() => import('./ProductDetailModal'), {
  ssr: false,
  loading: () => null,
})

interface ProductListProps {
  isOpen?: boolean
}

interface Product {
  id: string
  name: string
  price: number
  stock: number
  category?: string
  sku?: string
  barcode?: string
  status?: string
  minStock?: number
  maxStock?: number
  unit?: string
  description?: string
  imageUrl?: string
  companyId?: string
  Company?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt?: string
}

export default function ProductList({ isOpen = true }: ProductListProps) {
  const locale = useLocale()
  const t = useTranslations('products')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  // SuperAdmin kontrolÃ¼
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  
  // URL parametrelerinden filtreleri oku
  const searchFromUrl = searchParams.get('search') || ''
  
  const [search, setSearch] = useState(searchFromUrl)
  
  // URL'den gelen search parametresini state'e set et
  useEffect(() => {
    if (searchFromUrl && searchFromUrl !== search) {
      setSearch(searchFromUrl)
    }
  }, [searchFromUrl, search])
  const [stockFilter, setStockFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filterCompanyId, setFilterCompanyId] = useState('') // SuperAdmin için firma filtresi
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedProductData, setSelectedProductData] = useState<Product | null>(null)
  
  // SuperAdmin için firmaları çek
  const { data: companiesData } = useData<{ companies: Array<{ id: string; name: string }> }>(
    isOpen && isSuperAdmin ? '/api/superadmin/companies' : null,
    { dedupingInterval: 60000, revalidateOnFocus: false }
  )
  // Duplicate'leri filtrele - aynÄ± id'ye sahip kayÄ±tlarÄ± tekilleÅŸtir
  const companies = (companiesData?.companies || []).filter((company, index, self) => 
    index === self.findIndex((c) => c.id === company.id)
  )

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri Ã§ekme (CustomerList pattern'i)
  const apiUrl = useMemo(() => {
    if (!isOpen) return null

    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (stockFilter) params.append('stock', stockFilter)
    if (categoryFilter) params.append('category', categoryFilter)
    if (statusFilter) params.append('status', statusFilter)
    if (isSuperAdmin && filterCompanyId) params.append('filterCompanyId', filterCompanyId)
    return `/api/products?${params.toString()}`
  }, [
    isOpen,
    debouncedSearch,
    stockFilter,
    categoryFilter,
    statusFilter,
    isSuperAdmin,
    filterCompanyId,
  ])

  const { data: productsData, isLoading, error, mutate: mutateProducts } = useData<Product[]>(
    apiUrl,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  // API'den dÃ¶nen veriyi parse et - array olarak bekliyoruz (useMemo ile memoize)
  const products = useMemo(() => {
    // Hata varsa boÅŸ array dÃ¶ndÃ¼r
    if (error) {
      return []
    }
    return Array.isArray(productsData) ? productsData : []
  }, [productsData, error])

  // Unique kategorileri çıkar (dropdown için)
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    products.forEach((p) => {
      if (p.category && p.category.trim() !== '') {
        uniqueCategories.add(p.category.trim())
      }
    })
    return Array.from(uniqueCategories).sort()
  }, [products])

  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(t('deleteConfirm', { name }))) {
      return
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete product')
      }
      
      // Optimistic update - silinen kaydÄ± listeden kaldÄ±r
      const updatedProducts = products.filter((p) => p.id !== id)
      
      // Cache'i gÃ¼ncelle
      await mutateProducts(updatedProducts, { revalidate: false })
      
      // Tüm diğer product URL'lerini de güncelle
      await Promise.all([
        mutate('/api/products', updatedProducts, { revalidate: false }),
        mutate('/api/products?', updatedProducts, { revalidate: false }),
        apiUrl ? mutate(apiUrl, updatedProducts, { revalidate: false }) : Promise.resolve(),
      ])
    } catch (error: any) {
      // Production'da console.error kaldÄ±rÄ±ldÄ±
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      toast.error(tCommon('error'), error?.message)
    }
  }, [products, mutateProducts, apiUrl, t, tCommon])

  const handleAdd = useCallback(() => {
    setSelectedProduct(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedProduct(null)
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>(
    isOpen ? '/api/stats/products' : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
    }
  )

  const getStockBadge = (stock: number, minStock?: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800">{t('stockStatus.outOfStock')}</Badge>
    } else if (minStock && stock <= minStock) {
      return <Badge className="bg-red-100 text-red-800">{t('stockStatus.critical')}</Badge>
    } else if (stock <= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">{t('stockStatus.low')}</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">{t('stockStatus.inStock')}</Badge>
    }
  }

  // Stok istatistiklerini hesapla
  const stockStats = useMemo(() => {
    const critical = products.filter(p => p.minStock && p.stock <= p.minStock).length
    const lowStock = products.filter(p => !p.minStock && p.stock > 0 && p.stock <= 10).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const inStock = products.filter(p => p.stock > (p.minStock || 10)).length
    
    // Son giriÅŸ ve Ã§Ä±kÄ±ÅŸ tarihlerini bul
    const lastEntry = products
      .filter(p => p.updatedAt)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]
    
    return {
      critical,
      lowStock,
      outOfStock,
      inStock,
      lastUpdate: lastEntry?.updatedAt,
    }
  }, [products])

  if (!isOpen) {
    return null
  }

  if (isLoading) {
    return <SkeletonList />
  }

  // Hata durumunda kullanÄ±cÄ±ya bilgi ver
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {t('errorLoadingProducts')} 
            {error?.message?.includes('incomingQuantity') || error?.message?.includes('reservedQuantity') ? (
              <span className="block mt-2 text-sm">
                {t('migrationMissing')}
              </span>
            ) : (
              <span className="block mt-2 text-sm">{error?.message || tCommon('unknownError')}</span>
            )}
          </p>
        </div>
      </div>
    )
  }

  // ModuleStats'ten gelen total değerini kullan - dashboard ile tutarlı olması için
  const totalProducts = stats?.total || products.length

  return (
    <div className="space-y-6">
      {/* Ä°statistikler */}
      <ModuleStats module="products" statsUrl="/api/stats/products" />

      {/* Otomasyon Bilgileri */}
      <AutomationInfo
        title={t('automationTitle')}
        automations={[
          {
            action: t('automationQuoteAccepted'),
            result: t('automationQuoteAcceptedResult'),
            details: [
              t('automationQuoteAcceptedDetails1'),
              t('automationQuoteAcceptedDetails2'),
            ],
          },
          {
            action: t('automationInvoicePaid'),
            result: t('automationInvoicePaidResult'),
            details: [
              t('automationInvoicePaidDetails1'),
              t('automationInvoicePaidDetails2'),
            ],
          },
          {
            action: t('automationShipmentShipped'),
            result: t('automationShipmentShippedResult'),
            details: [
              t('automationShipmentShippedDetails1'),
              t('automationShipmentShippedDetails2'),
            ],
          },
          {
            action: t('automationStockCritical'),
            result: t('automationStockCriticalResult'),
            details: [
              t('automationStockCriticalDetails1'),
              t('automationStockCriticalDetails2'),
            ],
          },
        ]}
      />
      
      {/* Stok Durumu Ä°statistik KartlarÄ± */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('stats.totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="h-8 w-8 text-indigo-500" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('stats.criticalStock')}</p>
              <p className="text-2xl font-bold text-red-600">{stockStats.critical}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('stats.lastEntry')}</p>
              <p className="text-sm font-semibold text-gray-900">
                {stockStats.lastUpdate 
                  ? new Date(stockStats.lastUpdate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')
                  : '-'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('stats.lastExit')}</p>
              <p className="text-sm font-semibold text-gray-900">
                {stockStats.lastUpdate 
                  ? new Date(stockStats.lastUpdate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')
                  : '-'}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-gray-600">{t('totalProducts', { count: totalProducts })}</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('newProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder={t('searchPlaceholderDetailed')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
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
        <Select value={stockFilter || 'all'} onValueChange={(v) => setStockFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStockStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStock')}</SelectItem>
            <SelectItem value="inStock">{t('stockStatus.inStock')}</SelectItem>
            <SelectItem value="lowStock">{t('stockStatus.low')}</SelectItem>
            <SelectItem value="outOfStock">{t('stockStatus.outOfStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{tCommon('active')}</SelectItem>
            <SelectItem value="INACTIVE">{tCommon('inactive')}</SelectItem>
            <SelectItem value="DISCONTINUED">{t('discontinued')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tableHeaders.name')}</TableHead>
              {isSuperAdmin && <TableHead>{t('company')}</TableHead>}
              <TableHead>{t('tableHeaders.category')}</TableHead>
              <TableHead>{t('tableHeaders.sku')}/{t('barcode')}</TableHead>
              <TableHead>{t('tableHeaders.price')}</TableHead>
              <TableHead>{t('tableHeaders.stock')}</TableHead>
              <TableHead>{t('tableHeaders.status')}</TableHead>
              <TableHead>{t('tableHeaders.date')}</TableHead>
              <TableHead className="text-right">{t('tableHeaders.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 9 : 8} className="text-center py-8 text-gray-500">
                  {t('noProductsFound')}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`border-b hover:bg-gray-50 transition-colors ${(product as any).reservedQuantity > 0 ? 'bg-orange-50/30 border-l-4 border-orange-400' : ''}`}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div>{product.name}</div>
                      {product.status && product.status !== 'ACTIVE' && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {product.status === 'INACTIVE' ? tCommon('inactive') : t('discontinued')}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  {isSuperAdmin && (
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {product.Company?.name || '-'}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline" className="text-gray-700 border-gray-300">{product.category}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {product.sku && (
                        <div className="font-mono text-gray-600">{product.sku}</div>
                      )}
                      {product.barcode && (
                        <div className="font-mono text-xs text-gray-500">{product.barcode}</div>
                      )}
                      {!product.sku && !product.barcode && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(product.price || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{product.stock || 0} {product.unit || 'ADET'}</div>
                        {product.minStock && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {t('min')}: {product.minStock} {product.maxStock ? `| ${t('max')}: ${product.maxStock}` : ''}
                          </div>
                        )}
                        {product.updatedAt && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(product.updatedAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                          </div>
                        )}
                      </div>
                      {product.minStock && product.stock <= product.minStock && (
                        <div className="relative group">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div className="absolute left-0 top-6 hidden group-hover:block z-10 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {t('stockStatus.critical')}
                          </div>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStockBadge(product.stock || 0, product.minStock)}
                      {(product as any).reservedQuantity > 0 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                          {t('reserved')}: {(product as any).reservedQuantity}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProductId(product.id)
                          setSelectedProductData(product) // Liste sayfasÄ±ndaki veriyi hemen gÃ¶ster (hÄ±zlÄ± aÃ§Ä±lÄ±ÅŸ)
                          setDetailModalOpen(true)
                        }}
                        aria-label={t('viewProduct', { name: product.name })}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        aria-label={t('editProduct', { name: product.name })}
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={t('deleteProduct', { name: product.name })}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedProductId(null)
          setSelectedProductData(null)
        }}
        initialData={selectedProductData || undefined}
      />

      {/* Form Modal */}
      <ProductForm
        product={selectedProduct || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedProduct: Product) => {
          // Optimistic update - yeni/gÃ¼ncellenmiÅŸ kaydÄ± hemen cache'e ekle
          let updatedProducts: Product[]
          
          if (selectedProduct) {
            // UPDATE: Mevcut kaydÄ± gÃ¼ncelle - savedProduct'daki tÃ¼m alanlarÄ± kullan (minStock dahil)
            // savedProduct API'den dÃ¶nen tam veri, tÃ¼m alanlarÄ± iÃ§eriyor
            updatedProducts = products.map((p) =>
              p.id === savedProduct.id ? { ...savedProduct } : p
            )
          } else {
            // CREATE: Yeni kaydÄ± listenin baÅŸÄ±na ekle
            updatedProducts = [{ ...savedProduct }, ...products]
          }
          
          // Cache'i gÃ¼ncelle - optimistic update (revalidate: true ile fresh data Ã§ek)
          // BÃ¶ylece API'den fresh data Ã§ekilir ve minStock gÃ¼ncel gelir
          await mutateProducts(updatedProducts, { revalidate: true })
          
          // Tüm diğer product URL'lerini de güncelle (revalidate: true ile fresh data Ã§ek)
          await Promise.all([
            mutate('/api/products', updatedProducts, { revalidate: true }),
            mutate('/api/products?', updatedProducts, { revalidate: true }),
            apiUrl ? mutate(apiUrl, updatedProducts, { revalidate: true }) : Promise.resolve(),
          ])
          
          // Form'u kapat ve seÃ§ili Ã¼rÃ¼nÃ¼ temizle
          setFormOpen(false)
          setSelectedProduct(null)
        }}
      />
    </div>
  )
}
