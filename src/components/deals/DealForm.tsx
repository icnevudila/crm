'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
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
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  value: z.number().min(0, 'Değer 0\'dan büyük olmalı').max(999999999, 'Değer çok büyük'),
  customerId: z.string().optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
  winProbability: z.number().min(0, 'Kazanma olasılığı 0-100 arası olmalı').max(100, 'Kazanma olasılığı 0-100 arası olmalı').optional(),
  expectedCloseDate: z.string().optional(),
  leadSource: z.enum(['WEB', 'EMAIL', 'PHONE', 'REFERRAL', 'SOCIAL', 'OTHER']).optional(), // Lead source tracking (migration 025)
  competitorId: z.string().optional(), // Competitor tracking
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

async function fetchCompetitors() {
  const res = await fetch('/api/competitors')
  if (!res.ok) throw new Error('Failed to fetch competitors')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default function DealForm({ deal, open, onClose, onSuccess }: DealFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const customerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const [loading, setLoading] = useState(false)

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: open,
  })

  const { data: competitorsData } = useQuery({
    queryKey: ['competitors'],
    queryFn: fetchCompetitors,
    enabled: open,
  })

  // Güvenlik kontrolü - customers her zaman array olmalı
  const customers = Array.isArray(customersData) ? customersData : []
  const competitors = Array.isArray(competitorsData) ? competitorsData : []

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
  
  // Durum bazlı koruma kontrolü - form alanlarını devre dışı bırakmak için
  const isProtected = deal && (
    deal.stage === 'WON' || 
    deal.status === 'CLOSED'
  )

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
          leadSource: deal.leadSource || undefined, // Lead source tracking (migration 025)
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
          leadSource: undefined, // Lead source tracking (migration 025)
        })
      }
    }
  }, [deal, open, reset])

  const mutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const url = deal ? `/api/deals/${deal.id}` : '/api/deals'
      const method = deal ? 'PUT' : 'POST'

      // customerCompanyId'yi payload'a ekle
      const payload = {
        ...data,
        customerCompanyId: customerCompanyId || data.customerCompanyId || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        competitorId: data.competitorId && data.competitorId !== '' 
          ? data.competitorId 
          : undefined,
        // WinProbability sıfırsa undefined yap
        winProbability: data.winProbability || undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Deal save error:', error)
      toast.error('Kaydedilemedi', error.message)
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
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {deal && deal.stage === 'WON' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                🔒 Bu fırsat kazanıldı. Temel bilgiler (başlık, değer, aşama, durum) değiştirilemez. Sadece açıklama ve notlar gibi alanlar değiştirilebilir.
              </p>
            </div>
          )}
          {deal && deal.status === 'CLOSED' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-800 font-semibold">
                🔒 Bu fırsat kapatıldı. Fırsat bilgileri değiştirilemez veya silinemez.
              </p>
            </div>
          )}
          
          {/* Durum bazlı form devre dışı bırakma */}
          {isProtected && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-600">
                ⚠️ Bu fırsat korumalı durumda olduğu için form alanları düzenlenemez.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Başlık *</label>
              <Input
                {...register('title')}
                placeholder="Fırsat başlığı"
                disabled={loading || isProtected}
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
                disabled={loading || isProtected}
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

            {/* Competitor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rakip (opsiyonel)</label>
              <Select
                value={watch('competitorId') || 'NONE'}
                onValueChange={(value) =>
                  setValue('competitorId', value === 'NONE' ? '' : value)
                }
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rakip seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Yok</SelectItem>
                  {competitors.map((competitor: any) => (
                    <SelectItem key={competitor.id} value={competitor.id}>
                      {competitor.name}
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
                disabled={loading || isProtected}
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
                disabled={loading || isProtected}
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
                disabled={loading || isProtected}
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
                disabled={loading || isProtected}
              />
            </div>

            {/* Lead Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Potansiyel Müşteri Kaynağı</label>
              <Select
                value={watch('leadSource') || ''}
                onValueChange={(value) => setValue('leadSource', value as DealFormData['leadSource'])}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kaynak seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">Web Sitesi</SelectItem>
                  <SelectItem value="EMAIL">E-posta</SelectItem>
                  <SelectItem value="PHONE">Telefon</SelectItem>
                  <SelectItem value="REFERRAL">Referans</SelectItem>
                  <SelectItem value="SOCIAL">Sosyal Medya</SelectItem>
                  <SelectItem value="OTHER">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as DealFormData['status'])
                }
                disabled={loading || isProtected}
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
                disabled={loading || isProtected}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isProtected}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading || isProtected}
            >
              {loading ? 'Kaydediliyor...' : deal ? (isProtected ? 'Değiştirilemez' : 'Güncelle') : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
