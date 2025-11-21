'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Target, TrendingUp, Calendar, DollarSign, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import SalesQuotaForm from '@/components/sales-quotas/SalesQuotaForm'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { formatCurrency } from '@/lib/utils'
import { useData } from '@/hooks/useData'
import { mutate } from 'swr'

const periodLabels: Record<string, string> = {
  MONTHLY: 'Aylık',
  QUARTERLY: 'Üç Aylık',
  YEARLY: 'Yıllık',
}

export default function SalesQuotaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { confirm } = useConfirm()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: quota, isLoading, error, mutate: mutateQuota } = useData<any>(
    id ? `/api/sales-quotas/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !quota) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Kota Bulunamadı
          </h1>
          <p className="text-gray-500 mb-4">
            Aradığınız satış kotası bulunamadı veya silinmiş olabilir.
          </p>
          <Link href={`/${locale}/sales-quotas`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Listeye Dön
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const achievement = quota.achievement || 0
  const isAchieved = achievement >= 100
  const isNearTarget = achievement >= 80

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Satış Kotasını Sil?',
      description: 'Bu işlem geri alınamaz.',
      confirmLabel: 'Sil',
      cancelLabel: 'İptal',
      variant: 'destructive',
    })

    if (!confirmed) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/sales-quotas/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete quota')
      }

      toast.success('Kota silindi')
      await mutate('/api/sales-quotas')
      router.push(`/${locale}/sales-quotas`)
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/sales-quotas`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Satış Kotası</h1>
            <p className="text-gray-500 mt-1">
              {quota.user?.name || 'N/A'} - {periodLabels[quota.period] || quota.period}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteLoading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Hedef Gelir</span>
            <Target className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(quota.targetRevenue)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Gerçekleşen Gelir</span>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(quota.actualRevenue || 0)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Başarı Oranı</span>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">
            {achievement.toFixed(1)}%
          </div>
          <Progress value={achievement} className="mt-2" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Durum</span>
            <Calendar className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2">
            {isAchieved ? (
              <Badge className="bg-green-100 text-green-800 border-0">
                <Target className="h-3 w-3 mr-1" />
                Hedef Aşıldı
              </Badge>
            ) : isNearTarget ? (
              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                Hedefe Yakın
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-0">
                Riskli
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Genel Bilgiler</h2>
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Kullanıcı</span>
              <div className="mt-1">
                {quota.user ? (
                  <Link href={`/${locale}/users/${quota.user.id}`} className="text-indigo-600 hover:underline">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {quota.user.name}
                    </div>
                  </Link>
                ) : (
                  <span className="text-gray-900">N/A</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Periyot</span>
              <div className="mt-1">
                <Badge className="bg-blue-100 text-blue-800 border-0">
                  {periodLabels[quota.period] || quota.period}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Başlangıç Tarihi</span>
              <div className="mt-1 text-gray-900">
                {new Date(quota.startDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Bitiş Tarihi</span>
              <div className="mt-1 text-gray-900">
                {new Date(quota.endDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performans Detayları</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Hedef</span>
                <span className="text-sm font-medium">{formatCurrency(quota.targetRevenue)}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Gerçekleşen</span>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(quota.actualRevenue || 0)}
                </span>
              </div>
              <Progress value={achievement} className="h-2" />
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Kalan</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(Math.max(0, quota.targetRevenue - (quota.actualRevenue || 0)))}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">İşlem Geçmişi</h2>
        <ActivityTimeline
          entityType="sales-quota"
          entityId={id}
        />
      </Card>

      {/* Form Modal */}
      <SalesQuotaForm
        quota={quota}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedQuota: any) => {
          await mutateQuota(savedQuota, { revalidate: false })
          await mutate(`/api/sales-quotas/${id}`, savedQuota, { revalidate: false })
          await mutate('/api/sales-quotas', undefined, { revalidate: true })
          setFormOpen(false)
          toast.success('Kota güncellendi')
        }}
      />
    </div>
  )
}

