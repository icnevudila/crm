'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/hooks/useData'
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

// Gider kategorileri
const EXPENSE_CATEGORIES = [
  { value: 'FUEL', label: 'Araç Yakıtı' },
  { value: 'ACCOMMODATION', label: 'Konaklama' },
  { value: 'FOOD', label: 'Yemek' },
  { value: 'TRANSPORT', label: 'Ulaşım' },
  { value: 'OFFICE', label: 'Ofis Giderleri' },
  { value: 'MARKETING', label: 'Pazarlama' },
  { value: 'OTHER', label: 'Diğer' },
]

// Gelir kategorileri (genişletilmiş)
const INCOME_CATEGORIES = [
  { value: 'INVOICE_INCOME', label: 'Fatura Geliri' },
  { value: 'SERVICE', label: 'Hizmet Geliri' },
  { value: 'PRODUCT_SALE', label: 'Ürün Satışı' },
  { value: 'CONSULTING', label: 'Danışmanlık' },
  { value: 'LICENSE', label: 'Lisans Geliri' },
  { value: 'INVESTMENT', label: 'Yatırım Geliri' },
  { value: 'OTHER', label: 'Diğer' },
]

// Gider kategorileri (genişletilmiş)
const EXPENSE_CATEGORIES_FULL = [
  { value: 'FUEL', label: 'Araç Yakıtı' },
  { value: 'ACCOMMODATION', label: 'Konaklama' },
  { value: 'FOOD', label: 'Yemek' },
  { value: 'TRANSPORT', label: 'Ulaşım' },
  { value: 'OFFICE', label: 'Ofis Giderleri' },
  { value: 'MARKETING', label: 'Pazarlama' },
  { value: 'SHIPPING', label: 'Kargo/Sevkiyat' },
  { value: 'PURCHASE', label: 'Alış Giderleri' },
  { value: 'TRAVEL', label: 'Seyahat' },
  { value: 'UTILITIES', label: 'Faturalar (Elektrik, Su, İnternet)' },
  { value: 'RENT', label: 'Kira' },
  { value: 'SALARY', label: 'Maaş' },
  { value: 'TAX', label: 'Vergi' },
  { value: 'INSURANCE', label: 'Sigorta' },
  { value: 'MAINTENANCE', label: 'Bakım/Onarım' },
  { value: 'TRAINING', label: 'Eğitim' },
  { value: 'SOFTWARE', label: 'Yazılım/Lisans' },
  { value: 'OTHER', label: 'Diğer' },
]

// İlişkili entity tipleri
const RELATED_ENTITY_TYPES = [
  { value: 'INVOICE', label: 'Fatura' },
  { value: 'SHIPMENT', label: 'Sevkiyat' },
  { value: 'PURCHASE', label: 'Alış İşlemi' },
  { value: 'TASK', label: 'Görev' },
  { value: 'TICKET', label: 'Destek Talebi' },
  { value: 'MEETING', label: 'Toplantı' },
  { value: 'PRODUCT', label: 'Ürün' },
  { value: 'DEAL', label: 'Anlaşma' },
  { value: 'QUOTE', label: 'Teklif' },
  { value: 'NONE', label: 'İlişkisiz' },
]

// Ödeme yöntemleri
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Nakit' },
  { value: 'BANK', label: 'Banka Transferi' },
  { value: 'CREDIT_CARD', label: 'Kredi Kartı' },
  { value: 'DEBIT_CARD', label: 'Banka Kartı' },
  { value: 'CHECK', label: 'Çek' },
  { value: 'OTHER', label: 'Diğer' },
]

const financeSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).default('INCOME'),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalı').max(999999999, 'Tutar çok büyük'),
  category: z.string().optional(),
  description: z.string().max(1000, 'Açıklama en fazla 1000 karakter olabilir').optional(),
  relatedTo: z.string().optional(), // Eski format (backward compatibility)
  relatedEntityType: z.string().optional(), // Yeni: Entity tipi (Invoice, Shipment, vb.)
  relatedEntityId: z.string().optional(), // Yeni: Entity ID
  customerCompanyId: z.string().optional(), // Firma bazlı ilişki
  paymentMethod: z.string().optional(), // Ödeme yöntemi
  paymentDate: z.string().optional(), // Ödeme tarihi
  isRecurring: z.boolean().optional().default(false), // Tekrarlayan gider
})

type FinanceFormData = z.infer<typeof financeSchema>

interface FinanceFormProps {
  finance?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedFinance: any) => void | Promise<void>
}

interface CustomerCompany {
  id: string
  name: string
}

