'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Briefcase, Eye } from 'lucide-react'

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

import type { DealKanbanResponse } from '@/components/dashboard/types'

interface DealStatusSectionProps {
  isOpen: boolean
}

const DealStatusChart = dynamic(
  () => import('@/components/charts/DealStatusChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
    ),
  }
)

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
}

export default function DealStatusSection({ isOpen }: DealStatusSectionProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data } = useData<DealKanbanResponse>(
    isOpen ? '/api/analytics/deal-kanban' : null,
    {
      dedupingInterval: 120_000,
      refreshInterval: 180_000,
      revalidateOnFocus: false,
    }
  )

  const dealsInStage = useMemo(() => {
    if (!selectedStage || !data?.kanban) {
      return []
    }
    return (
      data.kanban.find((col) => col.stage === selectedStage)?.deals ?? []
    )
  }, [data, selectedStage])

  if (!isOpen) {
    return null
  }

  return (
    <section>
      <Card className="border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {t('dealStatusDistribution', {
                defaultMessage: 'Fırsat Durum Dağılımı',
              })}
            </h3>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 p-3">
            <Briefcase className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <DealStatusChart
          data={data?.kanban ?? []}
          onStageClick={(stage) => {
            setSelectedStage(stage)
            setDialogOpen(true)
          }}
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStage
                ? `${stageLabels[selectedStage] ?? selectedStage} ${t('dealsInStage', {
                    defaultMessage: 'Fırsatları',
                  })}`
                : t('dealDetails', { defaultMessage: 'Fırsat Detayları' })}
            </DialogTitle>
            <DialogDescription>
              {selectedStage
                ? `${dealsInStage.length} ${t('dealsFound', {
                    defaultMessage: 'fırsat bulundu',
                  })}`
                : t('dealList', {
                    defaultMessage: 'Fırsat listesi',
                  })}
            </DialogDescription>
          </DialogHeader>

          {selectedStage ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dealTitle', { defaultMessage: 'Fırsat' })}</TableHead>
                    <TableHead>{t('status', { defaultMessage: 'Durum' })}</TableHead>
                    <TableHead>{t('amount', { defaultMessage: 'Tutar' })}</TableHead>
                    <TableHead>{t('customer', { defaultMessage: 'Müşteri' })}</TableHead>
                    <TableHead>{t('createdAt', { defaultMessage: 'Oluşturulma' })}</TableHead>
                    <TableHead className="text-right">
                      {t('actions', { defaultMessage: 'İşlemler' })}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealsInStage.length > 0 ? (
                    dealsInStage.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell className="font-medium">
                          {deal.title || t('untitled', { defaultMessage: 'İsimsiz' })}
                        </TableCell>
                        <TableCell>
                          <Badge className={stageColors[selectedStage] ?? 'bg-gray-100'}>
                            {stageLabels[selectedStage] ?? selectedStage}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(deal.value ?? 0, 'TRY')}
                        </TableCell>
                        <TableCell>
                          {deal.customer?.name || deal.Customer?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {deal.createdAt
                            ? new Date(deal.createdAt).toLocaleDateString('tr-TR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/${locale}/deals/${deal.id}`} prefetch>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                        {t('noDealsInStatus', {
                          defaultMessage: 'Bu aşamada fırsat bulunmuyor',
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


