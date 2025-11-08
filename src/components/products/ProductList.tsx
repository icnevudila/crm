'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'
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
import ProductForm from './ProductForm'
import SkeletonList from '@/components/skeletons/SkeletonList'
import ModuleStats from '@/components/stats/ModuleStats'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

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
  createdAt: string
  updatedAt?: string
}

export default function ProductList() {
  const locale = useLocale()
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Debounced search - performans için
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search])

  // SWR ile veri çekme (CustomerList pattern'i)
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  if (stockFilter) params.append('stock', stockFilter)
  if (categoryFilter) params.append('category', categoryFilter)
  if (statusFilter) params.append('status', statusFilter)
  
  const apiUrl = `/api/products?${params.toString()}`
  const { data: productsData, isLoading, error, mutate: mutateProducts } = useData<Product[]>(apiUrl, {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  // API'den dönen veriyi parse et - array olarak bekliyoruz (useMemo ile memoize)
  const products = useMemo(() => {
    // Hata varsa boş array döndür
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
    if (!confirm(`${name} ürününü silmek istediğinize emin misiniz?`)) {
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
      
      // Optimistic update - silinen kaydı listeden kaldır
      const updatedProducts = products.filter((p) => p.id !== id)
      
      // Cache'i güncelle
      await mutateProducts(updatedProducts, { revalidate: false })
      
      // Tüm diğer product URL'lerini de güncelle
      await Promise.all([
        mutate('/api/products', updatedProducts, { revalidate: false }),
        mutate('/api/products?', updatedProducts, { revalidate: false }),
        mutate(apiUrl, updatedProducts, { revalidate: false }),
      ])
    } catch (error: any) {
      // Production'da console.error kaldırıldı
      if (process.env.NODE_ENV === 'development') {
        console.error('Delete error:', error)
      }
      alert(error?.message || 'Silme işlemi başarısız oldu')
    }
  }, [products, mutateProducts, apiUrl])

  const handleAdd = useCallback(() => {
    setSelectedProduct(null)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setFormOpen(false)
    setSelectedProduct(null)
  }, [])

  // Stats verisini çek - toplam sayı için
  const { data: stats } = useData<any>('/api/stats/products', {
    dedupingInterval: 5000,
    revalidateOnFocus: false,
  })

  const getStockBadge = (stock: number, minStock?: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800">Stokta Yok</Badge>
    } else if (minStock && stock <= minStock) {
      return <Badge className="bg-red-100 text-red-800">Kritik Stok</Badge>
    } else if (stock <= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Düşük Stok</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Stokta Var</Badge>
    }
  }

  // Stok istatistiklerini hesapla
  const stockStats = useMemo(() => {
    const critical = products.filter(p => p.minStock && p.stock <= p.minStock).length
    const lowStock = products.filter(p => !p.minStock && p.stock > 0 && p.stock <= 10).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const inStock = products.filter(p => p.stock > (p.minStock || 10)).length
    
    // Son giriş ve çıkış tarihlerini bul
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

  if (isLoading) {
    return <SkeletonList />
  }

  // Hata durumunda kullanıcıya bilgi ver
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Ürünler yüklenirken bir hata oluştu. 
            {error?.message?.includes('incomingQuantity') || error?.message?.includes('reservedQuantity') ? (
              <span className="block mt-2 text-sm">
                Veritabanı migration'ı eksik olabilir. Lütfen migration dosyalarını çalıştırın.
              </span>
            ) : (
              <span className="block mt-2 text-sm">{error?.message || 'Bilinmeyen hata'}</span>
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
      {/* İstatistikler */}
      <ModuleStats module="products" statsUrl="/api/stats/products" />
      
      {/* Stok Durumu İstatistik Kartları */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Ürün</p>
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
              <p className="text-sm text-gray-600 mb-1">Kritik Stok</p>
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
              <p className="text-sm text-gray-600 mb-1">Son Giriş</p>
              <p className="text-sm font-semibold text-gray-900">
                {stockStats.lastUpdate 
                  ? new Date(stockStats.lastUpdate).toLocaleDateString('tr-TR')
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
              <p className="text-sm text-gray-600 mb-1">Son Çıkış</p>
              <p className="text-sm font-semibold text-gray-900">
                {stockStats.lastUpdate 
                  ? new Date(stockStats.lastUpdate).toLocaleDateString('tr-TR')
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
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="mt-2 text-gray-600">Toplam {totalProducts} ürün</p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-gradient-primary text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="İsim, SKU veya Barkod ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stockFilter || 'all'} onValueChange={(v) => setStockFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Stok Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="inStock">Stokta Var</SelectItem>
            <SelectItem value="lowStock">Düşük Stok</SelectItem>
            <SelectItem value="outOfStock">Stokta Yok</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
            <SelectItem value="DISCONTINUED">Üretimden Kalktı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>SKU/Barkod</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Ürün bulunamadı
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
                          {product.status === 'INACTIVE' ? 'Pasif' : 'Üretimden Kalktı'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <Badge variant="outline">{product.category}</Badge>
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
                            Min: {product.minStock} {product.maxStock ? `| Max: ${product.maxStock}` : ''}
                          </div>
                        )}
                        {product.updatedAt && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(product.updatedAt).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      {product.minStock && product.stock <= product.minStock && (
                        <div className="relative group">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div className="absolute left-0 top-6 hidden group-hover:block z-10 bg-red-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            Kritik stok seviyesi
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
                          Rezerve: {(product as any).reservedQuantity}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(product.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/${locale}/products/${product.id}`} prefetch={true}>
                        <Button variant="ghost" size="icon" aria-label={`${product.name} ürününü görüntüle`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                        aria-label={`${product.name} ürününü düzenle`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:text-red-700"
                        aria-label={`${product.name} ürününü sil`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      <ProductForm
        product={selectedProduct || undefined}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedProduct: Product) => {
          // Optimistic update - yeni/güncellenmiş kaydı hemen cache'e ekle
          let updatedProducts: Product[]
          
          if (selectedProduct) {
            // UPDATE: Mevcut kaydı güncelle - savedProduct'daki tüm alanları kullan (minStock dahil)
            // savedProduct API'den dönen tam veri, tüm alanları içeriyor
            updatedProducts = products.map((p) =>
              p.id === savedProduct.id ? { ...savedProduct } : p
            )
          } else {
            // CREATE: Yeni kaydı listenin başına ekle
            updatedProducts = [{ ...savedProduct }, ...products]
          }
          
          // Cache'i güncelle - optimistic update (revalidate: true ile fresh data çek)
          // Böylece API'den fresh data çekilir ve minStock güncel gelir
          await mutateProducts(updatedProducts, { revalidate: true })
          
          // Tüm diğer product URL'lerini de güncelle (revalidate: true ile fresh data çek)
          await Promise.all([
            mutate('/api/products', updatedProducts, { revalidate: true }),
            mutate('/api/products?', updatedProducts, { revalidate: true }),
            mutate(apiUrl, updatedProducts, { revalidate: true }),
          ])
          
          // Form'u kapat ve seçili ürünü temizle
          setFormOpen(false)
          setSelectedProduct(null)
        }}
      />
    </div>
  )
}
