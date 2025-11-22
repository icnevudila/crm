import { z } from 'zod'

export const customerCreateSchema = z.object({
  name: z.string().min(1, 'İsim gereklidir').max(200, 'İsim en fazla 200 karakter olabilir'),
  email: z.string().email('Geçerli bir email girin').optional().or(z.literal('')),
  phone: z.string().max(50, 'Telefon en fazla 50 karakter olabilir').optional(),
  fax: z.string().max(50, 'Faks en fazla 50 karakter olabilir').optional(),
  city: z.string().max(100, 'Şehir en fazla 100 karakter olabilir').optional(),
  address: z.string().max(500, 'Adres en fazla 500 karakter olabilir').optional(),
  sector: z.string().max(100, 'Sektör en fazla 100 karakter olabilir').optional(),
  website: z.string().url('Geçerli bir web sitesi URL\'si girin').optional().or(z.literal('')),
  taxNumber: z.string().max(50, 'Vergi numarası en fazla 50 karakter olabilir').optional(),
  notes: z.string().max(2000, 'Notlar en fazla 2000 karakter olabilir').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  logoUrl: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
})

export const customerUpdateSchema = customerCreateSchema.partial().extend({
  name: z.string().min(1, 'İsim gereklidir').max(200, 'İsim en fazla 200 karakter olabilir').optional(),
})

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>


