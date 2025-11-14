'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Flame,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  LandingPipelineResponse,
  LandingRange,
} from '@/types/landing'

const RANGE_OPTIONS: Array<{ value: LandingRange; label: string }> = [
  { value: 'weekly', label: 'Bu Hafta' },
  { value: 'monthly', label: 'Bu Ay' },
]

const STATIC_TIMESTAMP = '2024-01-01T00:00:00.000Z'

const FALLBACK_DATA: Record<LandingRange, LandingPipelineResponse> = {
  weekly: {
    range: 'weekly',
    trend: 32,
    watchers: 148,
    live: true,
    stages: [
      {
        id: 'new',
        label: 'Yeni fırsat',
        value: 86,
        delta: 12,
        color: 'from-indigo-500 via-purple-500 to-pink-500',
        count: 40,
        items: [],
      },
      {
        id: 'proposal',
        label: 'Teklif aşaması',
        value: 74,
        delta: 8,
        color: 'from-cyan-500 via-indigo-500 to-purple-500',
        count: 30,
        items: [],
      },
      {
        id: 'closing',
        label: 'Kapanışta',
        value: 63,
        delta: 5,
        color: 'from-emerald-500 via-teal-500 to-sky-500',
        count: 22,
        items: [],
      },
    ],
    hotDeals: [
      {
        id: 'deal-1',
        company: 'Nova Bilişim',
        owner: 'Elif',
        amount: 48000,
        status: 'hot',
        createdAt: STATIC_TIMESTAMP,
      },
      {
        id: 'deal-2',
        company: 'Atlas Medikal',
        owner: 'Kerem',
        amount: 35500,
        status: 'warming',
        createdAt: STATIC_TIMESTAMP,
      },
    ],
    totals: {
      activeUsers: 1248,
      conversionDelta: 18,
    },
    schedule: [
      {
        id: 'schedule-1',
        time: '10:00',
        title: 'Demo hazırlık',
        type: 'demo',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
      {
        id: 'schedule-2',
        time: '12:30',
        title: 'Fiyat revizyonu',
        type: 'meeting',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
      {
        id: 'schedule-3',
        time: '15:00',
        title: 'Kapanış toplantısı',
        type: 'meeting',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
    ],
    performance: {
      value: 76,
      label: 'Kapanan fırsat',
    },
    satisfaction: {
      score: 4.9,
      trend: 12,
    },
  },
  monthly: {
    range: 'monthly',
    trend: 41,
    watchers: 302,
    live: true,
    stages: [
      {
        id: 'new',
        label: 'Yeni fırsat',
        value: 92,
        delta: 18,
        color: 'from-indigo-500 via-purple-500 to-pink-500',
        count: 58,
        items: [],
      },
      {
        id: 'proposal',
        label: 'Teklif aşaması',
        value: 69,
        delta: 11,
        color: 'from-cyan-500 via-indigo-500 to-purple-500',
        count: 27,
        items: [],
      },
      {
        id: 'closing',
        label: 'Kapanışta',
        value: 58,
        delta: 7,
        color: 'from-emerald-500 via-teal-500 to-sky-500',
        count: 19,
        items: [],
      },
    ],
    hotDeals: [
      {
        id: 'deal-3',
        company: 'Omega Lojistik',
        owner: 'Sena',
        amount: 61200,
        status: 'hot',
        createdAt: STATIC_TIMESTAMP,
      },
      {
        id: 'deal-4',
        company: 'Pixel Labs',
        owner: 'Burak',
        amount: 28750,
        status: 'warming',
        createdAt: STATIC_TIMESTAMP,
      },
    ],
    totals: {
      activeUsers: 2975,
      conversionDelta: 24,
    },
    schedule: [
      {
        id: 'schedule-4',
        time: '09:30',
        title: 'Pipeline sync',
        type: 'call',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
      {
        id: 'schedule-5',
        time: '13:00',
        title: 'Satış eğitimi',
        type: 'meeting',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
      {
        id: 'schedule-6',
        time: '16:30',
        title: 'Partner demo',
        type: 'demo',
        createdAt: STATIC_TIMESTAMP,
        status: 'TODO',
      },
    ],
    performance: {
      value: 82,
      label: 'Aylık performans',
    },
    satisfaction: {
      score: 4.8,
      trend: 9,
    },
  },
}

const LANDING_STAGE_SOURCES: Record<string, string> = {
  new: 'Fırsatlar modülünde "Yeni" aşamasındaki kayıtlar',
  proposal: 'Teklif aşamasındaki fırsatlar',
  closing: 'Kapanış adımına gelmiş fırsatlar',
}

const LANDING_HOT_DEALS_SOURCE = 'En yüksek potansiyelli fırsatları gösterir'
const LANDING_SCHEDULE_SOURCE = 'Bugün için planlanan görevlerin özeti'
const LANDING_ACTIVE_USERS_SOURCE = 'Paneli aktif kullanan kişi sayısı'
const LANDING_CONVERSION_SOURCE = 'Seçilen dönemde kazanılan fırsat oranı'

type DetailModalState =
  | {
      type: 'stage'
      title: string
      subtitle: string
      items: LandingPipelineResponse['stages'][number]['items']
    }
  | {
      type: 'hotDeals'
      deal: LandingPipelineResponse['hotDeals'][number]
    }
  | {
      type: 'schedule'
      task: LandingPipelineResponse['schedule'][number]
    }
  | null

function HeroShowcase() {
  const pathname = usePathname()
  const [browserLocale, setBrowserLocale] = useState<string | null>(null)
  const [range, setRange] = useState<LandingRange>('weekly')
  const [activeTab, setActiveTab] = useState<'pipeline' | 'schedule'>('pipeline')
  const [detailModal, setDetailModal] = useState<DetailModalState>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBrowserLocale(window.navigator.language ?? null)
    }
  }, [])

  const derivedLocale = useMemo(() => {
    if (!pathname) return null
    if (pathname === '/en' || pathname.startsWith('/en/')) {
      return 'en-US'
    }
    if (pathname === '/tr' || pathname.startsWith('/tr/')) {
      return 'tr-TR'
    }
    return null
  }, [pathname])

  const locale = browserLocale ?? derivedLocale ?? 'tr-TR'

  const metrics = useMemo(() => FALLBACK_DATA[range], [range])

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR'),
    [locale]
  )

  const formatDelta = useCallback((delta: number) => (delta >= 0 ? `+${delta}` : `${delta}`), [])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
      }),
    [locale]
  )

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale]
  )

  const formatDateTime = useCallback(
    (value: string) => {
      try {
        return dateFormatter.format(new Date(value))
      } catch {
        return value
      }
    },
    [dateFormatter]
  )

  const closeDetailModal = useCallback(() => setDetailModal(null), [])

  return (
    <TooltipProvider>
    <div className="relative mx-auto w-full max-w-xl lg:max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="relative overflow-hidden rounded-[26px] border border-white/12 bg-white/75 p-6 shadow-[0_45px_95px_-40px_rgba(12,22,45,0.6)] backdrop-blur-2xl lg:p-8 dark:border-slate-800/70 dark:bg-slate-900/70"
      >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
              <span className="relative h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-60 blur-[2px]" />
                <span className="relative block h-full w-full rounded-full bg-emerald-500" />
              </span>
              Demo izleme modu
              <span className="ml-2 flex items-center gap-1 rounded-full bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-500 shadow-sm dark:bg-slate-800/60 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                {numberFormatter.format(metrics.watchers)} örnek izleyici
              </span>
            </div>
          <div className="flex items-center gap-2">
              <Select
                value={range}
                onValueChange={(value) => setRange(value as LandingRange)}
              >
                <SelectTrigger className="h-8 w-[110px] rounded-full border-white/30 bg-white/70 px-3 text-xs font-semibold text-slate-600 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
                  <SelectValue placeholder="Aralık" />
                </SelectTrigger>
                <SelectContent
                  align="end"
                  className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-700/50 dark:bg-slate-900/90"
                >
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/65">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                  Pipeline sağlığı
                </p>
                      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                  <TrendingUp className="h-3.5 w-3.5" />
                          %{metrics.trend} büyüme
                        </span>
                        <Badge
                          variant="outline"
                          className="border-slate-200/70 bg-slate-100/80 text-[11px] font-medium text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300"
                        >
                          {RANGE_OPTIONS.find((item) => item.value === metrics.range)?.label}
                        </Badge>
                </div>
                    </div>
                    <div className="group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-slate-200/70 bg-white/70 text-slate-500 shadow-sm transition group-hover:text-indigo-600 dark:border-slate-700/60 dark:bg-slate-900/60 cursor-default"
                        disabled
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
              </div>

              <div className="mt-6 space-y-4">
                {metrics.stages.map((stage) => (
                  <Tooltip key={stage.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() =>
                          setDetailModal({
                            type: 'stage',
                            title: stage.label,
                            subtitle: LANDING_STAGE_SOURCES[stage.id] ?? 'Fırsatlar modülü',
                            items: stage.items,
                          })
                        }
                        className="w-full rounded-lg px-2 py-1 text-left transition hover:bg-indigo-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-300">
                          <span>{stage.label}</span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                              %{stage.value}
                              <span className="hidden sm:inline">·</span>
                              <span>{stage.count} kayıt</span>
                            </span>
                            <Badge className="border-none bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-200">
                              {formatDelta(stage.delta)}
                            </Badge>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.value}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                          />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                      <p>{LANDING_STAGE_SOURCES[stage.id] ?? 'Fırsatlar modülü'}</p>
                      <p className="mt-1 text-[11px] opacity-80">Toplam {stage.count} fırsat bu aşamada.</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-default items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/65 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-200">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Aktif kullanıcı
                  </p>
                            <p className="text-lg">
                              {numberFormatter.format(metrics.totals.activeUsers)}
                            </p>
                </div>
              </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                        <p>{LANDING_ACTIVE_USERS_SOURCE}</p>
                        <p className="mt-1 text-[11px] opacity-80">Şu anda {numberFormatter.format(metrics.totals.activeUsers)} kullanıcı panelde.</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-default items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover-border-indigo-200 hover:bg-indigo-500/5 dark:border-slate-800/60 dark:bg-slate-900/65 dark:text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    Dönüşüm artışı
                  </p>
                            <p className="text-lg">+%{metrics.totals.conversionDelta}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                        <p>{LANDING_CONVERSION_SOURCE}</p>
                        <p className="mt-1 text-[11px] opacity-80">Bu hafta +%{metrics.totals.conversionDelta} artış.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/65">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as typeof activeTab)}
                    className="w-full"
                  >
                    <TabsList className="grid h-9 w-full grid-cols-2 rounded-xl border border-slate-200/70 bg-slate-100/80 text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
                      <TabsTrigger value="pipeline" className="rounded-lg text-xs font-semibold">
                        Sıcak fırsatlar
                      </TabsTrigger>
                      <TabsTrigger value="schedule" className="rounded-lg text-xs font-semibold">
                        Bugünkü takvim
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pipeline" className="mt-4">
                      <div className="space-y-3">
                        {metrics.hotDeals.map((deal) => (
                          <Tooltip key={deal.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setDetailModal({ type: 'hotDeals', deal })}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition duration-200 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                              >
                                <div className="flex flex-col gap-1">
                                  <span>{deal.company}</span>
                                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                                    {deal.owner} • {deal.status === 'hot' ? 'Sıcak' : 'Takipte'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    pulse={deal.status === 'hot'}
                                    className={`border-none px-2.5 py-1 text-[11px] font-semibold ${
                                      deal.status === 'hot'
                                        ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white shadow-lg'
                                        : 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200'
                                    }`}
                                  >
                                    {currencyFormatter.format(deal.amount)}
                                  </Badge>
                                  <Flame
                                    className={`h-4 w-4 ${
                                      deal.status === 'hot'
                                        ? 'text-pink-500 dark:text-pink-400'
                                        : 'text-indigo-400 dark:text-indigo-300'
                                    }`}
                                  />
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                              <p>{LANDING_HOT_DEALS_SOURCE}</p>
                              <p className="mt-1 text-[11px] opacity-80">Beklenen tutar: {currencyFormatter.format(deal.amount)}.</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="schedule" className="mt-4">
                      <div className="space-y-3">
                        {metrics.schedule.map((item) => (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setDetailModal({ type: 'schedule', task: item })}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                                  <CalendarCheck2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-1 items-center justify-between gap-3">
                                  <div className="flex flex-col gap-1">
                                    <span>{item.title}</span>
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                                      {item.time}
                                    </span>
                                  </div>
                                  <Badge className="border-none bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                                    {item.type === 'meeting'
                                      ? 'Toplantı'
                                      : item.type === 'demo'
                                        ? 'Demo'
                                        : 'Görüşme'}
                                  </Badge>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                              <p>{LANDING_SCHEDULE_SOURCE}</p>
                              <p className="mt-1 text-[11px] opacity-80">Planlanan saat: {item.time}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
            </div>
          </div>

          <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/65">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                    Canlı özet
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Pipeline sağlığı %{metrics.trend} büyüme ile ilerliyor. {numberFormatter.format(metrics.watchers)} kişi bu görünümü yakından takip ediyor.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-xl border border-indigo-200/60 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200">
                <Sparkles className="h-4 w-4" />
                      %{metrics.trend} büyüme
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-100/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-300">
                      <Users className="h-4 w-4" />
                      {numberFormatter.format(metrics.watchers)} izleyici
                    </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/65">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        Canlı performans
                  </p>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                        %{metrics.performance.value} • {metrics.performance.label}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 space-y-3">
                    {metrics.schedule.slice(0, 3).map((item) => (
                      <Tooltip key={`${item.id}-summary`}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setDetailModal({ type: 'schedule', task: item })}
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800/40 dark:bg-slate-900/55 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                          >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <div className="flex flex-1 items-center justify-between">
                              <span>{item.title}</span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {item.time}
                              </span>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                          <p>{LANDING_SCHEDULE_SOURCE}</p>
                          <p className="mt-1 text-[11px] opacity-80">Planlanan saat: {item.time}</p>
                        </TooltipContent>
                      </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="pointer-events-none absolute -top-10 -right-12 hidden rounded-3xl border border-white/20 bg-white/60 p-4 shadow-xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/65 lg:block"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
          Performans
        </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            +%{metrics.performance.value}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-300">{metrics.performance.label}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
        className="pointer-events-none absolute -bottom-12 -left-6 hidden rounded-3xl border border-indigo-200/35 bg-white/75 p-4 shadow-2xl backdrop-blur-xl dark:border-indigo-500/20 dark:bg-slate-900/60 lg:block"
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-500">Memnuniyet</p>
        <div className="mt-2 flex items-center gap-3">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {metrics.satisfaction.score.toFixed(1)}
            </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            ))}
          </div>
        </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-300">
            Son 12 ay • +%{metrics.satisfaction.trend}
          </p>
      </motion.div>
    </div>

    <Dialog open={detailModal !== null} onOpenChange={(open) => (!open ? closeDetailModal() : undefined)}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        {detailModal?.type === 'stage' ? (
          <>
            <DialogHeader>
              <DialogTitle>{detailModal.title}</DialogTitle>
              <DialogDescription>{detailModal.subtitle}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              {detailModal.items.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-300">Bu aşamada kayıt bulunmuyor.</p>
              ) : (
                detailModal.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Sorumlu: {item.owner}</p>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                        {currencyFormatter.format(item.amount)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Durum: {item.status ?? 'Belirtilmedi'}</span>
                      <span>Oluşturma: {formatDateTime(item.createdAt)}</span>
                      {item.updatedAt ? <span>Güncelleme: {formatDateTime(item.updatedAt)}</span> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}

        {detailModal?.type === 'hotDeals' ? (
          <>
            <DialogHeader>
              <DialogTitle>{detailModal.deal.company}</DialogTitle>
              <DialogDescription>Sıcak fırsat detayları</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <span>Tutar</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                  {currencyFormatter.format(detailModal.deal.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sorumlu</span>
                <span>{detailModal.deal.owner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Durum</span>
                <Badge className="border-none bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {detailModal.deal.status === 'hot' ? 'Sıcak' : 'Takipte'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Oluşturma</span>
                <span>{formatDateTime(detailModal.deal.createdAt)}</span>
              </div>
              {detailModal.deal.updatedAt ? (
                <div className="flex items-center justify-between">
                  <span>Güncelleme</span>
                  <span>{formatDateTime(detailModal.deal.updatedAt)}</span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {detailModal?.type === 'schedule' ? (
          <>
            <DialogHeader>
              <DialogTitle>{detailModal.task.title}</DialogTitle>
              <DialogDescription>Görev detayları</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-200">
              <div className="flex items-center justify-between">
                <span>Planlanan saat</span>
                <span>{detailModal.task.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sorumlu</span>
                <span>{detailModal.task.owner ?? 'Atanmamış'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Durum</span>
                <Badge className="border-none bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                  {detailModal.task.status ?? 'Belirtilmedi'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Oluşturma</span>
                <span>{formatDateTime(detailModal.task.createdAt)}</span>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  )
}

export default memo(HeroShowcase)
