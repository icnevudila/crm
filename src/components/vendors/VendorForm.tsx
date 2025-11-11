'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const vendorSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı gereklidir'),
  sector: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([
    z.string().email('Geçerli bir email adresi giriniz'),
    z.literal('')
  ]).optional(),
  website: z.union([
    z.string().url('Geçerli bir website adresi giriniz'),
    z.literal('')
  ]).optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type VendorFormData = z.infer<typeof vendorSchema>

interface VendorFormProps {
  vendor?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedVendor: any) => void // Cache güncelleme için callback - kaydedilen tedarikçiyi parametre olarak geçiyoruz
}

export default function VendorForm({
  vendor,
  open,
  onClose,
  onSuccess,
}: VendorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      sector: '',
      city: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      taxNumber: '',
      taxOffice: '',
      description: '',
      status: 'ACTIVE',
    },
  })

  // Vendor prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (vendor) {
        // Düzenleme modu - tedarikçi bilgilerini yükle
        reset({
          name: vendor.name || '',
          sector: vendor.sector || '',
          city: vendor.city || '',
          address: vendor.address || '',
          phone: vendor.phone || '',
          email: vendor.email || '',
          website: vendor.website || '',
          taxNumber: vendor.taxNumber || '',
          taxOffice: vendor.taxOffice || '',
          description: vendor.description || '',
          status: vendor.status || 'ACTIVE',
        })
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          name: '',
          sector: '',
          city: '',
          address: '',
          phone: '',
          email: '',
          website: '',
          taxNumber: '',
          taxOffice: '',
          description: '',
          status: 'ACTIVE',
        })
      }
    }
  }, [vendor, open, reset])

  const status = watch('status')

  const onSubmit = async (data: VendorFormData) => {
    setLoading(true)
    try {
      const url = vendor
        ? `/api/vendors/${vendor.id}`
        : '/api/vendors'
      const method = vendor ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save vendor')
      }

      const savedVendor = await res.json()
      
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedVendor)
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vendor ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}
          </DialogTitle>
          <DialogDescription>
            {vendor ? 'Tedarikçi bilgilerini güncelleyin' : 'Yeni tedarikçi ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Tedarikçi Adı *</label>
              <Input
                {...register('name')}
                placeholder="Tedarikçi adı"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Input
                {...register('sector')}
                placeholder="Örn: Sağlık, Gıda, Yazılım"
                disabled={loading}
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Şehir</label>
              <Input
                {...register('city')}
                placeholder="İstanbul"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefon</label>
              <Input
                {...register('phone')}
                placeholder="0555 123 45 67"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="info@tedarikci.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Website</label>
              <Input
                {...register('website')}
                placeholder="https://www.tedarikci.com"
                disabled={loading}
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            {/* Tax Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi No</label>
              <Input
                {...register('taxNumber')}
                placeholder="1234567890"
                disabled={loading}
              />
            </div>

            {/* Tax Office */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi Dairesi</label>
              <Input
                {...register('taxOffice')}
                placeholder="Kadıköy Vergi Dairesi"
                disabled={loading}
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Adres</label>
              <Textarea
                {...register('address')}
                placeholder="Tam adres bilgisi"
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Açıklama</label>
              <Textarea
                {...register('description')}
                placeholder="Tedarikçi hakkında detaylı bilgi"
                disabled={loading}
                rows={4}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Durum</label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="INACTIVE">Pasif</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? 'Kaydediliyor...' : vendor ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}





