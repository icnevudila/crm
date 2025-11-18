'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { mutate } from 'swr'
import { useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast, handleApiError } from '@/lib/toast'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import SmartAutocomplete from '@/components/autocomplete/SmartAutocomplete'
import { handleFormValidationErrors } from '@/lib/form-validation'
import FormProgressBar from '@/components/forms/FormProgressBar'
import FormTemplateSelector from '@/components/forms/FormTemplateSelector'
import type { FormTemplate } from '@/hooks/useFormTemplates'
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

const customerSchema = z.object({
  name: z.string().min(1, 'İsim gereklidir'),
  email: z.string().email('Geçerli bir email girin').optional().or(z.literal('')),
  phone: z.string().optional(),
  fax: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().url('Geçerli bir web sitesi URL\'si girin').optional().or(z.literal('')),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  customerCompanyId: z.string().optional(),
  logoUrl: z.string().url('Geçerli bir URL girin').optional().or(z.literal('')),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  customer?: any
  open: boolean
  onClose: () => void
  onSuccess?: (newCustomer: any) => void // Cache güncelleme için callback - yeni kaydı parametre olarak geçiyoruz
  skipDialog?: boolean // Wizard içinde kullanım için Dialog wrapper'ı atla
}

export default function CustomerForm({
  customer,
  open,
  onClose,
  onSuccess,
  skipDialog = false,
}: CustomerFormProps) {
  const router = useRouter()
  const navigateToDetailToast = useNavigateToDetailToast()
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState(customer?.logoUrl || '')

  // Müşteri firmalarını çek (müşteri hangi firmada çalışıyor)
  const { data: customerCompaniesData } = useQuery({
    queryKey: ['customer-companies'],
    queryFn: async () => {
      const res = await fetch('/api/customer-companies')
      if (!res.ok) return []
      return res.json()
    },
    enabled: open, // Sadece form açıkken çek
  })
  const customerCompanies = Array.isArray(customerCompaniesData) ? customerCompaniesData : []

  const formRef = useRef<HTMLFormElement>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
      address: '',
      sector: '',
      website: '',
      taxNumber: '',
      notes: '',
      status: 'ACTIVE',
      customerCompanyId: '',
      logoUrl: '',
    },
  })

  // Customer prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (customer) {
        // Düzenleme modu - müşteri bilgilerini yükle
        reset({
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          fax: customer.fax || '',
          city: customer.city || '',
          address: customer.address || '',
          sector: customer.sector || '',
          website: customer.website || '',
          taxNumber: customer.taxNumber || '',
          notes: customer.notes || '',
          status: customer.status || 'ACTIVE',
          customerCompanyId: customer.customerCompanyId || '',
          logoUrl: customer.logoUrl || '',
        })
        setLogoPreview(customer.logoUrl || '')
      } else {
        // Yeni kayıt modu - form'u temizle
        reset({
          name: '',
          email: '',
          phone: '',
          fax: '',
          city: '',
          address: '',
          sector: '',
          website: '',
          taxNumber: '',
          notes: '',
          status: 'ACTIVE',
          customerCompanyId: '',
          logoUrl: '',
        })
        setLogoPreview('')
      }
    }
  }, [customer, open, reset])

  // Logo yükleme handler (gelecekte Supabase Storage'a yüklenecek)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Geçici olarak base64 preview göster (gelecekte Supabase Storage'a yüklenecek)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setLogoPreview(base64String)
        setValue('logoUrl', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const status = watch('status')

  const onError = (errors: any) => {
    // Form validation hatalarını göster ve scroll yap
    handleFormValidationErrors(errors, formRef)
  }

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    try {
      const url = customer
        ? `/api/customers/${customer.id}`
        : '/api/customers'
      const method = customer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      // Response body'yi güvenli bir şekilde parse et
      let result: any = {}
      let responseText = ''
      try {
        responseText = await res.text()
        if (responseText) {
          result = JSON.parse(responseText)
        }
      } catch (parseError) {
        // JSON parse edilemezse boş obje kullan
        console.warn('Response JSON parse edilemedi:', parseError, 'Response text:', responseText)
        // Parse edilemezse bile response text'i kullan
        if (responseText) {
          result = { error: responseText, message: responseText }
        }
      }
      
      if (!res.ok) {
        // Daha detaylı hata mesajı oluştur
        const errorMessage = result?.error || result?.message || responseText || `Müşteri kaydedilemedi (${res.status})`
        const apiError: any = {
          status: res.status,
          message: errorMessage,
          error: result?.error || errorMessage,
          code: result?.code || `HTTP_${res.status}`,
          details: result,
          responseText, // Debug için response text'i de ekle
        }
        console.error('CustomerForm API Error:', {
          status: res.status,
          error: apiError,
          result,
          responseText,
        })
        throw apiError
      }
      
      // Optimistic update - yeni kaydı hemen cache'e ekle ve UI'da göster
      // Parent component'e callback gönder - yeni/ güncellenmiş kayıt parametre olarak geçiliyor
      if (onSuccess) {
        await onSuccess(result) // result = API'den dönen yeni veya güncellenmiş müşteri
      }
      
      // Başarı toast'ı göster
      if (customer) {
        toast.success('Müşteri güncellendi', {
          description: 'Müşteri bilgileri başarıyla güncellendi.',
        })
      } else {
        // Yeni müşteri oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        // Güvenlik: result.id ve result.name kontrolü
        if (result?.id) {
          navigateToDetailToast('customer', result.id, result.name || result.title || 'Müşteri')
        } else {
          toast.success('Müşteri oluşturuldu', 'Müşteri başarıyla oluşturuldu.')
        }
      }
      
      reset()
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      handleApiError(error, 'Müşteri kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <div className="space-y-4">
      {!skipDialog && (
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>
                {customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
              </DialogTitle>
              <DialogDescription>
                {customer ? 'Müşteri bilgilerini güncelleyin' : 'Yeni müşteri ekleyin'}
              </DialogDescription>
            </div>
            {/* Form Template Selector - Sadece yeni kayıt modunda göster */}
            {!customer && (
              <FormTemplateSelector
                formType="customer"
                onSelectTemplate={(template: FormTemplate) => {
                  // Şablon verilerini forma yükle
                  reset({
                    ...watch(),
                    ...template.data,
                  })
                }}
                currentFormData={watch()}
                className="ml-4"
              />
            )}
          </div>
        </DialogHeader>
      )}

      {/* Form Progress Bar - Sadece yeni kayıt modunda ve Dialog içindeyken göster */}
      {!skipDialog && !customer && (
        <FormProgressBar
          formValues={watch()}
          requiredFields={['name']}
          allFields={['name', 'email', 'phone', 'city', 'address', 'sector', 'website', 'taxNumber', 'notes', 'status', 'customerCompanyId']}
          minPercentage={10}
          className="mb-4"
        />
      )}

      <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Müşteri Logosu</label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={loading}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={loading}
                      asChild
                    >
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Logo Yükle
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            {/* Name - Smart Autocomplete */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">İsim *</label>
              <SmartAutocomplete
                apiUrl={
                  watch('name') && watch('name').length >= 2
                    ? `/api/customers?search=${encodeURIComponent(watch('name'))}&limit=5`
                    : null
                }
                value={watch('name') || ''}
                onChange={(value) => setValue('name', value, { shouldValidate: true })}
                onSelect={(item) => {
                  setValue('name', item.label, { shouldValidate: true })
                  // Eğer müşteri seçildiyse, diğer bilgileri de doldur
                  if (item.value && item.value !== item.label) {
                    // Müşteri detaylarını çek ve form'u doldur
                    fetch(`/api/customers/${item.value}`)
                      .then((res) => res.json())
                      .then((data) => {
                        if (data) {
                          setValue('email', data.email || '')
                          setValue('phone', data.phone || '')
                          setValue('city', data.city || '')
                          setValue('address', data.address || '')
                          setValue('sector', data.sector || '')
                        }
                      })
                      .catch(() => {}) // Sessizce devam et
                  }
                }}
                placeholder="Müşteri adı (yazmaya başlayın...)"
                minChars={2}
                labelField="name"
                valueField="id"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <Input
                type="email"
                {...register('email')}
                placeholder="ornek@email.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
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

            {/* Fax */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Faks</label>
              <Input
                {...register('fax')}
                placeholder="0212 123 45 67"
                disabled={loading}
              />
            </div>

            {/* City - Smart Autocomplete */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Şehir</label>
              <SmartAutocomplete
                suggestions={[
                  { id: 'istanbul', label: 'İstanbul', value: 'İstanbul' },
                  { id: 'ankara', label: 'Ankara', value: 'Ankara' },
                  { id: 'izmir', label: 'İzmir', value: 'İzmir' },
                  { id: 'bursa', label: 'Bursa', value: 'Bursa' },
                  { id: 'antalya', label: 'Antalya', value: 'Antalya' },
                  { id: 'adana', label: 'Adana', value: 'Adana' },
                  { id: 'gaziantep', label: 'Gaziantep', value: 'Gaziantep' },
                  { id: 'konya', label: 'Konya', value: 'Konya' },
                  { id: 'kayseri', label: 'Kayseri', value: 'Kayseri' },
                  { id: 'eskisehir', label: 'Eskişehir', value: 'Eskişehir' },
                ]}
                value={watch('city') || ''}
                onChange={(value) => setValue('city', value)}
                placeholder="Şehir (yazmaya başlayın...)"
                minChars={1}
                className=""
                disabled={loading}
              />
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sektör</label>
              <Select
                value={watch('sector') || ''}
                onValueChange={(value) => setValue('sector', value === 'none' ? '' : value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sektör seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belirtilmemiş</SelectItem>
                  <SelectItem value="Teknoloji">Teknoloji</SelectItem>
                  <SelectItem value="Sağlık">Sağlık</SelectItem>
                  <SelectItem value="Eğitim">Eğitim</SelectItem>
                  <SelectItem value="İnşaat">İnşaat</SelectItem>
                  <SelectItem value="Otomotiv">Otomotiv</SelectItem>
                  <SelectItem value="Gıda">Gıda</SelectItem>
                  <SelectItem value="Tekstil">Tekstil</SelectItem>
                  <SelectItem value="Enerji">Enerji</SelectItem>
                  <SelectItem value="Finans">Finans</SelectItem>
                  <SelectItem value="Turizm">Turizm</SelectItem>
                  <SelectItem value="Lojistik">Lojistik</SelectItem>
                  <SelectItem value="Medya">Medya</SelectItem>
                  <SelectItem value="Danışmanlık">Danışmanlık</SelectItem>
                  <SelectItem value="E-ticaret">E-ticaret</SelectItem>
                  <SelectItem value="İmalat">İmalat</SelectItem>
                  <SelectItem value="Ticaret">Ticaret</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Adres</label>
              <Textarea
                {...register('address')}
                placeholder="Tam adres bilgisi"
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Web Sitesi</label>
              <Input
                type="url"
                {...register('website')}
                placeholder="https://www.example.com"
                disabled={loading}
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>

            {/* Tax Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vergi Numarası</label>
              <Input
                {...register('taxNumber')}
                placeholder="Vergi no"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Notlar</label>
              <Textarea
                {...register('notes')}
                placeholder="Özel notlar ve açıklamalar"
                rows={3}
                disabled={loading}
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
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary text-white w-full sm:w-auto"
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Kaydediliyor...' : customer ? 'Güncelle' : 'Kaydet'}
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
