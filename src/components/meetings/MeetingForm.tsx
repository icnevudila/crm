'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
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
import { useQuery } from '@tanstack/react-query'
import { useData } from '@/hooks/useData'
import { Checkbox } from '@/components/ui/checkbox'

const meetingSchema = z.object({
  title: z.string().min(1, 'Görüşme başlığı gereklidir').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().optional(),
  meetingDate: z.string().min(1, 'Görüşme tarihi gereklidir'),
  meetingDuration: z.number().min(1, 'Süre en az 1 dakika olmalı').max(1440, 'Süre en fazla 24 saat (1440 dakika) olabilir').optional(),
  location: z.string().max(500, 'Konum en fazla 500 karakter olabilir').optional(),
  status: z.enum(['PLANNED', 'DONE', 'CANCELLED']).default('PLANNED'),
  customerId: z.string().optional(),
  dealId: z.string().optional(),
  customerCompanyId: z.string().optional(), // Firma bazlı ilişki
  participantIds: z.array(z.string()).optional(), // Çoklu kullanıcı atama
  notes: z.string().optional(), // Görüşme notları
  outcomes: z.string().optional(), // Çıktılar/sonuçlar
  actionItems: z.string().optional(), // Aksiyon maddeleri
  attendees: z.string().optional(), // Katılımcılar (metin)
})

type MeetingFormData = z.infer<typeof meetingSchema>

interface MeetingFormProps {
  meeting?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedMeeting: any) => void
  dealId?: string // Prop olarak dealId geçilebilir (modal içinde kullanım için)
  quoteId?: string // Prop olarak quoteId geçilebilir (modal içinde kullanım için)
  customerId?: string // Prop olarak customerId geçilebilir (modal içinde kullanım için)
}

