'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Package } from 'lucide-react'
import { toast } from '@/lib/toast'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
import { handleFormValidationErrors } from '@/lib/form-validation'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
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

interface InvoiceFormProps {
  invoice?: any
  open: boolean
  onClose: () => void
  onSuccess?: (newInvoice: any) => void
  customerCompanyId?: string
  customerCompanyName?: string
  customerId?: string
  quoteId?: string // Prop olarak quoteId geçilebilir (modal içinde kullanım için)
  quote?: any // ✅ ÇÖZÜM: Quote objesi direkt geçilebilir (API çağrısı yapmadan)
  skipDialog?: boolean // Wizard içinde kullanım için Dialog wrapper'ı atla
  defaultInvoiceType?: 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE' // Varsayılan fatura tipi (Satın Alma modülünden açıldığında PURCHASE)
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

export default function InvoiceForm({
  invoice,
  open,
  onClose,
  onSuccess,
  customerCompanyId: customerCompanyIdProp,
  customerCompanyName,
  customerId: customerIdProp,
  quoteId: quoteIdProp,
  quote: quoteProp, // ✅ ÇÖZÜM: Quote objesi direkt geçilebilir
  skipDialog = false,
  defaultInvoiceType,
}: InvoiceFormProps) {
  const t = useTranslations('invoices.form')
  const tCommon = useTranslations('common.form')
  const router = useRouter()
  const queryClient = useQueryClient()
  const navigateToDetailToast = useNavigateToDetailToast()
  const searchParams = useSearchParams()
  const searchCustomerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const customerCompanyId = customerCompanyIdProp || searchCustomerCompanyId
  const [loading, setLoading] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [itemFormOpen, setItemFormOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [serviceSubtotal, setServiceSubtotal] = useState<number>(0) // Hizmet faturaları için KDV hariç tutar
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationModalType, setAutomationModalType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [automationModalOptions, setAutomationModalOptions] = useState<any>(null)

  // Schema'yı component içinde oluştur - locale desteği için
  const invoiceSchema = z.object({
    title: z.string().min(1, tCommon('titleRequired')).max(200, tCommon('titleMaxLength', { max: 200 })),
    status: z.enum(['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
    total: z.number().min(0.01, t('totalMin')).max(999999999, tCommon('amountMax')).refine((val) => val > 0, {
      message: 'Fatura tutarı 0 olamaz. Lütfen geçerli bir tutar girin.',
    }),
    invoiceType: z.enum(['SALES', 'PURCHASE', 'SERVICE_SALES', 'SERVICE_PURCHASE']).default('SALES'), // SALES (Satış), PURCHASE (Alış), SERVICE_SALES (Hizmet Satış), SERVICE_PURCHASE (Hizmet Alım)
    serviceDescription: z.string().max(1000, t('serviceDescriptionMaxLength')).optional(), // Hizmet faturaları için hizmet açıklaması
    customerId: z.string().optional(),
    quoteId: z.string().optional(),
    vendorId: z.string().optional(),
    customerCompanyId: z.string().optional(), // Firma bazlı ilişki
    invoiceNumber: z.string().max(50, t('invoiceNumberMaxLength')).optional(),
    dueDate: z.string().optional(),
    paymentDate: z.string().optional(),
    taxRate: z.number().min(0, t('taxRateRange')).max(100, t('taxRateRange')).optional(),
    billingAddress: z.string().max(500, t('billingAddressMaxLength')).optional(),
    billingCity: z.string().max(100, t('billingCityMaxLength')).optional(),
    billingTaxNumber: z.string().max(50, t('billingTaxNumberMaxLength')).optional(),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER']).optional(),
    paymentNotes: z.string().max(500, t('paymentNotesMaxLength')).optional(),
    description: z.string().max(2000, t('descriptionMaxLength')).optional(),
  })
    .refine((data) => {
      // PURCHASE veya SERVICE_PURCHASE faturası için tedarikçi zorunlu
      if (data.invoiceType === 'PURCHASE' || data.invoiceType === 'SERVICE_PURCHASE') {
        return !!(data.vendorId && data.vendorId.trim() !== '')
      }
      // SALES veya SERVICE_SALES faturası için müşteri veya teklif zorunlu
      return !!(data.customerId && data.customerId.trim() !== '') || !!(data.quoteId && data.quoteId.trim() !== '')
    }, {
      message: 'Müşteri, Teklif veya Tedarikçi seçimi zorunludur',
      path: ['customerId'] // İlk alan olarak customerId gösterilir, ama mesaj genel
    })
    .refine((data) => {
      // SALES veya SERVICE_SALES faturası için müşteri zorunlu
      if ((data.invoiceType === 'SALES' || data.invoiceType === 'SERVICE_SALES') && !data.customerId) {
        return false
      }
      return true
    }, {
      message: t('customerRequired'),
      path: ['customerId'], // Hata mesajı customerId alanında gösterilir
    })
    .refine((data) => {
      // PURCHASE veya SERVICE_PURCHASE faturası için tedarikçi zorunlu
      if ((data.invoiceType === 'PURCHASE' || data.invoiceType === 'SERVICE_PURCHASE') && !data.vendorId) {
        return false
      }
      return true
    }, {
      message: t('vendorRequired'),
      path: ['vendorId'], // Hata mesajı vendorId alanında gösterilir
    })
    .refine((data) => {
      // Hizmet faturaları için hizmet açıklaması zorunlu
      if ((data.invoiceType === 'SERVICE_SALES' || data.invoiceType === 'SERVICE_PURCHASE') && (!data.serviceDescription || data.serviceDescription.trim() === '')) {
        return false
      }
      return true
    }, {
      message: t('serviceDescriptionRequired'),
      path: ['serviceDescription'], // Hata mesajı serviceDescription alanında gösterilir
    })

  type InvoiceFormData = z.infer<typeof invoiceSchema>

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
  // ✅ ÇÖZÜM: quoteProp varsa onu da quotes listesine ekle (dropdown'da görünsün)
  const allQuotes = quoteProp && !quotes.find((q: any) => q.id === quoteProp.id) 
    ? [quoteProp, ...quotes] 
    : quotes
  const customers = Array.isArray(customersData) ? customersData : []
  const filteredCustomers = customerCompanyId
    ? customers.filter((customer: any) => customer.customerCompanyId === customerCompanyId)
    : customers
  const filteredQuotes = customerCompanyId
    ? allQuotes.filter((quote: any) => quote.customerCompanyId === customerCompanyId)
    : allQuotes
  const vendors = Array.isArray(vendorsData) ? vendorsData : []
  const products = Array.isArray(productsData) ? productsData : []

  const formRef = useRef<HTMLFormElement>(null)
  
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
      invoiceType: invoice?.invoiceType || defaultInvoiceType || 'SALES', // Varsayılan fatura tipi (eğer invoice varsa onun tipini kullan, yoksa defaultInvoiceType, yoksa SALES)
      serviceDescription: '',
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
      customerCompanyId: customerCompanyId || '',
    },
  })

  const status = watch('status')
  const quoteId = watch('quoteId')
  const customerId = watch('customerId')
  const taxRate = watch('taxRate') || 18
  const invoiceType = watch('invoiceType') || 'SALES'
  const selectedCustomer = customers.find((c: any) => c.id === customerId)
  
  // ✅ AKILLI OTOMASYON: Müşteri seçildiğinde otomatik adres bilgilerini doldur
  useEffect(() => {
    if (selectedCustomer && !invoice && open) {
      // Sadece yeni kayıt modunda ve müşteri seçildiğinde otomatik doldur
      // Eğer alanlar zaten doluysa üzerine yazma (kullanıcı manuel girmiş olabilir)
      const currentBillingAddress = watch('billingAddress')
      const currentBillingCity = watch('billingCity')
      const currentBillingTaxNumber = watch('billingTaxNumber')
      
      if (!currentBillingAddress && selectedCustomer.address) {
        setValue('billingAddress', selectedCustomer.address, { shouldDirty: false })
      }
      if (!currentBillingCity && selectedCustomer.city) {
        setValue('billingCity', selectedCustomer.city, { shouldDirty: false })
      }
      if (!currentBillingTaxNumber && selectedCustomer.taxNumber) {
        setValue('billingTaxNumber', selectedCustomer.taxNumber, { shouldDirty: false })
      }
    }
  }, [selectedCustomer, invoice, open, setValue, watch])
  
  // ✅ ÇÖZÜM: quoteProp varsa onun id'sini kullan, yoksa quoteIdProp
  const effectiveQuoteId = quoteProp?.id || quoteIdProp
  
  // ✅ ÇÖZÜM: Quote bilgilerini çek (quoteProp varsa direkt kullan, yoksa API'den çek)
  const { data: quoteDataFromApi } = useQuery({
    queryKey: ['quote', effectiveQuoteId],
    queryFn: async () => {
      if (!effectiveQuoteId) return null
      const res = await fetch(`/api/quotes/${effectiveQuoteId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: open && !invoice && !!effectiveQuoteId && !quoteProp, // Sadece quoteProp yoksa API'den çek
  })
  
  // QuoteProp varsa onu kullan, yoksa API'den gelen datayı kullan
  const quoteData = quoteProp || quoteDataFromApi
  
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
        toast.warning(message.title, { description: message.description })
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: SHIPPED (Sevkiyatı Yapıldı) durumundaki faturalar düzenlenemez
      if (invoice && invoice.status === 'SHIPPED') {
        const statusName = translateStage(invoice.status, 'invoice')
        toast.warning(
          t('cannotEditShipped'),
          t('cannotEditShippedMessage')
        )
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: RECEIVED (Satın Alma Onaylandı) durumundaki faturalar düzenlenemez
      if (invoice && invoice.status === 'RECEIVED') {
        const statusName = translateStage(invoice.status, 'invoice')
        toast.warning(
          t('cannotEditReceived'),
          t('cannotEditReceivedMessage')
        )
        onClose() // Modal'ı kapat
        return
      }

      // ÖNEMLİ: Quote'tan oluşturulan faturalar düzenlenemez
      if (invoice && invoice.quoteId) {
        toast.warning(t('cannotEditFromQuote'), { description: t('cannotEditFromQuoteMessage') })
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
          invoiceType: invoice.invoiceType || 'SALES',
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
          serviceDescription: invoice.serviceDescription || '',
          customerCompanyId: invoice.customerCompanyId || customerCompanyId || '',
        })
        
        // Hizmet faturası ise serviceSubtotal'i hesapla
        if (invoice.invoiceType === 'SERVICE_SALES' || invoice.invoiceType === 'SERVICE_PURCHASE') {
          const total = invoice.total || 0
          const taxRate = invoice.taxRate || 18
          const subtotal = total / (1 + (taxRate / 100))
          setServiceSubtotal(subtotal)
        } else {
          setServiceSubtotal(0)
        }
      } else if (quoteProp) {
        // ✅ ÖNEMLİ: quoteProp öncelikli (direkt geçilen quote objesi) - API çağrısı yapmadan
        const quote = quoteProp
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30) // 30 gün sonra
        
        reset({
          title: quote.title ? `Fatura - ${quote.title}` : '',
          status: 'DRAFT',
          total: typeof quote.total === 'string' ? parseFloat(quote.total) || 0 : (quote.total || 0),
          invoiceType: 'SALES',
          customerId: quote.customerId || customerIdProp || '',
          quoteId: quote.id || effectiveQuoteId, // ✅ quoteProp.id öncelikli
          vendorId: quote.vendorId || '',
          invoiceNumber: '',
          dueDate: dueDate.toISOString().split('T')[0],
          paymentDate: '',
          taxRate: quote.taxRate || 18,
          billingAddress: '',
          billingCity: '',
          billingTaxNumber: '',
          paymentMethod: undefined,
          paymentNotes: '',
          description: quote.description || '',
          serviceDescription: '',
          customerCompanyId: quote.customerCompanyId || customerCompanyId || '',
        })
        
        // Quote items'ları invoice items'a çevir
        if (quote.QuoteItem && Array.isArray(quote.QuoteItem)) {
          setInvoiceItems(
            quote.QuoteItem.map((item: any) => ({
              id: `temp-${Date.now()}-${Math.random()}`,
              productId: item.productId || '',
              productName: item.Product?.name || item.productName || '',
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              total: (item.quantity || 0) * (item.unitPrice || 0),
            }))
          )
        } else {
          setInvoiceItems([])
        }
        setServiceSubtotal(0)
      } else if (effectiveQuoteId && quoteData) {
        // Yeni kayıt modu - quoteIdProp varsa ve quote bilgileri API'den yüklendiyse forma yansıt
        const quote = quoteData
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30) // 30 gün sonra
        
        reset({
          title: quote.title ? `Fatura - ${quote.title}` : '',
          status: 'DRAFT',
          total: typeof quote.total === 'string' ? parseFloat(quote.total) || 0 : (quote.total || 0),
          invoiceType: 'SALES',
          customerId: quote.customerId || customerIdProp || '',
          quoteId: effectiveQuoteId,
          vendorId: quote.vendorId || '',
          invoiceNumber: '',
          dueDate: dueDate.toISOString().split('T')[0],
          paymentDate: '',
          taxRate: quote.taxRate || 18,
          billingAddress: '',
          billingCity: '',
          billingTaxNumber: '',
          paymentMethod: undefined,
          paymentNotes: '',
          description: quote.description || '',
          serviceDescription: '',
          customerCompanyId: quote.customerCompanyId || customerCompanyId || '',
        })
        
        // Quote items'ları invoice items'a çevir
        if (quote.QuoteItem && Array.isArray(quote.QuoteItem)) {
          setInvoiceItems(
            quote.QuoteItem.map((item: any) => ({
              id: `temp-${Date.now()}-${Math.random()}`,
              productId: item.productId || '',
              productName: item.Product?.name || item.productName || '',
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || 0,
              total: (item.quantity || 0) * (item.unitPrice || 0),
            }))
          )
        } else {
          setInvoiceItems([])
        }
        setServiceSubtotal(0)
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          title: '',
          status: 'DRAFT',
          total: 0,
          invoiceType: defaultInvoiceType || 'SALES', // Varsayılan: defaultInvoiceType varsa onu kullan, yoksa Satış faturası
          customerId: customerIdProp || '',
          quoteId: quoteIdProp || '',
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
          serviceDescription: '',
          customerCompanyId: customerCompanyId || '',
        })
        setInvoiceItems([])
        setServiceSubtotal(0)
        if (customerIdProp) {
          setValue('customerId', customerIdProp)
        }
        if (effectiveQuoteId) {
          setValue('quoteId', effectiveQuoteId)
        }
      }
    }
  }, [invoice?.id, open, quoteProp?.id]) // ✅ ÇÖZÜM: Sadece invoice ID, open ve quoteProp ID değiştiğinde reset et - diğer dependency'ler ayrı useEffect'lerde

  // ✅ ÇÖZÜM: Quote bilgileri geldiğinde form'u güncelle (ayrı useEffect)
  useEffect(() => {
    if (open && !invoice && quoteData && !quoteProp) {
      // Quote'tan fatura oluşturuluyorsa bilgileri doldur
      if (quoteData.customerId) {
        setValue('customerId', quoteData.customerId)
      }
      if (quoteData.customerCompanyId) {
        setValue('customerCompanyId', quoteData.customerCompanyId)
      }
      if (quoteData.id) {
        setValue('quoteId', quoteData.id)
      }
    }
  }, [open, invoice, quoteData, quoteProp, setValue])

  // ✅ ÇÖZÜM: CustomerCompanyId prop geldiğinde set et (ayrı useEffect)
  useEffect(() => {
    if (open && !invoice && customerCompanyId && !watch('customerCompanyId')) {
      setValue('customerCompanyId', customerCompanyId)
    }
  }, [open, invoice, customerCompanyId, setValue, watch])

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
    const invoiceType = watch('invoiceType')
    const taxRate = watch('taxRate') || 18
    
    // Hizmet faturaları için serviceSubtotal kullan
    if (invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') {
      const kdv = serviceSubtotal * (taxRate / 100)
      const total = serviceSubtotal + kdv
      setValue('total', total)
    } else {
      // Ürünlü faturalar için invoiceItems kullan
      const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0)
      const kdv = subtotal * (taxRate / 100)
      const total = subtotal + kdv
      setValue('total', total)
    }
  }, [invoiceItems, serviceSubtotal, setValue, watch])

  useEffect(() => {
    updateTotal()
  }, [updateTotal])

  // Hizmet faturalarında subtotal veya KDV değişince total'i güncelle
  useEffect(() => {
    const invoiceType = watch('invoiceType')
    if (invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') {
      updateTotal()
    }
  }, [serviceSubtotal, watch('taxRate'), watch('invoiceType'), updateTotal])

  // Müşteri seçilince otomatik doldur
  const handleCustomerChange = (customerId: string) => {
    setValue('customerId', customerId)
    const customer = filteredCustomers.find((c: any) => c.id === customerId)
    if (customer) {
      if (customer.address) setValue('billingAddress', customer.address)
      if (customer.city) setValue('billingCity', customer.city)
      if (customer.taxNumber) setValue('billingTaxNumber', customer.taxNumber)
    }
  }

  useEffect(() => {
    if (open && !invoice && filteredCustomers.length === 1 && !customerId) {
      const customer = filteredCustomers[0]
      setValue('customerId', customer.id)
      if (customer.address) setValue('billingAddress', customer.address)
      if (customer.city) setValue('billingCity', customer.city)
      if (customer.taxNumber) setValue('billingTaxNumber', customer.taxNumber)
    }
  }, [open, invoice, filteredCustomers, customerId, setValue])

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
            t('itemsSaveWarningTitle'),
            itemError?.message || t('itemsSaveWarningMessage')
          )
        }
      }
      
      return result
    },
    onSuccess: async (result) => {
      // Toast mesajı göster
      if (invoice) {
        toast.success(t('invoiceUpdated'), { description: t('invoiceUpdatedMessage', { title: result.title }) })
      } else {
        const message = customerCompanyName 
          ? t('invoiceCreatedMessageWithCompany', { company: customerCompanyName, title: result.title })
          : t('invoiceCreatedMessage', { title: result.title })
        // Yeni invoice oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('invoice', result.id, result.title)
      }
      
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
      // CRITICAL FIX: onSuccess'i önce çağır, sonra form'u kapat
      // onSuccess içinde onClose çağrılmamalı - form zaten kendi içinde onClose çağırıyor
      if (onSuccess) {
        await onSuccess(result)
      }
      
      // ✅ Otomasyon: Invoice oluşturulduğunda email gönder (kullanıcı tercihine göre)
      if (!invoice && result.customerId) {
        try {
          // Customer bilgisini çek
          const customerRes = await fetch(`/api/customers/${result.customerId}`)
          if (customerRes.ok) {
            const customer = await customerRes.json()
            if (customer?.email) {
              // Automation API'yi kontrol et
              const automationRes = await fetch('/api/automations/invoice-created-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice: result }),
              })
              
              if (automationRes.ok) {
                const automationData = await automationRes.json()
                if (automationData.shouldAsk) {
                  // Kullanıcıya sor (modal aç)
                  setAutomationModalType('email')
                  setAutomationModalOptions({
                    entityType: 'INVOICE',
                    entityId: result.id,
                    entityTitle: result.title,
                    customerEmail: customer.email,
                    customerPhone: customer.phone,
                    customerName: customer.name,
                    defaultSubject: `Fatura: ${result.title}`,
                    defaultMessage: `Merhaba ${customer.name},\n\nYeni fatura oluşturuldu: ${result.title}\n\nTutar: ${result.total ? `₺${result.total.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}\nDurum: ${result.status || 'DRAFT'}\n\nDetayları görüntülemek için lütfen bizimle iletişime geçin.`,
                    defaultHtml: `<p>Merhaba ${customer.name},</p><p>Yeni fatura oluşturuldu: <strong>${result.title}</strong></p><p>Tutar: ${result.total ? `₺${result.total.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p><p>Durum: ${result.status || 'DRAFT'}</p>`,
                    onSent: () => {
                      toast.success('E-posta gönderildi', { description: 'Müşteriye invoice bilgisi gönderildi' })
                    },
                    onAlwaysSend: async () => {
                      await fetch('/api/automations/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          automationType: 'emailOnInvoiceCreated',
                          preference: 'ALWAYS',
                        }),
                      })
                    },
                    onNeverSend: async () => {
                      await fetch('/api/automations/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          automationType: 'emailOnInvoiceCreated',
                          preference: 'NEVER',
                        }),
                      })
                    },
                  })
                  setAutomationModalOpen(true)
                }
              }
            }
          }
        } catch (error) {
          // Automation hatası ana işlemi engellemez
          console.error('Invoice automation error:', error)
        }
      }
      
      reset()
      setInvoiceItems([]) // InvoiceItem'ları temizle
      // Form'u kapat - onSuccess callback'inden SONRA (sonsuz döngü önleme)
      onClose()
    },
  })

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const onSubmit = async (data: InvoiceFormData) => {
    // ÖNEMLİ: SHIPPED durumundaki faturalar düzenlenemez
    if (invoice && invoice.status === 'SHIPPED') {
      toast.warning('Bu fatura gönderildiği için düzenleyemezsiniz', { description: 'Sevkiyat onaylandıktan sonra fatura değiştirilemez.' })
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
        serviceDescription: data.serviceDescription && data.serviceDescription.trim() !== '' ? data.serviceDescription.trim() : undefined,
        invoiceType: data.invoiceType, // invoiceType'ı açıkça ekle
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

  const formContent = (
    <div className="space-y-4">
      {!skipDialog && (
        <DialogHeader>
          <DialogTitle>
            {invoice ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {invoice ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>
      )}

      <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          {customerCompanyId && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-700">
              <p className="font-semibold">
                {t('companyLabel')}: {customerCompanyName || t('selectedCompany')}
              </p>
              <p>
                {filteredCustomers.length > 0
                  ? t('customersCount', { count: filteredCustomers.length })
                  : t('noCustomersFoundMessage')}
              </p>
            </div>
          )}
          <input type="hidden" {...register('customerCompanyId')} />
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {invoice && invoice.status === 'PAID' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-800 font-semibold">
                {t('paidWarning')}
              </p>
            </div>
          )}
          {invoice && invoice.status === 'SHIPPED' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                {t('shippedWarning')}
              </p>
            </div>
          )}
          {invoice && invoice.status === 'RECEIVED' && (
            <div className="bg-teal-50 border border-teal-200 rounded-md p-4 mb-4">
              <p className="text-sm text-teal-800 font-semibold">
                {t('receivedWarning')}
              </p>
            </div>
          )}
          {invoice && invoice.quoteId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
              <p className="text-sm text-indigo-800 font-semibold">
                {t('fromQuoteWarning')}
              </p>
            </div>
          )}
          
          {/* Durum bazlı form devre dışı bırakma */}
          {(invoice?.status === 'PAID' || invoice?.status === 'SHIPPED' || invoice?.status === 'RECEIVED' || invoice?.quoteId) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-600">
                {t('protectedWarning')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('titleLabel')} *</label>
              <Input
                {...register('title')}
                placeholder={t('titlePlaceholder')}
                disabled={loading || isProtected}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('invoiceNumberLabel')}</label>
              <Input
                {...register('invoiceNumber')}
                placeholder={t('invoiceNumberPlaceholder')}
                disabled={loading || isProtected}
              />
              <p className="text-xs text-gray-500">
                {t('invoiceNumberHint')}
              </p>
            </div>

            {/* Invoice Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('invoiceTypeLabel')}</label>
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
                      setServiceSubtotal(0) // Hizmet faturası değiştiğinde tutarı sıfırla
                    }
                  } else {
                    // Satış faturası - tedarikçi seçimini kaldır, müşteri seçimi aktif
                    setValue('vendorId', undefined)
                    if (value === 'SERVICE_SALES') {
                      setInvoiceItems([]) // Hizmet faturalarında ürün listesi temizlenir
                      setServiceSubtotal(0) // Hizmet faturası değiştiğinde tutarı sıfırla
                    }
                  }
                  // Ürünlü faturaya geçildiğinde serviceSubtotal'i sıfırla
                  if (value === 'SALES' || value === 'PURCHASE') {
                    setServiceSubtotal(0)
                  }
                }}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('invoiceTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SALES">{t('invoiceTypeSales')}</SelectItem>
                  <SelectItem value="PURCHASE">{t('invoiceTypePurchase')}</SelectItem>
                  <SelectItem value="SERVICE_SALES">{t('invoiceTypeServiceSales')}</SelectItem>
                  <SelectItem value="SERVICE_PURCHASE">{t('invoiceTypeServicePurchase')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Customer (Satış ve Hizmet Satış Faturaları için) */}
            {(watch('invoiceType') === 'SALES' || watch('invoiceType') === 'SERVICE_SALES') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('customerLabel')} *</label>
                <Select
                  value={customerId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setValue('customerId', undefined)
                    } else {
                      handleCustomerChange(value)
                    }
                  }}
                  disabled={loading || isProtected || filteredCustomers.length === 0}
                >
                  <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('customerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCustomers.length === 0 ? (
                      <SelectItem value="none" disabled>{t('noCustomersFound')}</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="none">{tCommon('notSelected')}</SelectItem>
                        {filteredCustomers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} {customer.email && `(${customer.email})`}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.customerId && (
                  <p className="text-sm text-red-600">{errors.customerId.message}</p>
                )}
              </div>
            )}

            {/* Quote */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('quoteLabel')}</label>
              <Select
                value={quoteId || 'none'}
                onValueChange={(value) => setValue('quoteId', value === 'none' ? undefined : value)}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('quotePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCommon('none')}</SelectItem>
                  {filteredQuotes
                    .filter((quote: any) => quote.status === 'ACCEPTED')
                    .map((quote: any) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.title} - {quote.total} ₺
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vendor (Alış ve Hizmet Alım Faturaları için) */}
            {(watch('invoiceType') === 'PURCHASE' || watch('invoiceType') === 'SERVICE_PURCHASE') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('vendorLabel')} *</label>
                <Select
                  value={watch('vendorId') || 'none'}
                  onValueChange={(value) => setValue('vendorId', value === 'none' ? undefined : value)}
                  disabled={loading || isProtected}
                >
                  <SelectTrigger className={errors.vendorId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('vendorPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tCommon('notSelected')}</SelectItem>
                    {vendors.map((vendor: any) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendorId && (
                  <p className="text-sm text-red-600">{errors.vendorId.message}</p>
                )}
              </div>
            )}

            {/* Service Description (Hizmet Faturaları için) */}
            {(watch('invoiceType') === 'SERVICE_SALES' || watch('invoiceType') === 'SERVICE_PURCHASE') && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t('serviceDescriptionLabel')} *</label>
                <Textarea
                  {...register('serviceDescription')}
                  placeholder={t('serviceDescriptionPlaceholder')}
                  rows={4}
                  disabled={loading || isProtected}
                  className={errors.serviceDescription ? 'border-red-500' : ''}
                />
                {errors.serviceDescription && (
                  <p className="text-sm text-red-600">{errors.serviceDescription.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  {t('serviceDescriptionHint')}
                </p>
              </div>
            )}

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('taxRateLabel')}</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taxRate', { 
                  valueAsNumber: true,
                  onChange: () => updateTotal() // KDV değişince toplamı güncelle
                })}
                placeholder={t('taxRatePlaceholder')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Tutar (KDV Hariç) - Sadece Hizmet Faturaları için */}
            {(watch('invoiceType') === 'SERVICE_SALES' || watch('invoiceType') === 'SERVICE_PURCHASE') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('subtotalLabel')} *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceSubtotal}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    setServiceSubtotal(value)
                  }}
                  placeholder={t('subtotalPlaceholder')}
                  disabled={loading || isProtected}
                />
              </div>
            )}

            {/* Total (KDV Dahil) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('totalLabel')} *</label>
              <Input
                type="number"
                step="0.01"
                {...register('total', { valueAsNumber: true })}
                placeholder={t('totalPlaceholder')}
                disabled={loading || isProtected}
                readOnly // Her zaman otomatik hesaplanıyor
              />
              {errors.total && (
                <p className="text-sm text-red-600">{errors.total.message}</p>
              )}
              {(watch('invoiceType') === 'SALES' || watch('invoiceType') === 'PURCHASE') ? (
                <p className="text-xs text-gray-500">
                  KDV Hariç: {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0))} + 
                  KDV (%{watch('taxRate') || 18}): {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * ((watch('taxRate') || 18) / 100))} = 
                  KDV Dahil: {formatCurrency((invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * (1 + ((watch('taxRate') || 18) / 100))))}
                </p>
              ) : (watch('invoiceType') === 'SERVICE_SALES' || watch('invoiceType') === 'SERVICE_PURCHASE') ? (
                <p className="text-xs text-gray-500">
                  {serviceSubtotal > 0 ? (
                    <>
                      KDV Hariç: {formatCurrency(serviceSubtotal)} + 
                      KDV (%{watch('taxRate') || 18}): {formatCurrency(serviceSubtotal * ((watch('taxRate') || 18) / 100))} = 
                      KDV Dahil: {formatCurrency(serviceSubtotal * (1 + ((watch('taxRate') || 18) / 100)))}
                    </>
                  ) : (
                    'Tutar (KDV hariç) girin, toplam otomatik hesaplanacaktır.'
                  )}
                </p>
              ) : null}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dueDateLabel')}</label>
              <Input
                type="date"
                {...register('dueDate')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Payment Date */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('paymentDateLabel')}</label>
                <Input
                  type="date"
                  {...register('paymentDate')}
                  disabled={loading || isProtected}
                />
              </div>
            )}

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('statusLabel')}</label>
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
                  <SelectItem value="DRAFT">{tCommon('statusDraft')}</SelectItem>
                  <SelectItem value="SENT">{tCommon('statusSent')}</SelectItem>
                  <SelectItem value="SHIPPED">{tCommon('statusShipped')}</SelectItem>
                  <SelectItem value="RECEIVED">{tCommon('statusReceived')}</SelectItem>
                  <SelectItem value="PAID">{tCommon('statusPaid')}</SelectItem>
                  <SelectItem value="OVERDUE">{tCommon('statusOverdue')}</SelectItem>
                  <SelectItem value="CANCELLED">{tCommon('statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billing Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t('billingAddressLabel')}</label>
              <Textarea
                {...register('billingAddress')}
                placeholder={t('billingAddressPlaceholder')}
                rows={2}
                disabled={loading || isProtected}
              />
            </div>

            {/* Billing City */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('billingCityLabel')}</label>
              <Input
                {...register('billingCity')}
                placeholder={t('billingCityPlaceholder')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Billing Tax Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('billingTaxNumberLabel')}</label>
              <Input
                {...register('billingTaxNumber')}
                placeholder={t('billingTaxNumberPlaceholder')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Payment Method */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('paymentMethodLabel')}</label>
                <Select
                  value={watch('paymentMethod') || 'none'}
                  onValueChange={(value) => setValue('paymentMethod', value === 'none' ? undefined : value as any)}
                  disabled={loading || isProtected}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('paymentMethodPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tCommon('notSelected')}</SelectItem>
                    <SelectItem value="CASH">{t('paymentMethodCash')}</SelectItem>
                    <SelectItem value="BANK_TRANSFER">{t('paymentMethodBankTransfer')}</SelectItem>
                    <SelectItem value="CHECK">{t('paymentMethodCheck')}</SelectItem>
                    <SelectItem value="CREDIT_CARD">{t('paymentMethodCreditCard')}</SelectItem>
                    <SelectItem value="OTHER">{t('paymentMethodOther')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Notes */}
            {status === 'PAID' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('paymentNotesLabel')}</label>
                <Input
                  {...register('paymentNotes')}
                  placeholder={t('paymentNotesPlaceholder')}
                  disabled={loading || isProtected}
                />
              </div>
            )}

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
          </div>

          {/* Invoice Items Section - Sadece Ürünlü Faturalar için */}
          {(watch('invoiceType') === 'SALES' || watch('invoiceType') === 'PURCHASE') && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('itemsSectionTitle')}
                {(watch('invoiceType') === 'SALES' || watch('invoiceType') === 'PURCHASE') && (
                  <span className="text-red-500">*</span>
                )}
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
                {t('addProduct')}
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
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">{t('productRequiredTitle')}</h4>
                  <p className="text-sm text-amber-700">
                    {t('purchaseProductRequiredMessage')}
                  </p>
                </div>
              </div>
            )}

            {/* ÖNEMLİ: Satış faturası için malzeme uyarısı */}
            {watch('invoiceType') === 'SALES' && invoiceItems.length === 0 && !invoice && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">{t('productRequiredTitle')}</h4>
                  <p className="text-sm text-amber-700">
                    {t('salesProductRequiredMessage')}
                  </p>
                </div>
              </div>
            )}

            {invoiceItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tableProduct')}</TableHead>
                      <TableHead>{t('tableQuantity')}</TableHead>
                      <TableHead>{t('tableUnitPrice')}</TableHead>
                      <TableHead className="text-right">{t('tableTotal')}</TableHead>
                      <TableHead className="text-right">{t('tableActions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.productName || products.find((p: any) => p.id === item.productId)?.name || t('productNotFound')}
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
                <div className="p-4 bg-gray-50 border-t">
                  <div className="flex justify-end gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{t('itemsSubtotal')}</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{t('itemsTax')} (%{taxRate})</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * (taxRate / 100))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{t('itemsTotal')}</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0) * (1 + (taxRate / 100)))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>{tCommon('noData')}</p>
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
                  {t('addProduct')}
                </Button>
              </div>
            )}
          </div>
          )}

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
              disabled={loading || isProtected}
            >
              {loading ? t('saving') : invoice ? (isProtected ? t('cannotEdit') : t('update')) : t('save')}
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
    </div>
  )

  // Automation Modal ve InvoiceItem Dialog - skipDialog durumunda render etme
  const dialogs = (
    <>
      {/* Automation Confirmation Modal */}
      {automationModalOpen && automationModalOptions && (
        <AutomationConfirmationModal
          type={automationModalType}
          options={automationModalOptions}
          open={automationModalOpen}
          onClose={() => {
            setAutomationModalOpen(false)
            setAutomationModalOptions(null)
          }}
        />
      )}
    </>
  )

  if (skipDialog) {
    return formContent
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {formContent}
        </DialogContent>
      </Dialog>
      {dialogs}
    </>
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
  const t = useTranslations('invoices.form')
  const tCommon = useTranslations('common.form')
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
        t('itemFormValidationTitle'),
        t('itemFormValidationMessage')
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
          <DialogTitle>{item ? t('itemEditTitle') : t('itemNewTitle')}</DialogTitle>
          <DialogDescription>
            {t('itemDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ürün Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('productLabel')} *</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t('productPlaceholder')} />
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
            <label className="text-sm font-medium">{t('quantityLabel')} *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              placeholder={t('quantityPlaceholder')}
            />
          </div>

          {/* Birim Fiyat */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('priceLabel')} *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              placeholder={t('pricePlaceholder')}
            />
          </div>

          {/* Toplam */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">{t('totalDisplay')}</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" className="bg-gradient-primary text-white">
              {item ? t('update') : tCommon('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
