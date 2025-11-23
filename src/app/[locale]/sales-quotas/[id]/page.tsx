'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Target, TrendingUp, Calendar, DollarSign, User, Briefcase, Receipt, Eye } from 'lucide-react'
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
import { useTranslations } from 'next-intl'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SalesQuotaDetailPage() {
  // Tüm hook'ları en üstte, conditional olmadan çağır
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { confirm } = useConfirm()
  const t = useTranslations('salesQuotas')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // id'yi string olarak al, her zaman hook'u çağır
  const id = (params?.id as string) || ''
  const apiUrl = id ? `/api/sales-quotas/${id}` : null

  const { data: quota, isLoading, error, mutate: mutateQuota } = useData<any>(
    apiUrl,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
      refreshInterval: 0, // Auto refresh YOK - sürekli refresh'i önle
    }
  )

  // Early returns - hook'lardan sonra
  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Geçersiz ID
          </h1>
          <p className="text-gray-500 mb-4">
            Geçersiz kota ID'si.
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

  // achievement'ı number'a çevir - güvenli tip kontrolü
  const achievement = typeof quota.achievement === 'number' 
    ? quota.achievement 
    : typeof quota.achievement === 'string' 
      ? parseFloat(quota.achievement) || 0 
      : 0
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
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-gray-500 mt-1">
              {quota.user?.name || 'N/A'} - {
                quota.period === 'MONTHLY' ? t('periodMonthly') :
                quota.period === 'QUARTERLY' ? t('periodQuarterly') :
                quota.period === 'YEARLY' ? t('periodYearly') :
                quota.period
              }
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
            {formatCurrency(typeof quota.targetRevenue === 'number' ? quota.targetRevenue : parseFloat(quota.targetRevenue) || 0)}
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
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2">
            {isAchieved ? (
              <Badge className="bg-green-100 text-green-800 border-0">
                <Target className="h-3 w-3 mr-1" />
                {t('statusAchieved', { defaultMessage: 'Hedef Aşıldı' })}
              </Badge>
            ) : isNearTarget ? (
              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                {t('statusNearTarget', { defaultMessage: 'Hedefe Yakın' })}
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 border-0">
                {t('statusAtRisk', { defaultMessage: 'Riskli' })}
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
                  {quota.period === 'MONTHLY' ? t('periodMonthly') :
                   quota.period === 'QUARTERLY' ? t('periodQuarterly') :
                   quota.period === 'YEARLY' ? t('periodYearly') :
                   quota.period}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Başlangıç Tarihi</span>
              <div className="mt-1 text-gray-900">
                {quota.startDate 
                  ? (() => {
                      const date = new Date(quota.startDate)
                      return isNaN(date.getTime()) 
                        ? 'Geçersiz tarih' 
                        : date.toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                    })()
                  : 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Bitiş Tarihi</span>
              <div className="mt-1 text-gray-900">
                {quota.endDate 
                  ? (() => {
                      const date = new Date(quota.endDate)
                      return isNaN(date.getTime()) 
                        ? 'Geçersiz tarih' 
                        : date.toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                    })()
                  : 'N/A'}
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

      {/* İlgili Kayıtlar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İlgili Deal'lar */}
        {quota.relatedDeals && quota.relatedDeals.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                İlgili Fırsatlar ({quota.relatedDeals.length})
              </h2>
              <Link href={`/${locale}/deals?assignedTo=${quota.userId}`}>
                <Button variant="ghost" size="sm">
                  Tümünü Gör
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Değer</TableHead>
                    <TableHead>Aşama</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quota.relatedDeals.slice(0, 5).map((deal: any) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.title || 'N/A'}</TableCell>
                      <TableCell>{deal.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(deal.value || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{deal.stage || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/${locale}/deals/${deal.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {quota.relatedDeals.length > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/${locale}/deals?assignedTo=${quota.userId}`}>
                  <Button variant="outline" size="sm">
                    +{quota.relatedDeals.length - 5} daha fazla fırsat görüntüle
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}

        {/* İlgili Invoice'lar */}
        {quota.relatedInvoices && quota.relatedInvoices.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-600" />
                İlgili Faturalar ({quota.relatedInvoices.length})
              </h2>
              <Link href={`/${locale}/invoices?assignedTo=${quota.userId}`}>
                <Button variant="ghost" size="sm">
                  Tümünü Gör
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quota.relatedInvoices.slice(0, 5).map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber || invoice.title || 'N/A'}
                      </TableCell>
                      <TableCell>{invoice.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(invoice.totalAmount || 0)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-0">
                          {invoice.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {quota.relatedInvoices.length > 5 && (
              <div className="mt-4 text-center">
                <Link href={`/${locale}/invoices?assignedTo=${quota.userId}`}>
                  <Button variant="outline" size="sm">
                    +{quota.relatedInvoices.length - 5} daha fazla fatura görüntüle
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        )}
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

