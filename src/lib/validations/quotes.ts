import { z } from 'zod'

export const quoteCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WAITING']).default('DRAFT'),
  total: z.number().min(0.01, 'Teklif tutarı en az 0.01 olmalıdır').max(999999999, 'Teklif tutarı çok büyük').refine((val) => val > 0, {
    message: 'Teklif tutarı 0 olamaz. Lütfen geçerli bir tutar girin.',
  }),
  dealId: z.string().uuid('Geçerli bir UUID giriniz').min(1, 'Fırsat seçimi zorunludur'),
  vendorId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  validUntil: z.string().min(1, 'Geçerlilik tarihi gereklidir'),
  discount: z.number().min(0, 'İndirim oranı 0-100 arasında olmalıdır').max(100, 'İndirim oranı 0-100 arasında olmalıdır').optional(),
  taxRate: z.number().min(0, 'KDV oranı 0-100 arasında olmalıdır').max(100, 'KDV oranı 0-100 arasında olmalıdır').optional(),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
}).refine((data) => {
  // validUntil geçmiş tarih olamaz
  if (data.validUntil) {
    const validUntil = new Date(data.validUntil)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return validUntil >= today
  }
  return true
}, {
  message: 'Geçerlilik tarihi geçmiş bir tarih olamaz',
  path: ['validUntil'],
})

export const quoteUpdateSchema = quoteCreateSchema.partial().extend({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
  dealId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  validUntil: z.string().optional(),
})

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>


