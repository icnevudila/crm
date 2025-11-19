'use client'

import {
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from 'react'
import dynamic from 'next/dynamic'
import { useSession } from '@/hooks/useSession'
import { useLocale, useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  Activity as ActivityIcon,
  TrendingUp,
  BarChart3,
  PieChart,
  Briefcase,
  Receipt,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useData } from '@/hooks/useData'
import type { DashboardSpotlightResponse } from '@/types/dashboard'
import ErrorBoundary from '@/components/ErrorBoundary'

const SectionSkeleton = () => (
  <div className="h-48 animate-pulse rounded-2xl border border-dashed border-slate-200 bg-slate-100/60" />
)

const SmartReminder = dynamic(
  () => import('@/components/automations/SmartReminder'),
  {
    ssr: false,
    loading: () => (
      <div className="h-32 animate-pulse rounded-3xl bg-slate-100/70" />
    ),
  }
)

const NextBestAction = dynamic(
  () => import('@/components/suggestions/NextBestAction'),
  {
    ssr: false,
    loading: () => null,
  }
)

const SmartSuggestions = dynamic(
  () => import('@/components/dashboard/SmartSuggestions'),
  {
    ssr: false,
    loading: () => null,
  }
)

const QuickStartWizard = dynamic(
  () => import('@/components/dashboard/QuickStartWizard'),
  {
    ssr: false,
    loading: () => null,
  }
)

const OnboardingModal = dynamic(
  () => import('@/components/onboarding/OnboardingModal').then(mod => ({ default: mod.OnboardingModal })),
  {
    ssr: false,
    loading: () => null,
  }
)

const DashboardSpotlight = dynamic(
  () => import('@/components/dashboard/DashboardSpotlight'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] animate-pulse rounded-[28px] border border-dashed border-slate-200 bg-slate-100/60" />
    ),
  }
)

const OverviewSection = dynamic(
  () => import('@/components/dashboard/sections/OverviewSection'),
  { ssr: false, loading: SectionSkeleton }
)

const SalesPerformanceSection = dynamic(
  () => import('@/components/dashboard/sections/SalesPerformanceSection'),
  { ssr: false, loading: SectionSkeleton }
)

const DistributionSection = dynamic(
  () => import('@/components/dashboard/sections/DistributionSection'),
  { ssr: false, loading: SectionSkeleton }
)

const DealStatusSection = dynamic(
  () => import('@/components/dashboard/sections/DealStatusSection'),
  { ssr: false, loading: SectionSkeleton }
)

const InvoiceStatusSection = dynamic(
  () => import('@/components/dashboard/sections/InvoiceStatusSection'),
  { ssr: false, loading: SectionSkeleton }
)

const RecentActivitiesSection = dynamic(
  () => import('@/components/dashboard/sections/RecentActivitiesSection'),
  { ssr: false, loading: SectionSkeleton }
)

interface SectionProps {
  isOpen: boolean
}

interface SectionDefinition {
  id: string
  titleKey: string
  titleFallback: string
  descriptionKey?: string
  descriptionFallback?: string
  Icon: LucideIcon
  Component: ComponentType<SectionProps>
  defaultOpen?: boolean
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 'overview',
    titleKey: 'overview',
    titleFallback: 'Genel Bakış',
    descriptionKey: 'overviewDescription',
    descriptionFallback: 'KPI özetleri ve anlık göstergeler',
    Icon: TrendingUp,
    Component: OverviewSection,
    defaultOpen: true,
  },
  {
    id: 'sales-performance',
    titleKey: 'salesPerformanceAnalysis',
    titleFallback: 'Satış & Performans Analizi',
    descriptionKey: 'salesPerformanceDescription',
    descriptionFallback: 'Aylık trendler ve ekip performansı',
    Icon: BarChart3,
    Component: SalesPerformanceSection,
    defaultOpen: true,
  },
  {
    id: 'distribution',
    titleKey: 'distributionAnalysis',
    titleFallback: 'Dağılım Analizi',
    descriptionKey: 'distributionAnalysisDescription',
    descriptionFallback: 'Segment bazlı ürün ve müşteri dağılımları',
    Icon: PieChart,
    Component: DistributionSection,
  },
  {
    id: 'deal-status',
    titleKey: 'dealStatus',
    titleFallback: 'Fırsat Durumu',
    descriptionKey: 'dealStatusDescription',
    descriptionFallback: 'Pipeline aşamaları ve fırsat detayları',
    Icon: Briefcase,
    Component: DealStatusSection,
  },
  {
    id: 'invoice-status',
    titleKey: 'invoiceStatus',
    titleFallback: 'Fatura Durumu',
    descriptionKey: 'invoiceStatusDescription',
    descriptionFallback: 'Ödeme süreçleri ve finansal görünüm',
    Icon: Receipt,
    Component: InvoiceStatusSection,
  },
  {
    id: 'recent-activities',
    titleKey: 'recentActivities',
    titleFallback: 'Son Aktiviteler',
    descriptionKey: 'recentActivitiesDescription',
    descriptionFallback: 'Sistem içi aksiyon ve log akışı',
    Icon: ActivityIcon,
    Component: RecentActivitiesSection,
  },
]

const STORAGE_KEY = 'crm-dashboard-open-sections'

