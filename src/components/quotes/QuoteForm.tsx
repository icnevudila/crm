'use client'

import { useState, useEffect, useRef } from 'react'
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
import { getStageMessage } from '@/lib/stageTranslations'
import { handleFormValidationErrors } from '@/lib/form-validation'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
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

interface QuoteFormProps {
  quote?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedQuote: any) => void // Cache güncelleme için callback
  dealId?: string // Prop olarak dealId geçilebilir (modal içinde kullanım için)
  customerId?: string // Prop olarak customerId geçilebilir (modal içinde kullanım için)
  customerCompanyId?: string
  customerCompanyName?: string
  skipDialog?: boolean // Wizard içinde kullanım için Dialog wrapper'ı atla
}

async function fetchDeals(customerCompanyId?: string) {
  const params = new URLSearchParams()
  params.append('pageSize', '1000')
  if (customerCompanyId) {
    params.append('customerCompanyId', customerCompanyId)
  }
  const res = await fetch(`/api/deals?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch deals')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.deals || [])
}

async function fetchVendors() {
  const res = await fetch('/api/vendors?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch vendors')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.vendors || [])
}

export default function QuoteForm({
  quote,
  open,
  onClose,
  onSuccess,
  dealId: dealIdProp,
  customerId: customerIdProp,
  customerCompanyId: customerCompanyIdProp,
  customerCompanyName,
  skipDialog = false,
}: QuoteFormProps) {
  const t = useTranslations('quotes.form')
  const tCommon = useTranslations('common.form')
  const tQuotes = useTranslations('quotes')
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const customerCompanyIdFromUrl = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const customerCompanyId = customerCompanyIdProp || customerCompanyIdFromUrl
  const dealIdFromUrl = searchParams.get('dealId') || undefined // URL'den dealId al
  
  // Prop öncelikli - prop varsa prop'u kullan, yoksa URL'den al
  const dealId = dealIdProp || dealIdFromUrl
  const customerId = customerIdProp
  const [loading, setLoading] = useState(false)
  const navigateToDetailToast = useNavigateToDetailToast()
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationModalType, setAutomationModalType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [automationModalOptions, setAutomationModalOptions] = useState<any>(null)

  // Schema'yı component içinde oluştur - locale desteği için
  const quoteSchema = z.object({
    title: z.string().min(1, tCommon('titleRequired')).max(200, tCommon('titleMaxLength', { max: 200 })),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WAITING']).default('DRAFT'),
    total: z.number().min(0.01, t('amountMin')).max(999999999, tCommon('amountMax')).refine((val) => val > 0, {
      message: 'Teklif tutarı 0 olamaz. Lütfen geçerli bir tutar girin.',
    }),
    dealId: z.string().min(1, t('dealRequired')),
    vendorId: z.string().optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
    validUntil: z.string().min(1, t('validUntilRequired')),
    discount: z.number().min(0, t('discountRange')).max(100, t('discountRange')).optional(),
    taxRate: z.number().min(0, t('taxRateRange')).max(100, t('taxRateRange')).optional(),
    customerCompanyId: z.string().optional(), // Firma bazlı ilişki
  }).refine((data) => {
    // validUntil geçmiş tarih olamaz
    if (data.validUntil) {
      const validUntil = new Date(data.validUntil)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return validUntil >= today
    }
    return true
  }, {
    message: t('validUntilPastDate'),
    path: ['validUntil'],
  })

  type QuoteFormData = z.infer<typeof quoteSchema>

  const { data: dealsData } = useQuery({
    queryKey: ['deals', customerCompanyId],
    queryFn: () => fetchDeals(customerCompanyId || undefined),
    enabled: open,
  })

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    enabled: open,
  })

  // Güvenlik kontrolü - her zaman array olmalı
  const deals = Array.isArray(dealsData) ? dealsData : []
  const filteredDeals = customerCompanyId
    ? deals.filter((deal: any) => deal.customerCompanyId === customerCompanyId)
    : deals
  const vendors = Array.isArray(vendorsData) ? vendorsData : []

  const formRef = useRef<HTMLFormElement>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote || {
      title: '',
      status: 'DRAFT',
      total: 0,
      dealId: '',
      vendorId: '',
      description: '',
      validUntil: '',
      discount: 0,
      taxRate: 18,
      customerCompanyId: customerCompanyId || '',
    },
  })

  const status = watch('status')
  const selectedDealId = watch('dealId') // Form'dan seçilen deal ID'si
  const total = watch('total')
  const discount = watch('discount') || 0
  const taxRate = watch('taxRate') || 18
  
  // Durum bazlı koruma kontrolü - form alanlarını devre dışı bırakmak için
  const isProtected = quote && quote.status === 'ACCEPTED'

  // Deal bilgilerini çek (dealId varsa)
  const { data: dealData } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!dealId) return null
      const res = await fetch(`/api/deals/${dealId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!dealId && open && !quote, // Sadece yeni kayıt modunda ve dealId varsa
  })

  // customerIdProp geldiğinde müşteri bilgilerini çek (wizard'larda kullanım için)
  const { data: customerData } = useQuery({
    queryKey: ['customer', customerIdProp],
    queryFn: async () => {
      if (!customerIdProp) return null
      const res = await fetch(`/api/customers/${customerIdProp}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: open && !quote && !dealId && !!customerIdProp, // Sadece yeni quote, dealId yok ve customerIdProp varsa
  })

  // Quote prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (quote) {
        // ÖNEMLİ: Quote ACCEPTED olduğunda düzenlenemez
        if (quote.status === 'ACCEPTED') {
          const message = getStageMessage(quote.status, 'quote', 'immutable')
          toast.warning(message.title, message.description)
          onClose() // Modal'ı kapat
          return
        }

        // Düzenleme modu - quote bilgilerini yükle
        // Tarih formatını düzelt
        let formattedValidUntil = ''
        if (quote.validUntil) {
          const date = new Date(quote.validUntil)
          if (!isNaN(date.getTime())) {
            formattedValidUntil = date.toISOString().split('T')[0]
          }
        }
        
        reset({
          title: quote.title || '',
          status: quote.status || 'DRAFT',
          total: quote.total || 0,
          dealId: quote.dealId || '',
          vendorId: quote.vendorId || '',
          description: quote.description || '',
          validUntil: formattedValidUntil,
          discount: quote.discount || 0,
          taxRate: quote.taxRate || 18,
          customerCompanyId: quote.customerCompanyId || customerCompanyId || '',
        })
      } else if (dealId && dealData) {
        // Yeni kayıt modu - dealId varsa ve deal bilgileri yüklendiyse forma yansıt
        const deal = dealData
        const validUntilDate = new Date()
        validUntilDate.setDate(validUntilDate.getDate() + 30) // 30 gün sonra
        
        reset({
          title: deal.title ? `Teklif - ${deal.title}` : '',
          status: 'DRAFT',
          total: typeof deal.value === 'string' ? parseFloat(deal.value) || 0 : (deal.value || 0),
          dealId: dealId,
          vendorId: '',
          description: deal.description || '',
          validUntil: validUntilDate.toISOString().split('T')[0],
          discount: 0,
          taxRate: 18,
          customerCompanyId: deal.customerCompanyId || customerCompanyId || '',
        })
      } else if (customerIdProp && customerData && !dealId) {
        // Yeni kayıt modu - customerIdProp varsa ve müşteri bilgileri yüklendiyse forma yansıt
        const customer = customerData
        const validUntilDate = new Date()
        validUntilDate.setDate(validUntilDate.getDate() + 30) // 30 gün sonra
        
        reset({
          title: '',
          status: 'DRAFT',
          total: 0,
          dealId: '', // Deal seçilmediyse boş
          vendorId: '',
          description: '',
          validUntil: validUntilDate.toISOString().split('T')[0],
          discount: 0,
          taxRate: 18,
          customerCompanyId: customer.customerCompanyId || customerCompanyId || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: '',
          status: 'DRAFT',
          total: 0,
          dealId: dealId || '', // Prop veya URL'den gelen dealId'yi kullan
          vendorId: '',
          description: '',
          validUntil: '',
          discount: 0,
          taxRate: 18,
          customerCompanyId: customerCompanyId || (customerData?.customerCompanyId) || '',
        })
        // Müşteri bilgileri geldiyse customerCompanyId'yi güncelle
        if (customerData?.customerCompanyId && !customerCompanyId) {
          setValue('customerCompanyId', customerData.customerCompanyId)
        }
      }
    }
  }, [quote, open, reset, dealId, dealData, customerCompanyId, customerIdProp, customerData, setValue]) // onClose dependency'den çıkarıldı - stable değil

  useEffect(() => {
    if (open && !quote && filteredDeals.length === 1 && !selectedDealId) {
      setValue('dealId', filteredDeals[0].id)
    }
  }, [open, quote, filteredDeals, selectedDealId, setValue])

  // Toplam hesaplama (indirim ve KDV ile)
  const subtotal = total || 0
  const discountAmount = (subtotal * discount) / 100
  const afterDiscount = subtotal - discountAmount
  const taxAmount = (afterDiscount * taxRate) / 100
  const finalTotal = afterDiscount + taxAmount

  const mutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const url = quote ? `/api/quotes/${quote.id}` : '/api/quotes'
      const method = quote ? 'PUT' : 'POST'

      const payload = {
        ...data,
        total: finalTotal,
        customerCompanyId: customerCompanyId || data.customerCompanyId || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save quote')
      }

      return res.json()
    },
    onSuccess: async (savedQuote) => {
      // Toast mesajı göster
      if (quote) {
        toast.success('Teklif güncellendi', `"${savedQuote.title}" teklifi başarıyla güncellendi.`)
      } else {
        // Yeni quote oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('quote', savedQuote.id, savedQuote.title)
      }
      
      // Query cache'ini invalidate et - fresh data çek
      // ÖNEMLİ: Dashboard'daki tüm ilgili query'leri invalidate et (ana sayfada güncellensin)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['kanban-quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-quotes'] }),
        queryClient.invalidateQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
      ])
      
      // Refetch yap - anında güncel veri gelsin
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['quotes'] }),
        queryClient.refetchQueries({ queryKey: ['kanban-quotes'] }),
        queryClient.refetchQueries({ queryKey: ['stats-quotes'] }),
        queryClient.refetchQueries({ queryKey: ['quote-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
        queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
      ])
      
      // Callback ile yeni eklenen teklifi parent'a gönder - optimistic update için
      if (onSuccess) {
        await onSuccess(savedQuote)
      }
      
      // ✅ Otomasyon: Quote oluşturulduğunda email gönder (kullanıcı tercihine göre)
      if (!quote && savedQuote.dealId) {
        try {
          // Deal bilgisini çek
          const dealRes = await fetch(`/api/deals/${savedQuote.dealId}`)
          if (dealRes.ok) {
            const deal = await dealRes.json()
            if (deal?.customerId) {
              // Customer bilgisini çek
              const customerRes = await fetch(`/api/customers/${deal.customerId}`)
              if (customerRes.ok) {
                const customer = await customerRes.json()
                if (customer?.email) {
                  // Automation API'yi kontrol et
                  const automationRes = await fetch('/api/automations/quote-sent-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quote: savedQuote }),
                  })
                  
                  if (automationRes.ok) {
                    const automationData = await automationRes.json()
                    if (automationData.shouldAsk) {
                      // Kullanıcıya sor (modal aç)
                      setAutomationModalType('email')
                      setAutomationModalOptions({
                        entityType: 'QUOTE',
                        entityId: savedQuote.id,
                        entityTitle: savedQuote.title,
                        customerEmail: customer.email,
                        customerPhone: customer.phone,
                        customerName: customer.name,
                        defaultSubject: `Teklif: ${savedQuote.title}`,
                        defaultMessage: `Merhaba ${customer.name},\n\nYeni teklif hazırlandı: ${savedQuote.title}\n\nTutar: ${savedQuote.total ? `₺${savedQuote.total.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}\nDurum: ${savedQuote.status || 'DRAFT'}\n\nDetayları görüntülemek için lütfen bizimle iletişime geçin.`,
                        defaultHtml: `<p>Merhaba ${customer.name},</p><p>Yeni teklif hazırlandı: <strong>${savedQuote.title}</strong></p><p>Tutar: ${savedQuote.total ? `₺${savedQuote.total.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p><p>Durum: ${savedQuote.status || 'DRAFT'}</p>`,
                        onSent: () => {
                          toast.success('E-posta gönderildi', 'Müşteriye quote bilgisi gönderildi')
                        },
                        onAlwaysSend: async () => {
                          await fetch('/api/automations/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              automationType: 'emailOnQuoteSent',
                              preference: 'ALWAYS',
                            }),
                          })
                        },
                        onNeverSend: async () => {
                          await fetch('/api/automations/preferences', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              automationType: 'emailOnQuoteSent',
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
            }
          }
        } catch (error) {
          // Automation hatası ana işlemi engellemez
          console.error('Quote automation error:', error)
        }
      }
      
      reset()
      onClose()
    },
  })

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const onSubmit = async (data: QuoteFormData) => {
    setLoading(true)
    try {
      // dealId ve validUntil zorunlu olduğu için undefined yapmayalım
      // Sadece description ve vendorId opsiyonel
      const cleanData = {
        ...data,
        description: data.description && data.description.trim() !== '' 
          ? data.description 
          : undefined,
        vendorId: data.vendorId && data.vendorId !== '' ? data.vendorId : undefined,
        customerCompanyId: data.customerCompanyId && data.customerCompanyId !== ''
          ? data.customerCompanyId
          : customerCompanyId || undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Quote save error:', error)
      toast.error(
        'Teklif kaydedilemedi',
        error.message || 'Teklif kaydetme işlemi sırasında bir hata oluştu. Lütfen tüm alanları kontrol edip tekrar deneyin.'
      )
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-4">
      {!skipDialog && (
        <DialogHeader>
          <DialogTitle>
            {quote ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {quote ? t('editDescription') : t('newDescription')}
            <br />
            <span className="text-xs text-red-600 mt-2 inline-block">
              {t('requiredFields')}
            </span>
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
                {filteredDeals.length > 0
                  ? t('activeDealsCount', { count: filteredDeals.length })
                  : t('noDealsFound')}
              </p>
            </div>
          )}
          <input type="hidden" {...register('customerCompanyId')} />
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {quote && quote.status === 'ACCEPTED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800 font-semibold">
                {t('acceptedWarning')}
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
              <label className="text-sm font-bold text-gray-900">
                {t('titleLabel')} <span className="text-red-600">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder={t('titlePlaceholder')}
                disabled={loading || isProtected}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Deal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                {t('dealLabel')} <span className="text-red-600">*</span>
              </label>
              <Select
                value={selectedDealId || 'none'}
                onValueChange={(value) =>
                  setValue('dealId', value === 'none' ? '' : value)
                }
                disabled={loading || isProtected || filteredDeals.length === 0}
              >
                <SelectTrigger className={errors.dealId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('dealPlaceholderRequired')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDeals.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {t('noDealsForCompany')}
                    </SelectItem>
                  ) : (
                    filteredDeals.map((deal: any) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title} {deal.Customer && `- ${deal.Customer.name || ''}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.dealId && (
                <p className="text-sm text-red-600 font-medium">{errors.dealId.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {t('dealRequiredHint')}
              </p>
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('vendorLabel')}</label>
              <Select
                value={watch('vendorId') || 'none'}
                onValueChange={(value) => setValue('vendorId', value === 'none' ? undefined : value)}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('vendorPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="none" disabled>{t('vendorNotFound')}</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">{t('vendorNotSelected')}</SelectItem>
                      {vendors.map((vendor: any) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('statusLabel')}</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as QuoteFormData['status'])
                }
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">{tQuotes('statusDraft')}</SelectItem>
                  <SelectItem value="SENT">{tQuotes('statusSent')}</SelectItem>
                  <SelectItem value="ACCEPTED">{tQuotes('statusAccepted')}</SelectItem>
                  <SelectItem value="DECLINED">{tQuotes('statusDeclined')}</SelectItem>
                  <SelectItem value="WAITING">{tQuotes('statusWaiting')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('descriptionLabel')}</label>
              <Textarea
                {...register('description')}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                disabled={loading || isProtected}
              />
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                {t('validUntilLabel')} <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                {...register('validUntil')}
                disabled={loading || isProtected}
                className={errors.validUntil ? 'border-red-500' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.validUntil && (
                <p className="text-sm text-red-600 font-medium">{errors.validUntil.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {t('validUntilHint')}
              </p>
            </div>

            {/* Subtotal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                {t('subtotalLabel')} (₺) <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('total', { valueAsNumber: true })}
                placeholder={t('totalPlaceholder')}
                disabled={loading || isProtected}
                className={errors.total ? 'border-red-500' : ''}
              />
              {errors.total && (
                <p className="text-sm text-red-600 font-medium">{errors.total.message}</p>
              )}
              <p className="text-xs text-gray-500">
                {t('subtotalHint')}
              </p>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('discountLabel')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('discount', { valueAsNumber: true })}
                placeholder={t('discountPlaceholder')}
                disabled={loading || isProtected}
              />
              {discount > 0 && (
                <p className="text-xs text-gray-500">
                  {t('discountAmountLabel')}: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(discountAmount)}
                </p>
              )}
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('taxRateLabel')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taxRate', { valueAsNumber: true })}
                placeholder={t('taxRatePlaceholder')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Final Total Display */}
            <div className="space-y-2 md:col-span-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t('totalDisplayLabel')}</span>
                <span className="text-2xl font-bold text-primary-600">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(finalTotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{t('subtotalDisplayLabel')}</span>
                  <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(subtotal)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('taxDisplayLabel', { rate: taxRate })}</span>
                  <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(taxAmount)}</span>
                </div>
              )}
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
              loading={loading}
            >
              {loading ? t('saving') : quote ? (isProtected ? t('cannotEdit') : t('update')) : t('save')}
            </Button>
          </div>
        </form>
    </div>
  )

  // Automation Modal - skipDialog durumunda render etme
  const dialogs = (
    <>
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
