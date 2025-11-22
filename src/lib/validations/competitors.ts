import { z } from 'zod'

export const competitorCreateSchema = z.object({
  name: z.string().min(1, 'Firma adı gereklidir').max(200, 'Firma adı en fazla 200 karakter olabilir'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  website: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  averagePrice: z.number().min(0, 'Ortalama fiyat 0\'dan küçük olamaz').optional(),
  marketShare: z.number().min(0, 'Pazar payı 0-100 arasında olmalıdır').max(100, 'Pazar payı 0-100 arasında olmalıdır').optional(),
  pricingStrategy: z.string().max(500, 'Fiyatlandırma stratejisi en fazla 500 karakter olabilir').optional(),
})

export const competitorUpdateSchema = competitorCreateSchema.partial().extend({
  name: z.string().min(1, 'Firma adı gereklidir').max(200, 'Firma adı en fazla 200 karakter olabilir').optional(),
})

export type CompetitorCreateInput = z.infer<typeof competitorCreateSchema>
export type CompetitorUpdateInput = z.infer<typeof competitorUpdateSchema>


