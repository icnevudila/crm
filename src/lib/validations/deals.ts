import { z } from 'zod'

export const dealCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  value: z.number().min(0.01, 'Fırsat değeri en az 0.01 olmalıdır').max(999999999, 'Fırsat değeri çok büyük').refine((val) => val > 0, {
    message: 'Fırsat değeri 0 olamaz. Lütfen geçerli bir tutar girin.',
  }),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  winProbability: z.number().min(0, 'Kazanma olasılığı 0-100 arasında olmalıdır').max(100, 'Kazanma olasılığı 0-100 arasında olmalıdır').optional(),
  expectedCloseDate: z.string().optional(),
  leadSource: z.enum(['WEB', 'EMAIL', 'PHONE', 'REFERRAL', 'SOCIAL', 'OTHER']).optional(),
  competitorId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  lostReason: z.string().optional(),
}).refine((data) => {
  // LOST stage'inde lostReason zorunlu
  if (data.stage === 'LOST') {
    return data.lostReason && data.lostReason.trim().length > 0
  }
  return true
}, {
  message: 'LOST aşamasında kayıp sebebi zorunludur',
  path: ['lostReason']
})

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
})

export type DealCreateInput = z.infer<typeof dealCreateSchema>
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>


