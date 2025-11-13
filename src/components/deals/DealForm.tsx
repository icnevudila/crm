'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
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

interface DealFormProps {
  deal?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedDeal: any) => void // Cache güncelleme için callback
  customerCompanyId?: string
  customerCompanyName?: string
  customerId?: string
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

export default function DealForm({
  deal,
  open,
  onClose,
  onSuccess,
  customerCompanyId: customerCompanyIdProp,
  customerCompanyName,
  customerId: customerIdProp,
}: DealFormProps) {
  const t = useTranslations('deals.form')
  const tCommon = useTranslations('common.form')
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const searchCustomerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const customerCompanyId = customerCompanyIdProp || searchCustomerCompanyId
  const [loading, setLoading] = useState(false)

  // Schema'yı component içinde oluştur - locale desteği için
  const dealSchema = z.object({
    title: z.string().min(1, tCommon('titleRequired')).max(200, tCommon('titleMaxLength', { max: 200 })),
    stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
    status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
    value: z.number().min(0, t('valueMin')).max(999999999, tCommon('amountMax')),
    customerId: z.string().optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
    winProbability: z.number().min(0, t('winProbabilityRange')).max(100, t('winProbabilityRange')).optional(),
    expectedCloseDate: z.string().optional(),
    leadSource: z.enum(['WEB', 'EMAIL', 'PHONE', 'REFERRAL', 'SOCIAL', 'OTHER']).optional(), // Lead source tracking (migration 025)
    competitorId: z.string().optional(), // Competitor tracking
    customerCompanyId: z.string().optional(),
  })

  type DealFormData = z.infer<typeof dealSchema>

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
  const filteredCustomers = customerCompanyId
    ? customers.filter((customer: any) => customer.customerCompanyId === customerCompanyId)
    : customers
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
      customerCompanyId: customerCompanyId || '',
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
          customerCompanyId: deal.customerCompanyId || customerCompanyId || '',
        })
      } else {
        // Yeni deal için formu sıfırla
        reset({
          title: '',
          stage: 'LEAD',
          status: 'OPEN',
          value: 0,
          customerId: customerIdProp || '',
          description: '',
          winProbability: 50,
          expectedCloseDate: '',
          leadSource: undefined, // Lead source tracking (migration 025)
          customerCompanyId: customerCompanyId || '',
        })
        if (customerIdProp) {
          setValue('customerId', customerIdProp)
        }
      }
    }
  }, [deal, open, reset, customerCompanyId, customerIdProp, setValue])

  const mutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      const url = deal ? `/api/deals/${deal.id}` : '/api/deals'
      const method = deal ? 'PUT' : 'POST'

      // customerCompanyId'yi payload'a ekle
      const payload: Record<string, unknown> = {
        ...data,
        customerCompanyId: customerCompanyId || (data as any).customerCompanyId || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        let message = 'Failed to save deal'
        try {
          const error = await res.json()
          message = error?.error || message
        } catch {
          // ignore json parse errors
        }

        if (res.status === 403) {
          message = 'Yetkiniz yoktur.'
        }

        throw new Error(message)
      }

      return res.json()
    },
    onSuccess: async (savedDeal) => {
      // Toast mesajı göster
      if (deal) {
        toast.success(t('dealUpdated'), t('dealUpdatedMessage', { title: savedDeal.title }))
      } else {
        const message = customerCompanyName 
          ? t('dealCreatedMessageWithCompany', { company: customerCompanyName, title: savedDeal.title })
          : t('dealCreatedMessage', { title: savedDeal.title })
        toast.success(t('dealCreated'), message)
      }
      
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
      // CRITICAL FIX: onSuccess'i önce çağır, sonra form'u kapat
      // onSuccess içinde onClose çağrılmamalı - form zaten kendi içinde onClose çağırıyor
      if (onSuccess) {
        await onSuccess(savedDeal)
      }
      reset()
      // Form'u kapat - onSuccess callback'inden SONRA (sonsuz döngü önleme)
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
        customerCompanyId: data.customerCompanyId && data.customerCompanyId !== '' 
          ? data.customerCompanyId 
          : customerCompanyId || undefined,
        // WinProbability sıfırsa undefined yap
        winProbability: data.winProbability || undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Deal save error:', error)
        const message =
        error.message === 'Yetkiniz yoktur.'
          ? t('unauthorized')
          : error.message
      toast.error(t('saveFailed'), message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {deal ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {deal ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {customerCompanyId && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-700">
              <p className="font-semibold">
                {t('companyLabel')}: {customerCompanyName || t('selectedCompany')}
              </p>
              <p>
                {filteredCustomers.length > 0
                  ? t('customersCount', { count: filteredCustomers.length })
                  : t('noCustomersFound')}
              </p>
            </div>
          )}
          <input type="hidden" {...register('customerCompanyId')} />
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {deal && deal.stage === 'WON' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                {t('wonWarning')}
              </p>
            </div>
          )}
          {deal && deal.status === 'CLOSED' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-800 font-semibold">
                {t('closedWarning')}
              </p>
            </div>
          )}
          
          {/* Durum bazlı form devre dışı bırakma */}
          {isProtected && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-600">
                {t('protectedWarning')}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('titleLabel')} *</label>
              <Input
                {...register('title')}
                placeholder={t('titlePlaceholder')}
                disabled={loading || isProtected}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('customerLabel')}</label>
              <Select
                value={customerId || ''}
                onValueChange={(value) => setValue('customerId', value)}
                disabled={loading || isProtected || filteredCustomers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('customerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.length === 0 && (
                    <SelectItem disabled value="none">
                      {t('noCustomersForCompany')}
                    </SelectItem>
                  )}
                  {filteredCustomers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competitor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('competitorLabel')}</label>
              <Select
                value={watch('competitorId') || 'NONE'}
                onValueChange={(value) =>
                  setValue('competitorId', value === 'NONE' ? '' : value)
                }
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('competitorPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t('competitorNone')}</SelectItem>
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
              <label className="text-sm font-medium">{t('valueLabel')} *</label>
              <Input
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder={t('valuePlaceholder')}
                disabled={loading || isProtected}
              />
              {errors.value && (
                <p className="text-sm text-red-600">{errors.value.message}</p>
              )}
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('stageLabel')}</label>
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
                  <SelectItem value="LEAD">{t('stageLead')}</SelectItem>
                  <SelectItem value="CONTACTED">{t('stageContacted')}</SelectItem>
                  <SelectItem value="PROPOSAL">{t('stageProposal')}</SelectItem>
                  <SelectItem value="NEGOTIATION">{t('stageNegotiation')}</SelectItem>
                  <SelectItem value="WON">{t('stageWon')}</SelectItem>
                  <SelectItem value="LOST">{t('stageLost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Win Probability */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('winProbabilityLabel')}</label>
              <Input
                type="number"
                min="0"
                max="100"
                {...register('winProbability', { valueAsNumber: true })}
                placeholder={t('winProbabilityPlaceholder')}
                disabled={loading || isProtected}
              />
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${winProbability}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{t('winProbabilityDisplay', { percent: winProbability })}</p>
            </div>

            {/* Expected Close Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('expectedCloseDateLabel')}</label>
              <Input
                type="date"
                {...register('expectedCloseDate')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Lead Source */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('leadSourceLabel')}</label>
              <Select
                value={watch('leadSource') || ''}
                onValueChange={(value) => setValue('leadSource', value as DealFormData['leadSource'])}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('leadSourcePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">{t('leadSourceWeb')}</SelectItem>
                  <SelectItem value="EMAIL">{t('leadSourceEmail')}</SelectItem>
                  <SelectItem value="PHONE">{t('leadSourcePhone')}</SelectItem>
                  <SelectItem value="REFERRAL">{t('leadSourceReferral')}</SelectItem>
                  <SelectItem value="SOCIAL">{t('leadSourceSocial')}</SelectItem>
                  <SelectItem value="OTHER">{t('leadSourceOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('statusLabel')}</label>
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
                  <SelectItem value="OPEN">{t('statusOpen')}</SelectItem>
                  <SelectItem value="CLOSED">{t('statusClosed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('descriptionLabel')}</label>
              <Textarea
                {...register('description')}
                placeholder={t('descriptionPlaceholder')}
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading || isProtected}
            >
              {loading ? t('saving') : deal ? (isProtected ? t('cannotEdit') : t('update')) : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
