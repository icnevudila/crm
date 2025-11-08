'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
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

const dealSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  value: z.number().min(0, 'Değer 0\'dan büyük olmalı'),
  customerId: z.string().optional(),
  description: z.string().optional(),
  winProbability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
})

type DealFormData = z.infer<typeof dealSchema>

interface DealFormProps {
  deal?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedDeal: any) => void // Cache güncelleme için callback
}

async function fetchCustomers() {
  const res = await fetch('/api/customers?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  // API'den dönen veri formatını kontrol et - array mi yoksa object mi?
  return Array.isArray(data) ? data : (data.data || data.customers || [])
}

export default function DealForm({ deal, open, onClose, onSuccess }: DealFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: open,
  })

  // Güvenlik kontrolü - customers her zaman array olmalı
  const customers = Array.isArray(customersData) ? customersData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: deal || {
      title: '',
      stage: 'LEAD',
      status: 'OPEN',
      value: 0,
      customerId: '',
      description: '',
      winProbability: 50,
      expectedCloseDate: '',
    },
  })

  const stage = watch('stage')
  const status = watch('status')
  const customerId = watch('customerId')
  const winProbability = watch('winProbability') || 50

  // Deal değiştiğinde formu güncelle
  useEffect(() => {
    if (open) {
      if (deal) {
        // Tarih formatını düzelt (YYYY-MM-DD)
        let formattedDate = ''
        if (deal.expectedCloseDate) {
          const date = new Date(deal.expectedCloseDate)
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0]
          }
        }
        
        reset({
          title: deal.title || '',
          stage: deal.stage || 'LEAD',
          status: deal.status || 'OPEN',
          value: deal.value || 0,
          customerId: deal.customerId || '',
          description: deal.description || '',
          winProbability: deal.winProbability ?? 50,
          expectedCloseDate: formattedDate,
        })
      } else {
        // Yeni deal için formu sıfırla
        reset({
          title: '',
          stage: 'LEAD',
          status: 'OPEN',
          value: 0,
          customerId: '',
          description: '',
          winProbability: 50,
          expectedCloseDate: '',
        })
      }
    }
  }, [deal, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const url = deal ? `/api/deals/${deal.id}` : '/api/deals'
      const method = deal ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save deal')
      }

      return res.json()
    },
    onSuccess: async (savedDeal) => {
      // Query cache'ini invalidate et - fresh data çek
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['deals'] }),
        queryClient.invalidateQueries({ queryKey: ['kanban-deals'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-deals'] }),
        queryClient.invalidateQueries({ queryKey: ['deal-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
      ])
      
      // Refetch yap - anında güncel veri gelsin
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['deals'] }),
        queryClient.refetchQueries({ queryKey: ['kanban-deals'] }),
        queryClient.refetchQueries({ queryKey: ['stats-deals'] }),
        queryClient.refetchQueries({ queryKey: ['deal-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
        queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
      ])
      
      // Parent component'e callback gönder - optimistic update için
      if (onSuccess) {
        await onSuccess(savedDeal)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: DealFormData) => {
    setLoading(true)
    try {
      // Boş string'leri temizle - tarih, description ve customerId için
      const cleanData = {
        ...data,
        expectedCloseDate: data.expectedCloseDate && data.expectedCloseDate.trim() !== '' 
          ? data.expectedCloseDate 
          : undefined,
        description: data.description && data.description.trim() !== '' 
          ? data.description 
          : undefined,
        customerId: data.customerId && data.customerId !== '' 
          ? data.customerId 
          : undefined,
        // WinProbability sıfırsa undefined yap
        winProbability: data.winProbability || undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Deal save error:', error)
      alert(error.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deal ? 'Fırsat Düzenle' : 'Yeni Fırsat'}
          </DialogTitle>
          <DialogDescription>
            {deal ? 'Fırsat bilgilerini güncelleyin' : 'Yeni fırsat oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Başlık *</label>
              <Input
                {...register('title')}
                placeholder="Fırsat başlığı"
                disabled={loading}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Müşteri</label>
              <Select
                value={customerId || ''}
                onValueChange={(value) => setValue('customerId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Değer (₺) *</label>
              <Input
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
              {errors.value && (
                <p className="text-sm text-red-600">{errors.value.message}</p>
              )}
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Aşama</label>
              <Select
                value={stage}
                onValueChange={(value) =>
                  setValue('stage', value as DealFormData['stage'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD">Potansiyel</SelectItem>
                  <SelectItem value="CONTACTED">İletişimde</SelectItem>
                  <SelectItem value="PROPOSAL">Teklif</SelectItem>
                  <SelectItem value="NEGOTIATION">Pazarlık</SelectItem>
                  <SelectItem value="WON">Kazanıldı</SelectItem>
                  <SelectItem value="LOST">Kaybedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Win Probability */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kazanma Olasılığı (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register('winProbability', { valueAsNumber: true })}
                placeholder="50"
                disabled={loading}
              />
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${winProbability}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{winProbability}% kazanma şansı</p>
            </div>

            {/* Expected Close Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Beklenen Kapanış Tarihi</label>
              <Input
                type="date"
                {...register('expectedCloseDate')}
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as DealFormData['status'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Açık</SelectItem>
                  <SelectItem value="CLOSED">Kapalı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Fırsat açıklaması ve notlar"
                rows={4}
                disabled={loading}
              />
            </div>
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
              {loading ? 'Kaydediliyor...' : deal ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
