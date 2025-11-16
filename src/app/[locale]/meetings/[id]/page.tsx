'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useData } from '@/hooks/useData'
import { ArrowLeft, Edit, Trash2, Calendar, Building2, User, FileText, DollarSign, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { toastError } from '@/lib/toast'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import SendMeetingLinkButton from '@/components/integrations/SendMeetingLinkButton'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'

// Lazy load MeetingForm - performans için
const MeetingForm = dynamic(() => import('@/components/meetings/MeetingForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load QuoteForm - performans için
const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

interface Meeting {
  id: string
  title: string
  description?: string
  meetingDate: string
  meetingDuration?: number
  location?: string
  meetingType?: string
  meetingUrl?: string
  meetingPassword?: string
  status: string
  expenseWarning?: boolean
  companyId: string
  customerId?: string
  dealId?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
  Customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  Deal?: {
    id: string
    title: string
    stage?: string
    value?: number
  }
  CreatedBy?: {
    id: string
    name: string
    email?: string
  }
  Company?: {
    id: string
    name: string
  }
  expenses?: any[]
  expenseBreakdown?: {
    fuel: number
    accommodation: number
    food: number
    other: number
    total: number
  }
  totalExpense?: number
  activities?: any[]
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const id = params.id as string
  const locale = useLocale()
  const [editMode, setEditMode] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)

  const { data: meeting, isLoading, error, mutate } = useData<Meeting>(`/api/meetings/${id}`, {
    dedupingInterval: 0,
    revalidateOnFocus: true,
  })

  if (isLoading) {
    return <SkeletonList />
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-lg text-gray-600">Görüşme bulunamadı</p>
        <Button onClick={() => router.push(`/${locale}/meetings`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Görüşmelere Dön
        </Button>
      </div>
    )
  }

  const canEdit = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' || meeting.createdBy === session?.user?.id

  const statusColors: Record<string, string> = {
    PLANNED: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    PLANNED: 'Planlandı',
    DONE: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
  }

  const handleDelete = async () => {
    if (!confirm(`${meeting.title} görüşmesini silmek istediğinize emin misiniz?`)) {
      return
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Silme işlemi başarısız oldu')
      }

      router.push(`/${locale}/meetings`)
    } catch (error: any) {
      toastError('Silme işlemi başarısız oldu', error?.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="meeting"
        entityId={id}
        onEdit={canEdit ? () => {
          setEditMode(true)
          setFormOpen(true)
        } : undefined}
        onDelete={canEdit ? handleDelete : undefined}
        onSendEmail={meeting.Customer?.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={meeting.Customer?.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={meeting.Customer?.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
        onAddToCalendar={() => {
          // Takvime ekleme işlemi AddToCalendarButton ile yapılıyor
        }}
        canEdit={canEdit}
        canDelete={canEdit}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/meetings`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="mt-2 text-gray-600">
              {new Date(meeting.meetingDate).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && !editMode && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(true)
                  setFormOpen(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
              {meeting.Customer?.email && (
                <SendEmailButton
                  to={meeting.Customer.email}
                  subject={`Toplantı: ${meeting.title}`}
                  html={`
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                        Toplantı Bilgileri
                      </h2>
                      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Toplantı:</strong> ${meeting.title}</p>
                        <p><strong>Tarih:</strong> ${new Date(meeting.meetingDate).toLocaleString('tr-TR')}</p>
                        ${meeting.location ? `<p><strong>Konum:</strong> ${meeting.location}</p>` : ''}
                        ${meeting.description ? `<p><strong>Açıklama:</strong><br>${meeting.description.replace(/\n/g, '<br>')}</p>` : ''}
                      </div>
                      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                        Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                      </p>
                    </div>
                  `}
                  category="GENERAL"
                  entityData={meeting}
                />
              )}
              {meeting.Customer?.phone && (
                <>
                  <SendSmsButton
                    to={meeting.Customer.phone.startsWith('+') 
                      ? meeting.Customer.phone 
                      : `+${meeting.Customer.phone.replace(/\D/g, '')}`}
                    message={`Merhaba, ${meeting.title} toplantısı ${new Date(meeting.meetingDate).toLocaleString('tr-TR')} tarihinde planlanmıştır.`}
                  />
                  <SendWhatsAppButton
                    to={meeting.Customer.phone.startsWith('+') 
                      ? meeting.Customer.phone 
                      : `+${meeting.Customer.phone.replace(/\D/g, '')}`}
                    message={`Merhaba, ${meeting.title} toplantısı ${new Date(meeting.meetingDate).toLocaleString('tr-TR')} tarihinde planlanmıştır.`}
                  />
                </>
              )}
              <AddToCalendarButton
                recordType="meeting"
                record={meeting}
                startTime={meeting.meetingDate}
                endTime={meeting.meetingDuration 
                  ? new Date(new Date(meeting.meetingDate).getTime() + meeting.meetingDuration * 60000).toISOString()
                  : meeting.meetingDate}
                location={meeting.location}
                attendees={meeting.Customer?.email ? [{ email: meeting.Customer.email, displayName: meeting.Customer.name }] : undefined}
              />
              {meeting.meetingUrl && (
                <SendMeetingLinkButton
                  meetingUrl={meeting.meetingUrl}
                  meetingTitle={meeting.title}
                  meetingDate={meeting.meetingDate}
                  meetingDuration={meeting.meetingDuration}
                  meetingPassword={meeting.meetingPassword}
                  meetingType={meeting.meetingType as any}
                  customerEmail={meeting.Customer?.email}
                  customerPhone={meeting.Customer?.phone}
                  customerName={meeting.Customer?.name}
                />
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <Badge className={statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[meeting.status] || meeting.status}
        </Badge>
      </div>

      {/* Quick Actions */}
      {meeting.Customer && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {meeting.Customer.email && (
              <SendEmailButton
                to={meeting.Customer.email}
                subject={`Toplantı: ${meeting.title}`}
                html={`
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                      Toplantı Bilgileri
                    </h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                      <p><strong>Toplantı:</strong> ${meeting.title}</p>
                      <p><strong>Tarih:</strong> ${new Date(meeting.meetingDate).toLocaleString('tr-TR')}</p>
                      ${meeting.location ? `<p><strong>Konum:</strong> ${meeting.location}</p>` : ''}
                      ${meeting.description ? `<p><strong>Açıklama:</strong><br>${meeting.description.replace(/\n/g, '<br>')}</p>` : ''}
                      ${meeting.meetingUrl ? `<p><strong>Toplantı Linki:</strong> <a href="${meeting.meetingUrl}" style="color: #6366f1;">${meeting.meetingUrl}</a></p>` : ''}
                      ${meeting.meetingPassword ? `<p><strong>Şifre:</strong> ${meeting.meetingPassword}</p>` : ''}
                    </div>
                  </div>
                `}
                category="GENERAL"
                entityData={meeting}
              />
            )}
            {meeting.Customer.phone && (
              <>
                <SendSmsButton
                  to={meeting.Customer.phone.startsWith('+') 
                    ? meeting.Customer.phone 
                    : `+${meeting.Customer.phone.replace(/\D/g, '')}`}
                  message={`Merhaba, ${meeting.title} toplantısı ${new Date(meeting.meetingDate).toLocaleString('tr-TR')} tarihinde planlanmıştır.${meeting.meetingUrl ? ` Toplantı linki: ${meeting.meetingUrl}` : ''}`}
                />
                <SendWhatsAppButton
                  to={meeting.Customer.phone.startsWith('+') 
                    ? meeting.Customer.phone 
                    : `+${meeting.Customer.phone.replace(/\D/g, '')}`}
                  message={`Merhaba, ${meeting.title} toplantısı ${new Date(meeting.meetingDate).toLocaleString('tr-TR')} tarihinde planlanmıştır.${meeting.meetingUrl ? ` Toplantı linki: ${meeting.meetingUrl}` : ''}`}
                />
              </>
            )}
            <AddToCalendarButton
              recordType="meeting"
              record={meeting}
              startTime={meeting.meetingDate}
              endTime={meeting.meetingDuration 
                ? new Date(new Date(meeting.meetingDate).getTime() + meeting.meetingDuration * 60000).toISOString()
                : meeting.meetingDate}
              location={meeting.location}
              attendees={meeting.Customer?.email ? [{ email: meeting.Customer.email, displayName: meeting.Customer.name }] : undefined}
            />
            {meeting.meetingUrl && (
              <SendMeetingLinkButton
                meetingUrl={meeting.meetingUrl}
                meetingTitle={meeting.title}
                meetingDate={meeting.meetingDate}
                meetingDuration={meeting.meetingDuration}
                meetingPassword={meeting.meetingPassword}
                meetingType={meeting.meetingType as any}
                customerEmail={meeting.Customer?.email}
                customerPhone={meeting.Customer?.phone}
                customerName={meeting.Customer?.name}
              />
            )}
            {meeting.dealId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(`/${locale}/deals/${meeting.dealId}`, '_blank')
                }}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Fırsatı Görüntüle
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Görüşme Notu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Görüşme Notu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {meeting.description || 'Not eklenmemiş'}
              </p>
            </CardContent>
          </Card>

          {/* İlgili Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>İlgili Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.Company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Firma</p>
                    <Link
                      href={`/${locale}/companies/${meeting.companyId}`}
                      className="text-primary-600 hover:underline"
                    >
                      {meeting.Company.name}
                    </Link>
                  </div>
                </div>
              )}
              {meeting.Customer && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Müşteri</p>
                    <Link
                      href={`/${locale}/customers/${meeting.customerId}`}
                      className="text-primary-600 hover:underline"
                    >
                      {meeting.Customer.name}
                    </Link>
                  </div>
                </div>
              )}
              {meeting.Deal && (
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fırsat</p>
                    <Link
                      href={`/${locale}/deals/${meeting.dealId}`}
                      className="text-primary-600 hover:underline"
                    >
                      {meeting.Deal.title}
                    </Link>
                  </div>
                </div>
              )}
              {meeting.location && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Konum</p>
                    <p className="text-gray-900">{meeting.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Giderler */}
          {meeting.expenseBreakdown && meeting.expenseBreakdown.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Görüşme Giderleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meeting.expenseBreakdown.fuel > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Araç Yakıt:</span>
                    <span className="font-semibold">{formatCurrency(meeting.expenseBreakdown.fuel)}</span>
                  </div>
                )}
                {meeting.expenseBreakdown.accommodation > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Konaklama:</span>
                    <span className="font-semibold">{formatCurrency(meeting.expenseBreakdown.accommodation)}</span>
                  </div>
                )}
                {meeting.expenseBreakdown.food > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yemek:</span>
                    <span className="font-semibold">{formatCurrency(meeting.expenseBreakdown.food)}</span>
                  </div>
                )}
                {meeting.expenseBreakdown.other > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diğer:</span>
                    <span className="font-semibold">{formatCurrency(meeting.expenseBreakdown.other)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold text-gray-900">Toplam:</span>
                  <span className="font-bold text-primary-600">{formatCurrency(meeting.expenseBreakdown.total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gider Uyarısı */}
          {meeting.expenseWarning && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">Gider Uyarısı</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 mb-4">
                  Bu görüşme için operasyon gideri girilmemiş görünüyor.
                </p>
                <Button
                  onClick={() => router.push(`/${locale}/finance?relatedTo=Meeting&relatedId=${meeting.id}`)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Gider Ekle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Hızlı Eylemler */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı Eylemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/${locale}/finance?relatedTo=Meeting&relatedId=${meeting.id}`)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Gider Ekle
              </Button>
              {meeting.customerId && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setQuoteFormOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Teklif Oluştur
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Oluşturan */}
          {meeting.CreatedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Oluşturan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{meeting.CreatedBy.name}</p>
                {meeting.CreatedBy.email && (
                  <p className="text-sm text-gray-500">{meeting.CreatedBy.email}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {formOpen && (
        <MeetingForm
          meeting={meeting}
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setEditMode(false)
          }}
          onSuccess={async (savedMeeting) => {
            await mutate()
            setFormOpen(false)
            setEditMode(false)
          }}
        />
      )}

      {/* Quote Form Modal */}
      <QuoteForm
        quote={undefined}
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onSuccess={async (savedQuote: any) => {
          // Cache'i güncelle - optimistic update
          await mutate(undefined, { revalidate: true })
          setQuoteFormOpen(false)
          // Başarılı kayıt sonrası teklif detay sayfasına yönlendir
          router.push(`/${locale}/quotes/${savedQuote.id}`)
        }}
        dealId={meeting.dealId}
        customerId={meeting.customerId}
        customerCompanyId={meeting.companyId}
      />
    </div>
  )
}