export default function DashboardPage() {
  const { data: session } = useSession()
  const t = useTranslations('dashboard')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)

  const defaultOpenSections = useMemo(
    () =>
      SECTION_DEFINITIONS.filter((section) => section.defaultOpen)
        .map((section) => section.id),
    []
  )

  const [openSections, setOpenSections] = useState<string[]>(defaultOpenSections)

  // İlk kullanımda wizard'ı aç
  useEffect(() => {
    const wizardCompleted = localStorage.getItem('quick-start-wizard-completed')
    const onboardingCompleted = localStorage.getItem('onboarding-modal-completed')
    
    if (!wizardCompleted && !onboardingCompleted) {
      // İlk kullanımda 2 saniye sonra quick start wizard'ı aç
      const timer = setTimeout(() => {
        setWizardOpen(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setOpenSections(parsed)
        }
      } catch {
        setOpenSections(defaultOpenSections)
      }
    }
  }, [defaultOpenSections])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openSections))
  }, [openSections])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1920px] space-y-4 sm:space-y-6 p-3 sm:p-4">
        <SmartReminder />

        <HeroBanner 
          t={t} 
          userName={session?.user?.name}
          onWizardClick={() => setWizardOpen(true)}
          onOnboardingClick={() => setOnboardingOpen(true)}
        />

        <DashboardSpotlight />

        {/* Next Best Action - Akıllı Öneriler */}
        <NextBestAction />

        {/* Smart Suggestions - Gelişmiş Akıllı Öneriler */}
        <SmartSuggestions />

        {/* Quick Start Wizard */}
        <QuickStartWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

        {/* Onboarding Modal - Detaylı Rehber */}
        <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(values) => setOpenSections(values as string[])}
          className="space-y-4"
        >
          {SECTION_DEFINITIONS.map(
            ({
              id,
              titleKey,
              titleFallback,
              descriptionKey,
              descriptionFallback,
              Icon,
              Component,
            }) => {
              const title = t(titleKey, { defaultMessage: titleFallback })
              const description = descriptionKey
                ? t(descriptionKey, { defaultMessage: descriptionFallback })
                : descriptionFallback
              const isOpen = openSections.includes(id)

              return (
                <AccordionItem
                  key={id}
                  value={id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow data-[state=open]:shadow-lg"
                >
                  <AccordionTrigger className="px-3 sm:px-4 md:px-6 py-3 text-left">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                          {title}
                        </p>
                        {description ? (
                          <p className="text-[10px] sm:text-xs text-slate-500">{description}</p>
                        ) : null}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 sm:px-4 pb-4 sm:pb-6 pt-0 md:px-6">
                    <ErrorBoundary
                      fallback={
                        <div className="p-4 text-center text-sm text-gray-500">
                          Bu bölüm yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.
                        </div>
                      }
                    >
                      <Component isOpen={isOpen} />
                    </ErrorBoundary>
                  </AccordionContent>
                </AccordionItem>
              )
            }
          )}
        </Accordion>
      </div>
    </div>
  )
}

function HeroBanner({
  t,
  userName,
  onWizardClick,
  onOnboardingClick,
}: {
  t: ReturnType<typeof useTranslations>
  userName?: string | null
  onWizardClick?: () => void
  onOnboardingClick?: () => void
}) {
  const locale = useLocale()
  const { data } = useData<DashboardSpotlightResponse>(
    '/api/dashboard/spotlight?range=weekly',
    {
      dedupingInterval: 8000,
      revalidateOnFocus: false,
    }
  )
  const [localTime, setLocalTime] = useState('')

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat(
      locale === 'en' ? 'en-US' : 'tr-TR',
      {
        dateStyle: 'full',
        timeStyle: 'short',
      }
    )

    setLocalTime(formatter.format(new Date()))
  }, [locale])

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR'),
    [locale]
  )

  const watchers = data?.watchers ?? 0
  const live = Boolean(data?.live)
  const watchersText = `${numberFormatter.format(
    watchers
  )} ${t('heroSummary.watchers', { defaultMessage: 'izleyici' })}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/10 bg-white/40 p-4 sm:p-8 text-slate-900 shadow-[0_24px_80px_-40px_rgba(99,102,241,0.35)] backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <div className="space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
          {t('title')}
        </span>
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
            {t('welcome')},{' '}
            <span className="text-indigo-600 dark:text-indigo-300">
              {userName ??
                t('guest', {
                  defaultMessage: 'Ziyaretçi',
                })}
            </span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {localTime
              ? t('heroSummary.timestamp', {
                  defaultMessage: '{time} itibarıyla paneliniz hazır.',
                  time: localTime,
                })
              : t('heroSummary.preparing', {
                  defaultMessage: 'Paneliniz hazırlanıyor...',
                })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-200">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 font-semibold shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <Users className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
            {watchersText}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 font-semibold shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
            {localTime}
          </span>
          {live ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 font-semibold text-emerald-600 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
              <ActivityIcon className="h-3.5 w-3.5" />
              {t('heroSummary.live', {
                defaultMessage: 'Canlı izleme açık',
              })}
            </span>
          ) : null}
          <div className="flex items-center gap-2">
            {onWizardClick && (
              <button
                onClick={onWizardClick}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-300/40 bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1.5 font-semibold text-white shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:scale-105"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Hızlı Başlangıç
              </button>
            )}
            {onOnboardingClick && (
              <button
                onClick={onOnboardingClick}
                className="inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 font-semibold text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all hover:scale-105"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Detaylı Rehber
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

