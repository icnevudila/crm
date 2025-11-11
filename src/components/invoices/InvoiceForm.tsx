'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Package } from 'lucide-react'
import { toast } from '@/lib/toast'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

const invoiceSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  status: z.enum(['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  total: z.number().min(0, 'Toplam 0\'dan büyük olmalı').max(999999999, 'Toplam çok büyük'),
  invoiceType: z.enum(['SALES', 'PURCHASE', 'SERVICE_SALES', 'SERVICE_PURCHASE']).default('SALES'), // SALES (Satış), PURCHASE (Alış), SERVICE_SALES (Hizmet Satış), SERVICE_PURCHASE (Hizmet Alım)
  serviceDescription: z.string().max(1000, 'Hizmet açıklaması en fazla 1000 karakter olabilir').optional(), // Hizmet faturaları için hizmet açıklaması
  customerId: z.string().optional(),
  quoteId: z.string().optional(),
  vendorId: z.string().optional(),
  customerCompanyId: z.string().optional(), // Firma bazlı ilişki
  invoiceNumber: z.string().max(50, 'Fatura numarası en fazla 50 karakter olabilir').optional(),
  dueDate: z.string().optional(),
  paymentDate: z.string().optional(),
  taxRate: z.number().min(0, 'KDV oranı 0-100 arası olmalı').max(100, 'KDV oranı 0-100 arası olmalı').optional(),
  billingAddress: z.string().max(500, 'Adres en fazla 500 karakter olabilir').optional(),
  billingCity: z.string().max(100, 'Şehir en fazla 100 karakter olabilir').optional(),
  billingTaxNumber: z.string().max(50, 'Vergi numarası en fazla 50 karakter olabilir').optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER']).optional(),
  paymentNotes: z.string().max(500, 'Ödeme notları en fazla 500 karakter olabilir').optional(),
  description: z.string().max(2000, 'Açıklama en fazla 2000 karakter olabilir').optional(),
}).refine((data) => {
  // SALES veya SERVICE_SALES faturası için müşteri zorunlu
  if ((data.invoiceType === 'SALES' || data.invoiceType === 'SERVICE_SALES') && !data.customerId) {
    return false
  }
  // PURCHASE veya SERVICE_PURCHASE faturası için tedarikçi zorunlu
  if ((data.invoiceType === 'PURCHASE' || data.invoiceType === 'SERVICE_PURCHASE') && !data.vendorId) {
    return false
  }
  // Hizmet faturaları için hizmet açıklaması zorunlu
  if ((data.invoiceType === 'SERVICE_SALES' || data.invoiceType === 'SERVICE_PURCHASE') && (!data.serviceDescription || data.serviceDescription.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'Satış faturası için müşteri, alış faturası için tedarikçi, hizmet faturaları için hizmet açıklaması seçilmelidir',
  path: ['customerId'], // Hata mesajı customerId alanında gösterilir
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  invoice?: any
  open: boolean
  onClose: () => void
  onSuccess?: (newInvoice: any) => void
}

async function fetchCustomers() {
  const res = await fetch('/api/customers?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch customers')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.customers || [])
}

async function fetchVendors() {
  const res = await fetch('/api/vendors?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch vendors')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.vendors || [])
}

async function fetchQuotes() {
  const res = await fetch('/api/quotes?pageSize=1000')
  if (!res.ok) throw new Error('Failed to fetch quotes')
  const data = await res.json()
  return Array.isArray(data) ? data : (data.data || data.quotes || [])
}

async function fetchProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Failed to fetch products')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

interface InvoiceItem {
  id?: string
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
  total: number
}

export default function InvoiceForm({ invoice, open, onClose, onSuccess }: InvoiceFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const customerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const [loading, setLoading] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  const { data: quotesData } = useQuery({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
    enabled: open,
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    enabled: open,
  })

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    enabled: open,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    enabled: open,
  })

  // Güvenlik kontrolü - her zaman array olmalı
  const quotes = Array.isArray(quotesData) ? quotesData : []
  const customers = Array.isArray(customersData) ? customersData : []
  const vendors = Array.isArray(vendorsData) ? vendorsData : []
  const products = Array.isArray(productsData) ? productsData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice || {
      title: '',
      status: 'DRAFT',
      total: 0,
      customerId: '',
      quoteId: '',
      vendorId: '',
      invoiceNumber: '',
      dueDate: '',
      paymentDate: '',
      taxRate: 18,
      billingAddress: '',
      billingCity: '',
      billingTaxNumber: '',
      paymentMethod: undefined,
      paymentNotes: '',
      description: '',
    },
  })

  const status = watch('status')
  const quoteId = watch('quoteId')
  const customerId = watch('customerId')
  const taxRate = watch('taxRate') || 18
  const selectedCustomer = customers.find((c: any) => c.id === customerId)
  
  // Durum bazlı koruma kontrolü - form alanlarını devre dışı bırakmak için
  const isProtected = invoice && (
    invoice.status === 'PAID' || 
    invoice.status === 'SHIPPED' || 
    invoice.status === 'RECEIVED' || 
    invoice.quoteId
  )

  // Invoice prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      // ÖNEMLİ: PAID (Ödendi) durumundaki faturalar düzenlenemez
      if (invoice && invoice.status === 'PAID') {
        const message = getStageMessage(invoice.status, 'invoice', 'immutable')
        toast.warning(message.title, message.description)
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: SHIPPED (Sevkiyatı Yapıldı) durumundaki faturalar düzenlenemez
      if (invoice && invoice.status === 'SHIPPED') {
        const statusName = translateStage(invoice.status, 'invoice')
        toast.warning(
          `${statusName} durumundaki faturalar düzenlenemez`,
          'Bu fatura için sevkiyat yapıldı ve stoktan düşüldü. Fatura bilgilerini değiştirmek için önce sevkiyatı iptal etmeniz ve stok işlemini geri almanız gerekir.'
        )
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: RECEIVED (Mal Kabul Edildi) durumundaki faturalar düzenlenemez
      if (invoice && invoice.status === 'RECEIVED') {
        const statusName = translateStage(invoice.status, 'invoice')
        toast.warning(
          `${statusName} durumundaki faturalar düzenlenemez`,
          'Bu fatura için mal kabul edildi ve stoğa girişi yapıldı. Fatura bilgilerini değiştirmek için önce mal kabul işlemini iptal etmeniz ve stok işlemini geri almanız gerekir.'
        )
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: Quote'tan oluşturulan faturalar düzenlenemez
      if (invoice && invoice.quoteId) {
        toast.warning('Tekliften oluşturulan faturalar değiştirilemez', 'Bu fatura tekliften otomatik olarak oluşturuldu. Fatura bilgilerini değiştirmek için önce teklifi reddetmeniz gerekir.')
        onClose() // Modal'ı kapat
        return
      }
      
      // InvoiceItem'ları yükle (eğer fatura varsa)
      if (invoice && invoice.InvoiceItem) {
        setInvoiceItems(
          invoice.InvoiceItem.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.Product?.name || '',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            total: item.total || 0,
          }))
        )
      } else {
        setInvoiceItems([])
      }

      if (invoice) {
        // Düzenleme modu - invoice bilgilerini yükle
        // Tarih formatını düzelt
        let formattedDueDate = ''
        let formattedPaymentDate = ''
        
        if (invoice.dueDate) {
          const date = new Date(invoice.dueDate)
          if (!isNaN(date.getTime())) {
            formattedDueDate = date.toISOString().split('T')[0]
          }
        }
        
        if (invoice.paymentDate) {
          const date = new Date(invoice.paymentDate)
          if (!isNaN(date.getTime())) {
            formattedPaymentDate = date.toISOString().split('T')[0]
          }
        }
        
        reset({
          title: invoice.title || '',
          status: invoice.status || 'DRAFT',
          total: invoice.total || 0,
          customerId: invoice.customerId || undefined,
          quoteId: invoice.quoteId || undefined,
          vendorId: invoice.vendorId || undefined,
          invoiceNumber: invoice.invoiceNumber || '',
          dueDate: formattedDueDate,
          paymentDate: formattedPaymentDate,
          taxRate: invoice.taxRate || 18,
          billingAddress: invoice.billingAddress || '',
          billingCity: invoice.billingCity || '',
          billingTaxNumber: invoice.billingTaxNumber || '',
          paymentMethod: invoice.paymentMethod || undefined,
          paymentNotes: invoice.paymentNotes || '',
          description: invoice.description || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: '',
          status: 'DRAFT',
          total: 0,
          invoiceType: 'SALES', // Varsayılan: Satış faturası
          customerId: '',
          quoteId: '',
          vendorId: '',
          invoiceNumber: '',
          dueDate: '',
          paymentDate: '',
          taxRate: 18,
          billingAddress: '',
          billingCity: '',
          billingTaxNumber: '',
          paymentMethod: undefined,
          paymentNotes: '',
          description: '',
        })
        setInvoiceItems([])
      }
    }
  }, [invoice, open, reset])

  // InvoiceItem ekleme/düzenleme fonksiyonları
  const handleAddItem = (item: InvoiceItem) => {
    if (editingItemIndex !== null) {
      // Düzenleme modu
      const updated = [...invoiceItems]
      updated[editingItemIndex] = item
      setInvoiceItems(updated)
      setEditingItemIndex(null)
    } else {
      // Yeni ekleme
      setInvoiceItems([...invoiceItems, item])
    }
    setItemFormOpen(false)
    updateTotal()
  }

  const handleRemoveItem = (index: number) => {
    const updated = invoiceItems.filter((_, i) => i !== index)
    setInvoiceItems(updated)
    updateTotal()
  }

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index)
    setItemFormOpen(true)
  }

  // Toplam tutarı güncelle (KDV dahil)
  const updateTotal = useCallback(() => {
    const taxRate = watch('taxRate') || 18
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0)
    const kdv = subtotal * (taxRate / 100)
    const total = subtotal + kdv
    setValue('total', total)
  }, [invoiceItems, setValue, watch])

  useEffect(() => {
    updateTotal()
  }, [updateTotal])

  // Müşteri seçilince otomatik doldur
  const handleCustomerChange = (customerId: string) => {
    setValue('customerId', customerId)
    const customer = customers.find((c: any) => c.id === customerId)
    if (customer) {
      if (customer.address) setValue('billingAddress', customer.address)
      if (customer.city) setValue('billingCity', customer.city)
      if (customer.taxNumber) setValue('billingTaxNumber', customer.taxNumber)
    }
  }

  const mutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const url = invoice ? `/api/invoices/${invoice.id}` : '/api/invoices'
      const method = invoice ? 'PUT' : 'POST'

      // YENİ: Satış faturası (SALES) veya Alış faturası (PURCHASE) ise invoiceItems'ı body'ye ekle
      const requestBody = {
        ...data,
        customerCompanyId: customerCompanyId || data.customerCompanyId || null, // URL'den veya form'dan customerCompanyId al
        ...((data.invoiceType === 'SALES' || data.invoiceType === 'PURCHASE') && invoiceItems.length > 0 && !invoice
          ? { invoiceItems: invoiceItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })) }
          : {}),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save invoice')
      }

      const result = await res.json()
      
      // YENİ: Sevkiyat oluşturuldu mesajını göster
      if (result.shipmentMessage) {
        toast.info(
          'Sevkiyat otomatik oluşturuldu',
          result.shipmentMessage + ' Sevkiyat sayfasından durumunu takip edebilirsiniz.'
        )
      }
      
      // Invoice oluşturulduktan sonra InvoiceItem'ları kaydet (eğer varsa ve yeni invoice ise)
      // NOT: API'de zaten invoiceItems kaydediliyor, burada sadece fallback olarak kalıyor
      if (invoiceItems.length > 0 && result.id && !invoice && !result.shipmentCreated) {
        try {
          // Her bir InvoiceItem'ı ayrı ayrı kaydet
          await Promise.all(
            invoiceItems.map(async (item) => {
              const itemRes = await fetch('/api/invoice-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  invoiceId: result.id,
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                }),
              })
              
              if (!itemRes.ok) {
                const error = await itemRes.json().catch(() => ({}))
                throw new Error(error.error || 'Failed to save invoice item')
              }
              
              return itemRes.json()
            })
          )
        } catch (itemError: any) {
          console.error('InvoiceItem save error:', itemError)
          // InvoiceItem kaydetme hatası ana işlemi engellemez, sadece uyarı ver
          toast.warning(
            'Fatura kaydedildi ancak bazı ürünler eklenemedi',
            itemError?.message || 'Ürün listesi kaydetme hatası. Faturayı düzenleyerek tekrar deneyin.'
          )
        }
      }
      
      return result
    },
    onSuccess: async (result) => {
      // Dashboard güncellemeleri - invoice-kanban ve kpis query'lerini invalidate et
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['kanban-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı güncelle
        queryClient.invalidateQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs güncelle (toplam değer, ortalama vs.)
      ])
      
      // Refetch yap - anında güncel veri gelsin
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['invoices'] }),
        queryClient.refetchQueries({ queryKey: ['kanban-invoices'] }),
        queryClient.refetchQueries({ queryKey: ['stats-invoices'] }),
        queryClient.refetchQueries({ queryKey: ['invoice-kanban'] }), // Dashboard'daki kanban chart'ı refetch et
        queryClient.refetchQueries({ queryKey: ['kpis'] }), // Dashboard'daki KPIs refetch et (toplam değer, ortalama vs.)
      ])
      
      // Parent component'e callback gönder - optimistic update için
      if (onSuccess) {
        await onSuccess(result)
      }
      reset()
      setInvoiceItems([]) // InvoiceItem'ları temizle
      onClose()
    },
  })

  const onSubmit = async (data: InvoiceFormData) => {
    // ÖNEMLİ: SHIPPED durumundaki faturalar düzenlenemez
    if (invoice && invoice.status === 'SHIPPED') {
      toast.warning('Bu fatura gönderildiği için düzenleyemezsiniz', 'Sevkiyat onaylandıktan sonra fatura değiştirilemez.')
      return
    }
    
    // ÖNEMLİ: Alış faturası (PURCHASE) için malzeme kontrolü
    if (data.invoiceType === 'PURCHASE' && invoiceItems.length === 0 && !invoice) {
      toast.warning(
        'Ürün eklemelisiniz',
        'Alış faturası için en az bir ürün eklemelisiniz. "Ürün Ekle" butonunu kullanarak satın alınan ürünleri ekleyin.'
      )
      return
    }
    
    // ÖNEMLİ: Satış faturası (SALES) için malzeme kontrolü
    if (data.invoiceType === 'SALES' && invoiceItems.length === 0 && !invoice) {
      toast.warning(
        'Ürün eklemelisiniz',
        'Satış faturası için en az bir ürün eklemelisiniz. "Ürün Ekle" butonunu kullanarak satılan ürünleri ekleyin.'
      )
      return
    }
    
    setLoading(true)
    try {
      // Boş string'leri temizle - tarih alanları ve diğer opsiyonel alanlar için
      const cleanData = {
        ...data,
        dueDate: data.dueDate && data.dueDate.trim() !== '' ? data.dueDate : undefined,
        paymentDate: data.paymentDate && data.paymentDate.trim() !== '' ? data.paymentDate : undefined,
        description: data.description && data.description.trim() !== '' ? data.description : undefined,
        invoiceNumber: data.invoiceNumber && data.invoiceNumber.trim() !== '' ? data.invoiceNumber : undefined,
        billingAddress: data.billingAddress && data.billingAddress.trim() !== '' ? data.billingAddress : undefined,
        billingCity: data.billingCity && data.billingCity.trim() !== '' ? data.billingCity : undefined,
        billingTaxNumber: data.billingTaxNumber && data.billingTaxNumber.trim() !== '' ? data.billingTaxNumber : undefined,
        paymentNotes: data.paymentNotes && data.paymentNotes.trim() !== '' ? data.paymentNotes : undefined,
        customerId: data.customerId && data.customerId !== '' ? data.customerId : undefined,
        quoteId: data.quoteId && data.quoteId !== '' ? data.quoteId : undefined,
        vendorId: data.vendorId && data.vendorId !== '' ? data.vendorId : undefined,
      }
      await mutation.mutateAsync(cleanData)
    } catch (error: any) {
      console.error('Invoice save error:', error)
      toast.error(
        'Fatura kaydedilemedi',
        error.message || 'Fatura kaydetme işlemi sırasında bir hata oluştu. Lütfen tüm alanları kontrol edip tekrar deneyin.'
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
            {invoice ? 'Fatura Düzenle' : 'Yeni Fatura'}
          </DialogTitle>
          <DialogDescription>
            {invoice ? 'Fatura bilgilerini güncelleyin' : 'Yeni fatura oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {invoice && invoice.status === 'PAID' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800 font-semibold">
                🔒 Bu fatura ödendi ve finans kaydı oluşturuldu. Fatura bilgileri değiştirilemez veya silinemez.
              </p>
            </div>
          )}
          {invoice && invoice.status === 'SHIPPED' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                🔒 Sevkiyatı yapıldı, stoktan düşüldü. Bu fatura değiştirilemez veya silinemez.
              </p>
            </div>
          )}
          {invoice && invoice.status === 'RECEIVED' && (
            <div className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4">
              <p className="text-sm text-teal-800 font-semibold">
                🔒 Mal kabul edildi, stoğa girişi yapıldı. Bu fatura değiştirilemez veya silinemez.
              </p>
            </div>
          )}
          {invoice && invoice.quoteId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
              <p className="text-sm text-indigo-800 font-semibold">
                ℹ️ Bu fatura tekliften oluşturuldu. Değiştirilemez.
              </p>
            </div>
          )}
          
          {/* Durum bazlı form devre dışı bırakma */}
          {(invoice?.status === 'PAID' || invoice?.status === 'SHIPPED' || invoice?.status === 'RECEIVED' || invoice?.quoteId) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-600">
                ⚠️ Bu fatura korumalı durumda olduğu için form alanları düzenlenemez.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Başlık *</label>
              <Input
                {...register('title')}
                placeholder="Fatura başlığı"
                disabled={loading || isProtected}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura Numarası</label>
              <Input
                {...register('invoiceNumber')}
                placeholder="FAT-2024-001"
                disabled={loading || isProtected}
              />
            </div>

            {/* Invoice Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura Tipi *</label>
              <Select
                value={watch('invoiceType') || 'SALES'}
                onValueChange={(value) => {
                  setValue('invoiceType', value as 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE')
                  // Tip değiştiğinde ilgili alanları temizle
                  if (value === 'PURCHASE' || value === 'SERVICE_PURCHASE') {
                    // Alış faturası - müşteri seçimini kaldır, tedarikçi seçimi aktif
                    setValue('customerId', undefined)
                    if (value === 'SERVICE_PURCHASE') {
                      setInvoiceItems([]) // Hizmet faturalarında ürün listesi temizlenir
                    }
                  } else {
                    // Satış faturası - tedarikçi seçimini kaldır, müşteri seçimi aktif
                    setValue('vendorId', undefined)
                    if (value === 'SERVICE_SALES') {
                      setInvoiceItems([]) // Hizmet faturalarında ürün listesi temizlenir
                    }
                  }
                }}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fatura tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALES">Satış Faturası (Stok Düşer)</SelectItem>
                  <SelectItem value="PURCHASE">Alış Faturası (Stok Artar)</SelectItem>
                  <SelectItem value="SERVICE_SALES">Hizmet Satış Faturası</SelectItem>
                  <SelectItem value="SERVICE_PURCHASE">Hizmet Alım Faturası</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {watch('invoiceType') === 'PURCHASE' 
                  ? 'Tedarikçiden alış - stok artacak' 
                  : watch('invoiceType') === 'SERVICE_SALES'
                  ? 'Müşteriye hizmet satışı - ürün seçimi yok'
                  : watch('invoiceType') === 'SERVICE_PURCHASE'
                  ? 'Tedarikçiden hizmet alımı - ürün seçimi yok'
                  : 'Müşteriye satış - stok düşecek'}
              </p>
            </div>

            {/* Customer (Sadece Satış Faturası için) */}
            {watch('invoiceType') === 'SALES' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Müşteri *</label>
                <Select
                  value={customerId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setValue('customerId', undefined)
                    } else {
                      handleCustomerChange(value)
                    }
                  }}
                  disabled={loading || isProtected}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.length === 0 ? (
                      <SelectItem value="none" disabled>Müşteri bulunamadı</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="none">Müşteri Seçilmedi</SelectItem>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.email && `(${customer.email})`}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quote */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Teklif</label>
              <Select
                value={quoteId || 'none'}
                onValueChange={(value) => setValue('quoteId', value === 'none' ? undefined : value)}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Teklif seçin (Opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Teklif Yok</SelectItem>
                  {quotes
                    .filter((quote: any) => quote.status === 'ACCEPTED')
                    .map((quote: any) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.title} - {quote.total} ₺
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor (Sadece Alış Faturası için) */}
            {watch('invoiceType') === 'PURCHASE' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tedarikçi *</label>
                <Select
                  value={watch('vendorId') || 'none'}
                  onValueChange={(value) => setValue('vendorId', value === 'none' ? undefined : value)}
                  disabled={loading || isProtected}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tedarikçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tedarikçi Seçilmedi</SelectItem>
                    {vendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">KDV Oranı (%)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taxRate', { 
                  valueAsNumber: true,
                  onChange: () => updateTotal() // KDV değişince toplamı güncelle
                })}
                placeholder="18"
                disabled={loading || isProtected}
              />
            </div>

            {/* Total (KDV Dahil) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Toplam (₺) *</label>
              <Input
                type="number"
                step="0.01"
                {...register('total', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading || isProtected}
                readOnly // Otomatik hesaplanıyor
              />
              {errors.total && (
                <p className="text-sm text-red-600">{errors.total.message}</p>
              )}
              <p className="text-xs text-gray-500">
                KDV Hariç: {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0))} + 
                KDV (%{watch('taxRate') || 18}): {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * ((watch('taxRate') || 18) / 100))} = 
                KDV Dahil: {formatCurrency((invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * (1 + ((watch('taxRate') || 18) / 100))))}
              </p>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vade Tarihi</label>
              <Input
                type="date"
                {...register('dueDate')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Payment Date */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ödeme Tarihi</label>
                <Input
                  type="date"
                  {...register('paymentDate')}
                  disabled={loading || isProtected}
                />
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as InvoiceFormData['status'])
                }
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="SENT">Gönderildi</SelectItem>
                  <SelectItem value="SHIPPED">Sevkiyatı Yapıldı</SelectItem>
                  <SelectItem value="RECEIVED">Mal Kabul Edildi</SelectItem>
                  <SelectItem value="PAID">Ödendi</SelectItem>
                  <SelectItem value="OVERDUE">Vadesi Geçmiş</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Fatura Adresi</label>
              <Textarea
                {...register('billingAddress')}
                placeholder="Fatura gönderim adresi"
                rows={2}
                disabled={loading || isProtected}
              />
            </div>

            {/* Billing City */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura Şehri</label>
              <Input
                {...register('billingCity')}
                placeholder="Şehir"
                disabled={loading || isProtected}
              />
            </div>

            {/* Billing Tax Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi Numarası</label>
              <Input
                {...register('billingTaxNumber')}
                placeholder="Vergi numarası"
                disabled={loading || isProtected}
              />
            </div>

            {/* Payment Method */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ödeme Yöntemi</label>
                <Select
                  value={watch('paymentMethod') || 'none'}
                  onValueChange={(value) => setValue('paymentMethod', value === 'none' ? undefined : value as any)}
                  disabled={loading || isProtected}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ödeme yöntemi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seçilmedi</SelectItem>
                    <SelectItem value="CASH">Nakit</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Banka Transferi</SelectItem>
                    <SelectItem value="CHECK">Çek</SelectItem>
                    <SelectItem value="CREDIT_CARD">Kredi Kartı</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Notes */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Ödeme Notları</label>
                <Input
                  {...register('paymentNotes')}
                  placeholder="Ödeme notları"
                  disabled={loading || isProtected}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Fatura açıklaması ve notlar"
                rows={3}
                disabled={loading || isProtected}
              />
            </div>
          </div>

          {/* Invoice Items Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Fatura Kalemleri
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingItemIndex(null)
                  setItemFormOpen(true)
                }}
                disabled={loading || isProtected}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ürün Ekle
              </Button>
            </div>

            {/* ÖNEMLİ: Alış faturası için malzeme uyarısı */}
            {watch('invoiceType') === 'PURCHASE' && invoiceItems.length === 0 && !invoice && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Malzeme Gerekli</h4>
                  <p className="text-sm text-amber-700">
                    Lütfen satın alınan ürünleri ekleyin. Malzeme eklemeden alış faturası oluşturulamaz ve mal kabul kaydı açılamaz.
                  </p>
                </div>
              </div>
            )}

            {invoiceItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Miktar</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.productName || products.find((p: any) => p.id === item.productId)?.name || 'Ürün bulunamadı'}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditItem(index)}
                              disabled={loading || isProtected}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              disabled={loading || isProtected}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Henüz ürün eklenmemiş</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItemIndex(null)
                    setItemFormOpen(true)
                  }}
                  disabled={loading || isProtected}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  İlk Ürünü Ekle
                </Button>
              </div>
            )}
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
              disabled={loading || isProtected}
            >
              {loading ? 'Kaydediliyor...' : invoice ? (isProtected ? 'Değiştirilemez' : 'Güncelle') : 'Kaydet'}
            </Button>
          </div>
        </form>

        {/* InvoiceItem Form Modal */}
        {itemFormOpen && (
          <InvoiceItemFormModal
            products={products}
            item={editingItemIndex !== null ? invoiceItems[editingItemIndex] : undefined}
            open={itemFormOpen}
            onClose={() => {
              setItemFormOpen(false)
              setEditingItemIndex(null)
            }}
            onSuccess={handleAddItem}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// InvoiceItem Form Modal Component
interface InvoiceItemFormModalProps {
  products: any[]
  item?: InvoiceItem
  open: boolean
  onClose: () => void
  onSuccess: (item: InvoiceItem) => void
}

function InvoiceItemFormModal({ products, item, open, onClose, onSuccess }: InvoiceItemFormModalProps) {
  const [productId, setProductId] = useState(item?.productId || '')
  const [quantity, setQuantity] = useState(item?.quantity || 1)
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice || 0)

  const selectedProduct = products.find((p: any) => p.id === productId)
  const total = quantity * unitPrice

  useEffect(() => {
    if (selectedProduct && selectedProduct.price) {
      setUnitPrice(selectedProduct.price)
    }
  }, [selectedProduct])

  useEffect(() => {
    if (item) {
      setProductId(item.productId)
      setQuantity(item.quantity)
      setUnitPrice(item.unitPrice)
    } else {
      setProductId('')
      setQuantity(1)
      setUnitPrice(0)
    }
  }, [item, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || quantity <= 0 || unitPrice < 0) {
      toast.warning(
        'Ürün bilgilerini eksiksiz doldurun',
        'Ürün seçmelisiniz, miktar 0\'dan büyük olmalı ve birim fiyat eksi olamaz.'
      )
      return
    }

    onSuccess({
      ...item,
      productId,
      productName: selectedProduct?.name || '',
      quantity,
      unitPrice,
      total,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Ürün Düzenle' : 'Ürün Ekle'}</DialogTitle>
          <DialogDescription>
            Faturaya ürün ekleyin. Stok otomatik güncellenecektir.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ürün Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ürün *</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Ürün seçin" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product: any) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} {product.sku ? `(${product.sku})` : ''} - Stok: {product.stock || 0}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Miktar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Miktar *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder="1"
            />
          </div>

          {/* Birim Fiyat */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Birim Fiyat (₺) *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          {/* Toplam */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Toplam</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" className="bg-gradient-primary text-white">
              {item ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
