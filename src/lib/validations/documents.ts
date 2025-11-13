import { z } from 'zod'

export const documentCreateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(255, 'Başlık çok uzun'),
  description: z.string().optional(),
  fileUrl: z.string().url('Geçerli bir URL giriniz'),
  fileName: z.string().min(1, 'Dosya adı gereklidir'),
  fileSize: z.number().int().positive('Dosya boyutu pozitif olmalıdır').optional(),
  fileType: z.string().optional(),
  relatedTo: z.enum(['Customer', 'Deal', 'Quote', 'Invoice', 'Contract', 'Document']).optional().nullable(),
  relatedId: z.string().uuid('Geçerli bir UUID giriniz').optional().nullable(),
  folder: z.string().max(100, 'Klasör adı çok uzun').optional(),
  tags: z.array(z.string()).optional(),
})

export const documentUpdateSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(255, 'Başlık çok uzun').optional(),
  description: z.string().optional(),
  relatedTo: z.enum(['Customer', 'Deal', 'Quote', 'Invoice', 'Contract', 'Document']).optional().nullable(),
  relatedId: z.string().uuid('Geçerli bir UUID giriniz').optional().nullable(),
  folder: z.string().max(100, 'Klasör adı çok uzun').optional(),
  tags: z.array(z.string()).optional(),
})

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>

