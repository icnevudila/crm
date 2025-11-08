'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { X } from 'lucide-react'
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

const companySchema = z.object({
  name: z.string().min(1, 'Firma adı gereklidir'),
  sector: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli bir email adresi giriniz').optional().or(z.literal('')),
  website: z.string().url('Geçerli bir website adresi giriniz').optional().or(z.literal('')),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CompanyFormProps {
  company?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedCompany: any) => void | Promise<void>
}

// Önceden tanımlı sektörler
const SECTORS = [
  'Teknoloji',
  'Yazılım',
  'Sağlık',
  'Eğitim',
  'Gıda',
  'İnşaat',
  'Otomotiv',
  'Enerji',
  'Finans',
  'Perakende',
  'Lojistik',
  'Turizm',
  'Medya',
  'Danışmanlık',
  'Üretim',
  'Tarım',
  'Kimya',
  'Tekstil',
  'İlaç',
  'Telekomünikasyon',
  'Gayrimenkul',
  'Emlak',
  'Hukuk',
  'Muhasebe',
  'Pazarlama',
  'Reklam',
  'Tasarım',
  'Mimarlık',
  'Mühendislik',
  'Diğer',
]

export default function CompanyForm({
  company,
  open,
  onClose,
  onSuccess,
}: CompanyFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  // ENTERPRISE: SuperAdmin için /api/companies, normal kullanıcı için /api/customer-companies
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: company || {
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

  const status = watch('status')

  const mutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      // ENTERPRISE: SuperAdmin için /api/companies, normal kullanıcı için /api/customer-companies
      const baseUrl = isSuperAdmin ? '/api/companies' : '/api/customer-companies'
      const url = company
        ? `${baseUrl}/${company.id}`
        : baseUrl
      const method = company ? 'PUT' : 'POST'

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include', // Session cookie'lerini gönder
        })

        if (!res.ok) {
          // Response body'yi parse etmeye çalış
          let errorData
          try {
            errorData = await res.json()
          } catch {
            // JSON parse edilemezse status text kullan
            errorData = { error: res.statusText || 'Failed to save company' }
          }
          throw new Error(errorData.error || errorData.message || 'Failed to save company')
        }

        return await res.json()
      } catch (fetchError: any) {
        // Network hatası veya diğer fetch hataları
        console.error('CompanyForm fetch error:', fetchError)
        throw new Error(fetchError?.message || 'Network error: Failed to fetch')
      }
    },
    onSuccess: (savedCompany) => {
      // Debug: Development'ta log ekle
      if (process.env.NODE_ENV === 'development') {
        console.log('CompanyForm onSuccess:', savedCompany)
      }
      
      // onSuccess callback'i çağır - optimistic update için
      if (onSuccess) {
        onSuccess(savedCompany)
      }
      reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('CompanyForm mutation error:', error)
      // Daha detaylı hata mesajı göster
      const errorMessage = error?.message || error?.error || 'Kaydetme işlemi başarısız oldu'
      alert(errorMessage)
    },
  })

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Firma Düzenle' : 'Yeni Firma'}
          </DialogTitle>
          <DialogDescription>
            {company ? 'Firma bilgilerini güncelleyin' : 'Yeni firma ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Firma Adı *</label>
              <Input
                {...register('name')}
                placeholder="Firma adı"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Select
                value={watch('sector') || 'none'}
                onValueChange={(value) => setValue('sector', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sektör seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sektör Seçilmedi</SelectItem>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder="info@firma.com"
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
                placeholder="https://www.firma.com"
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
                placeholder="Firma hakkında detaylı bilgi"
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
              {loading ? 'Kaydediliyor...' : company ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

