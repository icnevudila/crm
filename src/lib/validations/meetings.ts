import { z } from 'zod'

export const meetingCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  meetingDate: z.string().min(1, 'Görüşme tarihi gereklidir'),
  meetingDuration: z.number().min(1, 'Görüşme süresi en az 1 dakika olmalıdır').max(1440, 'Görüşme süresi en fazla 1440 dakika olabilir').optional(),
  location: z.string().max(500, 'Konum en fazla 500 karakter olabilir').optional(),
  meetingType: z.enum(['IN_PERSON', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'OTHER']).default('IN_PERSON'),
  meetingUrl: z.string().url('Geçerli bir URL giriniz').optional().or(z.literal('')),
  meetingPassword: z.string().max(100, 'Şifre en fazla 100 karakter olabilir').optional(),
  status: z.enum(['PLANNED', 'DONE', 'CANCELLED']).default('PLANNED'),
  customerId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  dealId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  quoteId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  invoiceId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  customerCompanyId: z.string().uuid('Geçerli bir UUID giriniz').optional(),
  participantIds: z.array(z.string().uuid('Geçerli bir UUID giriniz')).optional(),
  notes: z.string().max(2000, 'Notlar en fazla 2000 karakter olabilir').optional(),
  outcomes: z.string().max(2000, 'Çıktılar en fazla 2000 karakter olabilir').optional(),
  actionItems: z.string().max(2000, 'Aksiyon maddeleri en fazla 2000 karakter olabilir').optional(),
  attendees: z.string().max(500, 'Katılımcılar en fazla 500 karakter olabilir').optional(),
  isRecurring: z.boolean().optional().default(false),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  recurrenceInterval: z.number().min(1, 'Tekrar aralığı en az 1 olmalıdır').max(365, 'Tekrar aralığı en fazla 365 olabilir').optional().default(1),
  recurrenceEndDate: z.string().optional(),
  recurrenceCount: z.number().min(1, 'Tekrar sayısı en az 1 olmalıdır').max(1000, 'Tekrar sayısı en fazla 1000 olabilir').optional(),
  recurrenceDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
})

export const meetingUpdateSchema = meetingCreateSchema.partial().extend({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir').optional(),
  meetingDate: z.string().optional(),
})

export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>


