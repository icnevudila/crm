'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast, handleApiError } from '@/lib/toast'

const contactSchema = z.object({
  firstName: z.string().min(1, 'İsim gereklidir'),
  lastName: z.string().optional(),
  email: z.string().email('Geçerli bir email girin').optional().or(z.literal('')),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.enum(['DECISION_MAKER', 'INFLUENCER', 'END_USER', 'GATEKEEPER', 'OTHER']).default('OTHER'),
  linkedin: z.string().url('Geçerli bir LinkedIn URL\'si girin').optional().or(z.literal('')),
  notes: z.string().optional(),
  isPrimary: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  customerCompanyId: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
  contact?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedContact: any) => void
}

export default function ContactForm({
  contact,
  open,
  onClose,
  onSuccess,
}: ContactFormProps) {
  const [loading, setLoading] = useState(false)

  // Müşteri firmalarını çek
  const { data: customerCompaniesData } = useQuery({
    queryKey: ['customer-companies'],
    queryFn: async () => {
      const res = await fetch('/api/customer-companies')
      if (!res.ok) return []
      return res.json()
    },
    enabled: open,
  })
  const customerCompanies = Array.isArray(customerCompaniesData) ? customerCompaniesData : []

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      role: 'OTHER',
      linkedin: '',
      notes: '',
      isPrimary: false,
      status: 'ACTIVE',
      customerCompanyId: '',
    },
  })

  // Contact prop değiştiğinde form'u güncelle
  useEffect(() => {
    if (open) {
      if (contact) {
        reset({
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          title: contact.title || '',
          role: contact.role || 'OTHER',
          linkedin: contact.linkedin || '',
          notes: contact.notes || '',
          isPrimary: contact.isPrimary || false,
          status: contact.status || 'ACTIVE',
          customerCompanyId: contact.customerCompanyId || '',
        })
      } else {
        reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          title: '',
          role: 'OTHER',
          linkedin: '',
          notes: '',
          isPrimary: false,
          status: 'ACTIVE',
          customerCompanyId: '',
        })
      }
    }
  }, [contact, open, reset])

  const isPrimary = watch('isPrimary')
  const status = watch('status')
  const role = watch('role')

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    try {
      const url = contact
        ? `/api/contacts/${contact.id}`
        : '/api/contacts'
      const method = contact ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to save contact')
      }

      const savedContact = await res.json()
      
      if (onSuccess) {
        onSuccess(savedContact)
      }
      
      // Başarı toast'ı göster
      toast.success(
        contact ? 'Firma yetkilisi güncellendi' : 'Firma yetkilisi kaydedildi',
        contact ? 'Yetkili bilgileri başarıyla güncellendi.' : 'Yeni yetkili başarıyla eklendi.'
      )
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      handleApiError(error, 'İletişim kaydedilemedi', 'İletişim kaydetme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Contact Düzenle' : 'Yeni Contact Ekle'}
          </DialogTitle>
          <DialogDescription>
            Müşteri firma yetkilisi veya iletişim kişisi bilgilerini girin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Kişisel Bilgiler */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Kişisel Bilgiler</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  İsim <span className="text-red-500">*</span>
                </label>
                <Input {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Soyisim</label>
                <Input {...register('lastName')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefon</label>
                <Input {...register('phone')} placeholder="+90 555 123 4567" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Ünvan / Pozisyon</label>
              <Input {...register('title')} placeholder="Örn: CEO, Satın Alma Müdürü" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn Profili</label>
              <Input {...register('linkedin')} placeholder="https://linkedin.com/in/..." />
              {errors.linkedin && (
                <p className="text-red-500 text-sm mt-1">{errors.linkedin.message}</p>
              )}
            </div>
          </div>

          {/* Rol ve Durum */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">Rol ve Durum</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <Select value={role} onValueChange={(value) => setValue('role', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DECISION_MAKER">Karar Verici</SelectItem>
                    <SelectItem value="INFLUENCER">Etkileyici</SelectItem>
                    <SelectItem value="END_USER">Son Kullanıcı</SelectItem>
                    <SelectItem value="GATEKEEPER">Kapı Bekçisi</SelectItem>
                    <SelectItem value="OTHER">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Durum</label>
                <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
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

            <div>
              <label className="block text-sm font-medium mb-2">Müşteri Firma</label>
              <Select
                value={watch('customerCompanyId') || 'none'}
                onValueChange={(value) => setValue('customerCompanyId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Firma Yok</SelectItem>
                  {customerCompanies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setValue('isPrimary', !!checked)}
              />
              <label
                htmlFor="isPrimary"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Ana iletişim kişisi
              </label>
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-sm font-medium mb-2">Notlar</label>
            <Textarea {...register('notes')} rows={3} placeholder="İletişim notları, özel bilgiler..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : contact ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}



