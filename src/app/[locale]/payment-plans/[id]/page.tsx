'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ArrowLeft, Edit, Trash2, CreditCard, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ActivityTimeline from '@/components/ui/ActivityTimeline'
import SkeletonDetail from '@/components/skeletons/SkeletonDetail'
import PaymentPlanForm from '@/components/payment-plans/PaymentPlanForm'
import { toast } from '@/lib/toast'
import { useConfirm } from '@/hooks/useConfirm'
import { formatCurrency } from '@/lib/utils'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { useData } from '@/hooks/useData'

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  COMPLETED: 'Tamamlandı',
  DEFAULTED: 'Vadesi Geçti',
  CANCELLED: 'İptal Edildi',
}

const installmentStatusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçti',
  CANCELLED: 'İptal Edildi',
}

export default function PaymentPlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const { confirm } = useConfirm()
  const id = params.id as string
  const [formOpen, setFormOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { data: plan, isLoading, error, mutate: mutatePlan } = useData<any>(
    id ? `/api/payment-plans/${id}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  if (isLoading) {
    return <SkeletonDetail />
  }

  if (error || !plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödeme Planı Bulunamadı
          </h1>
          {error && (
            <p className="text-sm text-gray-600 mb-4">
              {(error as any)?.message || 'Ödeme planı yüklenirken bir hata oluştu'}
            </p>
          )}
          <Button onClick={() => router.push(`/${locale}/payment-plans`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!plan) return
    
    const confirmed = await confirm({
      title: 'Ödeme Planını Sil?',
      description: `${plan.name} ödeme planını silmek istediğinize emin misiniz?`,
      confirmLabel: 'Sil',
      cancelLabel: 'İptal',
      variant: 'destructive',
    })
    
    if (!confirmed) {
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/payment-plans/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Silme işlemi başarısız')
      }
      toast.success('Ödeme planı silindi')
      router.push(`/${locale}/payment-plans`)
    } catch (error: any) {
      toast.error('Silme işlemi başarısız', { description: error?.message || 'Bir hata oluştu' })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Taksitleri sırala
  const sortedInstallments = plan.installments
    ? [...plan.installments].sort((a: any, b: any) => a.installmentNumber - b.installmentNumber)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/payment-plans`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ödeme Planı Detayları
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Durum</div>
          <div className="mt-2">
            <Badge className={getStatusBadgeClass(plan.status)}>
              {statusLabels[plan.status] || plan.status}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Toplam Tutar</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(plan.totalAmount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Ödenen</div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {formatCurrency(plan.paidAmount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Kalan</div>
          <div className="mt-2 text-2xl font-bold text-orange-600">
            {formatCurrency(plan.remainingAmount)}
          </div>
        </Card>
      </div>

      {/* Related Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.invoice && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">İlişkili Fatura</h3>
            <Link
              href={`/${locale}/invoices/${plan.invoice.id}`}
              className="text-primary hover:underline"
            >
              {plan.invoice.invoiceNumber || plan.invoice.title || 'Fatura'}
            </Link>
            <div className="text-sm text-muted-foreground mt-1">
              {formatCurrency(plan.invoice.total || 0)}
            </div>
          </Card>
        )}
        {plan.customer && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Müşteri</h3>
            <Link
              href={`/${locale}/customers/${plan.customer.id}`}
              className="text-primary hover:underline"
            >
              {plan.customer.name || 'Müşteri'}
            </Link>
            {plan.customer.email && (
              <div className="text-sm text-muted-foreground mt-1">
                {plan.customer.email}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Installments */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Taksitler ({plan.installmentCount})</h3>
        {sortedInstallments.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taksit No</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Ödeme Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInstallments.map((installment: any) => {
                  const isOverdue = installment.status === 'OVERDUE' || 
                    (installment.status === 'PENDING' && new Date(installment.dueDate) < new Date())
                  
                  return (
                    <TableRow key={installment.id}>
                      <TableCell className="font-medium">
                        #{installment.installmentNumber}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(installment.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(installment.dueDate).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        {installment.paidAt
                          ? new Date(installment.paidAt).toLocaleDateString('tr-TR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            installment.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {installmentStatusLabels[installment.status] || installment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Henüz taksit eklenmemiş.</p>
        )}
      </Card>

      {/* Activity Timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Aktivite Geçmişi</h3>
        <ActivityTimeline entityId={id} entityType="PaymentPlan" />
      </Card>

      {/* Form Modal */}
      <PaymentPlanForm
        plan={plan}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={async (savedPlan) => {
          await mutatePlan(savedPlan, { revalidate: false })
          setFormOpen(false)
        }}
      />
    </div>
  )
}

