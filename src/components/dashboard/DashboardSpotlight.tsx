import { memo, useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck2,
  Flame,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useLocale } from 'next-intl'

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
import { useData } from '@/hooks/useData'
import type {
  DashboardRange,
  DashboardSpotlightResponse,
} from '@/types/dashboard'

interface DashboardSpotlightProps {
  className?: string
}

const RANGE_OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: 'weekly', label: 'Bu Hafta' },
  { value: 'monthly', label: 'Bu Ay' },
]

const createEmptyStage = (
  id: 'new' | 'proposal' | 'closing',
  label: string,
  color: string
): DashboardSpotlightResponse['stages'][number] => ({
  id,
  label,
  value: 0,
  delta: 0,
  color,
  count: 0,
  items: [],
})

const createEmptySpotlight = (range: DashboardRange): DashboardSpotlightResponse => ({
  range,
  trend: 0,
  watchers: 0,
  live: false,
  stages: [
    createEmptyStage('new', 'Yeni fırsat', 'bg-indigo-500'),
    createEmptyStage('proposal', 'Teklif aşaması', 'bg-indigo-500'),
    createEmptyStage('closing', 'Kapanışta', 'from-emerald-500 via-teal-500 to-sky-500'),
  ],
  hotDeals: [],
  totals: { activeUsers: 0, conversionDelta: 0 },
  schedule: [],
  performance: { value: 0, label: 'Performans verisi yok' },
  satisfaction: { score: 4, trend: 0 },
})

const FALLBACK: Record<DashboardRange, DashboardSpotlightResponse> = {
  weekly: createEmptySpotlight('weekly'),
  monthly: createEmptySpotlight('monthly'),
}

const EMPTY_STATE: Record<DashboardRange, DashboardSpotlightResponse> = {
  weekly: createEmptySpotlight('weekly'),
  monthly: createEmptySpotlight('monthly'),
}

const STAGE_SOURCE_DESCRIPTIONS: Record<string, string> = {
  new: 'Fırsatlar modülündeki "Yeni" aşamasında olan kayıtlar',
  proposal: 'Fırsatlar modülündeki teklif aşamasındaki kayıtlar',
  closing: 'Fırsatlar modülünde kapanışa yaklaşan kayıtlar',
}

const DATA_SOURCES = {
  hotDeals: 'En yüksek potansiyelli fırsatları gösterir',
  schedule: 'Bugün için planlanan görevlerin kısa listesi',
  activeUsers: 'Şirketinizde paneli kullanan kişi sayısı',
  conversion: 'Seçili tarih aralığında kapanan fırsat oranı',
}

type DetailModalState =
  | {
      type: 'stage'
      title: string
      subtitle: string
      items: DashboardSpotlightResponse['stages'][number]['items']
    }
  | {
      type: 'hotDeals'
      deal: DashboardSpotlightResponse['hotDeals'][number]
    }
  | {
    type: 'schedule'
    task: DashboardSpotlightResponse['schedule'][number]
  }
  | null

function SpotlightSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <div className="h-48 rounded-3xl border border-white/40 bg-white/70">
          <div className="h-full animate-pulse rounded-3xl bg-gradient-to-br from-white/60 via-indigo-50/30 to-white/60" />
        </div>
        <div className="h-32 rounded-3xl border border-white/40 bg-white/70">
          <div className="h-full animate-pulse rounded-3xl bg-gradient-to-br from-white/60 via-indigo-50/30 to-white/60" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-44 rounded-3xl border border-white/40 bg-white/70">
          <div className="h-full animate-pulse rounded-3xl bg-indigo-100/40" />
        </div>
        <div className="h-40 rounded-3xl border border-white/40 bg-white/70">
          <div className="h-full animate-pulse rounded-3xl bg-gradient-to-br from-white/60 via-indigo-50/30 to-white/60" />
        </div>
      </div>
    </div>
  )
}

