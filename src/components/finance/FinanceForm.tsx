'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

interface FinanceFormProps {
  finance?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedFinance: any) => void | Promise<void>
  customerCompanyId?: string
}

interface CustomerCompany {
  id: string
  name: string
}

export default function FinanceForm({
  finance,
  open,
  onClose,
  onSuccess,
  customerCompanyId: customerCompanyIdProp,
}: FinanceFormProps) {
  const t = useTranslations('finance.form')
  const tCommon = useTranslations('common.form')
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const urlCustomerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const customerCompanyId = customerCompanyIdProp || urlCustomerCompanyId
  const [loading, setLoading] = useState(false)

  // Schema'yı component içinde oluştur - locale desteği için
  const financeSchema = z.object({
    type: z.enum(['INCOME', 'EXPENSE']).default('INCOME'),
    amount: z.number().min(0.01, t('amountMin')).max(999999999, t('amountMax')),
    category: z.string().optional(),
    description: z.string().max(1000, t('descriptionMaxLength')).optional(),
    relatedTo: z.string().optional(), // Eski format (backward compatibility)
    relatedEntityType: z.string().optional(), // Yeni: Entity tipi (Invoice, Shipment, vb.)
    relatedEntityId: z.string().optional(), // Yeni: Entity ID
    customerCompanyId: z.string().optional(), // Firma bazlı ilişki
    paymentMethod: z.string().optional(), // Ödeme yöntemi
    paymentDate: z.string().optional(), // Ödeme tarihi
    isRecurring: z.boolean().optional().default(false), // Tekrarlayan gider
  })

  type FinanceFormData = z.infer<typeof financeSchema>

  // Kategorileri locale'den al
  const getIncomeCategories = () => [
    { value: 'INVOICE_INCOME', label: t('categoryInvoiceIncome') },
    { value: 'SERVICE', label: t('categoryService') },
    { value: 'PRODUCT_SALE', label: t('categoryProductSale') },
    { value: 'CONSULTING', label: t('categoryConsulting') },
    { value: 'LICENSE', label: t('categoryLicense') },
    { value: 'INVESTMENT', label: t('categoryInvestment') },
    { value: 'OTHER', label: t('categoryOther') },
  ]

  const getExpenseCategories = () => [
    { value: 'FUEL', label: t('categoryFuel') },
    { value: 'ACCOMMODATION', label: t('categoryAccommodation') },
    { value: 'FOOD', label: t('categoryFood') },
    { value: 'TRANSPORT', label: t('categoryTransport') },
    { value: 'OFFICE', label: t('categoryOffice') },
    { value: 'MARKETING', label: t('categoryMarketing') },
    { value: 'SHIPPING', label: t('categoryShipping') },
    { value: 'PURCHASE', label: t('categoryPurchase') },
    { value: 'TRAVEL', label: t('categoryTravel') },
    { value: 'UTILITIES', label: t('categoryUtilities') },
    { value: 'RENT', label: t('categoryRent') },
    { value: 'SALARY', label: t('categorySalary') },
    { value: 'TAX', label: t('categoryTax') },
    { value: 'INSURANCE', label: t('categoryInsurance') },
    { value: 'MAINTENANCE', label: t('categoryMaintenance') },
    { value: 'TRAINING', label: t('categoryTraining') },
    { value: 'SOFTWARE', label: t('categorySoftware') },
    { value: 'OTHER', label: t('categoryOther') },
  ]

  const getRelatedEntityTypes = () => [
    { value: 'INVOICE', label: t('relatedEntityTypeInvoice') },
    { value: 'SHIPMENT', label: t('relatedEntityTypeShipment') },
    { value: 'PURCHASE', label: t('relatedEntityTypePurchase') },
    { value: 'TASK', label: t('relatedEntityTypeTask') },
    { value: 'TICKET', label: t('relatedEntityTypeTicket') },
    { value: 'MEETING', label: t('relatedEntityTypeMeeting') },
    { value: 'PRODUCT', label: t('relatedEntityTypeProduct') },
    { value: 'DEAL', label: t('relatedEntityTypeDeal') },
    { value: 'QUOTE', label: t('relatedEntityTypeQuote') },
    { value: 'NONE', label: t('relatedEntityTypeNone') },
  ]

  const getPaymentMethods = () => [
    { value: 'CASH', label: t('paymentMethodCash') },
    { value: 'BANK', label: t('paymentMethodBank') },
    { value: 'CREDIT_CARD', label: t('paymentMethodCreditCard') },
    { value: 'DEBIT_CARD', label: t('paymentMethodDebitCard') },
    { value: 'CHECK', label: t('paymentMethodCheck') },
    { value: 'OTHER', label: t('paymentMethodOther') },
  ]

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
      customerCompanyId,
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
          customerCompanyId: finance.customerCompanyId || customerCompanyId || undefined,
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
          customerCompanyId: customerCompanyId || undefined,
          paymentMethod: '',
          paymentDate: new Date().toISOString().split('T')[0],
          isRecurring: false,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finance, open, reset]) // reset eklendi - dependency array boyutunu sabit tutmak için (reset stable'dır, sonsuz döngüye neden olmaz)

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
    onSuccess: async (savedFinance) => {
      // Toast mesajı göster
      if (finance) {
        toast.success(t('financeUpdated'), t('financeUpdatedMessage', { title: savedFinance.title || savedFinance.description || t('financeCreatedMessage') }))
      } else {
        toast.success(t('financeCreated'), t('financeCreatedMessage'))
      }
      
      // onSuccess callback'i çağır - optimistic update için
      // CRITICAL FIX: onSuccess'i önce çağır, sonra form'u kapat
      // onSuccess içinde onClose çağrılmamalı - form zaten kendi içinde onClose çağırıyor
      if (onSuccess) {
        // onSuccess async olabilir - Promise.resolve ile await kullan
        await Promise.resolve(onSuccess(savedFinance))
      }
      reset()
      // Form'u kapat - onSuccess callback'inden SONRA (sonsuz döngü önleme)
      onClose()
    },
  })

  const onSubmit = async (data: FinanceFormData) => {
    setLoading(true)
    try {
      // Boş string'leri null'a çevir - UUID alanları için
      const cleanData = {
        ...data,
        customerCompanyId: data.customerCompanyId && data.customerCompanyId.trim() !== '' && data.customerCompanyId !== 'none'
          ? data.customerCompanyId
          : (customerCompanyId && customerCompanyId.trim() !== '' ? customerCompanyId : null),
        relatedEntityId: data.relatedEntityId && data.relatedEntityId.trim() !== '' && data.relatedEntityId !== 'none'
          ? data.relatedEntityId
          : null,
        relatedEntityType: data.relatedEntityType && data.relatedEntityType !== 'NONE'
          ? data.relatedEntityType
          : null,
        // Opsiyonel string alanları temizle
        description: data.description && data.description.trim() !== '' ? data.description : undefined,
        relatedTo: data.relatedTo && data.relatedTo.trim() !== '' ? data.relatedTo : undefined,
        category: data.category && data.category.trim() !== '' ? data.category : undefined,
        paymentMethod: data.paymentMethod && data.paymentMethod.trim() !== '' ? data.paymentMethod : undefined,
        paymentDate: data.paymentDate && data.paymentDate.trim() !== '' ? data.paymentDate : undefined,
      }
      
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(t('saveFailed'), error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {finance ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {finance ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-4">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('typeLabel')} *</label>
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
                <SelectItem value="INCOME">{t('typeIncome')}</SelectItem>
                <SelectItem value="EXPENSE">{t('typeExpense')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('amountLabel')} *</label>
            <Input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder={t('amountPlaceholder')}
              disabled={loading}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('categoryLabel')}</label>
            <Select
              value={selectedCategory || 'none'}
              onValueChange={(value) =>
                setValue('category', value === 'none' ? '' : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('categoryNotSelected')}</SelectItem>
                {(type === 'INCOME' ? getIncomeCategories() : getExpenseCategories()).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('descriptionLabel')}</label>
            <Textarea
              {...register('description')}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              disabled={loading}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Customer Company (Müşteri Firması) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('customerCompanyLabel')}</label>
            <Select
              value={watch('customerCompanyId') || 'none'}
              onValueChange={(value) =>
                setValue('customerCompanyId', value === 'none' ? undefined : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('customerCompanyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('customerCompanyNotSelected')}</SelectItem>
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
            <label className="text-sm font-medium">{t('relatedEntityTypeLabel')}</label>
            <Select
              value={relatedEntityType || 'NONE'}
              onValueChange={(value) => {
                setValue('relatedEntityType', value === 'NONE' ? undefined : value)
                setValue('relatedEntityId', undefined) // Entity tipi değiştiğinde ID'yi temizle
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('relatedEntityTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {getRelatedEntityTypes().map((entity) => (
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
                {getRelatedEntityTypes().find((e) => e.value === relatedEntityType)?.label || t('relatedEntityLabel')}
              </label>
              <Select
              value={watch('relatedEntityId') || 'none'}
              onValueChange={(value) =>
                setValue('relatedEntityId', value === 'none' ? undefined : value)
              }
              disabled={loading || loadingEntities}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingEntities ? t('relatedEntityLoading') : t('relatedEntityPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('relatedEntityNotSelected')}</SelectItem>
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
            <label className="text-sm font-medium">{t('paymentMethodLabel')}</label>
            <Select
              value={watch('paymentMethod') || 'none'}
              onValueChange={(value) =>
                setValue('paymentMethod', value === 'none' ? '' : value)
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('paymentMethodPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('paymentMethodNotSelected')}</SelectItem>
                {getPaymentMethods().map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('paymentDateLabel')}</label>
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
                {t('isRecurringLabel')}
              </label>
            </div>
          )}

          {/* Related To (Eski format - backward compatibility) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('relatedToLabel')}</label>
            <Input
              {...register('relatedTo')}
              placeholder={t('relatedToPlaceholder')}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              {t('relatedToHint')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? t('saving') : finance ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}






