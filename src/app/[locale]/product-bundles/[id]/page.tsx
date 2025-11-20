'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, Package } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import ProductBundleForm from '@/components/product-bundles/ProductBundleForm'
import { toast, confirm } from '@/lib/toast'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Pasif',
}

export default function ProductBundleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: bundle, isLoading, error, mutate: mutateBundle } = useData<any>(
    id ? `/api/product-bundles/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !bundle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paket Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Paket yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/product-bundles`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!(await confirm(`${bundle.name} paketini silmek istediğinize emin misiniz?`))) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/product-bundles/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }
      toast.success('Paket silindi')
      router.push(`/${locale}/product-bundles`)
    } catch (error: any) {
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/product-bundles`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{bundle.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Paket Detayları
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFormOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteLoading ? 'Siliniyor...' : 'Sil'}
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Durum</div>
          <div className="mt-2">
            <Badge className={getStatusBadgeClass(bundle.status)}>
              {statusLabels[bundle.status] || bundle.status}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Toplam Fiyat</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(bundle.totalPrice)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Final Fiyat</div>
          <div className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(bundle.finalPrice)}
          </div>
        </Card>
      </div>

      {/* Description */}
      {bundle.description && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Açıklama</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {bundle.description}
          </p>
        </Card>
      )}

      {/* Items */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Paket Ürünleri</h3>
        {bundle.items && bundle.items.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Miktar</TableHead>
                  <TableHead>Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundle.items.map((item: any, index: number) => {
                  const product = item.product
                  const itemTotal = (product?.price || 0) * (item.quantity || 0)
                  return (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">
                        {product?.name || 'Ürün bulunamadı'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product?.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(product?.price || 0)}
                      </TableCell>
                      <TableCell>{item.quantity || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(itemTotal)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Henüz ürün eklenmemiş.</p>
        )}
      </Card>

      {/* Discount Info */}
      {bundle.discount > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">İndirim</div>
              <div className="mt-1 text-lg font-semibold text-green-600">
                %{bundle.discount}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">İndirim Tutarı</div>
              <div className="mt-1 text-lg font-semibold text-green-600">
                {formatCurrency(bundle.totalPrice - bundle.finalPrice)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Aktivite Geçmişi</h3>
        <ActivityTimeline entityId={id} entityType="ProductBundle" />
      </Card>

      {/* Form Modal */}
      <ProductBundleForm
        bundle={bundle}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedBundle) => {
          await mutateBundle(savedBundle, { revalidate: false })
          setFormOpen(false)
        }}
      />
    </div>
  )
}


