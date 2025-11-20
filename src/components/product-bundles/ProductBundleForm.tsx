'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/lib/toast'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'

const productBundleSchema = z.object({
  name: z.string().min(1, 'Paket adı gereklidir'),
  description: z.string().optional(),
  totalPrice: z.number().min(0, 'Toplam fiyat 0\'dan büyük olmalı'),
  discount: z.number().min(0).max(100, 'İndirim 0-100 arası olmalı'),
  finalPrice: z.number().min(0, 'Final fiyat 0\'dan büyük olmalı'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  items: z.array(z.object({
    productId: z.string().min(1, 'Ürün seçmelisiniz'),
    quantity: z.number().min(1, 'Miktar 1\'den büyük olmalı'),
  })).min(1, 'En az bir ürün eklemelisiniz'),
})

type ProductBundleFormData = z.infer<typeof productBundleSchema>

interface ProductBundleFormProps {
  bundle?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedBundle: any) => void
}

export default function ProductBundleForm({
  bundle,
  open,
  onClose,
  onSuccess,
}: ProductBundleFormProps) {
  const locale = useLocale()
  const t = useTranslations('productBundles')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Array<{ id: string; name?: string; sku?: string; price?: number }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductBundleFormData>({
    resolver: zodResolver(productBundleSchema),
    defaultValues: {
      name: '',
      description: '',
      totalPrice: 0,
      discount: 0,
      finalPrice: 0,
      status: 'ACTIVE',
      items: [],
    },
  })

  const watchedItems = watch('items')
  const watchedTotalPrice = watch('totalPrice')
  const watchedDiscount = watch('discount')

  // Calculate finalPrice when totalPrice or discount changes
  useEffect(() => {
    const total = watchedTotalPrice || 0
    const discountPercent = watchedDiscount || 0
    const discountAmount = (total * discountPercent) / 100
    const final = total - discountAmount
    setValue('finalPrice', Math.max(0, final))
  }, [watchedTotalPrice, watchedDiscount, setValue])

  // Load products
  useEffect(() => {
    if (open) {
      fetch('/api/products?limit=100')
        .then((res) => res.json())
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load products:', err))
    }
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (bundle) {
        reset({
          name: bundle.name || '',
          description: bundle.description || '',
          totalPrice: bundle.totalPrice || 0,
          discount: bundle.discount || 0,
          finalPrice: bundle.finalPrice || bundle.totalPrice || 0,
          status: bundle.status || 'ACTIVE',
          items: bundle.items?.map((item: any) => ({
            productId: item.productId || item.product?.id || '',
            quantity: item.quantity || 1,
          })) || [],
        })
      } else {
        reset({
          name: '',
          description: '',
          totalPrice: 0,
          discount: 0,
          finalPrice: 0,
          status: 'ACTIVE',
          items: [],
        })
      }
    }
  }, [bundle, open, reset])

  const addItem = () => {
    const currentItems = watch('items') || []
    setValue('items', [
      ...currentItems,
      { productId: '', quantity: 1 },
    ])
  }

  const removeItem = (index: number) => {
    const currentItems = watch('items') || []
    setValue('items', currentItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: 'productId' | 'quantity', value: any) => {
    const currentItems = watch('items') || []
    const updatedItems = [...currentItems]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' ? parseFloat(value) || 0 : value,
    }
    setValue('items', updatedItems)
  }

  const onSubmit = async (data: ProductBundleFormData) => {
    setLoading(true)
    try {
      const url = bundle
        ? `/api/product-bundles/${bundle.id}`
        : '/api/product-bundles'
      const method = bundle ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save bundle')
      }

      const savedBundle = await res.json()
      
      toast.success(
        bundle ? 'Paket güncellendi' : 'Paket oluşturuldu',
        {
          description: bundle 
            ? `${savedBundle.name || 'Paket'} başarıyla güncellendi.` 
            : `${savedBundle.name || 'Paket'} başarıyla oluşturuldu.`
        }
      )
      
      if (onSuccess) {
        onSuccess(savedBundle)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Paket kaydedilemedi', { 
        description: error?.message || 'Bir hata oluştu' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAICreate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-ai-chat', {
          detail: {
            message: `Yeni bir ürün paketi oluştur. Paket adı, açıklama, toplam fiyat, indirim oranı ve pakete dahil edilecek ürünleri belirt.`,
          },
        })
      )
    }
  }

  const handleAIEdit = () => {
    if (bundle && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-ai-chat', {
          detail: {
            message: `"${bundle.name}" adlı ürün paketini düzenle. Paket ID: ${bundle.id}`,
          },
        })
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bundle ? 'Paket Düzenle' : 'Yeni Paket'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* AI Buttons */}
          <div className="flex gap-2 justify-end">
            {bundle ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleAIEdit}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI ile Düzenle
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleAICreate}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI ile Oluştur
              </Button>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Paket Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Premium Paket"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Paket açıklaması..."
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalPrice">Toplam Fiyat (₺) *</Label>
              <Input
                id="totalPrice"
                type="number"
                step="0.01"
                {...register('totalPrice', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.totalPrice && (
                <p className="text-sm text-red-600 mt-1">{errors.totalPrice.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="discount">İndirim (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.discount && (
                <p className="text-sm text-red-600 mt-1">{errors.discount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="finalPrice">Final Fiyat (₺)</Label>
              <Input
                id="finalPrice"
                type="number"
                step="0.01"
                {...register('finalPrice', { valueAsNumber: true })}
                placeholder="0.00"
                readOnly
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(watch('finalPrice') || 0)}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ürünler *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ürün Ekle
              </Button>
            </div>

            {watchedItems && watchedItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchedItems.map((item, index) => {
                      const product = products.find((p) => p.id === item.productId)
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={(value) => updateItem(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Ürün seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.name} {p.sku && `(${p.sku})`} - {formatCurrency(p.price || 0)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.items?.[index]?.productId && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.items[index]?.productId?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            />
                            {errors.items?.[index]?.quantity && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.items[index]?.quantity?.message}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <p>Henüz ürün eklenmedi. Ürün eklemek için yukarıdaki butonu kullanın.</p>
              </div>
            )}
            {errors.items && (
              <p className="text-sm text-red-600 mt-1">{errors.items.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : bundle ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


