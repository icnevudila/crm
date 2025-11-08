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

const quoteSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WAITING']).default('DRAFT'),
  total: z.number().min(0.01, 'Alt Toplam 0\'dan büyük olmalı'),
  dealId: z.string().min(1, 'Fırsat seçimi zorunludur'),
  vendorId: z.string().optional(),
  description: z.string().optional(),
  validUntil: z.string().min(1, 'Geçerlilik tarihi zorunludur'),
  discount: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
})

type QuoteFormData = z.infer<typeof quoteSchema>

interface QuoteFormProps {
  quote?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedQuote: any) => void // Cache güncelleme için callback
}

async function fetchDeals() {
  const res = await fetch('/api/deals?pageSize=1000')
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

export default function QuoteForm({ quote, open, onClose, onSuccess }: QuoteFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: fetchDeals,
    enabled: open,
  })

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    enabled: open,
  })

  // Güvenlik kontrolü - her zaman array olmalı
  const deals = Array.isArray(dealsData) ? dealsData : []
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
    },
  })

  const status = watch('status')
  const dealId = watch('dealId')
  const total = watch('total')
  const discount = watch('discount') || 0
  const taxRate = watch('taxRate') || 18

  // Quote prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (quote) {
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
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: '',
          status: 'DRAFT',
          total: 0,
          dealId: '',
          vendorId: '',
          description: '',
          validUntil: '',
          discount: 0,
          taxRate: 18,
        })
      }
    }
  }, [quote, open, reset])

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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, total: finalTotal }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save quote')
      }

      return res.json()
    },
    onSuccess: async (savedQuote) => {
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
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Quote save error:', error)
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
            {quote ? 'Teklif Düzenle' : 'Yeni Teklif'}
          </DialogTitle>
          <DialogDescription>
            {quote ? 'Teklif bilgilerini güncelleyin' : 'Yeni teklif oluşturun'}
            <br />
            <span className="text-xs text-red-600 mt-2 inline-block">
              * İşaretli alanlar zorunludur
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-900">
                Başlık <span className="text-red-600">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder="Teklif başlığı"
                disabled={loading}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600 font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Deal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                Fırsat <span className="text-red-600">*</span>
              </label>
              <Select
                value={dealId || ''}
                onValueChange={(value) => setValue('dealId', value)}
                disabled={loading}
              >
                <SelectTrigger className={errors.dealId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Fırsat seçin (Zorunlu)" />
                </SelectTrigger>
                <SelectContent>
                  {deals.map((deal: any) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title} {deal.Customer && `- ${deal.Customer.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dealId && (
                <p className="text-sm text-red-600 font-medium">{errors.dealId.message}</p>
              )}
              <p className="text-xs text-gray-500">
                💡 Fırsat seçimi zorunludur. Müşteri bilgisi otomatik olarak fırsattan alınır.
              </p>
            </div>

            {/* Vendor */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tedarikçi</label>
              <Select
                value={watch('vendorId') || undefined}
                onValueChange={(value) => setValue('vendorId', value === 'none' ? undefined : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin (Opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="none" disabled>Tedarikçi bulunamadı</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">Tedarikçi seçilmedi</SelectItem>
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
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as QuoteFormData['status'])
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="SENT">Gönderildi</SelectItem>
                  <SelectItem value="ACCEPTED">Kabul Edildi</SelectItem>
                  <SelectItem value="DECLINED">Reddedildi</SelectItem>
                  <SelectItem value="WAITING">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Teklif açıklaması ve detaylar"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                Geçerlilik Tarihi <span className="text-red-600">*</span>
              </label>
              <Input
                type="date"
                {...register('validUntil')}
                disabled={loading}
                className={errors.validUntil ? 'border-red-500' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.validUntil && (
                <p className="text-sm text-red-600 font-medium">{errors.validUntil.message}</p>
              )}
              <p className="text-xs text-gray-500">
                💡 Teklifin geçerlilik süresini belirtin.
              </p>
            </div>

            {/* Subtotal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                Alt Toplam (₺) <span className="text-red-600">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('total', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
                className={errors.total ? 'border-red-500' : ''}
              />
              {errors.total && (
                <p className="text-sm text-red-600 font-medium">{errors.total.message}</p>
              )}
              <p className="text-xs text-gray-500">
                💡 İndirim ve KDV öncesi toplam tutarı girin.
              </p>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">İndirim (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('discount', { valueAsNumber: true })}
                placeholder="0"
                disabled={loading}
              />
              {discount > 0 && (
                <p className="text-xs text-gray-500">
                  İndirim: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(discountAmount)}
                </p>
              )}
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">KDV Oranı (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taxRate', { valueAsNumber: true })}
                placeholder="18"
                disabled={loading}
              />
            </div>

            {/* Final Total Display */}
            <div className="space-y-2 md:col-span-2 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(finalTotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Alt Toplam:</span>
                  <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(subtotal)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>KDV ({taxRate}%):</span>
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
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : quote ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}





