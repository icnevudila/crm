'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'

interface Finance {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  relatedTo?: string
  createdAt: string
  updatedAt?: string
  activities?: any[]
}

async function fetchFinance(id: string): Promise<Finance> {
  const res = await fetch(`/api/finance/${id}`)
  if (!res.ok) throw new Error('Failed to fetch finance record')
  return res.json()
}

export default function FinanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string

  const { data: finance, isLoading } = useQuery({
    queryKey: ['finance', id],
    queryFn: () => fetchFinance(id),
  })

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (!finance) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Finans kaydı bulunamadı</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/finance`)}
        >
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
            onClick={() => router.push(`/${locale}/finance`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Finans Kaydı
            </h1>
            <p className="mt-1 text-gray-600">
              {finance.type === 'INCOME' ? 'Gelir' : 'Gider'} Detayları
            </p>
          </div>
        </div>
      </div>

      {/* Finance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Finans Bilgileri</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Tip</p>
              <Badge
                className={
                  finance.type === 'INCOME'
                    ? 'bg-green-100 text-green-800 mt-1'
                    : 'bg-red-100 text-red-800 mt-1'
                }
              >
                {finance.type === 'INCOME' ? 'Gelir' : 'Gider'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tutar</p>
              <p className="text-2xl font-bold mt-1">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(finance.amount)}
              </p>
            </div>
            {finance.relatedTo && (
              <div>
                <p className="text-sm text-gray-600">İlişkili</p>
                <p className="font-medium mt-1">{finance.relatedTo}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Kayıt ID</p>
              <p className="font-mono text-sm mt-1">{finance.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma Tarihi</p>
              <p className="font-medium mt-1">
                {new Date(finance.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>
            {finance.updatedAt && (
              <div>
                <p className="text-sm text-gray-600">Son Güncelleme</p>
                <p className="font-medium mt-1">
                  {new Date(finance.updatedAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      {finance.activities && finance.activities.length > 0 && (
        <ActivityTimeline activities={finance.activities} />
      )}
    </div>
  )
}







