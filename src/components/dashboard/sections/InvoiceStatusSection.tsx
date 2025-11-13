'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Receipt, Eye } from 'lucide-react'

import { useData } from '@/hooks/useData'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

import type { InvoiceKanbanResponse } from '@/components/dashboard/types'

interface InvoiceStatusSectionProps {
  isOpen: boolean
}

const InvoiceStatusChart = dynamic(
  () => import('@/components/charts/InvoiceStatusChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
}

export default function InvoiceStatusSection({
  isOpen,
}: InvoiceStatusSectionProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data } = useData<InvoiceKanbanResponse>(
    isOpen ? '/api/analytics/invoice-kanban' : null,
    {
      dedupingInterval: 120_000,
      refreshInterval: 180_000,
      revalidateOnFocus: false,
    }
  )

  const invoicesInStatus = useMemo(() => {
    if (!selectedStatus || !data?.kanban) {
      return []
    }
    return (
      data.kanban.find((col) => col.status === selectedStatus)?.invoices ?? []
    )
  }, [data, selectedStatus])

  if (!isOpen) {
    return null
  }

  return (
    <section>
      <Card className="border border-gray-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t('invoiceStatusDistribution', {
                defaultMessage: 'Fatura Durum Dağılımı',
              })}
            </h3>
          </div>
          <div className="rounded-lg bg-green-100 p-2">
            <Receipt className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <InvoiceStatusChart
          data={data?.kanban ?? []}
          onStatusClick={(status) => {
            setSelectedStatus(status)
            setDialogOpen(true)
          }}
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStatus
                ? `${statusLabels[selectedStatus] ?? selectedStatus} ${t('invoicesInStatus', {
                    defaultMessage: 'Faturaları',
                  })}`
                : t('invoiceDetails', { defaultMessage: 'Fatura Detayları' })}
            </DialogTitle>
            <DialogDescription>
              {selectedStatus
                ? `${invoicesInStatus.length} ${t('invoicesFound', {
                    defaultMessage: 'fatura bulundu',
                  })}`
                : t('invoiceList', {
                    defaultMessage: 'Fatura listesi',
                  })}
            </DialogDescription>
          </DialogHeader>

          {selectedStatus ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('invoiceNumber', { defaultMessage: 'Fatura' })}
                    </TableHead>
                    <TableHead>{t('status', { defaultMessage: 'Durum' })}</TableHead>
                    <TableHead>{t('total', { defaultMessage: 'Toplam' })}</TableHead>
                    <TableHead>
                      {t('createdAt', { defaultMessage: 'Oluşturulma' })}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('actions', { defaultMessage: 'İşlemler' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicesInStatus.length > 0 ? (
                    invoicesInStatus.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.title || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[selectedStatus] ?? 'bg-gray-100'}>
                            {statusLabels[selectedStatus] ?? selectedStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(
                            invoice.totalAmount ?? invoice.total ?? 0,
                            'TRY'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/${locale}/invoices/${invoice.id}`} prefetch>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                        {t('noInvoicesInStatus', {
                          defaultMessage: 'Bu durumda fatura bulunmuyor',
                        })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}


