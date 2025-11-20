'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { handleFormValidationErrors } from '@/lib/form-validation'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  skipDialog?: boolean // Wizard içinde kullanım için Dialog wrapper'ı atla
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
  skipDialog = false,
}: DealFormProps) {
  const t = useTranslations('deals.form')
  const tCommon = useTranslations('common.form')
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const searchCustomerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const customerCompanyId = customerCompanyIdProp || searchCustomerCompanyId
  const [loading, setLoading] = useState(false)
  const navigateToDetailToast = useNavigateToDetailToast()
  const [lostReasonDialogOpen, setLostReasonDialogOpen] = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [pendingFormData, setPendingFormData] = useState<DealFormData | null>(null)
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationModalType, setAutomationModalType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [automationModalOptions, setAutomationModalOptions] = useState<any>(null)

  // Schema'yı component içinde oluştur - locale desteği için
  const dealSchema = z.object({
    title: z.string().min(1, tCommon('titleRequired')).max(200, tCommon('titleMaxLength', { max: 200 })),
    stage: z.enum(['LEAD', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('LEAD'),
    status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
    value: z.number().min(0.01, t('valueMin')).max(999999999, tCommon('amountMax')).refine((val) => val > 0, {
      message: 'Fırsat değeri 0 olamaz. Lütfen geçerli bir tutar girin.',
    }),
    customerId: z.string().optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
    winProbability: z.number().min(0, t('winProbabilityRange')).max(100, t('winProbabilityRange')).optional(),
    expectedCloseDate: z.string().optional(),
    leadSource: z.enum(['WEB', 'EMAIL', 'PHONE', 'REFERRAL', 'SOCIAL', 'OTHER']).optional(), // Lead source tracking (migration 025)
    competitorId: z.string().optional(), // Competitor tracking
    customerCompanyId: z.string().optional(),
    lostReason: z.string().optional(), // LOST stage'inde zorunlu olacak
  }).refine((data) => {
    // LOST stage'inde lostReason zorunlu
    if (data.stage === 'LOST') {
      return data.lostReason && data.lostReason.trim().length > 0
    }
    return true
  }, {
    message: 'LOST aşamasında kayıp sebebi zorunludur',
    path: ['lostReason']
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

  const formRef = useRef<HTMLFormElement>(null)
  
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

  // customerIdProp geldiğinde müşteri bilgilerini çek (wizard'larda kullanım için)
  const { data: customerData } = useQuery({
    queryKey: ['customer', customerIdProp],
    queryFn: async () => {
      if (!customerIdProp) return null
      const res = await fetch(`/api/customers/${customerIdProp}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: open && !deal && !!customerIdProp, // Sadece yeni deal ve customerIdProp varsa
  })

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
          lostReason: deal.lostReason || '', // LOST stage'inde kayıp sebebi
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
          customerCompanyId: customerCompanyId || (customerData?.customerCompanyId) || '',
        })
        if (customerIdProp) {
          setValue('customerId', customerIdProp)
        }
        // Müşteri bilgileri geldiyse customerCompanyId'yi güncelle
        if (customerData?.customerCompanyId && !customerCompanyId) {
          setValue('customerCompanyId', customerData.customerCompanyId)
        }
      }
    }
  }, [deal, open, reset, customerCompanyId, customerIdProp, customerData, setValue])

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
        // WON stage'i için özel mesaj
        if (savedDeal.stage === 'WON' && deal.stage !== 'WON') {
          toast.success(
            '🎉 Fırsat Kazanıldı!',
            `"${savedDeal.title}" fırsatı kazanıldı!\n\nOtomatik işlemler:\n• Teklif oluşturuldu\n• Sözleşme oluşturuldu\n• E-posta gönderildi`,
            {
              label: 'Teklifleri Görüntüle',
              onClick: () => window.location.href = `/${locale}/quotes`,
            }
          )
        } else {
          toast.success(t('dealUpdated'), { description: t('dealUpdatedMessage', { title: savedDeal.title }) })
        }
      } else {
        // Yeni deal oluşturuldu
        if (savedDeal.stage === 'WON') {
          toast.success(
            '🎉 Fırsat Kazanıldı!',
            `"${savedDeal.title}" fırsatı kazanıldı!\n\nOtomatik işlemler:\n• Teklif oluşturuldu\n• Sözleşme oluşturuldu\n• E-posta gönderildi`,
            {
              label: 'Teklifleri Görüntüle',
              onClick: () => window.location.href = `/${locale}/quotes`,
            }
          )
        } else {
          // Yeni deal oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
          navigateToDetailToast('deal', savedDeal.id, savedDeal.title)
          
          // ✅ Otomasyon: Deal oluşturulduğunda email gönder (kullanıcı tercihine göre)
          if (savedDeal.customerId) {
            try {
              // Customer bilgisini çek
              const customerRes = await fetch(`/api/customers/${savedDeal.customerId}`)
              if (customerRes.ok) {
                const customer = await customerRes.json()
                if (customer?.email) {
                  // Automation API'yi kontrol et
                  const automationRes = await fetch('/api/automations/deal-created-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deal: savedDeal }),
                  })
                  
                  if (automationRes.ok) {
                    const automationData = await automationRes.json()
                    if (automationData.shouldAsk) {
                      // Kullanıcıya sor (modal aç)
                      setAutomationModalType('email')
                      setAutomationModalOptions({
                        entityType: 'DEAL',
                        entityId: savedDeal.id,
                        entityTitle: savedDeal.title,
                        customerEmail: customer.email,
                        customerPhone: customer.phone,
                        customerName: customer.name,
                        defaultSubject: `Yeni Fırsat: ${savedDeal.title}`,
                        defaultMessage: `Merhaba ${customer.name},\n\nYeni fırsat oluşturuldu: ${savedDeal.title}\n\nDeğer: ${savedDeal.value ? `₺${savedDeal.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}\nAşama: ${savedDeal.stage || 'LEAD'}\n\nDetayları görüntülemek için lütfen bizimle iletişime geçin.`,
                        defaultHtml: `<p>Merhaba ${customer.name},</p><p>Yeni fırsat oluşturuldu: <strong>${savedDeal.title}</strong></p><p>Değer: ${savedDeal.value ? `₺${savedDeal.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p><p>Aşama: ${savedDeal.stage || 'LEAD'}</p>`,
                        onSent: () => {
                          toast.success('E-posta gönderildi', { description: 'Müşteriye deal bilgisi gönderildi' })
                        },
                        onAlwaysSend: async () => {
                          // Tercihi ALWAYS olarak kaydet
                          await fetch('/api/automations/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              automationType: 'emailOnDealCreated',
                              preference: 'ALWAYS',
                            }),
                          })
                        },
                        onNeverSend: async () => {
                          // Tercihi NEVER olarak kaydet
                          await fetch('/api/automations/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              automationType: 'emailOnDealCreated',
                              preference: 'NEVER',
                            }),
                          })
                        },
                      })
                      setAutomationModalOpen(true)
                    }
                  }
                }
              }
            } catch (error) {
              // Automation hatası ana işlemi engellemez
              console.error('Deal automation error:', error)
            }
          }
        }
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
    // LOST stage seçildiyse ve lostReason yoksa dialog aç
    if (data.stage === 'LOST' && !data.lostReason?.trim()) {
      setPendingFormData(data)
      setLostReasonDialogOpen(true)
      return
    }

    // Normal submit işlemi
    await submitFormData(data)
  }

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const submitFormData = async (data: DealFormData) => {
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
        // lostReason ekle (LOST stage'inde)
        lostReason: data.lostReason?.trim() || undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Deal save error:', error)
        const message =
        error.message === 'Yetkiniz yoktur.'
          ? t('unauthorized')
          : error.message
      toast.error(t('saveFailed'), { description: message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-4">
      {!skipDialog && (
        <DialogHeader>
          <DialogTitle>
            {deal ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {deal ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>
      )}

      <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
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
                <label className="text-sm font-medium">
                  {t('customerLabel')}
                  {stage && ['CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(stage) && (
                    <span className="text-red-600"> *</span>
                  )}
                </label>
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
                {errors.customerId && (
                  <p className="text-sm text-red-600">{errors.customerId.message}</p>
                )}
                {stage && ['CONTACTED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].includes(stage) && (
                  <p className="text-xs text-gray-500">CONTACTED aşamasından sonra müşteri veya firma seçimi zorunludur</p>
                )}
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
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading || isProtected}
                className="w-full sm:w-auto"
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary text-white w-full sm:w-auto"
                disabled={loading || isProtected}
              >
                {loading ? t('saving') : deal ? (isProtected ? t('cannotEdit') : t('update')) : t('save')}
              </Button>
            </div>
          </form>
    </div>
  )

  // LOST Reason Dialog ve Automation Modal - skipDialog durumunda render etme
  const dialogs = (
    <>
      {/* LOST Reason Dialog - Kayıp sebebi sor */}
      <Dialog open={lostReasonDialogOpen} onOpenChange={setLostReasonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fırsatı Kaybedildi Olarak İşaretle</DialogTitle>
            <DialogDescription>
              Fırsatı kaybedildi olarak işaretlemek için lütfen sebep belirtin. Bu sebep fırsat detay sayfasında not olarak görünecektir ve analiz görevi oluşturulacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">Kayıp Sebebi *</Label>
              <Textarea
                id="lostReason"
                placeholder="Örn: Fiyat uygun değil, Müşteri ihtiyacı değişti, Teknik uyumsuzluk, Rakipler daha avantajlı..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLostReasonDialogOpen(false)
                setLostReason('')
                setPendingFormData(null)
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!lostReason.trim()) {
                  toast.error('Sebep gerekli', { description: 'Lütfen kayıp sebebini belirtin.' })
                  return
                }

                if (!pendingFormData) {
                  toast.error('Hata', { description: 'Form verisi bulunamadı.' })
                  setLostReasonDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setLostReasonDialogOpen(false)
                const reason = lostReason.trim()
                setLostReason('')
                
                // Form verisine lostReason ekle ve submit et
                const formDataWithReason = {
                  ...pendingFormData,
                  lostReason: reason,
                }
                setPendingFormData(null)
                
                // Form'u submit et
                await submitFormData(formDataWithReason)
              }}
              disabled={!lostReason.trim()}
            >
              Kaydet ve Kaybedildi Olarak İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Automation Confirmation Modal */}
      {automationModalOpen && automationModalOptions && (
        <AutomationConfirmationModal
          type={automationModalType}
          options={automationModalOptions}
          open={automationModalOpen}
          onClose={() => {
            setAutomationModalOpen(false)
            setAutomationModalOptions(null)
          }}
        />
      )}
    </>
  )

  if (skipDialog) {
    return formContent
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {formContent}
        </DialogContent>
      </Dialog>
      {dialogs}
    </>
  )
}
