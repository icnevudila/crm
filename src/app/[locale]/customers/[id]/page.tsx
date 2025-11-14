'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, Briefcase, FileText, Receipt, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import CommentsSection from '@/components/ui/CommentsSection'
import FileUpload from '@/components/ui/FileUpload'
import dynamic from 'next/dynamic'

// Lazy load CustomerForm - performans için
const CustomerForm = dynamic(() => import('@/components/customers/CustomerForm'), {
  ssr: false,
  loading: () => null,
})

import SendEmailButton from '@/components/integrations/SendEmailButton'
import { toastError, toastSuccess, toastWithUndo } from '@/lib/toast'

async function fetchCustomer(id: string) {
  const res = await fetch(`/api/customers/${id}`)
  if (!res.ok) throw new Error('Failed to fetch customer')
  return res.json()
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomer(id),
  })

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/customers`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-1">Müşteri Detayları</p>
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

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Durum</h2>
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
          </div>
        </Card>
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

      {/* Activity Timeline */}
      {customer.activities && customer.activities.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
          <ActivityTimeline activities={customer.activities} />
        </Card>
      )}

      {/* Comments & Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CommentsSection entityType="Customer" entityId={id} />
        <FileUpload entityType="Customer" entityId={id} />
      </div>

      {/* Form Modal */}
      <CustomerForm
        customer={customer}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async () => {
          setFormOpen(false)
          await refetch()
        }}
      />
    </div>
  )
}





