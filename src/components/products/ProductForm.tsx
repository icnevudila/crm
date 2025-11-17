'use client'

import { useState, useEffect, useRef } from 'react'
import { toast, handleApiError } from '@/lib/toast'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { handleFormValidationErrors } from '@/lib/form-validation'
import Image from 'next/image'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
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
  // ÖNEMLİ: maxStock 0 veya undefined ise kontrolü atla (opsiyonel alan)
  if (data.minStock !== undefined && 
      data.maxStock !== undefined && 
      data.maxStock > 0 && // maxStock 0 ise kontrolü atla
      data.minStock > data.maxStock) {
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
  const navigateToDetailToast = useNavigateToDetailToast()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const formRef = useRef<HTMLFormElement>(null)
  
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
        // Fotoğraf preview'ını ayarla
        setImagePreview(product.imageUrl || null)
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
        setImagePreview(null)
      }
    }
  }, [product, open, reset])

  // Fotoğraf yükleme handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolü (sadece resim)
    if (!file.type.startsWith('image/')) {
      toast.error('Hata', 'Lütfen geçerli bir resim dosyası seçin')
      return
    }

    // Dosya boyutu kontrolü (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Hata', 'Resim boyutu 5MB\'dan büyük olamaz')
      return
    }

    setUploadingImage(true)
    try {
      // Önce preview göster
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Supabase Storage'a yükle
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'Product')
      if (product?.id) {
        formData.append('entityId', product.id)
      }

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Fotoğraf yüklenemedi')
      }

      const { file: uploadedFile } = await res.json()
      
      // Form'a imageUrl'i set et
      setValue('imageUrl', uploadedFile.url)
      
      toast.success('Başarılı', 'Fotoğraf başarıyla yüklendi')
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error('Hata', error?.message || 'Fotoğraf yüklenemedi')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Fotoğrafı kaldır
  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('imageUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
        // Response body'yi güvenli bir şekilde parse et
        let result: any = {}
        let responseText = ''
        try {
          responseText = await res.text()
          if (responseText) {
            result = JSON.parse(responseText)
          }
        } catch (parseError) {
          // JSON parse edilemezse boş obje kullan
          console.warn('Response JSON parse edilemedi:', parseError, 'Response text:', responseText)
          // Parse edilemezse bile response text'i kullan
          if (responseText) {
            result = { error: responseText, message: responseText }
          }
        }
        
        // Daha detaylı hata mesajı oluştur
        const errorMessage = result?.error || result?.message || responseText || `Ürün kaydedilemedi (${res.status})`
        const apiError: any = {
          status: res.status,
          message: errorMessage,
          error: result?.error || errorMessage,
          code: result?.code || `HTTP_${res.status}`,
          details: result,
          responseText, // Debug için response text'i de ekle
        }
        console.error('ProductForm API Error:', {
          status: res.status,
          error: apiError,
          result,
          responseText,
        })
        throw apiError
      }

      return res.json()
    },
    onSuccess: (result) => {
      // Success toast göster
      if (product) {
        toast.success('Ürün güncellendi', `${result.name} başarıyla güncellendi.`)
      } else {
        // Yeni ürün oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('product', result.id, result.name)
      }
      
      // Parent component'e callback gönder - optimistic update için
      if (onSuccess) {
        onSuccess(result)
      }
      reset()
      onClose()
    },
  })

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      handleApiError(error, 'Ürün kaydedilemedi', 'Ürün kaydetme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.')
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

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          {/* Zorunlu Alanlar Bilgisi */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">*</span> işareti olan alanlar zorunludur. Diğer alanlar isteğe bağlıdır.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Ürün Adı <span className="text-red-500 font-bold">*</span>
                <span className="text-xs text-gray-500 font-normal">(Zorunlu)</span>
              </label>
              <Input
                {...register('name')}
                placeholder="Örn: Domates Suyu"
                disabled={loading}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name ? (
                <p className="text-sm text-red-600 font-medium">{errors.name.message}</p>
              ) : (
                <p className="text-xs text-gray-500">Ürünün görünen adını girin</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                SKU (Stok Kodu)
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                {...register('sku')}
                placeholder="Örn: PRD-001"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Ürünün benzersiz stok kodunu girin</p>
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Barkod
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                {...register('barcode')}
                placeholder="Örn: 1234567890123"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Ürünün barkod numarasını girin</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Kategori
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
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
                  placeholder="Yeni kategori yazın"
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
                Mevcut kategorilerden seçin veya yeni kategori yazıp <span className="font-semibold">Enter</span> tuşuna basın
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Durum
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel - Varsayılan: Aktif)</span>
              </label>
              <Select
                value={watch('status') || 'ACTIVE'}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif (Satışta)</SelectItem>
                  <SelectItem value="INACTIVE">Pasif (Satışta Değil)</SelectItem>
                  <SelectItem value="DISCONTINUED">Üretimden Kalktı</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Ürünün satış durumunu belirleyin</p>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Birim
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel - Varsayılan: Adet)</span>
              </label>
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
              <p className="text-xs text-gray-500">Stok miktarının ölçü birimini seçin</p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Fiyat (₺)
                <span className="text-red-500 font-bold">*</span>
                <span className="text-xs text-gray-500 font-normal">(Zorunlu)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price ? (
                <p className="text-sm text-red-600 font-medium">{errors.price.message}</p>
              ) : (
                <p className="text-xs text-gray-500">Ürünün satış fiyatını girin (TL cinsinden)</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Stok Miktarı
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel - Varsayılan: 0)</span>
              </label>
              <Input
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock ? (
                <p className="text-sm text-red-600 font-medium">{errors.stock.message}</p>
              ) : (
                <p className="text-xs text-gray-500">Mevcut stok miktarını girin</p>
              )}
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Minimum Stok
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                type="number"
                min="0"
                {...register('minStock', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
                className={errors.minStock ? 'border-red-500' : ''}
              />
              {errors.minStock ? (
                <p className="text-sm text-red-600 font-medium">{errors.minStock.message}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Stok bu seviyenin altına düştüğünde <span className="font-semibold text-orange-600">uyarı bildirimi</span> gönderilir
                </p>
              )}
            </div>

            {/* Max Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Maksimum Stok
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                type="number"
                min="0"
                {...register('maxStock', { valueAsNumber: true })}
                placeholder="0 (boş bırakılabilir)"
                disabled={loading}
                className={errors.maxStock ? 'border-red-500' : ''}
              />
              {errors.maxStock ? (
                <p className="text-sm text-red-600 font-medium">{errors.maxStock.message}</p>
              ) : (
                <p className="text-xs text-gray-500">
                  Maksimum stok seviyesi. <span className="font-semibold">0 girilirse kontrol edilmez.</span> Minimum stoktan büyük olmalıdır.
                </p>
              )}
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Tedarikçi
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
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
              <p className="text-xs text-gray-500">Ürünü tedarik eden firma veya kişiyi seçin</p>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Ağırlık (kg)
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('weight', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Ürünün ağırlığını kilogram cinsinden girin</p>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Boyutlar
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Input
                {...register('dimensions')}
                placeholder="Örn: 10x20x30 cm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Ürünün boyutlarını girin (uzunluk x genişlik x yükseklik)</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Ürün Fotoğrafı
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              
              {/* Fotoğraf Preview */}
              {imagePreview && (
                <div className="relative inline-block mb-2">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Ürün fotoğrafı"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                    disabled={loading || uploadingImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Fotoğraf Yükleme Butonu */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading || uploadingImage}
                  className="hidden"
                  id="product-image-upload"
                />
                <label
                  htmlFor="product-image-upload"
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImage || loading
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      <span className="text-sm text-gray-600">Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-indigo-600">
                        {imagePreview ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Manuel URL Girişi (Opsiyonel) */}
              <div className="mt-2">
                <Input
                  type="url"
                  {...register('imageUrl')}
                  placeholder="Veya resim URL'si girin (https://example.com/image.jpg)"
                  disabled={loading || uploadingImage}
                  onChange={(e) => {
                    setValue('imageUrl', e.target.value)
                    if (e.target.value) {
                      setImagePreview(e.target.value)
                    } else {
                      setImagePreview(null)
                    }
                  }}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum dosya boyutu: 5MB. Desteklenen formatlar: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium flex items-center gap-1">
                Açıklama
                <span className="text-xs text-gray-500 font-normal">(Opsiyonel)</span>
              </label>
              <Textarea
                {...register('description')}
                placeholder="Ürün açıklaması ve özellikleri"
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Ürün hakkında detaylı bilgi ve özelliklerini yazın (maksimum 2000 karakter)</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
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





