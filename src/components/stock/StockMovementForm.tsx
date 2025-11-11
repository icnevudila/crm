'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react'
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

const stockMovementSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN']),
  quantity: z.number().min(0.01, 'Miktar 0\'dan büyük olmalı'),
  reason: z.string().optional(),
  notes: z.string().optional(),
  relatedTo: z.string().optional(),
  relatedId: z.string().optional(),
})

type StockMovementFormData = z.infer<typeof stockMovementSchema>

interface StockMovementFormProps {
  productId: string
  productName: string
  currentStock: number
  type?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function StockMovementForm({
  productId,
  productName,
  currentStock,
  type,
  open,
  onClose,
  onSuccess,
}: StockMovementFormProps) {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      type: type || 'IN',
      quantity: 0,
      reason: '',
      notes: '',
      relatedTo: '',
      relatedId: '',
    },
  })

  const movementType = watch('type')
  const quantity = watch('quantity') || 0

  // Modal açıldığında form'u sıfırla
  useEffect(() => {
    if (open) {
      reset({
        type: type || 'IN',
        quantity: 0,
        reason: '',
        notes: '',
        relatedTo: '',
        relatedId: '',
      })
    }
  }, [open, type, reset])

  // Yeni stok miktarını hesapla
  const calculateNewStock = () => {
    const qty = parseFloat(quantity.toString()) || 0
    if (movementType === 'IN' || movementType === 'RETURN') {
      return currentStock + qty
    } else if (movementType === 'OUT') {
      return currentStock - qty
    } else if (movementType === 'ADJUSTMENT') {
      return qty
    }
    return currentStock
  }

  const newStock = calculateNewStock()

  const onSubmit = async (data: StockMovementFormData) => {
    setLoading(true)
    try {
      const res = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          type: data.type,
          quantity: data.type === 'ADJUSTMENT' ? newStock : data.quantity,
          reason: data.reason || 'MANUEL',
          notes: data.notes || '',
          relatedTo: data.relatedTo || null,
          relatedId: data.relatedId || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Stok hareketi kaydedilemedi')
      }

      if (onSuccess) {
        onSuccess()
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Stok hareketi kaydedilemedi', error?.message)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'ADJUSTMENT':
        return <Minus className="h-4 w-4 text-yellow-600" />
      case 'RETURN':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IN':
        return 'Giriş'
      case 'OUT':
        return 'Çıkış'
      case 'ADJUSTMENT':
        return 'Düzeltme'
      case 'RETURN':
        return 'İade'
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type ? `Yeni ${getTypeLabel(type)}` : 'Yeni Stok Hareketi'}
          </DialogTitle>
          <DialogDescription>
            {productName} için stok hareketi ekleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Mevcut Stok Bilgisi */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Mevcut Stok</p>
            <p className="text-2xl font-bold text-gray-900">{currentStock}</p>
          </div>

          {/* Hareket Tipi */}
          {!type && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hareket Tipi *</label>
              <Select
                value={movementType}
                onValueChange={(value) => setValue('type', value as 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hareket tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Giriş
                    </div>
                  </SelectItem>
                  <SelectItem value="OUT">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Çıkış
                    </div>
                  </SelectItem>
                  <SelectItem value="ADJUSTMENT">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-yellow-600" />
                      Düzeltme
                    </div>
                  </SelectItem>
                  <SelectItem value="RETURN">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-blue-600" />
                      İade
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
          )}

          {/* Miktar */}
          {movementType === 'ADJUSTMENT' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Yeni Stok Miktarı *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="Yeni stok miktarını girin"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Mevcut stok: {currentStock} → Yeni stok: {newStock}
              </p>
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Miktar *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="Miktar girin"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Mevcut stok: {currentStock} → Yeni stok: {newStock}
              </p>
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>
          )}

          {/* Sebep */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sebep</label>
            <Select
              value={watch('reason') || 'MANUEL'}
              onValueChange={(value) => setValue('reason', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sebep seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUEL">Manuel</SelectItem>
                <SelectItem value="SATIS">Satış</SelectItem>
                <SelectItem value="ALIS">Alış</SelectItem>
                <SelectItem value="DÜZELTME">Düzeltme</SelectItem>
                <SelectItem value="IADE">İade</SelectItem>
                <SelectItem value="SEVKIYAT">Sevkiyat</SelectItem>
                <SelectItem value="TEDARIKCI">Tedarikçi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notlar</label>
            <Textarea
              {...register('notes')}
              placeholder="Stok hareketi hakkında notlar..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* İlişkili Tablo (Opsiyonel) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">İlişkili Tablo</label>
              <Select
                value={watch('relatedTo') || 'none'}
                onValueChange={(value) => setValue('relatedTo', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seçin (Opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Yok</SelectItem>
                  <SelectItem value="Invoice">Fatura</SelectItem>
                  <SelectItem value="Quote">Teklif</SelectItem>
                  <SelectItem value="Shipment">Sevkiyat</SelectItem>
                  <SelectItem value="Vendor">Tedarikçi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watch('relatedTo') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">İlişkili ID</label>
                <Input
                  {...register('relatedId')}
                  placeholder="ID girin"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              disabled={loading}
              className="bg-gradient-primary text-white"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

