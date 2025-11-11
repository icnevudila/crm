'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçilmelidir'),
  quantity: z.number().min(0.01, 'Miktar 0\'dan büyük olmalı'),
  unitPrice: z.number().min(0, 'Birim fiyat 0\'dan büyük olmalı'),
})

type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>

interface InvoiceItemFormProps {
  invoiceId: string
  open: boolean
  onClose: () => void
  onSuccess?: (invoiceItem: any) => void
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default function InvoiceItemForm({
  invoiceId,
  open,
  onClose,
  onSuccess,
}: InvoiceItemFormProps) {
  const [loading, setLoading] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: open,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InvoiceItemFormData>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      unitPrice: 0,
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
        unitPrice: 0,
      })
    }
  }, [open, reset])

  const onSubmit = async (data: InvoiceItemFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/invoice-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to add invoice item')
      }

      const invoiceItem = await res.json()

      if (onSuccess) {
        onSuccess(invoiceItem)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Ürün ekleme işlemi başarısız oldu', error?.message)
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
            Faturaya ürün ekleyin. Stok otomatik güncellenecektir.
          </DialogDescription>
        </DialogHeader>

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
              min="0"
              {...register('unitPrice', { valueAsNumber: true })}
              placeholder="0.00"
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
      </DialogContent>
    </Dialog>
  )
}

