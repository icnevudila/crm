'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Globe, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import CompetitorForm from '@/components/competitors/CompetitorForm'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { toastError, toastSuccess } from '@/lib/toast'
import ContextualActionsBar from '@/components/ui/ContextualActionsBar'

interface Competitor {
  id: string
  name: string
  description?: string | null
  website?: string | null
  strengths?: string[] | null
  weaknesses?: string[] | null
  pricingStrategy?: string | null
  averagePrice?: number | null
  marketShare?: number | null
  createdAt: string
  updatedAt?: string
}

export default function CompetitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // useData hook ile veri çekme (SWR cache) - standardize edilmiş veri çekme stratejisi
  const { data: competitor, isLoading, error, mutate: mutateCompetitor } = useData<Competitor>(
    id ? `/api/competitors/${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache (detay sayfası için optimal)
      revalidateOnFocus: false, // Focus'ta revalidate yapma (instant navigation)
    }
  )

  // İlgili Deal'ları çek (bu rakip ile rekabet edilen fırsatlar)
  const { data: relatedDeals = [] } = useData<any[]>(
    id ? `/api/deals?competitorId=${id}` : null,
    {
      dedupingInterval: 30000, // 30 saniye cache
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !competitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-gray-500">Rakip bulunamadı</p>
        <Button onClick={() => router.push(`/${locale}/competitors`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri Dön
        </Button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`${competitor.name} rakip kaydını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete competitor')
      }

      // Cache'i temizle
      await mutate('/api/competitors')
      await mutate(`/api/competitors/${id}`)

      toastSuccess('Rakip başarıyla silindi')
      router.push(`/${locale}/competitors`)
    } catch (error: any) {
      console.error('Delete error:', error)
      toastError(error?.message || 'Silme işlemi başarısız oldu')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    mutateCompetitor() // Veriyi yenile
  }

  // Strengths ve weaknesses array'i string'e çevir
  const strengthsArray = Array.isArray(competitor.strengths) 
    ? competitor.strengths 
    : competitor.strengths 
      ? [competitor.strengths] 
      : []
  
  const weaknessesArray = Array.isArray(competitor.weaknesses) 
    ? competitor.weaknesses 
    : competitor.weaknesses 
      ? [competitor.weaknesses] 
      : []

  return (
    <div className="space-y-6">
      {/* Contextual Actions Bar */}
      <ContextualActionsBar
        entityType="competitor"
        entityId={id}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/competitors`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{competitor.name}</h1>
            <p className="mt-1 text-gray-600">Rakip Analizi</p>
          </div>
        </div>
      </div>

      {/* Competitor Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Temel Bilgiler */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            Temel Bilgiler
          </h2>
          <div className="space-y-4">
            {competitor.description && (
              <div>
                <p className="text-sm text-gray-600">Açıklama</p>
                <p className="font-medium mt-1">{competitor.description}</p>
              </div>
            )}
            {competitor.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {competitor.website}
                </a>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(competitor.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Güçlü Yönler */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Güçlü Yönler
          </h2>
          {strengthsArray.length > 0 ? (
            <ul className="space-y-2">
              {strengthsArray.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Güçlü yön bilgisi eklenmemiş</p>
          )}
        </Card>

        {/* Zayıf Yönler */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Zayıf Yönler
          </h2>
          {weaknessesArray.length > 0 ? (
            <ul className="space-y-2">
              {weaknessesArray.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">✗</span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">Zayıf yön bilgisi eklenmemiş</p>
          )}
        </Card>

        {/* Fiyatlandırma Stratejisi */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            Fiyatlandırma
          </h2>
          <div className="space-y-4">
            {competitor.pricingStrategy && (
              <div>
                <p className="text-sm text-gray-600">Strateji</p>
                <p className="font-medium mt-1">{competitor.pricingStrategy}</p>
              </div>
            )}
            {competitor.averagePrice !== null && competitor.averagePrice !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Ortalama Fiyat</p>
                <p className="font-medium mt-1 text-lg">
                  {formatCurrency(competitor.averagePrice)}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Pazar Payı */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Pazar Analizi
          </h2>
          {competitor.marketShare !== null && competitor.marketShare !== undefined ? (
            <div>
              <p className="text-sm text-gray-600">Pazar Payı</p>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${competitor.marketShare}%` }}
                    />
                  </div>
                  <span className="font-bold text-lg">{competitor.marketShare}%</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Pazar payı bilgisi eklenmemiş</p>
          )}
        </Card>

        {/* İstatistikler */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            İstatistikler
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">İlgili Fırsatlar</p>
              <p className="font-bold text-2xl mt-1">{relatedDeals.length}</p>
            </div>
            {relatedDeals.length > 0 && (
              <div>
                <p className="text-sm text-gray-600">Toplam Fırsat Değeri</p>
                <p className="font-bold text-lg mt-1">
                  {formatCurrency(
                    relatedDeals.reduce((sum, deal) => sum + (deal.value || 0), 0)
                  )}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* İlgili Deal'lar */}
      {relatedDeals.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">İlgili Fırsatlar</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Aşama</TableHead>
                  <TableHead>Değer</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{deal.stage || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(deal.value || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deal.status === 'WON'
                            ? 'default'
                            : deal.status === 'LOST'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {deal.status || 'OPEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                        <Button variant="ghost" size="sm">
                          Görüntüle
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Aktivite Geçmişi</h2>
        <ActivityTimeline
          entityType="Competitor"
          entityId={id}
        />
      </Card>

      {/* Form Modal */}
      <CompetitorForm
        competitor={competitor}
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={async (savedCompetitor: Competitor) => {
          // Optimistic update
          await mutateCompetitor(savedCompetitor, { revalidate: false })
          await mutate('/api/competitors', undefined, { revalidate: false })
          toastSuccess('Rakip başarıyla güncellendi')
          handleFormClose()
        }}
      />
    </div>
  )
}

