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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const campaignSchema = z.object({
  name: z.string().min(1, 'Kampanya adı gereklidir'),
  subject: z.string().min(1, 'Konu gereklidir'),
  body: z.string().min(1, 'Email içeriği gereklidir'),
  targetSegment: z.string().optional(),
  scheduledAt: z.string().optional(),
})

type CampaignFormData = z.infer<typeof campaignSchema>

interface EmailCampaignFormProps {
  campaign?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedCampaign: any) => void
}

export default function EmailCampaignForm({
  campaign,
  open,
  onClose,
  onSuccess,
}: EmailCampaignFormProps) {
  const [loading, setLoading] = useState(false)
  const [segments, setSegments] = useState<Array<{ id: string; name: string; memberCount: number }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      subject: '',
      body: '',
      targetSegment: '',
      scheduledAt: '',
    },
  })

  // Load segments
  useEffect(() => {
    if (open) {
      fetch('/api/segments')
        .then((res) => res.json())
        .then((data) => setSegments(data))
        .catch((err) => console.error('Failed to load segments:', err))
    }
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (open && campaign) {
      reset({
        name: campaign.name || '',
        subject: campaign.subject || '',
        body: campaign.body || '',
        targetSegment: campaign.targetSegment || '',
        scheduledAt: campaign.scheduledAt || '',
      })
    } else if (open && !campaign) {
      reset({
        name: '',
        subject: '',
        body: '',
        targetSegment: '',
        scheduledAt: '',
      })
    }
  }, [campaign, open, reset])

  const onSubmit = async (data: CampaignFormData) => {
    setLoading(true)
    try {
      const url = campaign
        ? `/api/email-campaigns/${campaign.id}`
        : '/api/email-campaigns'
      const method = campaign ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save campaign')
      }

      const savedCampaign = await res.json()

      if (onSuccess) {
        onSuccess(savedCampaign)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kampanya kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Email Kampanyasını Düzenle' : 'Yeni Email Kampanyası'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Kampanya Adı *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Örn: Yeni Ürün Lansmanı"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Email Konusu *</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Örn: Yeni Ürünümüzü Keşfedin!"
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Email İçeriği *</Label>
            <Textarea
              id="body"
              {...register('body')}
              placeholder="Email içeriğini yazın..."
              rows={10}
            />
            {errors.body && (
              <p className="text-sm text-red-600">{errors.body.message}</p>
            )}
            <p className="text-xs text-gray-500">
              HTML kullanabilirsiniz (örn: &lt;strong&gt;, &lt;a&gt;)
            </p>
          </div>

          {/* Target Segment */}
          <div className="space-y-2">
            <Label htmlFor="targetSegment">Hedef Kitle (opsiyonel)</Label>
            <Select
              value={watch('targetSegment') || 'ALL'}
              onValueChange={(value) =>
                setValue('targetSegment', value === 'ALL' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Hedef seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Müşteriler</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={segment.id}>
                    {segment.name} ({segment.memberCount} üye)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Boş bırakılırsa tüm müşterilere gönderilir
            </p>
          </div>

          {/* Scheduled At */}
          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Zamanla (opsiyonel)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              {...register('scheduledAt')}
            />
            <p className="text-xs text-gray-500">
              Boş bırakılırsa hemen gönderilir
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Kaydediliyor...' : campaign ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


