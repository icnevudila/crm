'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

const productSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir').max(200, 'Ürün adı en fazla 200 karakter olabilir'),
  price: z.number().min(0, 'Fiyat 0\'dan büyük olmalı').max(999999999, 'Fiyat çok büyük'),
  stock: z.number().min(0, 'Stok 0\'dan küçük olamaz').max(999999999, 'Stok çok büyük').optional(),
  vendorId: z.string().optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  imageUrl: z.union([
    z.string().url('Geçerli bir URL girin'),
    z.literal(''),
  ]).optional(),
  category: z.string().max(100, 'Kategori en fazla 100 karakter olabilir').optional(),
  sku: z.string().max(100, 'SKU en fazla 100 karakter olabilir').optional(),
  barcode: z.string().max(100, 'Barkod en fazla 100 karakter olabilir').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
  minStock: z.number().min(0, 'Min stok 0\'dan küçük olamaz').max(999999999, 'Min stok çok büyük').optional(),
  maxStock: z.number().min(0, 'Max stok 0\'dan küçük olamaz').max(999999999, 'Max stok çok büyük').optional(),
  unit: z.string().max(20, 'Birim en fazla 20 karakter olabilir').optional(),
  weight: z.number().min(0, 'Ağırlık 0\'dan küçük olamaz').max(999999, 'Ağırlık çok büyük').optional(),
  dimensions: z.string().max(100, 'Boyutlar en fazla 100 karakter olabilir').optional(),
}).refine((data) => {
  // minStock < maxStock kontrolü
  if (data.minStock !== undefined && data.maxStock !== undefined && data.minStock > data.maxStock) {
    return false
  }
  return true
}, {
  message: 'Min stok, max stoktan büyük olamaz',
  path: ['minStock'],
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: any
  open: boolean
  onClose: () => void
  onSuccess?: (newProduct: any) => void
}

async function fetchVendors() {
  const res = await fetch('/api/vendors')
  if (!res.ok) throw new Error('Failed to fetch vendors')
  return res.json()
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default function ProductForm({ product, open, onClose, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    enabled: open,
  })

  const { data: productsData = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: open,
  })

  // Unique kategorileri çıkar (dropdown için)
  const categories = Array.from(
    new Set(
      (Array.isArray(productsData) ? productsData : [])
        .map((p: any) => p.category)
        .filter((cat: string) => cat && cat.trim() !== '')
    )
  ).sort() as string[]

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      name: '',
      price: 0,
      stock: 0,
      vendorId: '',
      description: '',
      imageUrl: '',
      category: '',
      sku: '',
      barcode: '',
      status: 'ACTIVE',
      minStock: 0,
      maxStock: 0,
      unit: 'ADET',
      weight: 0,
      dimensions: '',
    },
  })

  // Product prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (product) {
        // Düzenleme modu - product bilgilerini yükle
        reset({
          name: product.name || '',
          price: product.price || 0,
          stock: product.stock || 0,
          vendorId: product.vendorId || '',
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          category: product.category || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          status: product.status || 'ACTIVE',
          minStock: product.minStock || 0,
          maxStock: product.maxStock || 0,
          unit: product.unit || 'ADET',
          weight: product.weight || 0,
          dimensions: product.dimensions || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          name: '',
          price: 0,
          stock: 0,
          vendorId: '',
          description: '',
          imageUrl: '',
          category: '',
          sku: '',
          barcode: '',
          status: 'ACTIVE',
          minStock: 0,
          maxStock: 0,
          unit: 'ADET',
          weight: 0,
          dimensions: '',
        })
      }
    }
  }, [product, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save product')
      }

      return res.json()
    },
    onSuccess: (result) => {
      // Parent component'e callback gönder - optimistic update için
      if (onSuccess) {
        onSuccess(result)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Ürün Düzenle' : 'Yeni Ürün'}
          </DialogTitle>
          <DialogDescription>
            {product ? 'Ürün bilgilerini güncelleyin' : 'Yeni ürün ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Ürün Adı *</label>
              <Input
                {...register('name')}
                placeholder="Ürün adı"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU (Stok Kodu)</label>
              <Input
                {...register('sku')}
                placeholder="Örn: PRD-001"
                disabled={loading}
              />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Barkod</label>
              <Input
                {...register('barcode')}
                placeholder="Örn: 1234567890123"
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori</label>
              <div className="flex gap-2">
                <Select
                  value={watch('category') || 'none'}
                  onValueChange={(value) => setValue('category', value === 'none' ? '' : value)}
                  disabled={loading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori Seçilmedi</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  {...register('category')}
                  placeholder="Yeni kategori"
                  disabled={loading}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const newCategory = e.currentTarget.value.trim()
                      if (newCategory && !categories.includes(newCategory)) {
                        setValue('category', newCategory)
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                Mevcut kategorilerden seçin veya yeni kategori yazıp Enter&apos;a basın
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={watch('status') || 'ACTIVE'}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Pasif</SelectItem>
                  <SelectItem value="DISCONTINUED">Üretimden Kalktı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Birim</label>
              <Select
                value={watch('unit') || 'ADET'}
                onValueChange={(value) => setValue('unit', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Birim seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADET">Adet</SelectItem>
                  <SelectItem value="KG">Kilogram</SelectItem>
                  <SelectItem value="LITRE">Litre</SelectItem>
                  <SelectItem value="M2">Metrekare</SelectItem>
                  <SelectItem value="M3">Metreküp</SelectItem>
                  <SelectItem value="PAKET">Paket</SelectItem>
                  <SelectItem value="KUTU">Kutu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fiyat (₺) *</label>
              <Input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Stok Miktarı</label>
              <Input
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
              />
              {errors.stock && (
                <p className="text-sm text-red-600">{errors.stock.message}</p>
              )}
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Stok</label>
              <Input
                type="number"
                min="0"
                {...register('minStock', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Stok bu seviyenin altına düştüğünde uyarı verilir</p>
            </div>

            {/* Max Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Maksimum Stok</label>
              <Input
                type="number"
                min="0"
                {...register('maxStock', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Maksimum stok seviyesi (opsiyonel)</p>
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tedarikçi</label>
              <Select
                value={watch('vendorId') || 'none'}
                onValueChange={(value) => setValue('vendorId', value === 'none' ? undefined : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tedarikçi Seçilmedi</SelectItem>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ağırlık (kg)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('weight', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Boyutlar</label>
              <Input
                {...register('dimensions')}
                placeholder="Örn: 10x20x30 cm"
                disabled={loading}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Resim URL</label>
              <Input
                type="url"
                {...register('imageUrl')}
                placeholder="https://example.com/image.jpg"
                disabled={loading}
              />
              {errors.imageUrl && (
                <p className="text-sm text-red-600">{errors.imageUrl.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Ürün açıklaması ve özellikleri"
                rows={4}
                disabled={loading}
              />
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
              {loading ? 'Kaydediliyor...' : product ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}