function DashboardSpotlight({ className }: DashboardSpotlightProps) {
  const [range, setRange] = useState<DashboardRange>('weekly')
  const [tab, setTab] = useState<'hotDeals' | 'schedule'>('hotDeals')
  const [detailModal, setDetailModal] = useState<DetailModalState>(null)
  const locale = useLocale()

  const { data, error, isLoading, mutate } = useData<DashboardSpotlightResponse>(
    `/api/dashboard/spotlight?range=${range}`,
    {
      dedupingInterval: 8000,
      revalidateOnFocus: false,
    }
  )

const metrics = data ?? EMPTY_STATE[range]

  const numberFormatter = useMemo(() => new Intl.NumberFormat('tr-TR'), [])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale]
  )

  const formatDelta = useCallback((delta: number) => (delta >= 0 ? `+${delta}` : `${delta}`), [])

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        maximumFractionDigits: 0,
      }),
    []
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

  const handleRefresh = async () => {
    await mutate(undefined, { revalidate: true })
  }

  const closeDetailModal = useCallback(() => setDetailModal(null), [])

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/40 bg-white/80 p-4 sm:p-6 shadow-[0_40px_120px_-60px_rgba(99,102,241,0.55)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
          <div className="absolute inset-0 bg-indigo-50/30" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-200">
              <span className="relative flex items-center gap-2 rounded-full border border-emerald-200/60 bg-white/80 px-3 py-1 text-emerald-500 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="relative block h-2.5 w-2.5 rounded-full bg-emerald-500">
                  {metrics.live ? <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" /> : null}
                </span>
                {metrics.live ? 'Canlı izleme aktif' : 'Canlı veri bekleniyor'}
              </span>
              <span className="flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/75 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                {numberFormatter.format(metrics.watchers)} izleyici
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={range} onValueChange={(value) => setRange(value as DashboardRange)}>
                <SelectTrigger className="h-8 w-full sm:w-[120px] rounded-full border border-slate-200/70 bg-white/80 px-3 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300">
                  <SelectValue placeholder="Aralık" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/80">
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRefresh}
                className="h-8 w-8 rounded-full border border-slate-200/70 bg-white/80 text-slate-500 transition hover:text-indigo-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-[1.3fr_1fr]">
            {isLoading && !data ? (
              <SpotlightSkeleton />
            ) : (
              <>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
                          Pipeline sağlığı
                        </p>
                        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                          <TrendingUp className="h-3.5 w-3.5" />
                          %{metrics.trend} büyüme
                        </span>
                      </div>
                      <Badge
                        className="border border-slate-200/60 bg-white/80 text-[10px] font-semibold text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300"
                      >
                        {RANGE_OPTIONS.find((item) => item.value === metrics.range)?.label}
                      </Badge>
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
                                  subtitle: STAGE_SOURCE_DESCRIPTIONS[stage.id] ?? 'Fırsatlar modülü',
                                  items: stage.items,
                                })
                              }
                              className="flex w-full flex-col rounded-lg px-2 py-1 transition hover:bg-indigo-500/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                            >
                              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-300">
                                <span>{stage.label}</span>
                                <span className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                    %{stage.value}
                                    <span className="hidden sm:inline">·</span>
                                    <span>{stage.count} kayıt</span>
                                  </span>
                                  <Badge className="border-none bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    {formatDelta(stage.delta)}
                                  </Badge>
                                </span>
                              </div>
                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${stage.value}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className={`h-full rounded-full ${stage.color}`}
                                />
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[240px] bg-slate-900 text-white dark:bg-slate-800">
                            <p>{STAGE_SOURCE_DESCRIPTIONS[stage.id] ?? 'Fırsatlar modülü'}</p>
                            <p className="mt-1 text-[11px] opacity-80">Toplam {stage.count} fırsat bu aşamada.</p>
                            <p className="mt-1 text-[11px] opacity-70">Detay görmek için tıklayın.</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                        <div className="flex cursor-default items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-white">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                              Aktif kullanıcı
                            </p>
                            <p className="text-lg">{numberFormatter.format(metrics.totals.activeUsers)}</p>
                          </div>
                        </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                          <p>{DATA_SOURCES.activeUsers}</p>
                        <p className="mt-1 text-[11px] opacity-80">Şu an {metrics.totals.activeUsers} kişi oturum açmış durumda.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                        <div className="flex cursor-default items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-white">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-200">
                            <TrendingUp className="h-5 w-5" />
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
                          <p>{DATA_SOURCES.conversion}</p>
                        <p className="mt-1 text-[11px] opacity-80">Son dönemde kapanan fırsat oranı.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70">
                    <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
                      <TabsList className="grid h-9 grid-cols-2 rounded-2xl border border-slate-200/70 bg-slate-100/80 text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-300">
                        <TabsTrigger value="hotDeals" className="rounded-xl text-xs font-semibold">
                          Sıcak fırsatlar
                        </TabsTrigger>
                        <TabsTrigger value="schedule" className="rounded-xl text-xs font-semibold">
                          Bugünkü takvim
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="hotDeals" className="mt-4 space-y-3">
                        {metrics.hotDeals.map((deal) => (
                          <Tooltip key={deal.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setDetailModal({ type: 'hotDeals', deal })}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                              >
                                <div>
                                  <p>{deal.company}</p>
                                  <p className="text-[11px] font-medium text-slate-400">
                                    {deal.owner} • {deal.status === 'hot' ? 'Sıcak' : 'Takipte'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    pulse={deal.status === 'hot'}
                                    className={`border-none px-2.5 py-1 text-[11px] font-semibold ${
                                      deal.status === 'hot'
                                        ? 'bg-indigo-500 text-white shadow'
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
                              <p>{DATA_SOURCES.hotDeals}</p>
                              <p className="mt-1 text-[11px] opacity-80">Potansiyel: {currencyFormatter.format(deal.amount)}.</p>
                              <p className="mt-1 text-[11px] opacity-70">Detay kartını açmak için tıkla.</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {metrics.hotDeals.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200/70 bg-white/80 px-3 py-6 text-center text-xs font-medium text-slate-400 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-500">
                            Bu aralıkta sıcak fırsat bulunmuyor.
                          </div>
                        ) : null}
                      </TabsContent>
                      <TabsContent value="schedule" className="mt-4 space-y-3">
                        {metrics.schedule.map((item) => (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setDetailModal({ type: 'schedule', task: item })}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
                                  <CalendarCheck2 className="h-4 w-4" />
                                </div>
                                <div className="flex flex-1 items-center justify-between">
                                  <div>
                                    <p>{item.title}</p>
                                    <p className="text-[11px] font-medium text-slate-400">{item.time}</p>
                                  </div>
                                  <Badge className="border-none bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200">
                                    {item.type === 'meeting' ? 'Toplantı' : item.type === 'demo' ? 'Demo' : 'Görüşme'}
                                  </Badge>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                              <p>{DATA_SOURCES.schedule}</p>
                              <p className="mt-1 text-[11px] opacity-80">Planlanan saat: {item.time}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {metrics.schedule.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200/70 bg-white/80 px-3 py-6 text-center text-xs font-medium text-slate-400 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-500">
                            Bugün için planlanan görev bulunmuyor.
                          </div>
                        ) : null}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">
                      Canlı özet
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Pipeline görünümünüz %{metrics.trend} büyüyor. {numberFormatter.format(metrics.watchers)} kullanıcı bu paneli aktif olarak izliyor.
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

                  <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                          Canlı performans
                        </p>
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          %{metrics.performance.value} • {metrics.performance.label}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200">
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
                            className="flex w-full items-center gap-3 rounded-xl border border-slate-200/60 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                          >
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            <div className="flex flex-1 items-center justify-between">
                              <span>{item.title}</span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                {item.time}
                              </span>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px] bg-slate-900 text-white dark:bg-slate-800">
                          <p>{DATA_SOURCES.schedule}</p>
                          <p className="mt-1 text-[11px] opacity-80">Planlanan saat: {item.time}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {metrics.schedule.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200/70 bg-white/80 px-3 py-4 text-center text-xs font-medium text-slate-400 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-500">
                        Henüz takvime düşen bir etkinlik yok.
                      </div>
                    ) : null}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </motion.div>

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

export default memo(DashboardSpotlight)


