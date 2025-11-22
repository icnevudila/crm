import { z } from 'zod'

export const vendorCreateSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı gereklidir').max(200, 'Tedarikçi adı en fazla 200 karakter olabilir'),
  sector: z.string().max(100, 'Sektör en fazla 100 karakter olabilir').optional(),
  city: z.string().max(100, 'Şehir en fazla 100 karakter olabilir').optional(),
  address: z.string().max(500, 'Adres en fazla 500 karakter olabilir').optional(),
  phone: z.string().max(50, 'Telefon en fazla 50 karakter olabilir').optional(),
  email: z.string().email('Geçerli bir email adresi giriniz').optional().or(z.literal('')),
  website: z.string().url('Geçerli bir website adresi giriniz').optional().or(z.literal('')),
  taxNumber: z.string().max(50, 'Vergi numarası en fazla 50 karakter olabilir').optional(),
  taxOffice: z.string().max(100, 'Vergi dairesi en fazla 100 karakter olabilir').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const vendorUpdateSchema = vendorCreateSchema.partial().extend({
  name: z.string().min(1, 'Tedarikçi adı gereklidir').max(200, 'Tedarikçi adı en fazla 200 karakter olabilir').optional(),
})

export type VendorCreateInput = z.infer<typeof vendorCreateSchema>
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>


