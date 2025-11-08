'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Users, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import dynamic from 'next/dynamic'

// Lazy load DealForm - performans için
const DealForm = dynamic(() => import('@/components/deals/DealForm'), {
  ssr: false,
  loading: () => null,
})

async function fetchDeal(id: string) {
  const res = await fetch(`/api/deals/${id}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Fırsat yüklenirken bir hata oluştu')
  }
  return res.json()
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
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

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: deal, isLoading, error, refetch } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => fetchDeal(id),
    retry: 1,
    retryDelay: 500,
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !deal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Fırsat Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Fırsat yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/deals`)}>
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
            onClick={() => router.push(`/${locale}/deals`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deal.title}</h1>
            <p className="mt-1 text-gray-600">
              Oluşturulma: {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (!confirm(`${deal.title} fırsatını silmek istediğinize emin misiniz?`)) {
                return
              }
              setDeleteLoading(true)
              try {
                const res = await fetch(`/api/deals/${id}`, {
                  method: 'DELETE',
                })
                if (!res.ok) throw new Error('Silme işlemi başarısız')
                router.push(`/${locale}/deals`)
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
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Aşama</p>
          <Badge className={stageColors[deal.stage] || 'bg-gray-100'}>
            {stageLabels[deal.stage] || deal.stage}
          </Badge>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Değer</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(deal.value || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-card p-6">
          <p className="text-sm text-gray-600 mb-1">Durum</p>
          <Badge variant={deal.status === 'OPEN' ? 'default' : 'secondary'}>
            {deal.status === 'OPEN' ? 'Açık' : 'Kapalı'}
          </Badge>
        </div>
      </div>

      {/* Deal Details */}
      {(deal.description || deal.winProbability || deal.expectedCloseDate) && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Fırsat Detayları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deal.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Açıklama</p>
                <p className="text-gray-900 whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}
            {deal.winProbability !== undefined && deal.winProbability !== null && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Kazanma Olasılığı</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        deal.winProbability >= 70
                          ? 'bg-green-600'
                          : deal.winProbability >= 40
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${deal.winProbability}%` }}
                    />
                  </div>
                  <span className="font-medium">{deal.winProbability}%</span>
                </div>
              </div>
            )}
            {deal.expectedCloseDate && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Beklenen Kapanış Tarihi</p>
                <p className="font-medium">{new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Fırsat ID</span>
            <span className="font-mono text-sm">{deal.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Müşteri</span>
            {deal.Customer ? (
              <Link href={`/${locale}/customers/${deal.Customer.id}`} className="text-primary-600 hover:underline">
                {deal.Customer.name}
              </Link>
            ) : (
              <span>-</span>
            )}
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Oluşturulma Tarihi</span>
            <span>{new Date(deal.createdAt).toLocaleString('tr-TR')}</span>
          </div>
          {deal.updatedAt && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Güncellenme Tarihi</span>
              <span>{new Date(deal.updatedAt).toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* İlişkili Veriler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        {deal.Customer && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Müşteri
              </h2>
            </div>
            {deal.Customer.id ? (
              <Link
                href={`/${locale}/customers/${deal.Customer.id}`}
                className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{deal.Customer.name}</p>
                {deal.Customer.email && (
                  <p className="text-sm text-gray-600 mt-1">{deal.Customer.email}</p>
                )}
              </Link>
            ) : (
              <p className="text-gray-500 text-center py-4">Müşteri bilgisi yok</p>
            )}
          </Card>
        )}

        {/* Quotes */}
        {deal.Quote && deal.Quote.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Teklifler ({deal.Quote.length})
              </h2>
            </div>
            <div className="space-y-3">
              {deal.Quote.map((quote: any) => (
                <Link
                  key={quote.id}
                  href={`/${locale}/quotes/${quote.id}`}
                  className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{quote.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={statusColors[quote.status] || 'bg-gray-100'}>
                      {statusLabels[quote.status] || quote.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(quote.total || 0)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Timeline */}
      {deal.activities && deal.activities.length > 0 && (
        <ActivityTimeline activities={deal.activities} />
      )}

      {/* Form Modal */}
      <DealForm
        deal={deal}
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

