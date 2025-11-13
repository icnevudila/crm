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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye } from 'lucide-react'
import { toast } from '@/lib/toast'

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
  const [previewOpen, setPreviewOpen] = useState(false)

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

          {/* Body - HTML Editor with Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Email İçeriği *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const bodyValue = watch('body')
                  if (!bodyValue) {
                    toast.warning('Önce içerik yazın')
                    return
                  }
                  setPreviewOpen(true)
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Önizle
              </Button>
            </div>
            <Tabs defaultValue="editor" className="w-full">
              <TabsList>
                <TabsTrigger value="editor">Düzenle</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="mt-2">
                <Textarea
                  id="body"
                  {...register('body')}
                  placeholder="Email içeriğini yazın... HTML kullanabilirsiniz."
                  rows={12}
                  className="font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="html" className="mt-2">
                <div className="border rounded-md p-4 bg-gray-50 min-h-[200px]">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {watch('body') || 'HTML içeriği burada görünecek...'}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
            {errors.body && (
              <p className="text-sm text-red-600">{errors.body.message}</p>
            )}
            <p className="text-xs text-gray-500">
              HTML kullanabilirsiniz (örn: &lt;strong&gt;, &lt;a href="#"&gt;, &lt;p&gt;)
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

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Önizleme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Konu:</Label>
              <p className="mt-1 font-semibold">{watch('subject') || '(Konu yok)'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">İçerik:</Label>
              <div
                className="mt-2 border rounded-md p-4 bg-white min-h-[300px]"
                dangerouslySetInnerHTML={{ __html: watch('body') || '<p>İçerik yok</p>' }}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPreviewOpen(false)}>Kapat</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}