export default function FinanceForm({ finance, open, onClose, onSuccess }: FinanceFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const urlCustomerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const [loading, setLoading] = useState(false)

  // Müşteri firmalarını çek (firma seçimi için)
  const { data: customerCompanies = [] } = useData<CustomerCompany[]>('/api/customer-companies', {
    dedupingInterval: 60000, // 60 saniye cache
    revalidateOnFocus: false,
  })

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
      category: '',
      description: '',
      relatedTo: '',
      customerCompanyId: urlCustomerCompanyId,
    },
  })

  const type = watch('type')
  const selectedCategory = watch('category')
  const relatedEntityType = watch('relatedEntityType')
  const [relatedEntities, setRelatedEntities] = useState<any[]>([])
  const [loadingEntities, setLoadingEntities] = useState(false)

  // Finance prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (finance) {
        // Düzenleme modu - finance bilgilerini yükle
        reset({
          type: finance.type || 'INCOME',
          amount: finance.amount || 0,
          category: finance.category || '',
          description: finance.description || '',
          relatedTo: finance.relatedTo || '',
          relatedEntityType: finance.relatedEntityType || '',
          relatedEntityId: finance.relatedEntityId || '',
          customerCompanyId: finance.customerCompanyId || urlCustomerCompanyId,
          paymentMethod: finance.paymentMethod || '',
          paymentDate: finance.paymentDate ? new Date(finance.paymentDate).toISOString().split('T')[0] : '',
          isRecurring: finance.isRecurring || false,
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          type: 'INCOME',
          amount: 0,
          category: '',
          description: '',
          relatedTo: '',
          relatedEntityType: '',
          relatedEntityId: '',
          customerCompanyId: urlCustomerCompanyId,
          paymentMethod: '',
          paymentDate: new Date().toISOString().split('T')[0],
          isRecurring: false,
        })
      }
    }
  }, [finance, open, reset, urlCustomerCompanyId])

  // İlişkili entity seçildiğinde entity listesini çek
  useEffect(() => {
    const fetchRelatedEntities = async () => {
      if (!relatedEntityType || relatedEntityType === 'NONE') {
        setRelatedEntities([])
        return
      }

      setLoadingEntities(true)
      try {
        const endpoint = `/api/${relatedEntityType.toLowerCase()}s`
        const res = await fetch(endpoint)
        if (res.ok) {
          const data = await res.json()
          setRelatedEntities(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to fetch related entities:', error)
        setRelatedEntities([])
      } finally {
        setLoadingEntities(false)
      }
    }

    fetchRelatedEntities()
  }, [relatedEntityType])

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
      toast.error('Kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {finance ? 'Finans Kaydı Düzenle' : 'Yeni Finans Kaydı'}
          </DialogTitle>
          <DialogDescription>
            {finance ? 'Finans kaydını güncelleyin' : 'Yeni gelir/gider kaydı oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
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

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <Select
              value={selectedCategory || 'none'}
              onValueChange={(value) =>
                setValue('category', value === 'none' ? '' : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kategori Seçilmedi</SelectItem>
                {(type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES_FULL).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <Textarea
              {...register('description')}
              placeholder="Detaylı açıklama girin..."
              rows={3}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Customer Company (Müşteri Firması) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Müşteri Firması</label>
            <Select
              value={watch('customerCompanyId') || 'none'}
              onValueChange={(value) =>
                setValue('customerCompanyId', value === 'none' ? undefined : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Firma seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Firma Seçilmedi</SelectItem>
                {customerCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Related Entity Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">İlişkili Entity Tipi</label>
            <Select
              value={relatedEntityType || 'NONE'}
              onValueChange={(value) => {
                setValue('relatedEntityType', value === 'NONE' ? '' : value)
                setValue('relatedEntityId', '') // Entity tipi değiştiğinde ID'yi temizle
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entity tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                {RELATED_ENTITY_TYPES.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Related Entity ID */}
          {relatedEntityType && relatedEntityType !== 'NONE' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {RELATED_ENTITY_TYPES.find((e) => e.value === relatedEntityType)?.label || 'Entity'} Seçin
              </label>
              <Select
              value={watch('relatedEntityId') || 'none'}
              onValueChange={(value) =>
                setValue('relatedEntityId', value === 'none' ? '' : value)
              }
              disabled={loading || loadingEntities}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEntities ? 'Yükleniyor...' : 'Entity seçin'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Entity Seçilmedi</SelectItem>
                {relatedEntities.map((entity: any) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.title || entity.name || entity.subject || entity.tracking || entity.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ödeme Yöntemi</label>
            <Select
              value={watch('paymentMethod') || 'none'}
              onValueChange={(value) =>
                setValue('paymentMethod', value === 'none' ? '' : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Ödeme yöntemi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ödeme Yöntemi Seçilmedi</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ödeme Tarihi</label>
            <Input
              type="date"
              {...register('paymentDate')}
              disabled={loading}
            />
          </div>

          {/* Is Recurring (Sadece giderler için) */}
          {type === 'EXPENSE' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                {...register('isRecurring')}
                className="h-4 w-4 rounded border-gray-300"
                disabled={loading}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium">
                Tekrarlayan Gider (Aylık otomatik oluştur)
              </label>
            </div>
          )}

          {/* Related To (Eski format - backward compatibility) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">İlişkili (Manuel - Eski Format)</label>
            <Input
              {...register('relatedTo')}
              placeholder="Örn: Invoice: xxx, Meeting: xxx (Manuel giriş)"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              Yeni sistemde yukarıdaki "İlişkili Entity Tipi" kullanılmalı. Bu alan eski kayıtlar için.
            </p>
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






