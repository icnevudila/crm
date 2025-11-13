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
import { getStageMessage } from '@/lib/stageTranslations'
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
          customerCompanyId: customerCompanyId || '',
        })
      }
    }
  }, [quote, open, reset, dealId, dealData, customerCompanyId]) // onClose dependency'den çıkarıldı - stable değil

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
        const message = customerCompanyName 
          ? `${customerCompanyName} firması için "${savedQuote.title}" teklifi oluşturuldu.`
          : `"${savedQuote.title}" teklifi oluşturuldu.`
        toast.success('Teklif oluşturuldu', message)
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
      reset()
      onClose()
    },
  })

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {loading ? t('saving') : quote ? (isProtected ? t('cannotEdit') : t('update')) : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
