'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { Layers, Package } from 'lucide-react'

const quoteItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  quantity: z.number().min(0.01, 'Miktar 0\'dan büyük olmalı'),
  unitPrice: z.number().min(0.01, 'Birim fiyat 0\'dan büyük olmalı').refine((val) => val > 0, {
    message: 'Teklif kalemi birim fiyatı 0 olamaz. Lütfen geçerli bir fiyat girin.',
  }),
})

type QuoteItemFormData = z.infer<typeof quoteItemSchema>

interface QuoteItemFormProps {
  quoteId: string
  open: boolean
  onClose: () => void
  onSuccess?: (quoteItem: any) => void
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function fetchProductBundles() {
  const res = await fetch('/api/product-bundles?status=ACTIVE')
  if (!res.ok) throw new Error('Failed to fetch product bundles')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default function QuoteItemForm({
  quoteId,
  open,
  onClose,
  onSuccess,
}: QuoteItemFormProps) {
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'product' | 'bundle'>('product')
  const [selectedBundleId, setSelectedBundleId] = useState<string>('')

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: open,
  })

  const { data: bundles = [] } = useQuery({
    queryKey: ['product-bundles'],
    queryFn: fetchProductBundles,
    enabled: open && mode === 'bundle',
  })

  const { data: selectedBundle } = useQuery({
    queryKey: ['product-bundle', selectedBundleId],
    queryFn: async () => {
      if (!selectedBundleId) return null
      const res = await fetch(`/api/product-bundles/${selectedBundleId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: open && mode === 'bundle' && !!selectedBundleId,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuoteItemFormData>({
    resolver: zodResolver(quoteItemSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      unitPrice: 0.01,
    },
  })

  const selectedProductId = watch('productId')
  const quantity = watch('quantity') || 0
  const unitPrice = watch('unitPrice') || 0
  const total = quantity * unitPrice

  // Seçilen ürünün fiyatını otomatik doldur
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p: any) => p.id === selectedProductId)
      if (product && product.price) {
        setValue('unitPrice', product.price)
      }
    }
  }, [selectedProductId, products, setValue])

  // Modal açıldığında form'u temizle
  useEffect(() => {
    if (open) {
      reset({
        productId: '',
        quantity: 1,
        unitPrice: 0.01,
      })
      setMode('product')
      setSelectedBundleId('')
    }
  }, [open, reset])

  const onSubmit = async (data: QuoteItemFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/quote-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to add quote item')
      }

      const quoteItem = await res.json()

      if (onSuccess) {
        onSuccess(quoteItem)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Ürün ekleme işlemi başarısız oldu', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const onSubmitBundle = async () => {
    if (!selectedBundle || !selectedBundle.items || selectedBundle.items.length === 0) {
      toast.error('Hata', { description: 'Lütfen bir bundle seçin' })
      return
    }

    setLoading(true)
    try {
      // Bundle içindeki tüm ürünleri QuoteItem olarak ekle
      const items = selectedBundle.items.map((item: any) => ({
        quoteId,
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price || 0,
      }))

      // Her item için API çağrısı yap
      const results = await Promise.all(
        items.map((item: any) =>
          fetch('/api/quote-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          }).then((res) => {
            if (!res.ok) {
              return res.json().then((err) => {
                throw new Error(err.error || 'Failed to add quote item')
              })
            }
            return res.json()
          })
        )
      )

      toast.success('Başarılı', {
        description: `${results.length} ürün bundle'dan eklendi`,
      })

      if (onSuccess) {
        // İlk item'ı callback olarak gönder (UI güncellemesi için)
        onSuccess(results[0])
      }

      setSelectedBundleId('')
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Bundle ekleme işlemi başarısız oldu', {
        description: error?.message || 'Bir hata oluştu',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ürün Ekle</DialogTitle>
          <DialogDescription>
            Teklife ürün ekleyin. Ürün paketi seçerek birden fazla ürünü tek seferde ekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'product' | 'bundle')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="product" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tek Ürün
            </TabsTrigger>
            <TabsTrigger value="bundle" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Ürün Paketi
            </TabsTrigger>
          </TabsList>

          {/* Tek Ürün Modu */}
          <TabsContent value="product">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Ürün Seçimi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ürün *</label>
                <Select
                  value={selectedProductId || ''}
                  onValueChange={(value) => setValue('productId', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''} - Stok: {product.stock || 0}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className="text-sm text-red-600">{errors.productId.message}</p>
                )}
              </div>

              {/* Miktar */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Miktar *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="1"
                  disabled={loading}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              {/* Birim Fiyat */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Birim Fiyat (₺) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('unitPrice', { valueAsNumber: true })}
                  placeholder="0.01"
                  disabled={loading}
                />
                {errors.unitPrice && (
                  <p className="text-sm text-red-600">{errors.unitPrice.message}</p>
                )}
              </div>

              {/* Toplam */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Toplam</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Bundle Modu */}
          <TabsContent value="bundle">
            <div className="space-y-4">
              {/* Bundle Seçimi */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ürün Paketi *</label>
                <Select
                  value={selectedBundleId}
                  onValueChange={setSelectedBundleId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Paket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {bundles.map((bundle: any) => (
                      <SelectItem key={bundle.id} value={bundle.id}>
                        {bundle.name} - {formatCurrency(bundle.finalPrice || bundle.totalPrice || 0)}
                        {bundle.items && ` (${bundle.items.length} ürün)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seçilen Bundle Detayları */}
              {selectedBundle && selectedBundle.items && selectedBundle.items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">{selectedBundle.name}</h4>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatCurrency(selectedBundle.finalPrice || selectedBundle.totalPrice || 0)}
                    </span>
                  </div>
                  {selectedBundle.description && (
                    <p className="text-sm text-gray-600">{selectedBundle.description}</p>
                  )}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Paket İçeriği:</p>
                    <div className="space-y-2">
                      {selectedBundle.items.map((item: any, index: number) => (
                        <div
                          key={item.id || index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-700">
                            {item.product?.name || 'Ürün bulunamadı'} x {item.quantity}
                          </span>
                          <span className="text-gray-600">
                            {formatCurrency((item.product?.price || 0) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="button"
                  onClick={onSubmitBundle}
                  className="bg-gradient-primary text-white"
                  disabled={loading || !selectedBundleId}
                >
                  {loading ? 'Ekleniyor...' : 'Paketi Ekle'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

