'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, FileText, Receipt, Package, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import dynamic from 'next/dynamic'

// Lazy load QuoteForm - performans için
const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

async function fetchQuote(id: string) {
  const res = await fetch(`/api/quotes/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Teklif yüklenirken bir hata oluştu')
  }
  return res.json()
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  DECLINED: 'bg-red-100 text-red-800',
  WAITING: 'bg-yellow-100 text-yellow-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  DECLINED: 'Reddedildi',
  WAITING: 'Beklemede',
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: quote, isLoading, error, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => fetchQuote(id),
    retry: 1,
    retryDelay: 500,
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !quote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Teklif Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Teklif yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/quotes`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
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
            onClick={() => router.push(`/${locale}/quotes`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quote.title}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            className="bg-gradient-primary text-white"
            onClick={() => {
              window.open(`/api/pdf/quote/${id}`, '_blank')
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF İndir
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${quote.title} teklifini silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/quotes/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) throw new Error('Silme işlemi başarısız')
                router.push(`/${locale}/quotes`)
              } catch (error: any) {
                alert(error?.message || 'Silme işlemi başarısız oldu')
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Durum</p>
          <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
            {statusLabels[quote.status] || quote.status}
          </Badge>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Toplam</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(quote.total || 0)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-600 mb-1">Fırsat</p>
          {quote.Deal ? (
            <Link href={`/${locale}/deals/${quote.Deal.id}`} className="text-lg font-semibold text-primary-600 hover:underline">
              {quote.Deal.title}
            </Link>
          ) : (
            <p className="text-lg font-semibold text-gray-900">-</p>
          )}
        </Card>
      </div>

      {/* Quote Details */}
      {quote.description || quote.validUntil || quote.discount || quote.taxRate ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Teklif Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quote.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                <p className="text-gray-900 whitespace-pre-wrap">{quote.description}</p>
              </div>
            )}
            {quote.validUntil && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Geçerlilik Tarihi</p>
                <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString('tr-TR')}</p>
              </div>
            )}
            {quote.discount > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">İndirim</p>
                <p className="font-medium">{quote.discount}%</p>
              </div>
            )}
            {quote.taxRate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">KDV Oranı</p>
                <p className="font-medium">{quote.taxRate}%</p>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      {/* Details */}
      <div className="bg-white rounded-lg shadow-card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Detaylar</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Teklif ID</span>
            <span className="font-mono text-sm">{quote.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Oluşturulma Tarihi</span>
            <span>{new Date(quote.createdAt).toLocaleString('tr-TR')}</span>
          </div>
          {quote.updatedAt && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Güncellenme Tarihi</span>
              <span>{new Date(quote.updatedAt).toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ürün Listesi */}
      {quote.quoteItems && quote.quoteItems.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ürünler ({quote.quoteItems.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ürün</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Miktar</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Birim Fiyat</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {quote.quoteItems.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.Product?.name || 'Ürün Bulunamadı'}
                        </p>
                        {item.Product?.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {item.Product.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium">{item.quantity || 1}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium">{formatCurrency(item.unitPrice || 0)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-primary-600">
                        {formatCurrency(item.total || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={3} className="py-3 px-4 text-right font-semibold">
                    Ara Toplam:
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-lg">
                    {formatCurrency(
                      quote.quoteItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* İlişkili Veriler */}
      {quote.Invoice && quote.Invoice.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Faturalar ({quote.Invoice.length})
            </h2>
          </div>
          <div className="space-y-3">
            {quote.Invoice.map((invoice: any) => (
              <Link
                key={invoice.id}
                href={`/${locale}/invoices/${invoice.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invoice.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[invoice.status] || 'bg-gray-100'}>
                        {statusLabels[invoice.status] || invoice.status}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(invoice.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* İlişkili Müşteri */}
      {quote.Deal?.Customer && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Müşteri
            </h2>
          </div>
          <Link
            href={`/${locale}/customers/${quote.Deal.Customer.id}`}
            className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <p className="font-medium text-gray-900">{quote.Deal.Customer.name}</p>
            {quote.Deal.Customer.email && (
              <p className="text-sm text-gray-600 mt-1">{quote.Deal.Customer.email}</p>
            )}
          </Link>
        </Card>
      )}

      {/* Activity Timeline */}
      {quote.activities && quote.activities.length > 0 && (
        <ActivityTimeline activities={quote.activities} />
      )}

      {/* Form Modal */}
      <QuoteForm
        quote={quote}
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

