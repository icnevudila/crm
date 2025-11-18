'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
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

const shipmentSchema = z.object({
  tracking: z.string().max(100, 'Takip numarası en fazla 100 karakter olabilir').optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).default('PENDING'),
  invoiceId: z.string().min(1, 'Fatura seçimi zorunludur'),
  shippingCompany: z.string().max(200, 'Kargo firması en fazla 200 karakter olabilir').optional(),
  estimatedDelivery: z.string().optional(),
  deliveryAddress: z.string().max(500, 'Teslimat adresi en fazla 500 karakter olabilir').optional(),
}).refine((data) => {
  // estimatedDelivery geçmiş tarih olamaz
  if (data.estimatedDelivery) {
    const estimated = new Date(data.estimatedDelivery)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return estimated >= today
  }
  return true
}, {
  message: 'Tahmini teslimat tarihi geçmiş bir tarih olamaz',
  path: ['estimatedDelivery'],
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
  customerCompanyId?: string
  shipment?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedShipment: any) => void | Promise<void>
  invoiceId?: string // Prop olarak invoiceId geçilebilir (modal içinde kullanım için)
  skipDialog?: boolean // Wizard içinde kullanım için Dialog wrapper'ı atla
}

async function fetchInvoices() {
  // Sevkiyat için uygun faturaları getir:
  // - Sadece SALES tipindeki faturalar
  // - Daha önce sevkiyat kaydı olmayan faturalar
  const res = await fetch('/api/invoices/available-for-shipment')
  if (!res.ok) throw new Error('Failed to fetch available invoices')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default function ShipmentForm({ shipment, open, onClose, onSuccess, invoiceId: invoiceIdProp, skipDialog = false }: ShipmentFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const invoiceIdFromUrl = searchParams.get('invoiceId') || undefined // URL'den invoiceId al
  
  // Prop öncelikli - prop varsa prop'u kullan, yoksa URL'den al
  const invoiceId = invoiceIdProp || invoiceIdFromUrl
  
  const [loading, setLoading] = useState(false)

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
    enabled: open,
  })

  // Güvenlik kontrolü - invoices her zaman array olmalı
  const invoices = Array.isArray(invoicesData) ? invoicesData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: shipment || {
      tracking: '',
      status: 'PENDING',
      invoiceId: '',
      shippingCompany: '',
      estimatedDelivery: '',
      deliveryAddress: '',
    },
  })

  const status = watch('status')
  const watchedInvoiceId = watch('invoiceId')
  
  // Durum bazlı koruma kontrolü - form alanlarını devre dışı bırakmak için
  const isProtected = shipment && shipment.status === 'DELIVERED'

  // Shipment prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (shipment) {
        // Düzenleme modu - shipment bilgilerini yükle
        // Tarih formatını düzelt
        let formattedEstimatedDelivery = ''
        if (shipment.estimatedDelivery) {
          const date = new Date(shipment.estimatedDelivery)
          if (!isNaN(date.getTime())) {
            formattedEstimatedDelivery = date.toISOString().split('T')[0]
          }
        }
        
        reset({
          tracking: shipment.tracking || '',
          status: shipment.status || 'PENDING',
          invoiceId: shipment.invoiceId || '',
          shippingCompany: shipment.shippingCompany || '',
          estimatedDelivery: formattedEstimatedDelivery,
          deliveryAddress: shipment.deliveryAddress || '',
        })
      } else {
        // Yeni kayıt modu - form'u temizle (invoiceId prop'u varsa kullan)
        reset({
          tracking: '',
          status: 'PENDING',
          invoiceId: invoiceId || '',
          shippingCompany: '',
          estimatedDelivery: '',
          deliveryAddress: '',
        })
      }
    }
  }, [shipment, open, reset, invoiceId])

  const mutation = useMutation({
    mutationFn: async (data: ShipmentFormData) => {
      const url = shipment ? `/api/shipments/${shipment.id}` : '/api/shipments'
      const method = shipment ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save shipment')
      }

      return res.json()
    },
    onSuccess: (savedShipment) => {
      // Toast mesajı göster
      if (shipment) {
        toast.success('Sevkiyat güncellendi', { description: `"${savedShipment.tracking || 'Sevkiyat'}" başarıyla güncellendi.` })
      } else {
        // Yeni shipment oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('shipment', savedShipment.id, savedShipment.tracking || 'Sevkiyat')
      }
      
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedShipment)
      }
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: ShipmentFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Kaydedilemedi', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-4">
      {!skipDialog && (
        <DialogHeader>
          <DialogTitle>
            {shipment ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat'}
          </DialogTitle>
          <DialogDescription>
            {shipment ? 'Sevkiyat bilgilerini güncelleyin' : 'Yeni sevkiyat oluşturun'}
          </DialogDescription>
        </DialogHeader>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ÖNEMLİ: Durum bazlı koruma bilgilendirmeleri */}
          {shipment && shipment.status === 'DELIVERED' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-sm text-green-800 font-semibold">
                🔒 Bu sevkiyat teslim edildi. Sevkiyat bilgileri değiştirilemez veya silinemez.
              </p>
            </div>
          )}
          
          {/* Durum bazlı form devre dışı bırakma */}
          {isProtected && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-xs text-gray-600">
                ⚠️ Bu sevkiyat korumalı durumda olduğu için form alanları düzenlenemez.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura</label>
              <Select
                value={watchedInvoiceId || 'none'}
                onValueChange={(value) => setValue('invoiceId', value === 'none' ? '' : value)}
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fatura seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fatura seçilmedi</SelectItem>
                  {invoices.map((invoice: any) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue('status', value as ShipmentFormData['status'])
                }
                disabled={loading || isProtected}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Taslak</SelectItem>
                  <SelectItem value="PENDING">Beklemede</SelectItem>
                  <SelectItem value="APPROVED">Onaylı</SelectItem>
                  <SelectItem value="IN_TRANSIT">Yolda</SelectItem>
                  <SelectItem value="DELIVERED">Teslim Edildi</SelectItem>
                  <SelectItem value="CANCELLED">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tracking */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Takip Numarası</label>
              <Input
                {...register('tracking')}
                placeholder="TRK-123456789"
                disabled={loading || isProtected}
              />
            </div>

            {/* Shipping Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kargo Firması</label>
              <Input
                {...register('shippingCompany')}
                placeholder="Örn: Yurtiçi Kargo, Aras Kargo"
                disabled={loading || isProtected}
              />
            </div>

            {/* Estimated Delivery */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahmini Teslimat Tarihi</label>
              <Input
                type="date"
                {...register('estimatedDelivery')}
                disabled={loading || isProtected}
              />
            </div>

            {/* Delivery Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Teslimat Adresi</label>
              <Textarea
                {...register('deliveryAddress')}
                placeholder="Tam teslimat adresi"
                rows={3}
                disabled={loading || isProtected}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isProtected}
              className="w-full sm:w-auto"
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
              disabled={loading || isProtected}
              loading={loading}
            >
              {loading ? 'Kaydediliyor...' : shipment ? (isProtected ? 'Değiştirilemez' : 'Güncelle') : 'Kaydet'}
            </Button>
          </div>
        </form>
    </div>
  )

  if (skipDialog) {
    return formContent
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
