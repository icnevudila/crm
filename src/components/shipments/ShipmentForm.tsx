'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  tracking: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).default('PENDING'),
  invoiceId: z.string().optional(),
  shippingCompany: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  deliveryAddress: z.string().optional(),
})

type ShipmentFormData = z.infer<typeof shipmentSchema>

interface ShipmentFormProps {
  shipment?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedShipment: any) => void | Promise<void>
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

export default function ShipmentForm({ shipment, open, onClose, onSuccess }: ShipmentFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
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
  const invoiceId = watch('invoiceId')

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
        // Yeni kayıt modu - form'u temizle
        reset({
          tracking: '',
          status: 'PENDING',
          invoiceId: '',
          shippingCompany: '',
          estimatedDelivery: '',
          deliveryAddress: '',
        })
      }
    }
  }, [shipment, open, reset])

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
      alert(error?.message || 'Kaydetme işlemi başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {shipment ? 'Sevkiyat Düzenle' : 'Yeni Sevkiyat'}
          </DialogTitle>
          <DialogDescription>
            {shipment ? 'Sevkiyat bilgilerini güncelleyin' : 'Yeni sevkiyat oluşturun'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fatura</label>
              <Select
                value={invoiceId || ''}
                onValueChange={(value) => setValue('invoiceId', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fatura seçin" />
                </SelectTrigger>
                <SelectContent>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {/* Shipping Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kargo Firması</label>
              <Input
                {...register('shippingCompany')}
                placeholder="Örn: Yurtiçi Kargo, Aras Kargo"
                disabled={loading}
              />
            </div>

            {/* Estimated Delivery */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tahmini Teslimat Tarihi</label>
              <Input
                type="date"
                {...register('estimatedDelivery')}
                disabled={loading}
              />
            </div>

            {/* Delivery Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Teslimat Adresi</label>
              <Textarea
                {...register('deliveryAddress')}
                placeholder="Tam teslimat adresi"
                rows={3}
                disabled={loading}
              />
            </div>
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
              {loading ? 'Kaydediliyor...' : shipment ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
