'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useData } from '@/hooks/useData'

const contractSchema = z.object({
  title: z.string().min(1, 'Başlık gerekli').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().optional(),
  customerId: z.string().optional(),
  customerCompanyId: z.string().optional(),
  dealId: z.string().optional(),
  type: z.string().default('SERVICE'),
  category: z.string().optional(),
  startDate: z.string().min(1, 'Başlangıç tarihi gerekli'),
  endDate: z.string().min(1, 'Bitiş tarihi gerekli'),
  signedDate: z.string().optional(),
  renewalType: z.string().default('MANUAL'),
  renewalNoticeDays: z.number().min(0, 'Bildirim günü 0\'dan küçük olamaz').max(365, 'Bildirim günü 365\'ten büyük olamaz').default(30),
  autoRenewEnabled: z.boolean().default(false),
  billingCycle: z.string().default('YEARLY'),
  billingDay: z.number().min(1, 'Faturalama günü 1-31 arası olmalı').max(31, 'Faturalama günü 1-31 arası olmalı').optional(),
  paymentTerms: z.number().min(0, 'Ödeme vadesi 0\'dan küçük olamaz').max(365, 'Ödeme vadesi 365 günden fazla olamaz').default(30),
  value: z.number().min(0, 'Tutar 0\'dan küçük olamaz').max(999999999, 'Tutar çok büyük'),
  currency: z.string().default('TRY'),
  taxRate: z.number().min(0, 'KDV oranı 0-100 arası olmalı').max(100, 'KDV oranı 0-100 arası olmalı').default(18),
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
  message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
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
  message: 'İmza tarihi başlangıç tarihinden önce olamaz',
  path: ['signedDate'],
})

type ContractFormData = z.infer<typeof contractSchema>

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
  const [loading, setLoading] = useState(false)
  const [autoRenew, setAutoRenew] = useState(false)

  // Fetch customers for select
  const { data: customersData } = useData<{ data: any[] }>('/api/customers')
  const customers = customersData?.data || []

  // Fetch customer companies
  const { data: companiesData } = useData<any[]>('/api/customer-companies')
  const customerCompanies = companiesData || []

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

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true)
    try {
      const url = contract
        ? `/api/contracts/${contract.id}`
        : '/api/contracts'
      const method = contract ? 'PUT' : 'POST'

      // Convert autoRenew state to data
      data.autoRenewEnabled = autoRenew

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save contract')
      }

      const savedContract = await res.json()
      
      if (onSuccess) {
        onSuccess(savedContract)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Sözleşme Düzenle' : 'Yeni Sözleşme'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Sözleşme Başlığı *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Örn: Yıllık Yazılım Bakım Sözleşmesi"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Sözleşme detayları..."
                rows={3}
              />
            </div>
          </div>

          {/* Müşteri Seçimi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerId">Müşteri</Label>
              <select
                id="customerId"
                {...register('customerId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seçiniz...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="customerCompanyId">Müşteri Firma</Label>
              <select
                id="customerCompanyId"
                {...register('customerCompanyId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seçiniz...</option>
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
              <Label htmlFor="type">Sözleşme Tipi *</Label>
              <select
                id="type"
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="SERVICE">Hizmet</option>
                <option value="PRODUCT">Ürün</option>
                <option value="SUBSCRIPTION">Abonelik</option>
                <option value="MAINTENANCE">Bakım</option>
                <option value="LICENSE">Lisans</option>
                <option value="CONSULTING">Danışmanlık</option>
              </select>
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Örn: Yazılım"
              />
            </div>
          </div>

          {/* Tarihler */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
              />
              {errors.startDate && (
                <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endDate">Bitiş Tarihi *</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
              {errors.endDate && (
                <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="signedDate">İmza Tarihi</Label>
              <Input
                id="signedDate"
                type="date"
                {...register('signedDate')}
              />
            </div>
          </div>

          {/* Finansal Bilgiler */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="value">Tutar *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.value && (
                <p className="text-red-600 text-sm mt-1">{errors.value.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="taxRate">KDV Oranı (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                {...register('taxRate', { valueAsNumber: true })}
                placeholder="18"
              />
            </div>

            <div>
              <Label htmlFor="currency">Para Birimi</Label>
              <select
                id="currency"
                {...register('currency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Toplam Tutar */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Toplam Tutar (KDV Dahil)</div>
            <div className="text-2xl font-bold text-blue-600">{calculateTotal()}</div>
          </div>

          {/* Faturalandırma */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="billingCycle">Faturalandırma Döngüsü</Label>
              <select
                id="billingCycle"
                {...register('billingCycle')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MONTHLY">Aylık</option>
                <option value="QUARTERLY">3 Aylık</option>
                <option value="YEARLY">Yıllık</option>
                <option value="ONE_TIME">Tek Seferlik</option>
              </select>
            </div>

            <div>
              <Label htmlFor="paymentTerms">Ödeme Vadesi (Gün)</Label>
              <Input
                id="paymentTerms"
                type="number"
                {...register('paymentTerms', { valueAsNumber: true })}
                placeholder="30"
              />
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="DRAFT">Taslak</option>
                <option value="ACTIVE">Aktif</option>
                <option value="SUSPENDED">Askıda</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </div>
          </div>

          {/* Yenileme Ayarları */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Yenileme Ayarları</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="renewalType">Yenileme Tipi</Label>
                <select
                  id="renewalType"
                  {...register('renewalType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="MANUAL">Manuel</option>
                  <option value="AUTO">Otomatik</option>
                  <option value="NONE">Yenileme Yok</option>
                </select>
              </div>

              <div>
                <Label htmlFor="renewalNoticeDays">Bildirim Süresi (Gün)</Label>
                <Input
                  id="renewalNoticeDays"
                  type="number"
                  {...register('renewalNoticeDays', { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="autoRenewEnabled"
                checked={autoRenew}
                onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
              />
              <Label htmlFor="autoRenewEnabled" className="cursor-pointer">
                Otomatik yenileme aktif
              </Label>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Ek notlar..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : contract ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



