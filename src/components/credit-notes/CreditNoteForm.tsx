'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/lib/toast'
import { Sparkles } from 'lucide-react'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'

const creditNoteSchema = z.object({
  returnOrderId: z.string().optional(),
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalı'),
  reason: z.string().optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'APPLIED']).optional(),
})

type CreditNoteFormData = z.infer<typeof creditNoteSchema>

interface CreditNoteFormProps {
  creditNote?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedCreditNote: any) => void
  returnOrderId?: string // Return Order'dan geliyorsa
}

export default function CreditNoteForm({
  creditNote,
  open,
  onClose,
  onSuccess,
  returnOrderId: propReturnOrderId,
}: CreditNoteFormProps) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [returnOrders, setReturnOrders] = useState<Array<{ id: string; returnNumber?: string; totalAmount?: number }>>([])
  const [invoices, setInvoices] = useState<Array<{ id: string; invoiceNumber?: string; title?: string; totalAmount?: number }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name?: string }>>([])
  const [selectedReturnOrderId, setSelectedReturnOrderId] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreditNoteFormData>({
    resolver: zodResolver(creditNoteSchema),
    defaultValues: {
      returnOrderId: '',
      invoiceId: '',
      customerId: '',
      amount: 0,
      reason: '',
      status: 'DRAFT',
    },
  })

  // Load return orders, invoices, and customers
  useEffect(() => {
    if (open) {
      // Return Orders
      fetch('/api/return-orders?status=APPROVED&limit=100')
        .then((res) => res.json())
        .then((data) => setReturnOrders(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load return orders:', err))

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

  // Auto-fill amount when return order is selected
  useEffect(() => {
    if (selectedReturnOrderId) {
      const returnOrder = returnOrders.find(ro => ro.id === selectedReturnOrderId)
      if (returnOrder && returnOrder.totalAmount) {
        setValue('amount', returnOrder.totalAmount)
        // Auto-fill invoiceId and customerId from return order
        fetch(`/api/return-orders/${selectedReturnOrderId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.invoiceId) {
              setValue('invoiceId', data.invoiceId)
            }
            if (data.customerId) {
              setValue('customerId', data.customerId)
            }
          })
          .catch((err) => console.error('Failed to load return order details:', err))
      }
    }
  }, [selectedReturnOrderId, returnOrders, setValue])

  // Populate form when editing or when returnOrderId prop is provided
  useEffect(() => {
    if (open) {
      if (creditNote) {
        // Edit mode
        reset({
          returnOrderId: creditNote.returnOrderId || '',
          invoiceId: creditNote.invoiceId || '',
          customerId: creditNote.customerId || '',
          amount: creditNote.amount || 0,
          reason: creditNote.reason || '',
          status: creditNote.status || 'DRAFT',
        })
        setSelectedReturnOrderId(creditNote.returnOrderId || '')
      } else if (propReturnOrderId) {
        // New mode with returnOrderId prop
        reset({
          returnOrderId: propReturnOrderId,
          invoiceId: '',
          customerId: '',
          amount: 0,
          reason: '',
          status: 'DRAFT',
        })
        setSelectedReturnOrderId(propReturnOrderId)
      } else {
        // New mode without returnOrderId
        reset({
          returnOrderId: '',
          invoiceId: '',
          customerId: '',
          amount: 0,
          reason: '',
          status: 'DRAFT',
        })
        setSelectedReturnOrderId('')
      }
    }
  }, [creditNote, open, reset, propReturnOrderId])

  const onSubmit = async (data: CreditNoteFormData) => {
    setLoading(true)
    try {
      const url = creditNote
        ? `/api/credit-notes/${creditNote.id}`
        : '/api/credit-notes'
      const method = creditNote ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save credit note')
      }

      const savedCreditNote = await res.json()

      toast.success(
        creditNote ? 'Alacak dekontu güncellendi' : 'Alacak dekontu kaydedildi',
        {
          description: creditNote 
            ? `${savedCreditNote.creditNoteNumber} başarıyla güncellendi.` 
            : `${savedCreditNote.creditNoteNumber} başarıyla oluşturuldu.`
        }
      )

      if (onSuccess) {
        onSuccess(savedCreditNote)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Alacak dekontu kaydedilemedi', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {creditNote ? 'Alacak Dekontunu Düzenle' : 'Yeni Alacak Dekontu'}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const event = new CustomEvent('open-ai-chat', {
                  detail: {
                    initialMessage: creditNote
                      ? `Alacak dekontunu düzenle: ${creditNote.creditNoteNumber}`
                      : 'Yeni alacak dekontu oluştur',
                    context: {
                      type: 'credit-note',
                      creditNote: creditNote ? {
                        id: creditNote.id,
                        creditNoteNumber: creditNote.creditNoteNumber,
                        returnOrderId: creditNote.returnOrderId,
                      } : null,
                    },
                  },
                })
                window.dispatchEvent(event)
                toast.info('784 AI açılıyor...', { description: 'AI asistanı ile alacak dekontu oluşturabilir veya düzenleyebilirsiniz' })
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {creditNote ? 'AI ile Düzenle' : 'AI ile Oluştur'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Return Order */}
          <div className="space-y-2">
            <Label htmlFor="returnOrderId">İade Siparişi</Label>
            <Select
              value={watch('returnOrderId') || ''}
              onValueChange={(value) => {
                setValue('returnOrderId', value)
                setSelectedReturnOrderId(value)
              }}
              disabled={!!propReturnOrderId || !!creditNote}
            >
              <SelectTrigger>
                <SelectValue placeholder="İade siparişi seçin..." />
              </SelectTrigger>
              <SelectContent>
                {returnOrders.map((returnOrder) => (
                  <SelectItem key={returnOrder.id} value={returnOrder.id}>
                    {returnOrder.returnNumber || returnOrder.id.substring(0, 8)} - {formatCurrency(returnOrder.totalAmount || 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice */}
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Fatura</Label>
            <Select
              value={watch('invoiceId') || ''}
              onValueChange={(value) => setValue('invoiceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fatura seçin..." />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber || invoice.title || invoice.id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer */}
          <div className="space-y-2">
            <Label htmlFor="customerId">Müşteri</Label>
            <Select
              value={watch('customerId') || ''}
              onValueChange={(value) => setValue('customerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müşteri seçin..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name || customer.id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Tutar (₺) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Sebep</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Alacak dekontu sebebini açıklayın..."
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Select
              value={watch('status') || 'DRAFT'}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Taslak</SelectItem>
                <SelectItem value="ISSUED">Düzenlendi</SelectItem>
                <SelectItem value="APPLIED">Uygulandı</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? 'Kaydediliyor...' : creditNote ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


