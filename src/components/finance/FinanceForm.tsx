'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const financeSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).default('INCOME'),
  amount: z.number().min(0, 'Tutar 0\'dan büyük olmalı'),
  relatedTo: z.string().optional(),
})

type FinanceFormData = z.infer<typeof financeSchema>

interface FinanceFormProps {
  finance?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedFinance: any) => void | Promise<void>
}

export default function FinanceForm({ finance, open, onClose, onSuccess }: FinanceFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: finance || {
      type: 'INCOME',
      amount: 0,
      relatedTo: '',
    },
  })

  const type = watch('type')

  // Finance prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (finance) {
        // Düzenleme modu - finance bilgilerini yükle
        reset({
          type: finance.type || 'INCOME',
          amount: finance.amount || 0,
          relatedTo: finance.relatedTo || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          type: 'INCOME',
          amount: 0,
          relatedTo: '',
        })
      }
    }
  }, [finance, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: FinanceFormData) => {
      const url = finance ? `/api/finance/${finance.id}` : '/api/finance'
      const method = finance ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save finance record')
      }

      return res.json()
    },
    onSuccess: (savedFinance) => {
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedFinance)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: FinanceFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {finance ? 'Finans Kaydı Düzenle' : 'Yeni Finans Kaydı'}
          </DialogTitle>
          <DialogDescription>
            {finance ? 'Finans kaydını güncelleyin' : 'Yeni gelir/gider kaydı oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tip *</label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue('type', value as FinanceFormData['type'])
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCOME">Gelir</SelectItem>
                <SelectItem value="EXPENSE">Gider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tutar (₺) *</label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
              disabled={loading}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Related To */}
          <div className="space-y-2">
            <label className="text-sm font-medium">İlişkili</label>
            <Input
              {...register('relatedTo')}
              placeholder="Örn: Invoice: xxx"
              disabled={loading}
            />
            {errors.relatedTo && (
              <p className="text-sm text-red-600">{errors.relatedTo.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : finance ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}






