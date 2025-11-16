'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Edit, Trash2, Globe, TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import DetailModal from '@/components/ui/DetailModal'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'
import { formatCurrency } from '@/lib/utils'
import { toast, confirm } from '@/lib/toast'
import dynamic from 'next/dynamic'

const CompetitorForm = dynamic(() => import('./CompetitorForm'), {
  ssr: false,
  loading: () => null,
})

interface CompetitorDetailModalProps {
  competitorId: string | null
  open: boolean
  onClose: () => void
  initialData?: any
}

export default function CompetitorDetailModal({
  competitorId,
  open,
  onClose,
  initialData,
}: CompetitorDetailModalProps) {
  const router = useRouter()
  const locale = useLocale()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: competitor, isLoading, error, mutate: mutateCompetitor } = useData<any>(
    competitorId && open ? `/api/competitors/${competitorId}` : null,
    {
      dedupingInterval: 5000,
      revalidateOnFocus: false,
      fallbackData: initialData,
    }
  )

  // İlgili Deal'ları çek
  const { data: relatedDeals = [] } = useData<any[]>(
    competitorId && open ? `/api/deals?competitorId=${competitorId}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  const displayCompetitor = competitor || initialData

  const handleDelete = async () => {
    if (!displayCompetitor || !confirm(`${displayCompetitor.name} rakip kaydını silmek istediğinize emin misiniz?`)) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/competitors/${competitorId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }

      toast.success('Rakip silindi', `${displayCompetitor.name} başarıyla silindi.`)
      
      await mutate('/api/competitors')
      await mutate(`/api/competitors/${competitorId}`)
      
      onClose()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', error?.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  // Strengths ve weaknesses array'i string'e çevir
  const strengthsArray = Array.isArray(displayCompetitor?.strengths) 
    ? displayCompetitor.strengths 
    : displayCompetitor?.strengths 
      ? [displayCompetitor.strengths] 
      : []
  
  const weaknessesArray = Array.isArray(displayCompetitor?.weaknesses) 
    ? displayCompetitor.weaknesses 
    : displayCompetitor?.weaknesses 
      ? [displayCompetitor.weaknesses] 
      : []

  if (!open) return null

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={displayCompetitor?.name || 'Rakip Detayları'}
        isLoading={isLoading}
        error={error}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
      >
        {displayCompetitor && (
          <div className="space-y-6">
            {/* Competitor Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Temel Bilgiler */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-500" />
                  Temel Bilgiler
                </h2>
                <div className="space-y-4">
                  {displayCompetitor.description && (
                    <div>
                      <p className="text-sm text-gray-600">Açıklama</p>
                      <p className="font-medium mt-1">{displayCompetitor.description}</p>
                    </div>
                  )}
                  {displayCompetitor.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={displayCompetitor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {displayCompetitor.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
                    <p className="font-medium mt-1">
                      {new Date(displayCompetitor.createdAt).toLocaleDateString('tr-TR')}
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
                    {strengthsArray.map((strength: string, index: number) => (
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
                    {weaknessesArray.map((weakness: string, index: number) => (
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
                  {displayCompetitor.pricingStrategy && (
                    <div>
                      <p className="text-sm text-gray-600">Strateji</p>
                      <p className="font-medium mt-1">{displayCompetitor.pricingStrategy}</p>
                    </div>
                  )}
                  {displayCompetitor.averagePrice !== null && displayCompetitor.averagePrice !== undefined && (
                    <div>
                      <p className="text-sm text-gray-600">Ortalama Fiyat</p>
                      <p className="font-medium mt-1 text-lg">
                        {formatCurrency(displayCompetitor.averagePrice)}
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
                {displayCompetitor.marketShare !== null && displayCompetitor.marketShare !== undefined ? (
                  <div>
                    <p className="text-sm text-gray-600">Pazar Payı</p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full"
                            style={{ width: `${displayCompetitor.marketShare}%` }}
                          />
                        </div>
                        <span className="font-bold text-lg">{displayCompetitor.marketShare}%</span>
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
                          relatedDeals.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0)
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
                      {relatedDeals.map((deal: any) => (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onClose()
                                router.push(`/${locale}/deals/${deal.id}`)
                              }}
                            >
                              Görüntüle
                            </Button>
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
                entityId={competitorId || ''}
              />
            </Card>
          </div>
        )}
      </DetailModal>

      {/* Form Modal */}
      {formOpen && displayCompetitor && (
        <CompetitorForm
          competitor={displayCompetitor}
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            mutateCompetitor()
          }}
          onSuccess={async (savedCompetitor: any) => {
            await mutateCompetitor(savedCompetitor, { revalidate: false })
            await mutate('/api/competitors', undefined, { revalidate: true })
            toast.success('Rakip güncellendi', `${savedCompetitor.name} başarıyla güncellendi.`)
            setFormOpen(false)
          }}
        />
      )}
    </>
  )
}


