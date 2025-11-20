'use client'

import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useData } from '@/hooks/useData'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Trash2, Calendar, Building2, User, FileText, DollarSign, Plus, Clock, MapPin, Video, Zap, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import { Badge } from '@/components/ui/badge'
import SkeletonList from '@/components/skeletons/SkeletonList'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatCurrency } from '@/lib/utils'
import { toast, toastError, confirm } from '@/lib/toast'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import SendMeetingLinkButton from '@/components/integrations/SendMeetingLinkButton'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import ActivityTimeline from '@/components/ui/ActivityTimeline'

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

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(139, 92, 246) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
                size="icon"
            onClick={() => router.push(`/${locale}/meetings`)}
                className="bg-white/80 hover:bg-white shadow-sm"
          >
                <ArrowLeft className="h-4 w-4" />
          </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-20 h-20 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg ring-4 ring-violet-100/50"
            >
              <Calendar className="h-10 w-10 text-white" />
            </motion.div>
          <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                {meeting.title}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge className={statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}>
                  {statusLabels[meeting.status] || meeting.status}
                </Badge>
                <p className="text-gray-600 font-medium">
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
                    </div>
        </div>
      </motion.div>

      {/* Quick Actions - Premium Tasarım */}
      {meeting.Customer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-violet-100 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Hızlı İşlemler
              </h2>
            </div>
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
              <Link href={`/${locale}/deals/${meeting.dealId}`} prefetch={true}>
                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    toast.info('Fırsata Yönlendiriliyor', { description: `"${meeting.Deal?.title || 'Fırsat'}" fırsatına yönlendiriliyor...` })
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Fırsatı Görüntüle
                </Button>
              </Link>
            )}
            {meeting.customerId && (
              <Link href={`/${locale}/customers/${meeting.customerId}`} prefetch={true}>
                <Button
                  variant="outline"
                  className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  onClick={() => {
                    toast.info('Müşteriye Yönlendiriliyor', { description: `"${meeting.Customer?.name || 'Müşteri'}" müşterisine yönlendiriliyor...` })
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Müşteriyi Görüntüle
                </Button>
              </Link>
            )}
          </div>
        </Card>
        </motion.div>
      )}

      {/* Main Content - Premium Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Görüşme Notu - Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GradientCard
              gradientFrom="from-amber-500"
              gradientTo="to-orange-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Görüşme Notu</h2>
              </div>
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <p className="text-white/90 whitespace-pre-wrap">
                {meeting.description || 'Not eklenmemiş'}
              </p>
              </div>
            </GradientCard>
          </motion.div>

          {/* İlgili Bilgiler - Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GradientCard
              gradientFrom="from-indigo-500"
              gradientTo="to-blue-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">İlgili Bilgiler</h2>
              </div>
              <div className="space-y-4">
              {meeting.Company && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Building2 className="h-5 w-5 text-white" />
                  <div>
                      <p className="text-sm text-white/80">Firma</p>
                    <Link
                      href={`/${locale}/companies/${meeting.companyId}`}
                        className="text-white font-semibold hover:underline"
                    >
                      {meeting.Company.name}
                    </Link>
                  </div>
                </div>
              )}
              {meeting.Customer && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <User className="h-5 w-5 text-white" />
                  <div>
                      <p className="text-sm text-white/80">Müşteri</p>
                    <Link
                      href={`/${locale}/customers/${meeting.customerId}`}
                        className="text-white font-semibold hover:underline"
                    >
                      {meeting.Customer.name}
                    </Link>
                      {meeting.Customer.email && (
                        <p className="text-sm text-white/70">{meeting.Customer.email}</p>
                      )}
                  </div>
                </div>
              )}
              {meeting.Deal && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-white" />
                  <div>
                      <p className="text-sm text-white/80">Fırsat</p>
                    <Link
                      href={`/${locale}/deals/${meeting.dealId}`}
                        className="text-white font-semibold hover:underline"
                    >
                      {meeting.Deal.title}
                    </Link>
                      {meeting.Deal.value && (
                        <p className="text-sm text-white/70">{formatCurrency(meeting.Deal.value)}</p>
                      )}
                  </div>
                </div>
              )}
              {meeting.location && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <MapPin className="h-5 w-5 text-white" />
                  <div>
                      <p className="text-sm text-white/80">Konum</p>
                      <p className="text-white font-semibold">{meeting.location}</p>
                    </div>
                  </div>
                )}
                {meeting.meetingDuration && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Clock className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-sm text-white/80">Süre</p>
                      <p className="text-white font-semibold">{meeting.meetingDuration} dakika</p>
                </div>
                  </div>
                )}
                {meeting.meetingUrl && (
                  <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <Video className="h-5 w-5 text-white" />
                    <div>
                      <p className="text-sm text-white/80">Toplantı Linki</p>
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-semibold hover:underline"
                      >
                        {meeting.meetingType || 'Video Toplantı'}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>
          </motion.div>

          {/* Giderler - Premium Card */}
          {meeting.expenseBreakdown && meeting.expenseBreakdown.total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GradientCard
                gradientFrom="from-emerald-500"
                gradientTo="to-teal-500"
                className="p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Görüşme Giderleri</h2>
                </div>
                <div className="space-y-3">
                  {meeting.expenseBreakdown.fuel > 0 && (
                    <div className="flex justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-white/90">Araç Yakıt:</span>
                      <span className="font-semibold text-white">{formatCurrency(meeting.expenseBreakdown.fuel)}</span>
                    </div>
                  )}
                  {meeting.expenseBreakdown.accommodation > 0 && (
                    <div className="flex justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-white/90">Konaklama:</span>
                      <span className="font-semibold text-white">{formatCurrency(meeting.expenseBreakdown.accommodation)}</span>
                    </div>
                  )}
                  {meeting.expenseBreakdown.food > 0 && (
                    <div className="flex justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-white/90">Yemek:</span>
                      <span className="font-semibold text-white">{formatCurrency(meeting.expenseBreakdown.food)}</span>
                  </div>
                )}
                {meeting.expenseBreakdown.other > 0 && (
                    <div className="flex justify-between p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <span className="text-white/90">Diğer:</span>
                      <span className="font-semibold text-white">{formatCurrency(meeting.expenseBreakdown.other)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-white/20">
                    <span className="font-bold text-white text-lg">Toplam:</span>
                    <span className="font-bold text-white text-lg">{formatCurrency(meeting.expenseBreakdown.total)}</span>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
          )}

          {/* Gider Uyarısı */}
          {meeting.expenseWarning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
              <CardHeader>
                  <CardTitle className="text-amber-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Gider Uyarısı
                  </CardTitle>
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
            </motion.div>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Hızlı Eylemler - Premium Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GradientCard
              gradientFrom="from-cyan-500"
              gradientTo="to-blue-500"
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Hızlı Eylemler</h2>
              </div>
              <div className="space-y-2">
              <Button
                variant="outline"
                  className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => router.push(`/${locale}/finance?relatedTo=Meeting&relatedId=${meeting.id}`)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Gider Ekle
              </Button>
              {meeting.customerId && (
                <Button
                  variant="outline"
                    className="w-full justify-start bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={() => setQuoteFormOpen(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Teklif Oluştur
                </Button>
              )}
              </div>
            </GradientCard>
          </motion.div>

          {/* Oluşturan - Premium Card */}
          {meeting.CreatedBy && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GradientCard
                gradientFrom="from-slate-500"
                gradientTo="to-gray-500"
                className="p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Oluşturan</h2>
                </div>
                <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-white font-semibold">{meeting.CreatedBy.name}</p>
                {meeting.CreatedBy.email && (
                    <p className="text-sm text-white/70 mt-1">{meeting.CreatedBy.email}</p>
                )}
                </div>
              </GradientCard>
            </motion.div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      {meeting.activities && meeting.activities.length > 0 && (
        <ActivityTimeline activities={meeting.activities} />
      )}

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

