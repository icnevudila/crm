import { z } from 'zod'

export const ticketCreateSchema = z.object({
  subject: z.string().min(1, 'Konu gereklidir').max(200, 'Konu en fazla 200 karakter olabilir'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']).default('OPEN'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').min(1, 'Müşteri seçimi zorunludur'),
  assignedTo: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
})

export const ticketUpdateSchema = ticketCreateSchema.partial().extend({
  subject: z.string().min(1, 'Konu gereklidir').max(200, 'Konu en fazla 200 karakter olabilir').optional(),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
})

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>


