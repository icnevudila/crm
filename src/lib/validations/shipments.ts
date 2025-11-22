import { z } from 'zod'

export const shipmentCreateSchema = z.object({
  tracking: z.string().max(100, 'Takip numarası en fazla 100 karakter olabilir').optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).default('PENDING'),
  invoiceId: z.string().uuid('Geçerli bir UUID giriniz').min(1, 'Fatura seçimi zorunludur'),
  shippingCompany: z.string().max(200, 'Kargo firması en fazla 200 karakter olabilir').optional(),
  estimatedDelivery: z.string().optional(),
  deliveryAddress: z.string().max(500, 'Teslimat adresi en fazla 500 karakter olabilir').optional(),
}).refine((data) => {
  // estimatedDelivery geçmiş tarih olamaz
  if (data.estimatedDelivery) {
    const estimated = new Date(data.estimatedDelivery)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return estimated >= today
  }
  return true
}, {
  message: 'Tahmini teslimat tarihi geçmiş bir tarih olamaz',
  path: ['estimatedDelivery'],
})

export const shipmentUpdateSchema = shipmentCreateSchema.partial().extend({
  invoiceId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
})

export type ShipmentCreateInput = z.infer<typeof shipmentCreateSchema>
export type ShipmentUpdateInput = z.infer<typeof shipmentUpdateSchema>


