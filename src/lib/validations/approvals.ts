import { z } from 'zod'

export const approvalCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(255, 'Başlık çok uzun'),
  description: z.string().optional(),
  relatedTo: z.enum(['Quote', 'Deal', 'Invoice', 'Contract', 'Document'], {
    errorMap: () => ({ message: 'Geçerli bir modül seçiniz' }),
  }),
  relatedId: z.string().uuid('Geçerli bir UUID giriniz'),
  approverIds: z.array(z.string().uuid('Geçerli bir UUID giriniz')).min(1, 'En az bir onaylayıcı seçmelisiniz'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
})

export const approvalRejectSchema = z.object({
  reason: z.string().min(1, 'Red nedeni gereklidir').max(500, 'Red nedeni çok uzun'),
})

export type ApprovalCreateInput = z.infer<typeof approvalCreateSchema>
export type ApprovalRejectInput = z.infer<typeof approvalRejectSchema>

