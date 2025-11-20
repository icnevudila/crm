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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/lib/toast'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { formatCurrency } from '@/lib/utils'

const returnOrderSchema = z.object({
  invoiceId: z.string().min(1, 'Fatura seçmelisiniz'),
  customerId: z.string().optional(),
  reason: z.string().min(1, 'İade sebebi gereklidir'),
  returnDate: z.string().min(1, 'İade tarihi gereklidir'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Ürün seçmelisiniz'),
    quantity: z.number().min(1, 'Miktar 1\'den büyük olmalı'),
    unitPrice: z.number().min(0, 'Birim fiyat 0\'dan büyük olmalı'),
    totalPrice: z.number().min(0, 'Toplam fiyat 0\'dan büyük olmalı'),
    reason: z.string().optional(),
  })).min(1, 'En az bir ürün eklemelisiniz'),
})

type ReturnOrderFormData = z.infer<typeof returnOrderSchema>

interface ReturnOrderFormProps {
  returnOrder?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedReturnOrder: any) => void
  invoiceId?: string // Invoice'dan geliyorsa
}

export default function ReturnOrderForm({
  returnOrder,
  open,
  onClose,
  onSuccess,
  invoiceId: propInvoiceId,
}: ReturnOrderFormProps) {
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Array<{ id: string; invoiceNumber?: string; title?: string }>>([])
  const [customers, setCustomers] = useState<Array<{ id: string; name?: string }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name?: string; sku?: string; price?: number }>>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')
  const [invoiceItems, setInvoiceItems] = useState<Array<{
    id: string
    productId?: string
    quantity: number
    unitPrice: number
    total: number
    product?: { id: string; name?: string; sku?: string }
  }>>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReturnOrderFormData>({
    resolver: zodResolver(returnOrderSchema),
    defaultValues: {
      invoiceId: '',
      customerId: '',
      reason: '',
      returnDate: new Date().toISOString().split('T')[0],
      items: [],
    },
  })

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

      // Products
      fetch('/api/products?limit=100')
        .then((res) => res.json())
        .then((data) => setProducts(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load products:', err))
    }
  }, [open])

  // Load invoice items when invoice is selected
  useEffect(() => {
    if (selectedInvoiceId) {
      fetch(`/api/invoices/${selectedInvoiceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.InvoiceItem) {
            setInvoiceItems(data.InvoiceItem || [])
            // Auto-fill customerId
            if (data.customerId) {
              setValue('customerId', data.customerId)
            }
          }
        })
        .catch((err) => console.error('Failed to load invoice items:', err))
    } else {
      setInvoiceItems([])
    }
  }, [selectedInvoiceId, setValue])

  // Populate form when editing or when invoiceId prop is provided
  useEffect(() => {
    if (open) {
      if (returnOrder) {
        // Edit mode
        reset({
          invoiceId: returnOrder.invoiceId || '',
          customerId: returnOrder.customerId || '',
          reason: returnOrder.reason || '',
          returnDate: returnOrder.returnDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          items: returnOrder.items?.map((item: any) => ({
            productId: item.productId || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            reason: item.reason || '',
          })) || [],
        })
        setSelectedInvoiceId(returnOrder.invoiceId || '')
      } else if (propInvoiceId) {
        // New mode with invoiceId prop
        reset({
          invoiceId: propInvoiceId,
          customerId: '',
          reason: '',
          returnDate: new Date().toISOString().split('T')[0],
          items: [],
        })
        setSelectedInvoiceId(propInvoiceId)
      } else {
        // New mode without invoiceId
        reset({
          invoiceId: '',
          customerId: '',
          reason: '',
          returnDate: new Date().toISOString().split('T')[0],
          items: [],
        })
        setSelectedInvoiceId('')
      }
    }
  }, [returnOrder, open, reset, propInvoiceId])

  const addItem = () => {
    const currentItems = watch('items') || []
    setValue('items', [
      ...currentItems,
      {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        reason: '',
      },
    ])
  }

  const removeItem = (index: number) => {
    const currentItems = watch('items') || []
    setValue('items', currentItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const currentItems = watch('items') || []
    const updatedItems = [...currentItems]
    
    if (field === 'productId') {
      // Find product price
      const product = products.find(p => p.id === value)
      if (product && product.price) {
        updatedItems[index].unitPrice = product.price
        updatedItems[index].totalPrice = updatedItems[index].quantity * product.price
      }
    } else if (field === 'quantity' || field === 'unitPrice') {
      const numValue = parseFloat(value) || 0
      updatedItems[index][field] = numValue
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice
    } else {
      updatedItems[index][field] = value
    }
    
    setValue('items', updatedItems)
  }

  const onSubmit = async (data: ReturnOrderFormData) => {
    setLoading(true)
    try {
      const url = returnOrder
        ? `/api/return-orders/${returnOrder.id}`
        : '/api/return-orders'
      const method = returnOrder ? 'PUT' : 'POST'

      const totalAmount = data.items.reduce((sum, item) => sum + item.totalPrice, 0)

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          totalAmount,
          refundAmount: totalAmount,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save return order')
      }

      const savedReturnOrder = await res.json()

      toast.success(
        returnOrder ? 'İade siparişi güncellendi' : 'İade siparişi kaydedildi',
        {
          description: returnOrder 
            ? `${savedReturnOrder.returnNumber} başarıyla güncellendi.` 
            : `${savedReturnOrder.returnNumber} başarıyla oluşturuldu.`
        }
      )

      if (onSuccess) {
        onSuccess(savedReturnOrder)
      }

      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('İade siparişi kaydedilemedi', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const items = watch('items') || []
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {returnOrder ? 'İade Siparişini Düzenle' : 'Yeni İade Siparişi'}
            </DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const event = new CustomEvent('open-ai-chat', {
                  detail: {
                    initialMessage: returnOrder
                      ? `İade siparişini düzenle: ${returnOrder.returnNumber}`
                      : 'Yeni iade siparişi oluştur',
                    context: {
                      type: 'return-order',
                      returnOrder: returnOrder ? {
                        id: returnOrder.id,
                        returnNumber: returnOrder.returnNumber,
                        invoiceId: returnOrder.invoiceId,
                      } : null,
                    },
                  },
                })
                window.dispatchEvent(event)
                toast.info('784 AI açılıyor...', { description: 'AI asistanı ile iade siparişi oluşturabilir veya düzenleyebilirsiniz' })
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {returnOrder ? 'AI ile Düzenle' : 'AI ile Oluştur'}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Invoice */}
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Fatura *</Label>
            <Select
              value={watch('invoiceId')}
              onValueChange={(value) => {
                setValue('invoiceId', value)
                setSelectedInvoiceId(value)
              }}
              disabled={!!propInvoiceId || !!returnOrder}
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
            {errors.invoiceId && (
              <p className="text-sm text-red-600">{errors.invoiceId.message}</p>
            )}
          </div>

          {/* Customer (auto-filled from invoice) */}
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

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">İade Sebebi *</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="İade sebebini açıklayın..."
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Return Date */}
          <div className="space-y-2">
            <Label htmlFor="returnDate">İade Tarihi *</Label>
            <Input
              id="returnDate"
              type="date"
              {...register('returnDate')}
            />
            {errors.returnDate && (
              <p className="text-sm text-red-600">{errors.returnDate.message}</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>İade Edilecek Ürünler *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ürün Ekle
              </Button>
            </div>

            {/* Quick add from invoice items */}
            {invoiceItems.length > 0 && items.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">
                  Faturadan ürün eklemek için:
                </p>
                <div className="space-y-2">
                  {invoiceItems.map((invoiceItem) => (
                    <Button
                      key={invoiceItem.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addItem()
                        const currentItems = watch('items') || []
                        const lastIndex = currentItems.length - 1
                        updateItem(lastIndex, 'productId', invoiceItem.productId)
                        updateItem(lastIndex, 'quantity', invoiceItem.quantity)
                        updateItem(lastIndex, 'unitPrice', invoiceItem.unitPrice)
                      }}
                      className="w-full justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {invoiceItem.product?.name || invoiceItem.productId?.substring(0, 8)} - 
                      Miktar: {invoiceItem.quantity} - 
                      Fiyat: {formatCurrency(invoiceItem.unitPrice)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead>Toplam</TableHead>
                      <TableHead>Sebep</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ürün seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name || product.sku || product.id.substring(0, 8)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.reason || ''}
                            onChange={(e) => updateItem(index, 'reason', e.target.value)}
                            placeholder="Sebep..."
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {items.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Henüz ürün eklenmedi. "Ürün Ekle" butonuna tıklayın veya faturadan ekleyin.
              </p>
            )}

            {errors.items && (
              <p className="text-sm text-red-600">{errors.items.message}</p>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam İade Tutarı:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}

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
              {loading ? 'Kaydediliyor...' : returnOrder ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


