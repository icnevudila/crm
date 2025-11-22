import { z } from 'zod'

export const invoiceCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  status: z.enum(['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  total: z.number().min(0.01, 'Fatura tutarı en az 0.01 olmalıdır').max(999999999, 'Fatura tutarı çok büyük').refine((val) => val > 0, {
    message: 'Fatura tutarı 0 olamaz. Lütfen geçerli bir tutar girin.',
  }),
  invoiceType: z.enum(['SALES', 'PURCHASE', 'SERVICE_SALES', 'SERVICE_PURCHASE']).default('SALES'),
  serviceDescription: z.string().max(1000, 'Hizmet açıklaması en fazla 1000 karakter olabilir').optional(),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  quoteId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  vendorId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  invoiceNumber: z.string().max(50, 'Fatura numarası en fazla 50 karakter olabilir').optional(),
  dueDate: z.string().optional(),
  paymentDate: z.string().optional(),
  taxRate: z.number().min(0, 'KDV oranı 0-100 arasında olmalıdır').max(100, 'KDV oranı 0-100 arasında olmalıdır').optional(),
  billingAddress: z.string().max(500, 'Fatura adresi en fazla 500 karakter olabilir').optional(),
  billingCity: z.string().max(100, 'Fatura şehri en fazla 100 karakter olabilir').optional(),
  billingTaxNumber: z.string().max(50, 'Vergi numarası en fazla 50 karakter olabilir').optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER']).optional(),
  paymentNotes: z.string().max(500, 'Ödeme notları en fazla 500 karakter olabilir').optional(),
}).refine((data) => {
  // SALES/SERVICE_SALES için customerId zorunlu
  if (data.invoiceType === 'SALES' || data.invoiceType === 'SERVICE_SALES') {
    return data.customerId && data.customerId.trim().length > 0
  }
  // PURCHASE/SERVICE_PURCHASE için vendorId zorunlu
  if (data.invoiceType === 'PURCHASE' || data.invoiceType === 'SERVICE_PURCHASE') {
    return data.vendorId && data.vendorId.trim().length > 0
  }
  // SERVICE_SALES/SERVICE_PURCHASE için serviceDescription zorunlu
  if (data.invoiceType === 'SERVICE_SALES' || data.invoiceType === 'SERVICE_PURCHASE') {
    return data.serviceDescription && data.serviceDescription.trim().length > 0
  }
  return true
}, {
  message: 'Fatura tipine göre gerekli alanlar eksik',
  path: ['customerId'],
})

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
})

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>


