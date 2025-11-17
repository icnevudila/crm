'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Briefcase, FileText, Receipt, Trash2, User, Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DocumentList from '@/components/documents/DocumentList'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import dynamic from 'next/dynamic'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('@/components/customers/CustomerForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load DealForm - performans için
const DealForm = dynamic(() => import('@/components/deals/DealForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load QuoteForm - performans için
const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load MeetingForm - performans için
const MeetingForm = dynamic(() => import('@/components/meetings/MeetingForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load TaskForm - performans için
const TaskForm = dynamic(() => import('@/components/tasks/TaskForm'), {
  ssr: false,
  loading: () => null,
})

// Lazy load TicketForm - performans için
const TicketForm = dynamic(() => import('@/components/tickets/TicketForm'), {
  ssr: false,
  loading: () => null,
})

import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'
import { toastError, toastSuccess, toastWithUndo } from '@/lib/toast'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'
import { Video, Calendar as CalendarIcon } from 'lucide-react'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [dealFormOpen, setDealFormOpen] = useState(false)
  const [quoteFormOpen, setQuoteFormOpen] = useState(false)
  const [meetingFormOpen, setMeetingFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [ticketFormOpen, setTicketFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: customer, isLoading, error, mutate: mutateCustomer } = useData<any>(
    id ? `/api/customers/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-500">Müşteri bulunamadı</p>
        <Button onClick={() => router.push(`/${locale}/customers`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="customer"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={async () => {
          if (!confirm(`${customer.name} müşterisini silmek istediğinize emin misiniz?`)) {
            return
          }
          setDeleteLoading(true)
          try {
            const res = await fetch(`/api/customers/${id}`, {
              method: 'DELETE',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Silme işlemi başarısız')
            }
            router.push(`/${locale}/customers`)
          } catch (error: any) {
            toastError('Silme işlemi başarısız oldu', error?.message)
            throw error
          } finally {
            setDeleteLoading(false)
          }
        }}
        onDuplicate={async () => {
          try {
            const res = await fetch(`/api/customers/${id}/duplicate`, {
              method: 'POST',
            })
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}))
              throw new Error(errorData.error || 'Kopyalama işlemi başarısız')
            }
            const duplicatedCustomer = await res.json()
            toastSuccess('Müşteri kopyalandı')
            router.push(`/${locale}/customers/${duplicatedCustomer.id}`)
          } catch (error: any) {
            toastError('Kopyalama işlemi başarısız oldu', error?.message)
          }
        }}
        onCreateRelated={(type) => {
          if (type === 'deal') {
            setDealFormOpen(true) // Modal form aç
          } else if (type === 'quote') {
            setQuoteFormOpen(true) // Modal form aç
          } else if (type === 'meeting') {
            setMeetingFormOpen(true) // Modal form aç
          } else if (type === 'task') {
            setTaskFormOpen(true) // Modal form aç
          } else if (type === 'ticket') {
            setTicketFormOpen(true) // Modal form aç
          }
        }}
        onSendEmail={customer.email ? () => {
          // Email gönderme işlemi SendEmailButton ile yapılıyor
        } : undefined}
        onSendSms={customer.phone ? () => {
          // SMS gönderme işlemi SendSmsButton ile yapılıyor
        } : undefined}
        onSendWhatsApp={customer.phone ? () => {
          // WhatsApp gönderme işlemi SendWhatsAppButton ile yapılıyor
        } : undefined}
      />

      {/* Header - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 p-6 shadow-lg"
      >
        {/* Arka plan pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(99, 102, 241) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/${locale}/customers`)}
                className="bg-white/80 hover:bg-white shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
            {/* Logo - Premium Tasarım */}
            {customer.logoUrl ? (
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="relative w-20 h-20 rounded-xl bg-white border-2 border-indigo-200 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-indigo-100/50"
              >
                <Image
                  src={customer.logoUrl}
                  alt={customer.name}
                  width={80}
                  height={80}
                  className="object-cover"
                />
                {/* Glow efekti */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 pointer-events-none" />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg ring-4 ring-indigo-100/50"
              >
                <Building2 className="h-10 w-10 text-white" />
              </motion.div>
            )}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {customer.name}
              </h1>
              <p className="text-gray-600 mt-1 font-medium">Müşteri Detayları</p>
            </div>
          </div>
          <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/customers`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          {customer.email && (
            <SendEmailButton
              to={customer.email}
              subject={`Müşteri: ${customer.name}`}
              html={`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    Müşteri Bilgileri
                  </h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>Müşteri:</strong> ${customer.name}</p>
                    ${customer.email ? `<p><strong>E-posta:</strong> ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p><strong>Telefon:</strong> ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p><strong>Adres:</strong> ${customer.address}</p>` : ''}
                    ${customer.city ? `<p><strong>Şehir:</strong> ${customer.city}</p>` : ''}
                    ${customer.sector ? `<p><strong>Sektör:</strong> ${customer.sector}</p>` : ''}
                  </div>
                  <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                    Bu e-posta CRM Enterprise V3 sisteminden gönderilmiştir.
                  </p>
                </div>
              `}
            />
          )}
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${customer.name} müşterisini silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              
              // Optimistic update için müşteri bilgisini sakla
              const deletedCustomer = customer
              
              try {
                const res = await fetch(`/api/customers/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) throw new Error('Silme işlemi başarısız')
                
                // Başarı toast'ı - undo özelliği ile
                toastWithUndo(
                  `${deletedCustomer.name} müşterisi başarıyla silindi`,
                  async () => {
                    // Undo işlemi - müşteriyi geri yükle
                    try {
                      const restoreRes = await fetch(`/api/customers`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(deletedCustomer),
                      })
                      if (restoreRes.ok) {
                        toastSuccess('Müşteri geri yüklendi')
                        router.refresh()
                      } else {
                        toastError('Müşteri geri yüklenemedi')
                      }
                    } catch (error) {
                      toastError('Müşteri geri yüklenemedi')
                    }
                  }
                )
                
                router.push(`/${locale}/customers`)
              } catch (error: any) {
                toastError('Silme işlemi başarısız oldu', error?.message)
              } finally {
                setDeleteLoading(false)
              }
            }}
            disabled={deleteLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions - Premium Tasarım */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-gradient-to-br from-white to-gray-50 border-indigo-100 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hızlı İşlemler
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {customer.email && (
            <SendEmailButton
              to={customer.email}
              subject={`Müşteri: ${customer.name}`}
              html={`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                    Müşteri Bilgileri
                  </h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>Müşteri:</strong> ${customer.name}</p>
                    ${customer.email ? `<p><strong>E-posta:</strong> ${customer.email}</p>` : ''}
                    ${customer.phone ? `<p><strong>Telefon:</strong> ${customer.phone}</p>` : ''}
                    ${customer.address ? `<p><strong>Adres:</strong> ${customer.address}</p>` : ''}
                    ${customer.city ? `<p><strong>Şehir:</strong> ${customer.city}</p>` : ''}
                    ${customer.sector ? `<p><strong>Sektör:</strong> ${customer.sector}</p>` : ''}
                  </div>
                </div>
              `}
              category="CUSTOMER"
              entityData={customer}
            />
          )}
          {customer.phone && (
            <>
              <SendSmsButton
                to={customer.phone}
                message={`Merhaba ${customer.name}, size ulaşmak istiyoruz. Lütfen bize dönüş yapın.`}
              />
              <SendWhatsAppButton
                to={customer.phone}
                message={`Merhaba ${customer.name}, size ulaşmak istiyoruz. Lütfen bize dönüş yapın.`}
              />
            </>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setMeetingFormOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Toplantı Oluştur
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setDealFormOpen(true)}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Fırsat Oluştur
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setQuoteFormOpen(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Teklif Oluştur
          </Button>
        </div>
        </Card>
      </motion.div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İletişim Bilgileri</h2>
          <div className="space-y-3">
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{customer.address}</span>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customer.phone}</span>
              </div>
            )}
            {customer.fax && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">Faks: {customer.fax}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customer.email}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customer.city}</span>
              </div>
            )}
            {customer.sector && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{customer.sector}</span>
              </div>
            )}
            {customer.website && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {customer.website}
                </a>
              </div>
            )}
            {customer.taxNumber && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">Vergi No: {customer.taxNumber}</span>
              </div>
            )}
          </div>
        </Card>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Durum ve Bilgiler
              </h2>
            </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600">Durum:</span>
              <Badge
                className={
                  customer.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 ml-2'
                    : 'bg-red-100 text-red-800 ml-2'
                }
              >
                {customer.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-gray-600">Oluşturulma:</span>
              <span className="ml-2 text-gray-700">
                {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
            {customer.CreatedByUser && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Oluşturan:</span>
                  <span className="ml-2 text-gray-700 font-medium">
                    {customer.CreatedByUser.name}
                  </span>
                </div>
              </div>
            )}
            {customer.updatedAt && (
              <div>
                <span className="text-sm text-gray-600">Son Güncelleme:</span>
                <span className="ml-2 text-gray-700">
                  {new Date(customer.updatedAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
            {customer.UpdatedByUser && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600">Son Güncelleyen:</span>
                  <span className="ml-2 text-gray-700 font-medium">
                    {customer.UpdatedByUser.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
        </motion.div>

        {/* Notes Card - Premium Tasarım */}
        {customer.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2"
          >
            <Card className="p-6 bg-gradient-to-br from-white to-amber-50/30 border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-amber-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Notlar
                </h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
            </Card>
          </motion.div>
        )}

        {/* Finansal Özet */}
        {customer.Invoice && customer.Invoice.length > 0 && (() => {
          const paidInvoices = customer.Invoice.filter((inv: any) => inv.status === 'PAID')
          const pendingInvoices = customer.Invoice.filter((inv: any) => inv.status === 'SENT' || inv.status === 'OVERDUE')
          const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
          const pendingPayments = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || inv.total || 0), 0)
          const lastPaymentDate = paidInvoices.length > 0 
            ? paidInvoices.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt
            : null
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Finansal Özet
                    </h2>
                  </div>
                <Link href={`/${locale}/finance?customerId=${id}`}>
                  <Button variant="outline" size="sm">
                    Tüm Finans Kayıtları →
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {paidInvoices.length} ödenmiş fatura
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(pendingPayments)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pendingInvoices.length} bekleyen fatura
                  </p>
                </div>
                {lastPaymentDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Son Ödeme</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(lastPaymentDate).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.ceil((new Date().getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24))} gün önce
                    </p>
                  </div>
                )}
              </div>
            </Card>
            </motion.div>
          )
        })()}
      </div>

      {/* Related Data */}
      {customer.Deal && customer.Deal.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İlgili Fırsatlar</h2>
          <div className="space-y-2">
            {customer.Deal.map((deal: any) => (
              <Link
                key={deal.id}
                href={`/${locale}/deals/${deal.id}`}
                className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{deal.title}</span>
                  <Badge>{deal.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* İlişkili Veriler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fırsatlar */}
        {customer.Deal && customer.Deal.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                Fırsatlar ({customer.Deal.length})
              </h2>
              {customer.Deal.length > 5 && (
                <Link href={`/${locale}/deals?customerId=${id}`}>
                  <Button variant="outline" size="sm">Tümünü Gör</Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {customer.Deal.slice(0, 5).map((deal: any) => (
                <Link
                  key={deal.id}
                  href={`/${locale}/deals/${deal.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-gray-600">{deal.stage}</p>
                    </div>
                    <Badge>{deal.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Teklifler */}
        {customer.Quote && customer.Quote.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Teklifler ({customer.Quote.length})
              </h2>
              {customer.Quote.length > 5 && (
                <Link href={`/${locale}/quotes?customerId=${id}`}>
                  <Button variant="outline" size="sm">Tümünü Gör</Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {customer.Quote.slice(0, 5).map((quote: any) => (
                <Link
                  key={quote.id}
                  href={`/${locale}/quotes/${quote.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{quote.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(quote.total || 0)}
                      </p>
                    </div>
                    <Badge>{quote.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Faturalar */}
        {customer.Invoice && customer.Invoice.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                Faturalar ({customer.Invoice.length})
              </h2>
              {customer.Invoice.length > 5 && (
                <Link href={`/${locale}/invoices?customerId=${id}`}>
                  <Button variant="outline" size="sm">Tümünü Gör</Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {customer.Invoice.slice(0, 5).map((invoice: any) => (
                <Link
                  key={invoice.id}
                  href={`/${locale}/invoices/${invoice.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{invoice.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(invoice.total || 0)}
                      </p>
                    </div>
                    <Badge>{invoice.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Sevkiyatlar */}
        {customer.Shipment && customer.Shipment.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Sevkiyatlar ({customer.Shipment.length})
              </h2>
              {customer.Shipment.length > 5 && (
                <Link href={`/${locale}/shipments?customerId=${id}`}>
                  <Button variant="outline" size="sm">Tümünü Gör</Button>
                </Link>
              )}
            </div>
            <div className="space-y-2">
              {customer.Shipment.slice(0, 5).map((shipment: any) => (
                <Link
                  key={shipment.id}
                  href={`/${locale}/shipments/${shipment.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{shipment.tracking || 'Sevkiyat'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <Badge>{shipment.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Document List */}
      <DocumentList relatedTo="Customer" relatedId={id} />

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline entityType="Customer" entityId={id} />
      </Card>

      {/* Comments & Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CommentsSection entityType="Customer" entityId={id} />
        <FileUpload entityType="Customer" entityId={id} />
      </div>

      {/* Form Modals */}
      <CustomerForm
        customer={customer}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedCustomer: any) => {
          // Form başarılı olduğunda cache'i güncelle (sayfa reload yok)
          // Optimistic update - güncellenmiş customer'ı cache'e ekle
          await mutateCustomer(savedCustomer, { revalidate: false })
          
          // Tüm ilgili cache'leri güncelle
          await Promise.all([
            mutate('/api/customers', undefined, { revalidate: true }),
            mutate('/api/customers?', undefined, { revalidate: true }),
            mutate((key: string) => typeof key === 'string' && key.startsWith('/api/customers'), undefined, { revalidate: true }),
          ])
        }}
      />

      <DealForm
        open={dealFormOpen}
        onClose={() => setDealFormOpen(false)}
        onSuccess={async (savedDeal) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          // Toast zaten DealForm içinde gösteriliyor (navigateToDetailToast)
        }}
        customerId={id}
      />

      <QuoteForm
        open={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        onSuccess={async (savedQuote) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          // Toast zaten QuoteForm içinde gösteriliyor (navigateToDetailToast)
        }}
        customerId={id}
      />

      <MeetingForm
        open={meetingFormOpen}
        onClose={() => setMeetingFormOpen(false)}
        onSuccess={async (savedMeeting) => {
          // Cache'i güncelle - optimistic update
          await mutateCustomer(undefined, { revalidate: true })
          // Toast zaten MeetingForm içinde gösteriliyor (navigateToDetailToast)
        }}
        customerId={id}
        customerCompanyId={customer.companyId}
        customerCompanyName={customer.name}
      />

      <TaskForm
        task={undefined}
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        customerName={customer.name}
        onSuccess={async (savedTask) => {
          await mutateCustomer(undefined, { revalidate: true })
          setTaskFormOpen(false)
        }}
      />

      <TicketForm
        ticket={undefined}
        open={ticketFormOpen}
        onClose={() => setTicketFormOpen(false)}
        customerId={id}
        onSuccess={async (savedTicket) => {
          await mutateCustomer(undefined, { revalidate: true })
          setTicketFormOpen(false)
        }}
      />
    </div>
  )
}