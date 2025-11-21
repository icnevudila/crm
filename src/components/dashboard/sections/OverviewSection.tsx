'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import {
  TrendingUp,
  FileText,
  Target,
  Building2,
  Activity,
  Users,
  Briefcase,
  Clock,
  RotateCcw,
  FileCheck,
  CreditCard,
  Layers,
  TrendingDown,
} from 'lucide-react'

import { Card } from '@/components/ui/card'
import GradientCard from '@/components/ui/GradientCard'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs'
import { useData } from '@/hooks/useData'
import SkeletonCard from '@/components/skeletons/SkeletonCard'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { KPIData, MonthlyKPI } from '@/components/dashboard/types'

interface OverviewSectionProps {
  isOpen: boolean
}

const DEFAULT_KPIS: KPIData = {
  totalSales: 0,
  totalQuotes: 0,
  successRate: 0,
  activeCompanies: 0,
  recentActivity: 0,
  totalInvoices: 0,
  totalCustomers: 0,
  totalDeals: 0,
  avgDealValue: 0,
  pendingInvoices: 0,
  pendingShipments: 0,
  pendingPurchaseShipments: 0,
  totalReturnOrders: 0,
  totalReturnOrdersValue: 0,
  pendingReturnOrders: 0,
  totalCreditNotes: 0,
  totalCreditNotesValue: 0,
  appliedCreditNotes: 0,
  totalPaymentPlans: 0,
  totalPaymentPlansValue: 0,
  activePaymentPlans: 0,
  overduePaymentPlans: 0,
  totalSalesQuotas: 0,
  activeSalesQuotas: 0,
  totalTargetRevenue: 0,
  totalActualRevenue: 0,
  quotaAchievementRate: 0,
  totalProductBundles: 0,
  totalProductBundlesValue: 0,
  monthlyKPIs: [],
}

export default function OverviewSection({ isOpen }: OverviewSectionProps) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  const { data, isLoading, error } = useData<KPIData>(
    isOpen ? '/api/analytics/kpis' : null,
    {
      dedupingInterval: 60_000,
      refreshInterval: 60_000,
      revalidateOnFocus: false,
    }
  )

  const kpis = useRealtimeKPIs(data ?? DEFAULT_KPIS)

  if (!isOpen) {
    return null
  }

  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={`kpi-skeleton-${index}`} />
        ))}
      </div>
    )
  }

  if (error) {
    console.error('Dashboard overview section error:', error)
  }

  return (
    <div className="space-y-6">
      <KPICards kpis={kpis} t={t} locale={locale} />
      {kpis?.monthlyKPIs && kpis.monthlyKPIs.length > 0 ? (
        <MonthlyKPICards monthlyKPIs={kpis.monthlyKPIs} t={t} locale={locale} />
      ) : null}
    </div>
  )
}

