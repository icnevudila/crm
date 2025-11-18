'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/lib/toast'

const segmentSchema = z.object({
  name: z.string().min(1, 'Segment adı gereklidir'),
  description: z.string().optional(),
  color: z.string().optional(),
  autoAssign: z.boolean().default(false),
})

type SegmentFormData = z.infer<typeof segmentSchema>

interface SegmentFormProps {
  segment?: any
  open: boolean
  onClose: () => void
  onSuccess?: (saved: any) => void
}

export default function SegmentForm({ segment, open, onClose, onSuccess }: SegmentFormProps) {
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SegmentFormData>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      autoAssign: false,
    },
  })

  useEffect(() => {
    if (open) {
      if (segment) {
        reset({
          name: segment.name || '',
          description: segment.description || '',
          color: segment.color || '#6366f1',
          autoAssign: segment.autoAssign || false,
        })
      } else {
        reset({
          name: '',
          description: '',
          color: '#6366f1',
          autoAssign: false,
        })
      }
    }
  }, [segment, open, reset])

  const onSubmit = async (data: SegmentFormData) => {
    setLoading(true)
    try {
      const url = segment ? `/api/segments/${segment.id}` : '/api/segments'
      const method = segment ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Save failed')

      const saved = await res.json()
      
      // Success toast göster
      toast.success(
        segment ? 'Segment güncellendi' : 'Segment kaydedildi',
        segment ? `${data.name} başarıyla güncellendi.` : `${data.name} başarıyla eklendi.`
      )
      
      if (onSuccess) onSuccess(saved)

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', { description: error?.message || 'Segment kaydetme işlemi başarısız oldu.' })
    } finally {
      setLoading(false)
    }
  }

  const autoAssign = watch('autoAssign')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{segment ? 'Segment Düzenle' : 'Yeni Segment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Segment Adı *</Label>
            <Input id="name" {...register('name')} placeholder="VIP Müşteriler" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" {...register('description')} placeholder="Segment açıklaması..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Renk</Label>
            <div className="flex items-center gap-2">
              <Input id="color" type="color" {...register('color')} className="w-20 h-10" />
              <span className="text-sm text-gray-500">Segment rengini seçin</span>
            </div>
          </div>

          <div className="flex items-center justify-between space-y-2">
            <div>
              <Label htmlFor="autoAssign">Otomatik Atama</Label>
              <p className="text-xs text-gray-500">Kriterlere uyan müşteriler otomatik eklenir</p>
            </div>
            <Switch
              id="autoAssign"
              checked={autoAssign}
              onCheckedChange={(checked) => setValue('autoAssign', checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : segment ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