export default function MeetingForm({
  meeting,
  open,
  onClose,
  onSuccess,
  dealId: dealIdProp,
  quoteId: quoteIdProp,
  customerId: customerIdProp,
}: MeetingFormProps) {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const customerCompanyId = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const dealIdFromUrl = searchParams.get('dealId') || undefined // URL'den dealId al
  const quoteIdFromUrl = searchParams.get('quoteId') || undefined // URL'den quoteId al
  const customerIdFromUrl = searchParams.get('customerId') || undefined // URL'den customerId al
  
  // Prop öncelikli - prop varsa prop'u kullan, yoksa URL'den al
  const dealId = dealIdProp || dealIdFromUrl
  const quoteId = quoteIdProp || quoteIdFromUrl
  const customerId = customerIdProp || customerIdFromUrl
  const [loading, setLoading] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  // Kullanıcıları çek
  async function fetchUsers() {
    const res = await fetch('/api/users')
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  }

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: open,
  })

  // Müşterileri çek - TÜM müşterileri çekmek için pagination parametresi ekle
  const { data: customersResponse, error: customersError, isLoading: customersLoading } = useData<any>('/api/customers?page=1&pageSize=1000', {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })
  // API'den gelen data pagination ile { data: [...], pagination: {...} } formatında geliyor
  const customers = Array.isArray(customersResponse) 
    ? customersResponse 
    : (customersResponse?.data || [])

  // Debug: Müşteri listesi kontrolü
  useEffect(() => {
    if (customersError) {
      console.error('Customers fetch error:', customersError)
    }
    if (customersResponse) {
      console.log('Customers response:', customersResponse)
      console.log('Customers loaded:', customers.length, customers)
    }
  }, [customersResponse, customersError, customers.length])

  // Fırsatları çek - TÜM fırsatları çekmek için pagination parametresi ekle
  const { data: dealsResponse } = useData<any>('/api/deals?page=1&pageSize=1000', {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })
  // API'den gelen data pagination ile { data: [...], pagination: {...} } formatında geliyor
  const deals = Array.isArray(dealsResponse) 
    ? dealsResponse 
    : (dealsResponse?.data || [])

  // Deal bilgilerini çek (dealId varsa) - QuoteForm pattern'i ile
  const { data: dealData } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      if (!dealId) return null
      const res = await fetch(`/api/deals/${dealId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!dealId && open && !meeting, // Sadece yeni kayıt modunda ve dealId varsa
  })

  // Quote bilgilerini çek (quoteId varsa)
  const { data: quoteData } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      if (!quoteId) return null
      const res = await fetch(`/api/quotes/${quoteId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!quoteId && open && !meeting, // Sadece yeni kayıt modunda ve quoteId varsa
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      description: '',
      meetingDate: new Date().toISOString().slice(0, 16),
      meetingDuration: 60,
      location: '',
      status: 'PLANNED',
      customerId: '',
      dealId: '',
    },
  })

  // Meeting prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (meeting) {
        // Düzenleme modu - participant'ları da yükle
        const participantIds = meeting.participants?.map((p: any) => p.userId) || []
        setSelectedParticipants(participantIds)
        
        reset({
          title: meeting.title || '',
          description: meeting.description || '',
          meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          meetingDuration: meeting.meetingDuration || 60,
          location: meeting.location || '',
          status: meeting.status || 'PLANNED',
          customerId: meeting.customerId || '',
          dealId: meeting.dealId || '',
          participantIds: participantIds,
        })
      } else {
        // Yeni kayıt modu
        setSelectedParticipants([])
        
        // Deal bilgileri varsa formu otomatik doldur
        if (dealId && dealData) {
          const deal = dealData
          reset({
            title: deal.title ? `Görüşme - ${deal.title}` : '',
            description: deal.description || '',
            meetingDate: new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: deal.customerId || customerId || '',
            dealId: dealId,
            participantIds: [],
          })
          // Deal'dan customer bilgilerini otomatik doldur
          if (deal.customerId) {
            setValue('customerId', deal.customerId)
          }
        } else if (quoteId && quoteData) {
          // Quote bilgileri varsa formu otomatik doldur
          const quote = quoteData
          reset({
            title: quote.title ? `Görüşme - ${quote.title}` : '',
            description: quote.description || '',
            meetingDate: new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: quote.customerId || customerId || '',
            dealId: quote.dealId || dealId || '',
            participantIds: [],
          })
          // Quote'dan deal ve customer bilgilerini otomatik doldur
          if (quote.dealId) {
            setValue('dealId', quote.dealId)
          }
          if (quote.customerId) {
            setValue('customerId', quote.customerId)
          }
        } else {
          // Normal yeni kayıt modu
          reset({
            title: '',
            description: '',
            meetingDate: new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: customerId || '',
            dealId: dealId || '',
            participantIds: [],
          })
          // Prop veya URL'den gelen ID'leri set et
          if (dealId) {
            setValue('dealId', dealId)
          }
          if (customerId) {
            setValue('customerId', customerId)
          }
        }
      }
    }
  }, [meeting, open, reset, dealId, customerId, setValue, dealData, quoteId, quoteData])

  const status = watch('status')
  const selectedCustomerId = watch('customerId') // Form'dan seçilen müşteri ID'si

  // Müşteri seçildiğinde ilgili fırsatları filtrele
  const filteredDeals = selectedCustomerId
    ? deals.filter((deal: any) => deal.customerId === selectedCustomerId)
    : deals

  const onSubmit = async (data: MeetingFormData) => {
    setLoading(true)
    try {
      // "none" değerlerini null'a çevir (Select component için)
      const submitData = {
        ...data,
        customerId: data.customerId === 'none' ? null : (data.customerId || null),
        dealId: data.dealId === 'none' ? null : (data.dealId || null),
        // NOT: customerCompanyId kolonu Meeting tablosunda yok, bu yüzden kaldırıldı
        participantIds: selectedParticipants, // Çoklu kullanıcı seçimi
      }

      const url = meeting
        ? `/api/meetings/${meeting.id}`
        : '/api/meetings'
      const method = meeting ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save meeting')
      }

      const savedMeeting = await res.json()
      
      // Başarı mesajı - deal/quote bilgisi ile
      let successMessage = 'Görüşme başarıyla oluşturuldu'
      const stageUpdated = savedMeeting.dealStageUpdated === true
      
      if (dealId && dealData) {
        if (stageUpdated) {
          successMessage = `Görüşme oluşturuldu: "${dealData.title}" fırsatı için. Fırsat otomatik olarak "Pazarlık" aşamasına taşındı.`
        } else {
          successMessage = `Görüşme oluşturuldu: "${dealData.title}" fırsatı için`
        }
      } else if (quoteId && quoteData) {
        successMessage = `Görüşme oluşturuldu: "${quoteData.title}" teklifi için`
      }
      
      // Toast mesajı göster
      if (stageUpdated) {
        toast.success(
          'Görüşme Oluşturuldu & Fırsat Güncellendi',
          successMessage
        )
      } else {
        toast.success('Görüşme Oluşturuldu', successMessage)
      }
      
      // onSuccess callback'i çağır - yönlendirme burada yapılacak
      if (onSuccess) {
        onSuccess(savedMeeting)
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
            {meeting ? 'Görüşme Düzenle' : 'Yeni Görüşme'}
          </DialogTitle>
          <DialogDescription>
            {meeting ? 'Görüşme bilgilerini güncelleyin' : 'Yeni görüşme ekleyin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık *</label>
            <Input
              {...register('title')}
              placeholder="Görüşme başlığı"
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Açıklama</label>
            <Textarea
              {...register('description')}
              placeholder="Görüşme notları..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Meeting Date & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih & Saat *</label>
              <Input
                type="datetime-local"
                {...register('meetingDate')}
                disabled={loading}
              />
              {errors.meetingDate && (
                <p className="text-sm text-red-600">{errors.meetingDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Süre (dakika)</label>
              <Input
                type="number"
                {...register('meetingDuration', { valueAsNumber: true })}
                placeholder="60"
                disabled={loading}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Konum</label>
            <Input
              {...register('location')}
              placeholder="Görüşme yeri"
              disabled={loading}
            />
          </div>

          {/* Customer & Deal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Müşteri</label>
              <Select
                value={customerId || 'none'}
                onValueChange={(value) => {
                  setValue('customerId', value === 'none' ? '' : (value || ''))
                  setValue('dealId', '') // Müşteri değiştiğinde fırsatı temizle
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Müşteri yok</SelectItem>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fırsat</label>
              <Select
                value={watch('dealId') || 'none'}
                onValueChange={(value) => setValue('dealId', value === 'none' ? '' : (value || ''))}
                disabled={!customerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fırsat seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fırsat yok</SelectItem>
                  {filteredDeals.map((deal: any) => (
                    <SelectItem key={deal.id} value={deal.id}>
                      {deal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Participants - Çoklu Kullanıcı Seçimi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Katılımcılar</label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Kullanıcı yükleniyor...</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`participant-${user.id}`}
                        checked={selectedParticipants.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedParticipants([...selectedParticipants, user.id])
                          } else {
                            setSelectedParticipants(selectedParticipants.filter((id) => id !== user.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`participant-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {user.name || user.email}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedParticipants.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedParticipants.length} kullanıcı seçildi
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Görüşme Notları</label>
            <Textarea
              {...register('notes')}
              placeholder="Görüşme sırasında alınan notlar..."
              rows={3}
            />
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sonuçlar / Çıktılar</label>
            <Textarea
              {...register('outcomes')}
              placeholder="Görüşmeden elde edilen sonuçlar..."
              rows={3}
            />
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Aksiyon Maddeleri</label>
            <Textarea
              {...register('actionItems')}
              placeholder="Yapılacaklar listesi (her satıra bir madde)..."
              rows={3}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Katılımcılar (Metin)</label>
            <Input
              {...register('attendees')}
              placeholder="Örn: Ahmet Yılmaz, Ayşe Demir"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Durum</label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as 'PLANNED' | 'DONE' | 'CANCELLED')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planlandı</SelectItem>
                <SelectItem value="DONE">Tamamlandı</SelectItem>
                <SelectItem value="CANCELLED">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
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
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : meeting ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

