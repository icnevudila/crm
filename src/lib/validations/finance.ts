import { z } from 'zod'

export const financeCreateSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).default('INCOME'),
  amount: z.number().min(0.01, 'Tutar en az 0.01 olmalıdır').max(999999999, 'Tutar çok büyük').refine((val) => val > 0, {
    message: 'Finans kaydı tutarı 0 olamaz. Lütfen geçerli bir tutar girin.',
  }),
  category: z.string().max(100, 'Kategori en fazla 100 karakter olabilir').optional(),
  description: z.string().max(1000, 'Açıklama en fazla 1000 karakter olabilir').optional(),
  relatedTo: z.string().optional(), // Eski format (backward compatibility)
  relatedEntityType: z.string().optional(), // Yeni: Entity tipi (Invoice, Shipment, vb.)
  relatedEntityId: z.string().uuid('Geçerli bir UUID giriniz').optional(), // Yeni: Entity ID
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(), // Firma bazlı ilişki
  paymentMethod: z.enum(['CASH', 'BANK', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER']).optional(), // Ödeme yöntemi
  paymentDate: z.string().optional(), // Ödeme tarihi
  isRecurring: z.boolean().optional().default(false), // Tekrarlayan gider
})

export const financeUpdateSchema = financeCreateSchema.partial().extend({
  amount: z.number().min(0.01, 'Tutar en az 0.01 olmalıdır').max(999999999, 'Tutar çok büyük').optional(),
})

export type FinanceCreateInput = z.infer<typeof financeCreateSchema>
export type FinanceUpdateInput = z.infer<typeof financeUpdateSchema>


