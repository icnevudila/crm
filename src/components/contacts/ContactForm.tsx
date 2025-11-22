'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useData } from '@/hooks/useData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
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
  imageUrl: z.union([
    z.string().url('Geçerli bir URL girin'),
    z.literal(''),
  ]).optional(),
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
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Müşteri firmalarını çek
  const { data: customerCompaniesData } = useQuery({
    queryKey: ['customer-companies'],
    queryFn: async () => {
      const res = await fetch('/api/customer-companies')
      if (!res.ok) return []
      return res.json()
    },
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
      imageUrl: '',
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
          imageUrl: contact.imageUrl || '',
        })
        // Fotoğraf preview'ını ayarla
        setImagePreview(contact.imageUrl || null)
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
          imageUrl: '',
        })
        setImagePreview(null)
      }
    }
  }, [contact, open, reset])

  // Fotoğraf yükleme handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipi kontrolü (sadece resim)
    if (!file.type.startsWith('image/')) {
      toast.error('Hata', { description: 'Lütfen geçerli bir resim dosyası seçin' })
      return
    }

    // Dosya boyutu kontrolü (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('Hata', { description: 'Resim boyutu 5MB\'dan büyük olamaz' })
      return
    }

    setUploadingImage(true)
    try {
      // Önce preview göster
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Supabase Storage'a yükle
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entityType', 'Contact')
      if (contact?.id) {
        formData.append('entityId', contact.id)
      }

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Fotoğraf yüklenemedi')
      }

      const { file: uploadedFile } = await res.json()
      
      // Form'a imageUrl'i set et
      setValue('imageUrl', uploadedFile.url)
      
      toast.success('Başarılı', { description: 'Fotoğraf başarıyla yüklendi' })
    } catch (error: any) {
      console.error('Image upload error:', error)
      toast.error('Hata', error?.message || 'Fotoğraf yüklenemedi')
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Fotoğrafı kaldır
  const handleRemoveImage = () => {
    setImagePreview(null)
    setValue('imageUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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

            {/* Profil Fotoğrafı */}
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-2">Profil Fotoğrafı</label>
              
              {/* Fotoğraf Preview */}
              {imagePreview && (
                <div className="relative inline-block mb-2">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Profil fotoğrafı"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                    disabled={loading || uploadingImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Fotoğraf Yükleme Butonu */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading || uploadingImage}
                  className="hidden"
                  id="contact-image-upload"
                />
                <label
                  htmlFor="contact-image-upload"
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImage || loading
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                      <span className="text-sm text-gray-600">Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-indigo-600">
                        {imagePreview ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Manuel URL Girişi (Opsiyonel) */}
              <div className="mt-2">
                <Input
                  type="url"
                  {...register('imageUrl')}
                  placeholder="Veya resim URL'si girin (https://example.com/image.jpg)"
                  disabled={loading || uploadingImage}
                  onChange={(e) => {
                    setValue('imageUrl', e.target.value)
                    if (e.target.value) {
                      setImagePreview(e.target.value)
                    } else {
                      setImagePreview(null)
                    }
                  }}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-red-600 mt-1">{errors.imageUrl.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimum dosya boyutu: 5MB. Desteklenen formatlar: JPG, PNG, GIF, WebP
                </p>
              </div>
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



