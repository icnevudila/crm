import { z } from 'zod'

export const emailCampaignCreateSchema = z.object({
  name: z.string().min(1, 'Kampanya adı gereklidir').max(255, 'Kampanya adı çok uzun'),
  subject: z.string().min(1, 'Email konusu gereklidir').max(255, 'Email konusu çok uzun'),
  body: z.string().min(1, 'Email içeriği gereklidir'),
  targetSegment: z.string().uuid('Geçerli bir segment UUID giriniz').optional().nullable(),
  scheduledAt: z.string().datetime('Geçerli bir tarih formatı giriniz').optional().nullable(),
})

export const emailCampaignUpdateSchema = z.object({
  name: z.string().min(1, 'Kampanya adı gereklidir').max(255, 'Kampanya adı çok uzun').optional(),
  subject: z.string().min(1, 'Email konusu gereklidir').max(255, 'Email konusu çok uzun').optional(),
  body: z.string().min(1, 'Email içeriği gereklidir').optional(),
  targetSegment: z.string().uuid('Geçerli bir segment UUID giriniz').optional().nullable(),
  scheduledAt: z.string().datetime('Geçerli bir tarih formatı giriniz').optional().nullable(),
})

export type EmailCampaignCreateInput = z.infer<typeof emailCampaignCreateSchema>
export type EmailCampaignUpdateInput = z.infer<typeof emailCampaignUpdateSchema>

