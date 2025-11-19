'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { mutate } from 'swr'
import Image from 'next/image'
import { ArrowLeft, Edit, Package, ShoppingCart, FileText, TrendingUp, TrendingDown, Minus, Plus, RotateCcw, History, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { toast, toastError } from '@/lib/toast'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import StockMovementForm from '@/components/stock/StockMovementForm'
import Link from 'next/link'
import { useData } from '@/hooks/useData'
import { confirm } from '@/lib/toast'
import ProductForm from '@/components/products/ProductForm'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [stockFormOpen, setStockFormOpen] = useState(false)
  const [stockFormType, setStockFormType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: product, isLoading, error, mutate: mutateProduct } = useData<any>(
    id ? `/api/products/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  // Stok hareketlerini çek - dengeli cache stratejisi (stok hareketleri sık güncellenir ama cache de önemli)
  const stockMovementsUrl = `/api/stock-movements?productId=${id}&limit=10`
  const { data: stockMovements = [], mutate: mutateStockMovements } = useData<any[]>(
    stockMovementsUrl,
    {
      dedupingInterval: 5000, // 5 saniye cache (dengeli - güncellemeler hızlı görünür ama gereksiz API çağrısı yok)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  // İlgili Quote ve Invoice'ları çek
  const { data: relatedQuotes = [] } = useData<any[]>(
    id ? `/api/products/${id}/quotes` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache
      revalidateOnFocus: false,
    }
  )
  const { data: relatedInvoices = [] } = useData<any[]>(
    id ? `/api/products/${id}/invoices` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ürün Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Ürün yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/products`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const getStockBadge = (stock: number, minStock?: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-100 text-red-800">Stokta Yok</Badge>
    } else if (minStock && stock <= minStock) {
      return <Badge className="bg-yellow-100 text-yellow-800">Düşük Stok</Badge>
    } else if (stock <= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">Düşük Stok</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Stokta Var</Badge>
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Pasif</Badge>
      case 'DISCONTINUED':
        return <Badge className="bg-red-100 text-red-800">Üretimden Kalktı</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
    }
  }

  const getMovementTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUSTMENT':
        return <Minus className="h-4 w-4 text-yellow-600" />
      case 'RETURN':
        return <TrendingUp className="h-4 w-4 text-blue-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Giriş'
      case 'OUT':
        return 'Çıkış'
      case 'ADJUSTMENT':
        return 'Düzeltme'
      case 'RETURN':
        return 'İade'
      default:
        return type
    }
  }

  // Product status'leri için available statuses
  const availableStatuses = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Pasif' },
    { value: 'DISCONTINUED', label: 'Üretimden Kaldırıldı' },
  ]

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="product"
        entityId={id}
        currentStatus={product.status || 'ACTIVE'}
        availableStatuses={availableStatuses}
        onStatusChange={async (newStatus) => {
          const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
          if (!res.ok) {
            const error = await res.json().catch(() => ({}))
            throw new Error(error.error || 'Durum değiştirilemedi')
          }
          const updatedProduct = await res.json()
          await mutateProduct(updatedProduct, { revalidate: false })
          await Promise.all([
            mutate('/api/products', undefined, { revalidate: true }),
            mutate('/api/products?', undefined, { revalidate: true }),
          ])
        }}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
          if (!confirm(`${product.name} ürününü silmek istediğinize emin misiniz?`)) {
            return
          }
          setDeleteLoading(true)
          try {
            const res = await fetch(`/api/products/${id}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Silme işlemi başarısız')
            }
            router.push(`/${locale}/products`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message)
            throw error
          } finally {
            setDeleteLoading(false)
          }
        }}
        onDuplicate={async () => {
          try {
            const res = await fetch(`/api/products/${id}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedProduct = await res.json()
            toast.success('Ürün kopyalandı')
            router.push(`/${locale}/products/${duplicatedProduct.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message)
          }
        }}
        canEdit={true}
        canDelete={true}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/products`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(product.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/products`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${product.name} ürününü silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/products/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) {
                  const errorData = await res.json().catch(() => ({}))
                  throw new Error(errorData.error || 'Silme işlemi başarısız')
                }
                router.push(`/${locale}/products`)
              } catch (error: any) {
                toastError('Silme işlemi başarısız oldu', error?.message)
              } finally {
                setDeleteLoading(false)
              }
            }}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Fiyat</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(product.price || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Stok</p>
          <p className="text-2xl font-bold text-gray-900">
            {product.stock || 0} {product.unit || 'ADET'}
          </p>
          {product.minStock && (
            <p className="text-xs text-gray-500 mt-1">
              Min: {product.minStock} | Max: {product.maxStock || '-'}
            </p>
          )}
        </div>
        {/* YENİ: Rezerve Miktar */}
        <div className={`bg-white rounded-lg shadow-card p-6 ${(product as any).reservedQuantity > 0 ? 'border-2 border-orange-300 bg-orange-50' : ''}`}>
          <p className="text-sm text-gray-600 mb-1">Rezerve Miktar</p>
          <p className={`text-2xl font-bold ${(product as any).reservedQuantity > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {(product as any).reservedQuantity || 0} {product.unit || 'ADET'}
          </p>
          {(product as any).reservedQuantity > 0 && (
            <p className="text-xs text-orange-600 mt-1 font-medium">
              ⚠️ Sevkiyat bekliyor
            </p>
          )}
        </div>
        {/* YENİ: Beklenen Giriş (Incoming Quantity) */}
        <div className={`bg-white rounded-lg shadow-card p-6 ${(product as any).incomingQuantity > 0 ? 'border-2 border-green-300 bg-green-50' : ''}`}>
          <p className="text-sm text-gray-600 mb-1">Beklenen Giriş</p>
          <p className={`text-2xl font-bold ${(product as any).incomingQuantity > 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {(product as any).incomingQuantity || 0} {product.unit || 'ADET'}
          </p>
          {(product as any).incomingQuantity > 0 && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              ✓ Mal kabul bekliyor
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Stok Durumu</p>
          {getStockBadge(product.stock || 0, product.minStock)}
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Ürün Durumu</p>
          {getStatusBadge(product.status)}
        </div>
      </div>

      {/* Product Details */}
      {(product.category || product.sku || product.barcode || product.weight || product.dimensions || product.description) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ürün Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.sku && (
              <div>
                <p className="text-sm text-gray-600 mb-1">SKU (Stok Kodu)</p>
                <p className="font-medium">{product.sku}</p>
              </div>
            )}
            {product.barcode && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Barkod</p>
                <p className="font-mono font-medium">{product.barcode}</p>
              </div>
            )}
            {product.category && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Kategori</p>
                <p className="font-medium">{product.category}</p>
              </div>
            )}
            {product.vendorId && product.Vendor && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Tedarikçi</p>
                <Link
                  href={`/${locale}/vendors/${product.Vendor.id}`}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {product.Vendor.name}
                </Link>
              </div>
            )}
            {product.unit && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Birim</p>
                <p className="font-medium">{product.unit}</p>
              </div>
            )}
            {product.weight && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Ağırlık</p>
                <p className="font-medium">{product.weight} kg</p>
              </div>
            )}
            {product.dimensions && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Boyutlar</p>
                <p className="font-medium">{product.dimensions}</p>
              </div>
            )}
            {product.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            {product.imageUrl && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Fotoğraf</p>
                <Image 
                  src={product.imageUrl} 
                  alt={product.name}
                  width={192}
                  height={192}
                  className="object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Ürün ID</span>
            <span className="font-mono text-sm">{product.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Oluşturulma Tarihi</span>
            <span>{new Date(product.createdAt).toLocaleString('tr-TR')}</span>
          </div>
          {product.updatedAt && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Güncellenme Tarihi</span>
              <span>{new Date(product.updatedAt).toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs: Satış Geçmişi (müşteri/firma bazlı) ve Stok Geçmişi (teknik hareketler) */}
      <Card className="p-6">
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Satış Geçmişi
            </TabsTrigger>
            <TabsTrigger value="stock">
              <History className="h-4 w-4 mr-2" />
              Stok Geçmişi
            </TabsTrigger>
          </TabsList>

          {/* Satış Geçmişi Tab - Müşteri, firma, fırsat bazlı satış bilgileri */}
          <TabsContent value="sales" className="mt-6">
            {(relatedQuotes.length > 0 || relatedInvoices.length > 0) ? (
              <>
          
          {/* Teklifler */}
          {relatedQuotes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">Teklifler ({relatedQuotes.length})</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Teklif</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedQuotes.map((quote: any) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/${locale}/quotes/${quote.id}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {quote.title || quote.quoteNumber || '-'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {quote.Customer?.name || '-'}
                        </TableCell>
                        <TableCell>{quote.quantity || '-'}</TableCell>
                        <TableCell>{formatCurrency(quote.unitPrice || 0)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quote.total || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{quote.status || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Faturalar */}
          {relatedInvoices.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700">Faturalar ({relatedInvoices.length})</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Müşteri</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedInvoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/${locale}/invoices/${invoice.id}`}
                            className="text-indigo-600 hover:underline"
                          >
                            {invoice.title || '-'}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {invoice.Customer?.name || '-'}
                        </TableCell>
                        <TableCell>{invoice.quantity || '-'}</TableCell>
                        <TableCell>{formatCurrency(invoice.unitPrice || 0)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.total || 0)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.status || '-'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Bu ürün için henüz teklif veya fatura kaydı bulunmuyor.
              </div>
            )}
          </TabsContent>

          {/* Stok Geçmişi Tab - Teknik stok hareketleri (giriş, çıkış, sevkiyat, tedarikçi) */}
          <TabsContent value="stock" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Son 10 Stok Hareketi</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStockFormType('IN')
                    setStockFormOpen(true)
                  }}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Yeni Giriş
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStockFormType('OUT')
                    setStockFormOpen(true)
                  }}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Yeni Çıkış
                </Button>
              </div>
            </div>
            
            {stockMovements.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Önceki Stok</TableHead>
                      <TableHead>Yeni Stok</TableHead>
                      <TableHead>Sebep</TableHead>
                      <TableHead>İşlem Yapan</TableHead>
                      <TableHead>Notlar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.map((movement: any) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementTypeIcon(movement.type)}
                            <span>{getMovementTypeLabel(movement.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell className={movement.type === 'OUT' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                          {movement.type === 'OUT' ? '-' : '+'}{Math.abs(movement.quantity)}
                        </TableCell>
                        <TableCell>{movement.previousStock}</TableCell>
                        <TableCell className="font-semibold">{movement.newStock}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.reason || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          {movement.User?.name || movement.User?.email || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {movement.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Stok hareketi bulunamadı
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Activity Timeline */}
      <ActivityTimeline entityType="Product" entityId={id} />

      {/* Stok Hareketi Form Modal */}
      <StockMovementForm
        productId={id}
        productName={product.name}
        currentStock={product.stock || 0}
        type={stockFormType}
        open={stockFormOpen}
        onClose={() => {
          setStockFormOpen(false)
          setStockFormType(undefined)
        }}
        onSuccess={async () => {
          // Stok hareketi başarılı olduğunda cache'leri güncelle
          await mutateStockMovements(undefined, { revalidate: true })
          await mutateProduct(undefined, { revalidate: true })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/products', undefined, { revalidate: true }),
            mutate('/api/products?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/products'), undefined, { revalidate: true }),
            mutate('/api/stock-movements', undefined, { revalidate: true }),
          ])
        }}
      />

      {/* Product Form Modal */}
      <ProductForm
        product={product}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedProduct: any) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş product'ı cache'e ekle
          await mutateProduct(savedProduct, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/products', undefined, { revalidate: true }),
            mutate('/api/products?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/products'), undefined, { revalidate: true }),
          ])
        }}
      />
    </div>
  )
}
