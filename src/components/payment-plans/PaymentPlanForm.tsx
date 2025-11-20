'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Sparkles } from 'lucide-react'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'

const paymentPlanSchema = z.object({
  name: z.string().min(1, 'Plan adı gereklidir'),
  invoiceId: z.string().min(1, 'Fatura seçmelisiniz'),
  customerId: z.string().optional(),
  totalAmount: z.number().min(0.01, 'Toplam tutar 0\'dan büyük olmalı'),
  installmentCount: z.number().min(1, 'Taksit sayısı en az 1 olmalı').max(60, 'Taksit sayısı en fazla 60 olabilir'),
  installmentFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']),
  startDate: z.string().min(1, 'Başlangıç tarihi gereklidir'),
})

type PaymentPlanFormData = z.infer<typeof paymentPlanSchema>

interface PaymentPlanFormProps {
  plan?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedPlan: any) => void
  invoiceId?: string
}

export default function PaymentPlanForm({
  plan,
  open,
  onClose,
  onSuccess,
  invoiceId: propInvoiceId,
}: PaymentPlanFormProps) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Array<{ id: string; invoiceNumber?: string; title?: string; total?: number; customerId?: string }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name?: string }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentPlanFormData>({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: {
      name: '',
      invoiceId: '',
      customerId: '',
      totalAmount: 0,
      installmentCount: 1,
      installmentFrequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const watchedInvoiceId = watch('invoiceId')
  const watchedTotalAmount = watch('totalAmount')
  const watchedInstallmentCount = watch('installmentCount')

  // Load invoices and customers
  useEffect(() => {
    if (open) {
      // Invoices
      fetch('/api/invoices?limit=100')
        .then((res) => res.json())
        .then((data) => setInvoices(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load invoices:', err))

      // Customers
      fetch('/api/customers?limit=100')
        .then((res) => res.json())
        .then((data) => setCustomers(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load customers:', err))
    }
  }, [open])

  // Invoice seçildiğinde totalAmount ve customerId'yi otomatik doldur
  useEffect(() => {
    if (watchedInvoiceId) {
      const invoice = invoices.find((inv) => inv.id === watchedInvoiceId)
      if (invoice) {
        if (invoice.total) {
          setValue('totalAmount', invoice.total)
        }
        if (invoice.customerId) {
          setValue('customerId', invoice.customerId)
        }
      }
    }
  }, [watchedInvoiceId, invoices, setValue])

  // Populate form when editing or when invoiceId prop is provided
  useEffect(() => {
    if (open) {
      if (plan) {
        reset({
          name: plan.name || '',
          invoiceId: plan.invoiceId || '',
          customerId: plan.customerId || '',
          totalAmount: plan.totalAmount || 0,
          installmentCount: plan.installmentCount || 1,
          installmentFrequency: (plan.installmentFrequency || 'MONTHLY') as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
          startDate: plan.installments?.[0]?.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        })
      } else if (propInvoiceId) {
        reset({
          name: '',
          invoiceId: propInvoiceId,
          customerId: '',
          totalAmount: 0,
          installmentCount: 1,
          installmentFrequency: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0],
        })
      } else {
        reset({
          name: '',
          invoiceId: '',
          customerId: '',
          totalAmount: 0,
          installmentCount: 1,
          installmentFrequency: 'MONTHLY',
          startDate: new Date().toISOString().split('T')[0],
        })
      }
    }
  }, [plan, open, reset, propInvoiceId])

  const onSubmit = async (data: PaymentPlanFormData) => {
    setLoading(true)
    try {
      const url = plan
        ? `/api/payment-plans/${plan.id}`
        : '/api/payment-plans'
      const method = plan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save payment plan')
      }

      const savedPlan = await res.json()
      
      toast.success(
        plan ? 'Ödeme planı güncellendi' : 'Ödeme planı oluşturuldu',
        {
          description: plan 
            ? `${savedPlan.name || 'Ödeme planı'} başarıyla güncellendi.` 
            : `${savedPlan.name || 'Ödeme planı'} başarıyla oluşturuldu.`
        }
      )
      
      if (onSuccess) {
        onSuccess(savedPlan)
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Ödeme planı kaydedilemedi', { 
        description: error?.message || 'Bir hata oluştu' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAICreate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-ai-chat', {
          detail: {
            message: `Yeni bir ödeme planı oluştur. Fatura seçimi, taksit sayısı, taksit sıklığı ve başlangıç tarihini belirt.`,
          },
        })
      )
    }
  }

  const handleAIEdit = () => {
    if (plan && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('open-ai-chat', {
          detail: {
            message: `"${plan.name}" adlı ödeme planını düzenle. Plan ID: ${plan.id}`,
          },
        })
      )
    }
  }

  // Taksit tutarını hesapla
  const installmentAmount = watchedTotalAmount && watchedInstallmentCount
    ? watchedTotalAmount / watchedInstallmentCount
    : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Ödeme Planı Düzenle' : 'Yeni Ödeme Planı'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* AI Buttons */}
          <div className="flex gap-2 justify-end">
            {plan ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleAIEdit}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI ile Düzenle
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleAICreate}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI ile Oluştur
              </Button>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Plan Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: 12 Aylık Taksit Planı"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="invoiceId">Fatura *</Label>
              <Select
                value={watch('invoiceId')}
                onValueChange={(value) => setValue('invoiceId', value)}
                disabled={!!propInvoiceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fatura seçin" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber || inv.title || 'Fatura'} - {formatCurrency(inv.total || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.invoiceId && (
                <p className="text-sm text-red-600 mt-1">{errors.invoiceId.message}</p>
              )}
            </div>
          </div>

          {/* Customer (optional, auto-filled from invoice) */}
          <div>
            <Label htmlFor="customerId">Müşteri (Opsiyonel)</Label>
            <Select
              value={watch('customerId') || ''}
              onValueChange={(value) => setValue('customerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müşteri seçin (otomatik doldurulur)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Müşteri seçilmedi</SelectItem>
                {customers.map((cust) => (
                  <SelectItem key={cust.id} value={cust.id}>
                    {cust.name || 'Müşteri'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount and Installments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalAmount">Toplam Tutar (₺) *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                {...register('totalAmount', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.totalAmount && (
                <p className="text-sm text-red-600 mt-1">{errors.totalAmount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="installmentCount">Taksit Sayısı *</Label>
              <Input
                id="installmentCount"
                type="number"
                min="1"
                max="60"
                {...register('installmentCount', { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.installmentCount && (
                <p className="text-sm text-red-600 mt-1">{errors.installmentCount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="installmentFrequency">Taksit Sıklığı *</Label>
              <Select
                value={watch('installmentFrequency')}
                onValueChange={(value) => setValue('installmentFrequency', value as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Haftalık</SelectItem>
                  <SelectItem value="MONTHLY">Aylık</SelectItem>
                  <SelectItem value="QUARTERLY">Çeyreklik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Installment Amount Preview */}
          {watchedTotalAmount > 0 && watchedInstallmentCount > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Taksit Tutarı (Tahmini)</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(installmentAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Son taksit tutarı farklı olabilir (yuvarlama nedeniyle)
              </div>
            </div>
          )}

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate">Başlangıç Tarihi *</Label>
            <Input
              id="startDate"
              type="date"
              {...register('startDate')}
            />
            {errors.startDate && (
              <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : plan ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

