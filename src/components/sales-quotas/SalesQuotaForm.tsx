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
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])

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

  // Load users
  useEffect(() => {
    if (open) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(data))
        .catch((err) => console.error('Failed to load users:', err))
    }
  }, [open])

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
        quota ? `${userName} için kota başarıyla güncellendi.` : `${userName} için kota başarıyla eklendi.`
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
          <DialogTitle>
            {quota ? 'Satış Kotasını Düzenle' : 'Yeni Satış Kotası'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* User */}
          <div className="space-y-2">
            <Label htmlFor="userId">Kullanıcı *</Label>
            <Select
              value={watch('userId')}
              onValueChange={(value) => setValue('userId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kullanıcı seçin..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-red-600">{errors.userId.message}</p>
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


