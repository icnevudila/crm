'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { useData } from '@/hooks/useData'

const meetingSchema = z.object({
  title: z.string().min(1, 'Görüşme başlığı gereklidir'),
  description: z.string().optional(),
  meetingDate: z.string().min(1, 'Görüşme tarihi gereklidir'),
  meetingDuration: z.number().min(1).optional(),
  location: z.string().optional(),
  status: z.enum(['PLANNED', 'DONE', 'CANCELLED']).default('PLANNED'),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
})

type MeetingFormData = z.infer<typeof meetingSchema>

interface MeetingFormProps {
  meeting?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedMeeting: any) => void
}

export default function MeetingForm({
  meeting,
  open,
  onClose,
  onSuccess,
}: MeetingFormProps) {
  const [loading, setLoading] = useState(false)

  // Müşterileri çek
  const { data: customers = [] } = useData<any[]>('/api/customers', {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })

  // Fırsatları çek
  const { data: deals = [] } = useData<any[]>('/api/deals', {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      description: '',
      meetingDate: new Date().toISOString().slice(0, 16),
      meetingDuration: 60,
      location: '',
      status: 'PLANNED',
      customerId: '',
      dealId: '',
    },
  })

  // Meeting prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (meeting) {
        // Düzenleme modu
        reset({
          title: meeting.title || '',
          description: meeting.description || '',
          meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          meetingDuration: meeting.meetingDuration || 60,
          location: meeting.location || '',
          status: meeting.status || 'PLANNED',
          customerId: meeting.customerId || '',
          dealId: meeting.dealId || '',
        })
      } else {
        // Yeni kayıt modu
        reset({
          title: '',
          description: '',
          meetingDate: new Date().toISOString().slice(0, 16),
          meetingDuration: 60,
          location: '',
          status: 'PLANNED',
          customerId: '',
          dealId: '',
        })
      }
    }
  }, [meeting, open, reset])

  const status = watch('status')
  const customerId = watch('customerId')

  // Müşteri seçildiğinde ilgili fırsatları filtrele
  const filteredDeals = customerId
    ? deals.filter((deal: any) => deal.customerId === customerId)
    : deals

  const onSubmit = async (data: MeetingFormData) => {
    setLoading(true)
    try {
      const url = meeting
        ? `/api/meetings/${meeting.id}`
        : '/api/meetings'
      const method = meeting ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save meeting')
      }

      const savedMeeting = await res.json()
      
      // onSuccess callback'i çağır
      if (onSuccess) {
        onSuccess(savedMeeting)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'Görüşme Düzenle' : 'Yeni Görüşme'}
          </DialogTitle>
          <DialogDescription>
            {meeting ? 'Görüşme bilgilerini güncelleyin' : 'Yeni görüşme ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık *</label>
            <Input
              {...register('title')}
              placeholder="Görüşme başlığı"
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <Textarea
              {...register('description')}
              placeholder="Görüşme notları..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Meeting Date & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih & Saat *</label>
              <Input
                type="datetime-local"
                {...register('meetingDate')}
                disabled={loading}
              />
              {errors.meetingDate && (
                <p className="text-sm text-red-600">{errors.meetingDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Süre (dakika)</label>
              <Input
                type="number"
                {...register('meetingDuration', { valueAsNumber: true })}
                placeholder="60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Konum</label>
            <Input
              {...register('location')}
              placeholder="Görüşme yeri"
              disabled={loading}
            />
          </div>

          {/* Customer & Deal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Müşteri</label>
              <Select
                value={customerId || ''}
                onValueChange={(value) => {
                  setValue('customerId', value || '')
                  setValue('dealId', '') // Müşteri değiştiğinde fırsatı temizle
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Müşteri yok</SelectItem>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fırsat</label>
              <Select
                value={watch('dealId') || ''}
                onValueChange={(value) => setValue('dealId', value || '')}
                disabled={!customerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fırsat seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Fırsat yok</SelectItem>
                  {filteredDeals.map((deal: any) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Durum</label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as 'PLANNED' | 'DONE' | 'CANCELLED')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planlandı</SelectItem>
                <SelectItem value="DONE">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : meeting ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

