'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useData } from '@/hooks/useData'
import { toast } from '@/lib/toast'

interface ContractFormProps {
  contract?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedContract: any) => void
}

export default function ContractForm({
  contract,
  open,
  onClose,
  onSuccess,
}: ContractFormProps) {
  const t = useTranslations('contracts.form')
  const tCommon = useTranslations('common.form')
  const [loading, setLoading] = useState(false)
  const [autoRenew, setAutoRenew] = useState(false)

  // Schema'yı component içinde oluştur - locale desteği için
  const contractSchema = z.object({
    title: z.string().min(1, t('titleRequired')).max(200, t('titleMaxLength')),
    description: z.string().optional(),
    customerId: z.string().optional(),
    customerCompanyId: z.string().optional(),
    dealId: z.string().optional(),
    type: z.string().default('SERVICE'),
    category: z.string().optional(),
    startDate: z.string().min(1, t('startDateRequired')),
    endDate: z.string().min(1, t('endDateRequired')),
    signedDate: z.string().optional(),
    renewalType: z.string().default('MANUAL'),
    renewalNoticeDays: z.number().min(0, t('renewalNoticeDaysMin')).max(365, t('renewalNoticeDaysMax')).default(30),
    autoRenewEnabled: z.boolean().default(false),
    billingCycle: z.string().default('YEARLY'),
    billingDay: z.number().min(1, t('billingDayRange')).max(31, t('billingDayRange')).optional(),
    paymentTerms: z.number().min(0, t('paymentTermsMin')).max(365, t('paymentTermsMax')).default(30),
    value: z
      .number({ invalid_type_error: t('valueRequired') })
      .min(0, t('valueMin'))
      .max(999999999, t('valueMax')),
    currency: z.string().default('TRY'),
    taxRate: z.number().min(0, t('taxRateRange')).max(100, t('taxRateRange')).default(18),
    status: z.string().default('DRAFT'),
    terms: z.string().optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    // endDate startDate'den sonra olmalı
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end >= start
    }
    return true
  }, {
    message: t('endDateBeforeStart'),
    path: ['endDate'],
  }).refine((data) => {
    // signedDate startDate'den önce olamaz
    if (data.startDate && data.signedDate) {
      const start = new Date(data.startDate)
      const signed = new Date(data.signedDate)
      return signed >= start
    }
    return true
  }, {
    message: t('signedDateBeforeStart'),
    path: ['signedDate'],
  })

  type ContractFormData = z.infer<typeof contractSchema>

  // Fetch customers for select
  const { data: customersData } = useData<{ data: any[] }>('/api/customers')
  const customers = customersData?.data || []

  // Fetch customer companies
  const { data: companiesData } = useData<any[]>('/api/customer-companies')
  const customerCompanies = companiesData || []

  const formRef = useRef<HTMLFormElement>(null)
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      type: 'SERVICE',
      renewalType: 'MANUAL',
      renewalNoticeDays: 30,
      autoRenewEnabled: false,
      billingCycle: 'YEARLY',
      paymentTerms: 30,
      currency: 'TRY',
      taxRate: 18,
      status: 'DRAFT',
    },
  })

  const watchValue = watch('value')
  const watchTaxRate = watch('taxRate')

  // Calculate total value
  const calculateTotal = () => {
    if (watchValue && watchTaxRate) {
      const value = Number(watchValue)
      const taxRate = Number(watchTaxRate)
      const total = value + (value * taxRate / 100)
      return total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
    }
    return '0,00 ₺'
  }

  // Contract prop değiştiğinde form'u güncelle
  useEffect(() => {
    if (open) {
      if (contract) {
        // Düzenleme modu
        reset({
          title: contract.title || '',
          description: contract.description || '',
          customerId: contract.customerId || '',
          customerCompanyId: contract.customerCompanyId || '',
          dealId: contract.dealId || '',
          type: contract.type || 'SERVICE',
          category: contract.category || '',
          startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
          endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
          signedDate: contract.signedDate ? contract.signedDate.split('T')[0] : '',
          renewalType: contract.renewalType || 'MANUAL',
          renewalNoticeDays: contract.renewalNoticeDays || 30,
          autoRenewEnabled: contract.autoRenewEnabled || false,
          billingCycle: contract.billingCycle || 'YEARLY',
          billingDay: contract.billingDay || undefined,
          paymentTerms: contract.paymentTerms || 30,
          value: contract.value || 0,
          currency: contract.currency || 'TRY',
          taxRate: contract.taxRate || 18,
          status: contract.status || 'DRAFT',
          terms: contract.terms || '',
          notes: contract.notes || '',
        })
        setAutoRenew(contract.autoRenewEnabled || false)
      } else {
        // Yeni kayıt modu
        const today = new Date().toISOString().split('T')[0]
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        const endDate = nextYear.toISOString().split('T')[0]

        reset({
          title: '',
          description: '',
          customerId: '',
          type: 'SERVICE',
          category: '',
          startDate: today,
          endDate: endDate,
          renewalType: 'MANUAL',
          renewalNoticeDays: 30,
          autoRenewEnabled: false,
          billingCycle: 'YEARLY',
          paymentTerms: 30,
          value: 0,
          currency: 'TRY',
          taxRate: 18,
          status: 'DRAFT',
          terms: '',
          notes: '',
        })
        setAutoRenew(false)
      }
    }
  }, [contract, open, reset])

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true)
    try {
      const url = contract
        ? `/api/contracts/${contract.id}`
        : '/api/contracts'
      const method = contract ? 'PUT' : 'POST'

      // Convert autoRenew state to data
      const sanitizedData: Record<string, unknown> = {
        ...data,
        autoRenewEnabled: autoRenew,
        customerId: data.customerId ? data.customerId : null,
        customerCompanyId: data.customerCompanyId ? data.customerCompanyId : null,
        dealId: data.dealId ? data.dealId : null,
        category: data.category ? data.category : null,
        description: data.description ? data.description : null,
        signedDate: data.signedDate ? data.signedDate : null,
        renewalNoticeDays:
          typeof data.renewalNoticeDays === 'number' && !Number.isNaN(data.renewalNoticeDays)
            ? data.renewalNoticeDays
            : 30,
        billingDay:
          typeof data.billingDay === 'number' && !Number.isNaN(data.billingDay)
            ? data.billingDay
            : null,
        paymentTerms:
          typeof data.paymentTerms === 'number' && !Number.isNaN(data.paymentTerms)
            ? data.paymentTerms
            : 30,
        value:
          typeof data.value === 'number' && !Number.isNaN(data.value)
            ? data.value
            : 0,
        taxRate:
          typeof data.taxRate === 'number' && !Number.isNaN(data.taxRate)
            ? data.taxRate
            : 18,
        notes: data.notes ? data.notes : null,
        terms: data.terms ? data.terms : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save contract')
      }

      const savedContract = await res.json()
      
      // Toast mesajı göster
      if (contract) {
        toast.success(t('contractUpdated'), t('contractUpdatedMessage', { title: savedContract.title }))
      } else {
        toast.success(t('contractCreated'), t('contractCreatedMessage', { title: savedContract.title }))
      }
      
      if (onSuccess) {
        onSuccess(savedContract)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(t('saveFailed'), error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {contract ? t('editTitle') : t('newTitle')}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">{t('titleLabel')} *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder={t('titlePlaceholder')}
                required
                aria-invalid={errors.title ? 'true' : 'false'}
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">{t('descriptionLabel')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Müşteri Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId">{t('customerLabel')}</Label>
              <select
                id="customerId"
                {...register('customerId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('customerPlaceholder')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="customerCompanyId">{t('customerCompanyLabel')}</Label>
              <select
                id="customerCompanyId"
                {...register('customerCompanyId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('customerCompanyPlaceholder')}</option>
                {customerCompanies.map((company: any) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tip ve Kategori */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">{t('typeLabel')} *</Label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                aria-invalid={errors.type ? 'true' : 'false'}
              >
                <option value="SERVICE">{t('typeService')}</option>
                <option value="PRODUCT">{t('typeProduct')}</option>
                <option value="SUBSCRIPTION">{t('typeSubscription')}</option>
                <option value="MAINTENANCE">{t('typeMaintenance')}</option>
                <option value="LICENSE">{t('typeLicense')}</option>
                <option value="CONSULTING">{t('typeConsulting')}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="category">{t('categoryLabel')}</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder={t('categoryPlaceholder')}
              />
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">{t('startDateLabel')} *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                required
                aria-invalid={errors.startDate ? 'true' : 'false'}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">{t('endDateLabel')} *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                required
                aria-invalid={errors.endDate ? 'true' : 'false'}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="signedDate">{t('signedDateLabel')}</Label>
              <Input
                id="signedDate"
                type="date"
                {...register('signedDate')}
              />
              {errors.signedDate && (
                <p className="text-red-600 text-sm mt-1">{errors.signedDate.message}</p>
              )}
            </div>
          </div>

          {/* Finansal Bilgiler */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="value">{t('valueLabel')} *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder={t('valuePlaceholder')}
                required
                aria-invalid={errors.value ? 'true' : 'false'}
              />
              {errors.value && (
                <p className="text-red-600 text-sm mt-1">{errors.value.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="taxRate">{t('taxRateLabel')}</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                {...register('taxRate', { valueAsNumber: true })}
                placeholder={t('taxRatePlaceholder')}
              />
              {errors.taxRate && (
                <p className="text-red-600 text-sm mt-1">{errors.taxRate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">{t('currencyLabel')}</Label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TRY">{t('currencyTRY')}</option>
                <option value="USD">{t('currencyUSD')}</option>
                <option value="EUR">{t('currencyEUR')}</option>
                <option value="GBP">{t('currencyGBP')}</option>
              </select>
            </div>
          </div>

          {/* Toplam Tutar */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">{t('totalAmountLabel')}</div>
            <div className="text-2xl font-bold text-blue-600">{calculateTotal()}</div>
          </div>

          {/* Faturalandırma */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="billingCycle">{t('billingCycleLabel')}</Label>
              <select
                id="billingCycle"
                {...register('billingCycle')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MONTHLY">{t('billingCycleMonthly')}</option>
                <option value="QUARTERLY">{t('billingCycleQuarterly')}</option>
                <option value="YEARLY">{t('billingCycleYearly')}</option>
                <option value="ONE_TIME">{t('billingCycleOneTime')}</option>
              </select>
            </div>

            <div>
              <Label htmlFor="paymentTerms">{t('paymentTermsLabel')}</Label>
              <Input
                id="paymentTerms"
                type="number"
                {...register('paymentTerms', { valueAsNumber: true })}
                placeholder={t('paymentTermsPlaceholder')}
              />
              {errors.paymentTerms && (
                <p className="text-red-600 text-sm mt-1">{errors.paymentTerms.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">{t('statusLabel')}</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="DRAFT">{t('statusDraft')}</option>
                <option value="ACTIVE">{t('statusActive')}</option>
                <option value="SUSPENDED">{t('statusSuspended')}</option>
                <option value="CANCELLED">{t('statusCancelled')}</option>
              </select>
            </div>
          </div>

          {/* Yenileme Ayarları */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">{t('renewalSettingsTitle')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renewalType">{t('renewalTypeLabel')}</Label>
                <select
                  id="renewalType"
                  {...register('renewalType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MANUAL">{t('renewalTypeManual')}</option>
                  <option value="AUTO">{t('renewalTypeAuto')}</option>
                  <option value="NONE">{t('renewalTypeNone')}</option>
                </select>
              </div>

              <div>
                <Label htmlFor="renewalNoticeDays">{t('renewalNoticeDaysLabel')}</Label>
                <Input
                  id="renewalNoticeDays"
                  type="number"
                  {...register('renewalNoticeDays', { valueAsNumber: true })}
                  placeholder={t('renewalNoticeDaysPlaceholder')}
                />
                {errors.renewalNoticeDays && (
                  <p className="text-red-600 text-sm mt-1">{errors.renewalNoticeDays.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="autoRenewEnabled"
                checked={autoRenew}
                onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
              />
              <Label htmlFor="autoRenewEnabled" className="cursor-pointer">
                {t('autoRenewEnabledLabel')}
              </Label>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <Label htmlFor="notes">{t('notesLabel')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('saving') : contract ? t('update') : t('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



