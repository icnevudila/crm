import { z } from 'zod'

export const contractCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  dealId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  type: z.string().default('SERVICE'),
  category: z.string().max(100, 'Kategori en fazla 100 karakter olabilir').optional(),
  startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
  endDate: z.string().min(1, 'Bitiş tarihi gereklidir'),
  signedDate: z.string().optional(),
  renewalType: z.string().default('MANUAL'),
  renewalNoticeDays: z.number().min(0, 'Yenileme bildirim günü 0-365 arasında olmalıdır').max(365, 'Yenileme bildirim günü 0-365 arasında olmalıdır').default(30),
  autoRenewEnabled: z.boolean().default(false),
  billingCycle: z.string().default('YEARLY'),
  billingDay: z.number().min(1, 'Faturalama günü 1-31 arasında olmalıdır').max(31, 'Faturalama günü 1-31 arasında olmalıdır').optional(),
  paymentTerms: z.number().min(0, 'Ödeme koşulları 0-365 arasında olmalıdır').max(365, 'Ödeme koşulları 0-365 arasında olmalıdır').default(30),
  value: z.number().min(0, 'Değer 0\'dan küçük olamaz').max(999999999, 'Değer çok büyük'),
  currency: z.string().default('TRY'),
  taxRate: z.number().min(0, 'KDV oranı 0-100 arasında olmalıdır').max(100, 'KDV oranı 0-100 arasında olmalıdır').default(18),
  status: z.string().default('DRAFT'),
  terms: z.string().max(5000, 'Şartlar en fazla 5000 karakter olabilir').optional(),
  notes: z.string().max(2000, 'Notlar en fazla 2000 karakter olabilir').optional(),
}).refine((data) => {
  // customerId veya customerCompanyId en az biri zorunlu
  return !!(data.customerId && data.customerId.trim() !== '') || !!(data.customerCompanyId && data.customerCompanyId.trim() !== '')
}, {
  message: 'Müşteri veya Firma seçimi zorunludur',
  path: ['customerId'],
}).refine((data) => {
  // endDate startDate'den sonra olmalı
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate)
    const end = new Date(data.endDate)
    return end >= start
  }
  return true
}, {
  message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
  path: ['endDate'],
}).refine((data) => {
  // signedDate startDate'den önce olamaz
  if (data.startDate && data.signedDate) {
    const start = new Date(data.startDate)
    const signed = new Date(data.signedDate)
    return signed >= start
  }
  return true
}, {
  message: 'İmza tarihi başlangıç tarihinden önce olamaz',
  path: ['signedDate'],
})

export const contractUpdateSchema = contractCreateSchema.partial().extend({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type ContractCreateInput = z.infer<typeof contractCreateSchema>
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>


