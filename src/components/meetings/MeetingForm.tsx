'use client'

import { useState, useEffect } from 'react'
import { toast, toastWarning } from '@/lib/toast'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useNavigateToDetailToast } from '@/lib/quick-action-helper'
import { AutomationConfirmationModal } from '@/lib/automations/toast-confirmation'
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

interface MeetingFormProps {
  meeting?: any
  open: boolean
  onClose: () => void
  onSuccess?: (savedMeeting: any) => void
  dealId?: string // Prop olarak dealId geçilebilir (modal içinde kullanım için)
  quoteId?: string // Prop olarak quoteId geçilebilir (modal içinde kullanım için)
  customerId?: string // Prop olarak customerId geçilebilir (modal içinde kullanım için)
  customerCompanyId?: string
  customerCompanyName?: string
  initialDate?: Date // Takvimden seçilen tarih
}

export default function MeetingForm({
  meeting,
  open,
  onClose,
  onSuccess,
  dealId: dealIdProp,
  quoteId: quoteIdProp,
  customerId: customerIdProp,
  customerCompanyId: customerCompanyIdProp,
  customerCompanyName,
  initialDate,
}: MeetingFormProps) {
  const t = useTranslations('meetings.form')
  const tCommon = useTranslations('common.form')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const customerCompanyIdFromUrl = searchParams.get('customerCompanyId') || undefined // URL'den customerCompanyId al
  const dealIdFromUrl = searchParams.get('dealId') || undefined // URL'den dealId al
  const quoteIdFromUrl = searchParams.get('quoteId') || undefined // URL'den quoteId al
  const customerIdFromUrl = searchParams.get('customerId') || undefined // URL'den customerId al
  
  // Prop öncelikli - prop varsa prop'u kullan, yoksa URL'den al
  const dealId = dealIdProp || dealIdFromUrl
  const quoteId = quoteIdProp || quoteIdFromUrl
  const customerId = customerIdProp || customerIdFromUrl
  const customerCompanyId = customerCompanyIdProp || customerCompanyIdFromUrl
  const [loading, setLoading] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [creatingVideoMeeting, setCreatingVideoMeeting] = useState(false)
  const navigateToDetailToast = useNavigateToDetailToast()
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationModalType, setAutomationModalType] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [automationModalOptions, setAutomationModalOptions] = useState<any>(null)
  // ✅ Recurring meeting state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count'>('date')
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([])

  // Schema'yı component içinde oluştur - locale desteği için
  const meetingSchema = z.object({
    title: z.string().min(1, t('titleRequired')).max(200, t('titleMaxLength')),
    description: z.string().optional(),
    meetingDate: z.string().min(1, t('meetingDateRequired')),
    meetingDuration: z.number().min(1, t('meetingDurationMin')).max(1440, t('meetingDurationMax')).optional(),
    location: z.string().max(500, t('locationMaxLength')).optional(),
    meetingType: z.enum(['IN_PERSON', 'ZOOM', 'GOOGLE_MEET', 'TEAMS', 'OTHER']).default('IN_PERSON'),
    meetingUrl: z.string().optional().refine(
      (val) => !val || val === '' || z.string().url().safeParse(val).success,
      { message: 'Geçerli bir URL giriniz' }
    ),
    meetingPassword: z.string().max(100).optional(),
    status: z.enum(['PLANNED', 'DONE', 'CANCELLED']).default('PLANNED'),
    customerId: z.string().optional(),
    dealId: z.string().optional(),
    customerCompanyId: z.string().optional(), // Firma bazlı ilişki
    participantIds: z.array(z.string()).optional(), // Çoklu kullanıcı atama
    notes: z.string().optional(), // Görüşme notları
    outcomes: z.string().optional(), // Çıktılar/sonuçlar
    actionItems: z.string().optional(), // Aksiyon maddeleri
    attendees: z.string().optional(), // Katılımcılar (metin)
    // ✅ Recurring meeting alanları
    isRecurring: z.boolean().optional().default(false),
    recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    recurrenceInterval: z.number().min(1).max(365).optional().default(1),
    recurrenceEndDate: z.string().optional(),
    recurrenceCount: z.number().min(1).max(1000).optional(),
    recurrenceDaysOfWeek: z.array(z.number()).optional(), // 0=Pazar, 1=Pazartesi, ...
  })

  type MeetingFormData = z.infer<typeof meetingSchema>

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
  const filteredCustomers = customerCompanyId
    ? customers.filter((customer: any) => customer.customerCompanyId === customerCompanyId)
    : customers

  // Debug: Müşteri listesi kontrolü
  useEffect(() => {
    if (customersError) {
      console.error('Customers fetch error:', customersError)
    }
    if (customersResponse) {
      console.log('Customers response:', customersResponse)
      console.log('Customers loaded:', customers.length, customers)
    }
  }, [customersResponse, customersError, customers.length, customers])

  // Fırsatları çek - TÜM fırsatları çekmek için pagination parametresi ekle
  const { data: dealsResponse } = useData<any>('/api/deals?page=1&pageSize=1000', {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  })
  // API'den gelen data pagination ile { data: [...], pagination: {...} } formatında geliyor
  const deals = Array.isArray(dealsResponse) 
    ? dealsResponse 
    : (dealsResponse?.data || [])
  const dealsByCompany = customerCompanyId
    ? deals.filter((deal: any) => deal.customerCompanyId === customerCompanyId)
    : deals

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
      meetingType: 'IN_PERSON',
      meetingUrl: '',
      meetingPassword: '',
      status: 'PLANNED',
      customerId: '',
      dealId: '',
      customerCompanyId: customerCompanyId || '',
      isRecurring: false,
      recurrenceType: 'WEEKLY',
      recurrenceInterval: 1,
      recurrenceEndDate: '',
      recurrenceCount: undefined,
      recurrenceDaysOfWeek: [],
    },
  })

  // Meeting prop değiştiğinde veya modal açıldığında form'u güncelle
  useEffect(() => {
    if (open) {
      if (meeting) {
        // Düzenleme modu - participant'ları da yükle
        const participantIds = meeting.participants?.map((p: any) => p.userId) || []
        setSelectedParticipants(participantIds)
        
        // Recurring meeting state'lerini yükle
        setIsRecurring(meeting.isRecurring || false)
        setRecurrenceEndType(meeting.recurrenceEndDate ? 'date' : (meeting.recurrenceCount ? 'count' : 'date'))
        setSelectedDaysOfWeek(meeting.recurrenceDaysOfWeek || [])
        
        reset({
          title: meeting.title || '',
          description: meeting.description || '',
          meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
          meetingDuration: meeting.meetingDuration || 60,
          location: meeting.location || '',
          meetingType: meeting.meetingType || 'IN_PERSON',
          meetingUrl: meeting.meetingUrl || '',
          meetingPassword: meeting.meetingPassword || '',
          status: meeting.status || 'PLANNED',
          customerId: meeting.customerId || '',
          dealId: meeting.dealId || '',
          participantIds: participantIds,
          customerCompanyId: meeting.customerCompanyId || customerCompanyId || '',
          isRecurring: meeting.isRecurring || false,
          recurrenceType: meeting.recurrenceType || 'WEEKLY',
          recurrenceInterval: meeting.recurrenceInterval || 1,
          recurrenceEndDate: meeting.recurrenceEndDate ? new Date(meeting.recurrenceEndDate).toISOString().slice(0, 10) : '',
          recurrenceCount: meeting.recurrenceCount || undefined,
          recurrenceDaysOfWeek: meeting.recurrenceDaysOfWeek || [],
        })
      } else {
        // Yeni kayıt modu
        setSelectedParticipants([])
        
        // Deal bilgileri varsa formu otomatik doldur
        if (dealId && dealData) {
          const deal = dealData
          reset({
            title: deal.title ? t('autoTitleFromDeal', { dealTitle: deal.title }) : '',
            description: deal.description || '',
            meetingDate: new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: deal.customerId || customerId || '',
            dealId: dealId,
            participantIds: [],
            customerCompanyId: customerCompanyId || deal.customerCompanyId || '',
          })
          // Deal'dan customer bilgilerini otomatik doldur
          if (deal.customerId) {
            setValue('customerId', deal.customerId)
          }
        } else if (quoteId && quoteData) {
          // Quote bilgileri varsa formu otomatik doldur
          const quote = quoteData
          reset({
            title: quote.title ? t('autoTitleFromQuote', { quoteTitle: quote.title }) : '',
            description: quote.description || '',
            meetingDate: new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: quote.customerId || customerId || '',
            dealId: quote.dealId || dealId || '',
            participantIds: [],
            customerCompanyId: customerCompanyId || quote.customerCompanyId || '',
          })
          // Quote'dan deal ve customer bilgilerini otomatik doldur
          if (quote.dealId) {
            setValue('dealId', quote.dealId)
          }
          if (quote.customerId) {
            setValue('customerId', quote.customerId)
          }
        } else {
          // Normal yeni kayıt modu - initialDate varsa kullan
          setIsRecurring(false)
          setRecurrenceEndType('date')
          setSelectedDaysOfWeek([])
          
          reset({
            title: '',
            description: '',
            meetingDate: initialDate ? initialDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            meetingDuration: 60,
            location: '',
            status: 'PLANNED',
            customerId: customerId || '',
            dealId: dealId || '',
            participantIds: [],
            customerCompanyId: customerCompanyId || '',
            isRecurring: false,
            recurrenceType: 'WEEKLY',
            recurrenceInterval: 1,
            recurrenceEndDate: '',
            recurrenceCount: undefined,
            recurrenceDaysOfWeek: [],
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
  }, [meeting, open, reset, dealId, customerId, setValue, dealData, quoteId, quoteData, customerCompanyId, initialDate]) // initialDate eklendi

  const status = watch('status')
  const selectedCustomerId = watch('customerId') // Form'dan seçilen müşteri ID'si

  // Müşteri seçildiğinde ilgili fırsatları filtrele
  const filteredDeals = selectedCustomerId
    ? dealsByCompany.filter((deal: any) => deal.customerId === selectedCustomerId)
    : dealsByCompany

  useEffect(() => {
    if (open && !meeting && filteredCustomers.length === 1 && !customerId) {
      setValue('customerId', filteredCustomers[0].id)
    }
  }, [open, meeting, filteredCustomers, customerId, setValue])

  const onSubmit = async (data: MeetingFormData) => {
    setLoading(true)
    try {
      // "none" değerlerini null'a çevir (Select component için)
      const submitData = {
        ...data,
        customerId: data.customerId === 'none' ? null : (data.customerId || null),
        dealId: data.dealId === 'none' ? null : (data.dealId || null),
        customerCompanyId: data.customerCompanyId && data.customerCompanyId !== ''
          ? data.customerCompanyId
          : customerCompanyId || null,
        participantIds: selectedParticipants, // Çoklu kullanıcı seçimi
        // ✅ Recurring meeting alanları
        isRecurring: isRecurring,
        recurrenceType: isRecurring ? (data.recurrenceType || 'WEEKLY') : null,
        recurrenceInterval: isRecurring ? (data.recurrenceInterval || 1) : null,
        recurrenceEndDate: isRecurring && recurrenceEndType === 'date' && data.recurrenceEndDate ? data.recurrenceEndDate : null,
        recurrenceCount: isRecurring && recurrenceEndType === 'count' && data.recurrenceCount ? data.recurrenceCount : null,
        recurrenceDaysOfWeek: isRecurring && data.recurrenceType === 'WEEKLY' && selectedDaysOfWeek.length > 0 ? selectedDaysOfWeek : null,
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
        
        // ✅ Zaman çakışması kontrolü - özel hata mesajı göster
        if (res.status === 409 && errorData.conflicts) {
          // Çakışma var - kullanıcıya detaylı bilgi göster
          const conflictMessage = errorData.conflicts.length === 1
            ? errorData.conflicts[0]
            : `Aşağıdaki çakışmalar tespit edildi:\n\n${errorData.conflicts.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`
          
          toast.error(
            'Zaman Çakışması',
            conflictMessage,
            {
              duration: 10000, // 10 saniye göster
            }
          )
          throw new Error(errorData.message || 'Zaman çakışması tespit edildi')
        }
        
        throw new Error(errorData.error || 'Failed to save meeting')
      }

      const savedMeeting = await res.json()
      
      // Toast mesajı göster
      if (meeting) {
        // Güncelleme durumu
        toast.success(t('meetingUpdated'), t('meetingUpdatedMessage', { title: savedMeeting.title }))
      } else {
        // Yeni oluşturma durumu
        const stageUpdated = savedMeeting.dealStageUpdated === true
        let successMessage = t('meetingCreatedMessage')
        let successTitle = t('meetingCreated')
        
        if (dealId && dealData) {
          if (stageUpdated) {
            successMessage = customerCompanyName
              ? t('meetingCreatedWithDealStageUpdatedAndCompany', { company: customerCompanyName, dealTitle: dealData.title })
              : t('meetingCreatedWithDealStageUpdated', { dealTitle: dealData.title })
            successTitle = t('meetingCreatedAndDealUpdated')
          } else {
            successMessage = customerCompanyName
              ? t('meetingCreatedWithDealAndCompany', { company: customerCompanyName, dealTitle: dealData.title })
              : t('meetingCreatedWithDeal', { dealTitle: dealData.title })
          }
        } else if (quoteId && quoteData) {
          successMessage = customerCompanyName
            ? t('meetingCreatedWithQuoteAndCompany', { company: customerCompanyName, quoteTitle: quoteData.title })
            : t('meetingCreatedWithQuote', { quoteTitle: quoteData.title })
        } else if (customerCompanyName) {
          successMessage = t('meetingCreatedWithCompany', { company: customerCompanyName })
        }
        
        // Yeni meeting oluşturuldu - "Detay sayfasına gitmek ister misiniz?" toast'u göster
        navigateToDetailToast('meeting', savedMeeting.id, savedMeeting.title)
      }
      
      // onSuccess callback'i çağır - yönlendirme burada yapılacak
      // CRITICAL FIX: onSuccess'i önce çağır, sonra form'u kapat
      // onSuccess içinde onClose çağrılmamalı - form zaten kendi içinde onClose çağırıyor
      if (onSuccess) {
        await onSuccess(savedMeeting)
      }
      
      // ✅ Otomasyon: Meeting oluşturulduğunda email gönder (kullanıcı tercihine göre)
      if (!meeting && savedMeeting.customerId) {
        try {
          // Customer bilgisini çek
          const customerRes = await fetch(`/api/customers/${savedMeeting.customerId}`)
          if (customerRes.ok) {
            const customer = await customerRes.json()
            if (customer?.email) {
              // Automation API'yi kontrol et
              const automationRes = await fetch('/api/automations/meeting-created-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meeting: savedMeeting }),
              })
              
              if (automationRes.ok) {
                const automationData = await automationRes.json()
                if (automationData.shouldAsk) {
                  // Kullanıcıya sor (modal aç)
                  setAutomationModalType('email')
                  setAutomationModalOptions({
                    entityType: 'MEETING',
                    entityId: savedMeeting.id,
                    entityTitle: savedMeeting.title,
                    customerEmail: customer.email,
                    customerPhone: customer.phone,
                    customerName: customer.name,
                    defaultSubject: `Toplantı: ${savedMeeting.title}`,
                    defaultMessage: `Merhaba ${customer.name},\n\nYeni toplantı planlandı: ${savedMeeting.title}\n\nTarih: ${savedMeeting.meetingDate ? new Date(savedMeeting.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}\nLokasyon: ${savedMeeting.location || 'Belirtilmemiş'}\n\nDetayları görüntülemek için lütfen bizimle iletişime geçin.`,
                    defaultHtml: `<p>Merhaba ${customer.name},</p><p>Yeni toplantı planlandı: <strong>${savedMeeting.title}</strong></p><p>Tarih: ${savedMeeting.meetingDate ? new Date(savedMeeting.meetingDate).toLocaleString('tr-TR') : 'Belirtilmemiş'}</p><p>Lokasyon: ${savedMeeting.location || 'Belirtilmemiş'}</p>`,
                    onSent: () => {
                      toast.success('E-posta gönderildi', 'Müşteriye meeting bilgisi gönderildi')
                    },
                    onAlwaysSend: async () => {
                      await fetch('/api/automations/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          automationType: 'emailOnMeetingCreated',
                          preference: 'ALWAYS',
                        }),
                      })
                    },
                    onNeverSend: async () => {
                      await fetch('/api/automations/preferences', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          automationType: 'emailOnMeetingCreated',
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
          console.error('Meeting automation error:', error)
        }
      }
      
      reset()
      // Form'u kapat - onSuccess callback'inden SONRA (sonsuz döngü önleme)
      onClose()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(t('saveFailed'), error?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? t('editTitle') : t('newTitle')}
          </DialogTitle>
          <DialogDescription>
            {meeting ? t('editDescription') : t('newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {customerCompanyId && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-sm text-indigo-700">
              <p className="font-semibold">
                {t('companyLabel')}: {customerCompanyName || t('selectedCompany')}
              </p>
              <p>
                {filteredCustomers.length > 0
                  ? t('customersCount', { count: filteredCustomers.length })
                  : t('noCustomersFound')}
              </p>
            </div>
          )}
          <input type="hidden" {...register('customerCompanyId')} />
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('titleLabel')} *</label>
            <Input
              {...register('title')}
              placeholder={t('titlePlaceholder')}
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('descriptionLabel')}</label>
            <Textarea
              {...register('description')}
              placeholder={t('descriptionPlaceholder')}
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Meeting Date & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('meetingDateLabel')} *</label>
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
              <label className="text-sm font-medium">{t('meetingDurationLabel')}</label>
              <Input
                type="number"
                {...register('meetingDuration', { valueAsNumber: true })}
                placeholder={t('meetingDurationPlaceholder')}
                disabled={loading}
              />
              {errors.meetingDuration && (
                <p className="text-sm text-red-600">{errors.meetingDuration.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('locationLabel')}</label>
            <Input
              {...register('location')}
              placeholder={t('locationPlaceholder')}
              disabled={loading}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Meeting Type & URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Toplantı Tipi</label>
            <Select
              value={watch('meetingType') || 'IN_PERSON'}
              onValueChange={(value) => setValue('meetingType', value as any)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Toplantı tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PERSON">Yüz Yüze</SelectItem>
                <SelectItem value="ZOOM">Zoom</SelectItem>
                <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
                <SelectItem value="OTHER">Diğer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting URL (video link) */}
          {(watch('meetingType') === 'ZOOM' || watch('meetingType') === 'GOOGLE_MEET' || watch('meetingType') === 'TEAMS' || watch('meetingType') === 'OTHER') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {watch('meetingType') === 'ZOOM' ? 'Zoom Linki' :
                   watch('meetingType') === 'GOOGLE_MEET' ? 'Google Meet Linki' :
                   watch('meetingType') === 'TEAMS' ? 'Teams Linki' :
                   'Toplantı Linki'}
                </label>
                {(watch('meetingType') === 'ZOOM' || watch('meetingType') === 'GOOGLE_MEET' || watch('meetingType') === 'TEAMS') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      // Video meeting otomatik oluştur
                      const meetingType = watch('meetingType')
                      const title = watch('title')
                      const meetingDate = watch('meetingDate')
                      const meetingDuration = watch('meetingDuration') || 60

                      if (!title || title.trim() === '') {
                        toastWarning('Önce toplantı başlığını girin')
                        return
                      }

                      if (!meetingDate) {
                        toastWarning('Önce toplantı tarihini girin')
                        return
                      }

                      setCreatingVideoMeeting(true)
                      try {
                        const res = await fetch('/api/meetings/create-video-meeting', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            meetingType,
                            title,
                            meetingDate,
                            meetingDuration,
                            description: watch('description') || '',
                            attendees: selectedParticipants.map((userId) => {
                              const user = users.find((u: any) => u.id === userId)
                              return user?.email
                            }).filter(Boolean),
                            password: watch('meetingPassword') || undefined,
                          }),
                        })

                        if (!res.ok) {
                          const error = await res.json().catch(() => ({}))
                          throw new Error(error.error || 'Video meeting oluşturulamadı')
                        }

                        const result = await res.json()

                        // Form'u otomatik doldur
                        setValue('meetingUrl', result.meetingUrl || result.joinUrl || '')
                        if (result.password) {
                          setValue('meetingPassword', result.password)
                        }

                        toast.success('Başarılı', `${meetingType} meeting başarıyla oluşturuldu!`)
                      } catch (error: any) {
                        console.error('Video meeting creation error:', error)
                        toast.error('Hata', error?.message || 'Video meeting oluşturulamadı')
                      } finally {
                        setCreatingVideoMeeting(false)
                      }
                    }}
                    disabled={loading || creatingVideoMeeting || !watch('title') || !watch('meetingDate')}
                    className="text-xs"
                  >
                    {creatingVideoMeeting ? 'Oluşturuluyor...' : 'Otomatik Oluştur'}
                  </Button>
                )}
              </div>
              <Input
                {...register('meetingUrl')}
                placeholder={watch('meetingType') === 'ZOOM' ? 'https://zoom.us/j/...' :
                             watch('meetingType') === 'GOOGLE_MEET' ? 'https://meet.google.com/...' :
                             watch('meetingType') === 'TEAMS' ? 'https://teams.microsoft.com/...' :
                             'https://...'}
                disabled={loading}
                type="url"
              />
              {errors.meetingUrl && (
                <p className="text-sm text-red-600">{errors.meetingUrl.message}</p>
              )}
              {(watch('meetingType') === 'ZOOM' || watch('meetingType') === 'GOOGLE_MEET' || watch('meetingType') === 'TEAMS') && (
                <p className="text-xs text-gray-500">
                  {watch('meetingType') === 'ZOOM' && 'Zoom API credentials gerekli (.env.local: ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET)'}
                  {watch('meetingType') === 'GOOGLE_MEET' && 'Google OAuth access token gerekli (.env.local: GOOGLE_ACCESS_TOKEN)'}
                  {watch('meetingType') === 'TEAMS' && 'Microsoft Graph access token gerekli (.env.local: MICROSOFT_ACCESS_TOKEN)'}
                </p>
              )}
            </div>
          )}

          {/* Meeting Password (Zoom/Meet için) */}
          {(watch('meetingType') === 'ZOOM' || watch('meetingType') === 'GOOGLE_MEET' || watch('meetingType') === 'TEAMS') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Toplantı Şifresi (Opsiyonel)</label>
              <Input
                {...register('meetingPassword')}
                placeholder="Şifre (varsa)"
                disabled={loading}
                type="password"
              />
              {errors.meetingPassword && (
                <p className="text-sm text-red-600">{errors.meetingPassword.message}</p>
              )}
            </div>
          )}

          {/* Customer & Deal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('customerLabel')}</label>
              <Select
                value={customerId || 'none'}
                onValueChange={(value) => {
                  setValue('customerId', value === 'none' ? '' : (value || ''))
                  setValue('dealId', '') // Müşteri değiştiğinde fırsatı temizle
                }}
                disabled={filteredCustomers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('customerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCustomers.length === 0 && (
                    <SelectItem value="none" disabled>
                      {t('customerNotFound')}
                    </SelectItem>
                  )}
                  <SelectItem value="none">{t('customerNone')}</SelectItem>
                  {filteredCustomers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('dealLabel')}</label>
              <Select
                value={watch('dealId') || 'none'}
                onValueChange={(value) => setValue('dealId', value === 'none' ? '' : (value || ''))}
                disabled={filteredDeals.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dealPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('dealNone')}</SelectItem>
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
            <label className="text-sm font-medium">{t('participantsLabel')}</label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('participantsLoading')}</p>
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
                {t('participantsSelected', { count: selectedParticipants.length })}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('notesLabel')}</label>
            <Textarea
              {...register('notes')}
              placeholder={t('notesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Outcomes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('outcomesLabel')}</label>
            <Textarea
              {...register('outcomes')}
              placeholder={t('outcomesPlaceholder')}
              rows={3}
            />
          </div>

          {/* Action Items */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('actionItemsLabel')}</label>
            <Textarea
              {...register('actionItems')}
              placeholder={t('actionItemsPlaceholder')}
              rows={3}
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('attendeesLabel')}</label>
            <Input
              {...register('attendees')}
              placeholder={t('attendeesPlaceholder')}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('statusLabel')}</label>
            <Select
              value={status}
              onValueChange={(value) => setValue('status', value as 'PLANNED' | 'DONE' | 'CANCELLED')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">{t('statusPlanned')}</SelectItem>
                <SelectItem value="DONE">{t('statusDone')}</SelectItem>
                <SelectItem value="CANCELLED">{t('statusCancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Recurring Meeting Options */}
          <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => {
                  setIsRecurring(checked === true)
                  setValue('isRecurring', checked === true)
                }}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer">
                🔁 Tekrar Eden Randevu
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-indigo-300">
                {/* Recurrence Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tekrar Tipi</label>
                  <Select
                    value={watch('recurrenceType') || 'WEEKLY'}
                    onValueChange={(value) => setValue('recurrenceType', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Günlük</SelectItem>
                      <SelectItem value="WEEKLY">Haftalık</SelectItem>
                      <SelectItem value="MONTHLY">Aylık</SelectItem>
                      <SelectItem value="YEARLY">Yıllık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recurrence Interval */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Her {watch('recurrenceType') === 'DAILY' ? 'kaç günde' : 
                          watch('recurrenceType') === 'WEEKLY' ? 'kaç haftada' :
                          watch('recurrenceType') === 'MONTHLY' ? 'kaç ayda' : 'kaç yılda'} bir?
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    {...register('recurrenceInterval', { valueAsNumber: true })}
                    defaultValue={1}
                    disabled={loading}
                  />
                </div>

                {/* Weekly: Days of Week */}
                {watch('recurrenceType') === 'WEEKLY' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hangi Günler?</label>
                    <div className="grid grid-cols-7 gap-2">
                      {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <Checkbox
                            id={`day-${index}`}
                            checked={selectedDaysOfWeek.includes(index === 0 ? 0 : index)}
                            onCheckedChange={(checked) => {
                              const dayNum = index === 0 ? 0 : index
                              if (checked) {
                                const newDays = [...selectedDaysOfWeek, dayNum]
                                setSelectedDaysOfWeek(newDays)
                                setValue('recurrenceDaysOfWeek', newDays)
                              } else {
                                const newDays = selectedDaysOfWeek.filter(d => d !== dayNum)
                                setSelectedDaysOfWeek(newDays)
                                setValue('recurrenceDaysOfWeek', newDays)
                              }
                            }}
                          />
                          <label htmlFor={`day-${index}`} className="text-xs cursor-pointer">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* End Type: Date or Count */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitiş Şekli</label>
                  <Select
                    value={recurrenceEndType}
                    onValueChange={(value) => setRecurrenceEndType(value as 'date' | 'count')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Bitiş Tarihi</SelectItem>
                      <SelectItem value="count">Kaç Kez Tekrarlanacak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* End Date or Count */}
                {recurrenceEndType === 'date' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bitiş Tarihi</label>
                    <Input
                      type="date"
                      {...register('recurrenceEndDate')}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kaç Kez Tekrarlanacak?</label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      {...register('recurrenceCount', { valueAsNumber: true })}
                      placeholder="Örn: 10"
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
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
              className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? t('saving') : meeting ? t('update') : t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    
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
}

