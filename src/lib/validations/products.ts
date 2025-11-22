import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1, 'Ürün adı gereklidir').max(200, 'Ürün adı en fazla 200 karakter olabilir'),
  price: z.number().min(0, 'Fiyat 0\'dan büyük olmalı').max(999999999, 'Fiyat çok büyük'),
  stock: z.number().min(0, 'Stok 0\'dan küçük olamaz').max(999999999, 'Stok çok büyük').optional(),
  vendorId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
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
  if (data.minStock !== undefined && 
      data.maxStock !== undefined && 
      data.maxStock > 0 && 
      data.minStock > data.maxStock) {
    return false
  }
  return true
}, {
  message: 'Min stok, max stoktan büyük olamaz',
  path: ['minStock'],
})

export const productUpdateSchema = productCreateSchema.partial().extend({
  name: z.string().min(1, 'Ürün adı gereklidir').max(200, 'Ürün adı en fazla 200 karakter olabilir').optional(),
})

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>


