'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Sparkles } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useData } from '@/hooks/useData'

const quotaSchema = z.object({
  userId: z.string().min(1, 'Kullanıcı seçmelisiniz'),
  targetRevenue: z.number().min(0, 'Hedef gelir 0\'dan büyük olmalı'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
  endDate: z.string().min(1, 'Bitiş tarihi gereklidir'),
})

type QuotaFormData = z.infer<typeof quotaSchema>

interface SalesQuotaFormProps {
  quota?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedQuota: any) => void
}

export default function SalesQuotaForm({
  quota,
  open,
  onClose,
  onSuccess,
}: SalesQuotaFormProps) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuotaFormData>({
    resolver: zodResolver(quotaSchema),
    defaultValues: {
      userId: '',
      targetRevenue: 0,
      period: 'MONTHLY',
      startDate: '',
      endDate: '',
    },
  })

  // Kullanıcıları çek - SWR ile (repo kurallarına uygun)
  // Hook'u her zaman çağır, sadece open olduğunda fetch yap
  const { data: users = [], isLoading: usersLoading } = useData<any[]>(
    open ? '/api/users' : null,
    {
      dedupingInterval: 60000, // 1 dakika cache
      revalidateOnFocus: false,
    }
  )

  // Populate form when editing
  useEffect(() => {
    if (open && quota) {
      reset({
        userId: quota.userId || '',
        targetRevenue: quota.targetRevenue || 0,
        period: quota.period || 'MONTHLY',
        startDate: quota.startDate?.split('T')[0] || '',
        endDate: quota.endDate?.split('T')[0] || '',
      })
    } else if (open && !quota) {
      reset({
        userId: '',
        targetRevenue: 0,
        period: 'MONTHLY',
        startDate: '',
        endDate: '',
      })
    }
  }, [quota, open, reset])

  const onSubmit = async (data: QuotaFormData) => {
    setLoading(true)
    try {
      const url = quota
        ? `/api/sales-quotas/${quota.id}`
        : '/api/sales-quotas'
      const method = quota ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save quota')
      }

      const savedQuota = await res.json()

      // Success toast göster
      const user = users.find(u => u.id === data.userId)
      const userName = user?.name || 'Kullanıcı'
      toast.success(
        quota ? 'Satış kotası güncellendi' : 'Satış kotası kaydedildi',
        {
          description: quota ? `${userName} için kota başarıyla güncellendi.` : `${userName} için kota başarıyla eklendi.`
        }
      )

      if (onSuccess) {
        onSuccess(savedQuota)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kota kaydedilemedi', { description: error?.message || 'Bir hata oluştu' })
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {quota ? 'Satış Kotasını Düzenle' : 'Yeni Satış Kotası'}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // FloatingAIChat'i aç ve context-aware prompt gönder
                const yearFromDate = quota?.startDate ? new Date(quota.startDate).getFullYear() : ''
                const event = new CustomEvent('open-ai-chat', {
                  detail: {
                    initialMessage: quota
                      ? `Satış kotasını düzenle: ${quota.user?.name || 'Kullanıcı'} için ${quota.period} ${yearFromDate} - Hedef: ${quota.targetRevenue} TL`
                      : 'Yeni satış kotası oluştur',
                    context: {
                      type: 'sales-quota',
                      quota: quota ? {
                        id: quota.id,
                        userId: quota.userId,
                        period: quota.period,
                        startDate: quota.startDate,
                        targetRevenue: quota.targetRevenue,
                      } : null,
                    },
                  },
                })
                window.dispatchEvent(event)
                toast.info('784 AI açılıyor...', { description: 'AI asistanı ile satış kotası oluşturabilir veya düzenleyebilirsiniz' })
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {quota ? 'AI ile Düzenle' : 'AI ile Oluştur'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User */}
          <div className="space-y-2">
            <Label htmlFor="userId">Kullanıcı *</Label>
            <Select
              value={watch('userId')}
              onValueChange={(value) => setValue('userId', value)}
              disabled={usersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "Yükleniyor..." : "Kullanıcı seçin..."} />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">Yükleniyor...</div>
                ) : users.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-yellow-600">Kullanıcı bulunamadı</div>
                ) : (
                  users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-red-600">{errors.userId.message}</p>
            )}
            {!usersLoading && users.length === 0 && (
              <p className="text-sm text-yellow-600">Kullanıcı listesi boş. Lütfen önce kullanıcı ekleyin.</p>
            )}
          </div>

          {/* Target Revenue */}
          <div className="space-y-2">
            <Label htmlFor="targetRevenue">Hedef Gelir (₺) *</Label>
            <Input
              id="targetRevenue"
              type="number"
              step="0.01"
              {...register('targetRevenue', { valueAsNumber: true })}
              placeholder="100000.00"
            />
            {errors.targetRevenue && (
              <p className="text-sm text-red-600">{errors.targetRevenue.message}</p>
            )}
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label htmlFor="period">Periyot *</Label>
            <Select
              value={watch('period')}
              onValueChange={(value) => setValue('period', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Aylık</SelectItem>
                <SelectItem value="QUARTERLY">Çeyreklik</SelectItem>
                <SelectItem value="YEARLY">Yıllık</SelectItem>
              </SelectContent>
            </Select>
            {errors.period && (
              <p className="text-sm text-red-600">{errors.period.message}</p>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
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
              {loading ? 'Kaydediliyor...' : quota ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