const KPICards = ({
  kpis,
  t,
  locale,
}: {
  kpis: KPIData
  t: ReturnType<typeof useTranslations>
  locale: string
}) => {
  const memoizedCards = useMemo(
    () => (
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/invoices`}
                  prefetch
                  className="block h-full"
                  title={t('totalSales')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-indigo-50 via-indigo-50 to-blue-50 border border-indigo-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/50 hover:border-indigo-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/20 to-blue-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('totalSales')}
                </p>
                <AnimatedCounter
                  value={kpis?.totalSales ?? 0}
                  prefix="₺"
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 p-3.5 transition-transform duration-300">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('totalSalesTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/quotes`}
                  prefetch
                  className="block h-full"
                  title={t('totalQuotes')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 border border-orange-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-200/50 hover:border-orange-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-orange-200/20 to-amber-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('totalQuotes')}
                </p>
                <AnimatedCounter
                  value={kpis?.totalQuotes ?? 0}
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 p-3.5 transition-transform duration-300">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('totalQuotesTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/reports`}
                  prefetch
                  className="block h-full"
                  title={t('successRate')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-200/50 hover:border-green-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-green-200/20 to-emerald-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('successRate')}
                </p>
                <AnimatedCounter
                  value={kpis?.successRate ?? 0}
                  suffix="%"
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 p-3.5 transition-transform duration-300">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('successRateTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/companies`}
                  prefetch
                  className="block h-full"
                  title={t('activeCompanies')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 border border-blue-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/50 hover:border-blue-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/20 to-indigo-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('activeCompanies')}
                </p>
                <AnimatedCounter
                  value={kpis?.activeCompanies ?? 0}
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-3.5 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('activeCompaniesTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/activity`}
                  prefetch
                  className="block h-full"
                  title={t('recentActivity')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 border border-pink-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-200/50 hover:border-pink-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-pink-200/20 to-rose-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('recentActivity')}
                </p>
                <AnimatedCounter
                  value={kpis?.recentActivity ?? 0}
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 p-3.5 transition-transform duration-300">
                <Activity className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('recentActivityTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/invoices?status=SENT`}
                  prefetch
                  className="block h-full"
                  title={t('pendingInvoices')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-200/50 hover:border-amber-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('pendingInvoices')}
                </p>
                <AnimatedCounter
                  value={kpis?.pendingInvoices ?? 0}
                  prefix="₺"
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-3.5 transition-transform duration-300">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('pendingInvoicesTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/customers`}
                  prefetch
                  className="block h-full"
                  title={t('totalCustomers')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 border border-blue-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/50 hover:border-blue-300">
            <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-200/20 blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {t('totalCustomers')}
                </p>
                <AnimatedCounter
                  value={kpis?.totalCustomers ?? 0}
                  className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text"
                />
              </div>
              <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-3.5 transition-transform duration-300">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('totalCustomersTooltip')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Link
                  href={`/${locale}/deals`}
                  prefetch
                  className="block h-full"
                  title={t('totalDeals')}
                >
                  <Card className="relative h-full cursor-pointer overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50 border border-emerald-200/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-200/50 hover:border-emerald-300">
                    <div className="absolute top-0 right-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-200/20 to-teal-200/20 blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
                          {t('totalDeals')}
                        </p>
                        <AnimatedCounter
                          value={kpis?.totalDeals ?? 0}
                          className="text-xl font-bold leading-tight text-transparent sm:text-2xl md:text-3xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text"
                        />
                      </div>
                      <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-3.5 transition-transform duration-300">
                        <Briefcase className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{t('totalDealsTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    ),
    [kpis, t, locale]
  )

  return memoizedCards
}

const MonthlyKPICards = ({
  monthlyKPIs,
  t,
  locale,
}: {
  monthlyKPIs: MonthlyKPI[]
  t: ReturnType<typeof useTranslations>
  locale: string
}) => {
  const memoizedCards = useMemo(
    () => (
      <div className="space-y-2">
        {monthlyKPIs.map((monthly) => {
          const monthName = new Date(`${monthly.month}-01`).toLocaleDateString(
            locale,
            {
              month: 'long',
              year: 'numeric',
            }
          )
          const successRate =
            monthly.quotes && monthly.quotes > 0
              ? Math.round(((monthly.acceptedQuotes ?? 0) / monthly.quotes) * 100)
              : 0

          return (
            <div key={monthly.month} className="mb-2">
              <h3 className="mb-2 text-xs font-semibold capitalize text-gray-700">
                {monthName}
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                <GradientCard gradient="primary" className="flex min-h-[70px] flex-col p-3">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
                        Satış
                      </p>
                      <AnimatedCounter
                        value={monthly.sales ?? 0}
                        prefix="₺"
                        className="text-sm font-bold text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text"
                      />
                    </div>
                    <div className="ml-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-1.5">
                      <TrendingUp className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                <GradientCard gradient="secondary" className="flex min-h-[70px] flex-col p-3">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
                        Teklif
                      </p>
                      <AnimatedCounter
                        value={monthly.quotes ?? 0}
                        className="text-sm font-bold text-transparent bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text"
                      />
                    </div>
                    <div className="ml-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-1.5">
                      <FileText className="h-3 w-3 text-orange-600" />
                    </div>
                  </div>
                </GradientCard>

                <GradientCard gradient="success" className="flex min-h-[70px] flex-col p-3">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
                        Başarı
                      </p>
                      <AnimatedCounter
                        value={successRate}
                        suffix="%"
                        className="text-sm font-bold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text"
                      />
                    </div>
                    <div className="ml-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-1.5">
                      <Target className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>
                </GradientCard>

                <GradientCard gradient="primary" className="flex min-h-[70px] flex-col p-3">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
                        Fatura
                      </p>
                      <AnimatedCounter
                        value={monthly.invoices ?? 0}
                        prefix="₺"
                        className="text-sm font-bold text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text"
                      />
                    </div>
                    <div className="ml-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-1.5">
                      <Clock className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                <GradientCard gradient="secondary" className="flex min-h-[70px] flex-col p-3">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-gray-600">
                        Fırsat
                      </p>
                      <AnimatedCounter
                        value={monthly.deals ?? 0}
                        className="text-sm font-bold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text"
                      />
                    </div>
                    <div className="ml-2 flex-shrink-0 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-1.5">
                      <Briefcase className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>
                </GradientCard>
              </div>
            </div>
          )
        })}
      </div>
    ),
    [monthlyKPIs, locale]
  )

  return memoizedCards
}



