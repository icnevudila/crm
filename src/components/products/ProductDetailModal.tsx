'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Package, ShoppingCart, FileText, TrendingUp, TrendingDown, Minus, Plus, History, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import dynamic from 'next/dynamic'
import { toast, confirm } from '@/lib/toast'
import StockMovementForm from '@/components/stock/StockMovementForm'
import Link from 'next/link'

// Lazy load ProductForm - performans için
const ProductForm = dynamic(() => import('./ProductForm'), {
  ssr: false,
  loading: () => null,
})

interface ProductDetailModalProps {
  productId: string | null
  open: boolean
  onClose: () => void
  initialData?: any // Liste sayfasından gelen veri (hızlı açılış için)
}

export default function ProductDetailModal({
  productId,
  open,
  onClose,
  initialData,
}: ProductDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [stockFormOpen, setStockFormOpen] = useState(false)
  const [stockFormType, setStockFormType] = useState<'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | undefined>(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // SWR ile veri çek - cache'den hızlı açılış için
  const { data: product, isLoading, error, mutate: mutateProduct } = useData<any>(
    productId && open ? `/api/products/${productId}` : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: false, // Focus'ta yeniden fetch yapma
      fallbackData: initialData, // İlk render için liste sayfasındaki veriyi kullan
    }
  )

  // Stok hareketlerini çek
  const stockMovementsUrl = `/api/stock-movements?productId=${productId}&limit=10`
  const { data: stockMovements = [], mutate: mutateStockMovements } = useData<any[]>(
    productId && open ? stockMovementsUrl : null,
    {
      dedupingInterval: 0, // Cache'i devre dışı bırak (her zaman fresh data)
      revalidateOnFocus: true,
      refreshInterval: 0,
    }
  )

  // İlgili Quote ve Invoice'ları çek
  const { data: relatedQuotes = [] } = useData<any[]>(
    productId && open ? `/api/products/${productId}/quotes` : null
  )
  const { data: relatedInvoices = [] } = useData<any[]>(
    productId && open ? `/api/products/${productId}/invoices` : null
  )

  // initialData varsa direkt göster (hızlı açılış için)
  const displayProduct = product || initialData

  const handleDelete = async () => {
    if (!displayProduct || !confirm(`${displayProduct.name} ürününü silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Ürün silindi')
      
      // Cache'i güncelle
      await mutate('/api/products')
      await mutate(`/api/products/${productId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!open || !productId) return null

  // Loading state - sadece initialData yoksa ve hala loading ise göster
  if (isLoading && !initialData && !displayProduct) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Ürün Detayları"
        size="xl"
      >
        <div className="p-4">Yükleniyor...</div>
      </DetailModal>
    )
  }

  // Error state - sadece initialData yoksa ve error varsa göster
  if (error && !initialData && !displayProduct) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Hata"
        size="md"
      >
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Ürün yüklenemedi</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  // Product yoksa
  if (!displayProduct) {
    return (
      <DetailModal
        open={open}
        onClose={onClose}
        title="Ürün Bulunamadı"
        size="md"
      >
        <div className="p-4 text-center">
          <p className="text-gray-500 mb-4">Ürün bulunamadı</p>
          <Button onClick={onClose}>Kapat</Button>
        </div>
      </DetailModal>
    )
  }

  const getStockBadge = (stock: number, minStock?: number) => {
    if (stock === 0) {
      return <Badge className="bg-red-600 text-white border-red-700">Stokta Yok</Badge>
    } else if (minStock && stock <= minStock) {
      return <Badge className="bg-yellow-600 text-white border-yellow-700">Düşük Stok</Badge>
    } else if (stock <= 10) {
      return <Badge className="bg-yellow-600 text-white border-yellow-700">Düşük Stok</Badge>
    } else {
      return <Badge className="bg-green-600 text-white border-green-700">Stokta Var</Badge>
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600 text-white border-green-700">Aktif</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-600 text-white border-gray-700">Pasif</Badge>
      case 'DISCONTINUED':
        return <Badge className="bg-red-600 text-white border-red-700">Üretimden Kalktı</Badge>
      default:
        return <Badge className="bg-green-600 text-white border-green-700">Aktif</Badge>
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

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayProduct?.name || 'Ürün Detayları'}
        description="Ürün bilgileri ve stok hareketleri"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pb-4 border-b">
            <Button variant="outline" onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleteLoading ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Fiyat</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(displayProduct?.price || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Stok</p>
              <p className="text-2xl font-bold text-gray-900">
                {displayProduct?.stock || 0} {displayProduct?.unit || 'ADET'}
              </p>
              {displayProduct?.minStock && (
                <p className="text-xs text-gray-500 mt-1">
                  Min: {displayProduct.minStock} | Max: {displayProduct.maxStock || '-'}
                </p>
              )}
            </div>
            {(displayProduct as any)?.reservedQuantity > 0 && (
              <div className="bg-white rounded-lg shadow-card p-6 border-2 border-orange-300 bg-orange-50">
                <p className="text-sm text-gray-600 mb-1">Rezerve Miktar</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(displayProduct as any).reservedQuantity || 0} {displayProduct?.unit || 'ADET'}
                </p>
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  ⚠️ Sevkiyat bekliyor
                </p>
              </div>
            )}
            {(displayProduct as any)?.incomingQuantity > 0 && (
              <div className="bg-white rounded-lg shadow-card p-6 border-2 border-green-300 bg-green-50">
                <p className="text-sm text-gray-600 mb-1">Beklenen Giriş</p>
                <p className="text-2xl font-bold text-green-600">
                  {(displayProduct as any).incomingQuantity || 0} {displayProduct?.unit || 'ADET'}
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Mal kabul bekliyor
                </p>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Stok Durumu</p>
              {getStockBadge(displayProduct?.stock || 0, displayProduct?.minStock)}
            </div>
            <div className="bg-white rounded-lg shadow-card p-6">
              <p className="text-sm text-gray-600 mb-1">Ürün Durumu</p>
              {getStatusBadge(displayProduct?.status)}
            </div>
          </div>

          {/* Product Details */}
          {(displayProduct?.category || displayProduct?.sku || displayProduct?.barcode || displayProduct?.weight || displayProduct?.dimensions || displayProduct?.description) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Ürün Detayları</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayProduct?.sku && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">SKU (Stok Kodu)</p>
                    <p className="font-medium">{displayProduct.sku}</p>
                  </div>
                )}
                {displayProduct?.barcode && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Barkod</p>
                    <p className="font-mono font-medium">{displayProduct.barcode}</p>
                  </div>
                )}
                {displayProduct?.category && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kategori</p>
                    <p className="font-medium">{displayProduct.category}</p>
                  </div>
                )}
                {displayProduct?.unit && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Birim</p>
                    <p className="font-medium">{displayProduct.unit}</p>
                  </div>
                )}
                {displayProduct?.weight && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ağırlık</p>
                    <p className="font-medium">{displayProduct.weight} kg</p>
                  </div>
                )}
                {displayProduct?.dimensions && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Boyutlar</p>
                    <p className="font-medium">{displayProduct.dimensions}</p>
                  </div>
                )}
                {displayProduct?.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{displayProduct.description}</p>
                  </div>
                )}
                {displayProduct?.imageUrl && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Fotoğraf</p>
                    <Image 
                      src={displayProduct.imageUrl} 
                      alt={displayProduct.name}
                      width={192}
                      height={192}
                      className="object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Tabs: Satış Geçmişi ve Stok Geçmişi */}
          <Card className="p-6">
            <Tabs defaultValue="stock" className="w-full">
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

              {/* Stok Geçmişi Tab */}
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

              {/* Satış Geçmişi Tab */}
              <TabsContent value="sales" className="mt-6">
                {relatedQuotes.length > 0 || relatedInvoices.length > 0 ? (
                  <>
                    {relatedQuotes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-3 text-gray-700">Teklifler</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Teklif</TableHead>
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Miktar</TableHead>
                                <TableHead>Toplam</TableHead>
                                <TableHead>Durum</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {relatedQuotes.slice(0, 5).map((quote: any) => (
                                <TableRow key={quote.id}>
                                  <TableCell>
                                    <Link 
                                      href={`/${locale}/quotes/${quote.id}`}
                                      className="text-indigo-600 hover:underline"
                                      onClick={onClose}
                                    >
                                      {quote.title || '-'}
                                    </Link>
                                  </TableCell>
                                  <TableCell>{quote.Customer?.name || '-'}</TableCell>
                                  <TableCell>{quote.quantity || '-'}</TableCell>
                                  <TableCell>{formatCurrency(quote.total || 0)}</TableCell>
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
                    {relatedInvoices.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3 text-gray-700">Faturalar</h3>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fatura</TableHead>
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Miktar</TableHead>
                                <TableHead>Toplam</TableHead>
                                <TableHead>Durum</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {relatedInvoices.slice(0, 5).map((invoice: any) => (
                                <TableRow key={invoice.id}>
                                  <TableCell>
                                    <Link 
                                      href={`/${locale}/invoices/${invoice.id}`}
                                      className="text-indigo-600 hover:underline"
                                      onClick={onClose}
                                    >
                                      {invoice.title || '-'}
                                    </Link>
                                  </TableCell>
                                  <TableCell>{invoice.Customer?.name || '-'}</TableCell>
                                  <TableCell>{invoice.quantity || '-'}</TableCell>
                                  <TableCell>{formatCurrency(invoice.total || 0)}</TableCell>
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
                    Satış geçmişi bulunamadı
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>

          {/* Activity Timeline */}
          <ActivityTimeline entityType="Product" entityId={productId} />
        </div>
      </DetailModal>

      {/* Stok Hareketi Form Modal */}
      <StockMovementForm
        productId={productId}
        productName={displayProduct?.name || ''}
        currentStock={displayProduct?.stock || 0}
        type={stockFormType}
        open={stockFormOpen}
        onClose={() => {
          setStockFormOpen(false)
          setStockFormType(undefined)
        }}
        onSuccess={() => {
          mutateProduct()
          mutateStockMovements()
        }}
      />

      {/* Product Form Modal */}
      <ProductForm
        product={displayProduct || undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await mutateProduct()
          await mutate(`/api/products/${productId}`)
        }}
      />
    </>
  )
}

