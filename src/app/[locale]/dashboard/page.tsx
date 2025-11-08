'use client'

import { useSession } from 'next-auth/react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Suspense, useMemo, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Eye } from 'lucide-react'
// ULTRA AGRESİF lazy loading - ilk yükleme hızı için
import SkeletonDashboard from '@/components/skeletons/SkeletonDashboard'
import { useRealtimeKPIs } from '@/hooks/useRealtimeKPIs' // Hook'lar dynamic import edilemez
import { Card } from '@/components/ui/card' // Basit component - normal import
const GradientCard = dynamic(() => import('@/components/ui/GradientCard'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded" />,
})
const AnimatedCounter = dynamic(() => import('@/components/ui/AnimatedCounter'), {
  ssr: false,
  loading: () => <div className="h-8 w-24 animate-pulse bg-gray-100 rounded" />,
})
const ActivityTimeline = dynamic(() => import('@/components/ui/ActivityTimeline'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" />,
})
import {
  TrendingUp,
  FileText,
  Target,
  Building2,
  Activity,
  Receipt,
  Users,
  Briefcase,
  DollarSign,
  Clock,
} from 'lucide-react'

// Lazy load chart components - error boundary ile korunuyor
const SalesTrendChart = dynamic(() => import('@/components/charts/SalesTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const ProductSalesChart = dynamic(() => import('@/components/charts/ProductSalesChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CustomerSectorChart = dynamic(() => import('@/components/charts/CustomerSectorChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CompanySectorChart = dynamic(() => import('@/components/charts/CompanySectorChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const CompanyPerformanceChart = dynamic(() => import('@/components/charts/CompanyPerformanceChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const DealKanbanChart = dynamic(() => import('@/components/charts/DealKanbanChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

const InvoiceStatusChart = dynamic(() => import('@/components/charts/InvoiceStatusChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-100 rounded" />,
})

async function fetchKPIs() {
  try {
    const res = await fetch('/api/analytics/kpis', {
      cache: 'force-cache', // ULTRA AGRESİF: Cache kullan (instant navigation için)
      credentials: 'include', // Session cookie'lerini gönder
      next: { revalidate: 3600 }, // 1 saat cache - Next.js ISR
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('KPIs API error:', res.status, errorData)
      // Hata durumunda default değerler dön (UI bozulmasın)
      return {
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
      }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchKPIs error:', error)
    // Hata durumunda default değerler dön (UI bozulmasın)
    return {
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
    }
  }
}

async function fetchTrends() {
  try {
    const res = await fetch('/api/analytics/trends', {
      cache: 'no-store', // Fresh data için cache'i kapat
      credentials: 'include', // Session cookie'lerini gönder
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Trends API error:', res.status, errorData)
      // Hata durumunda boş trend data dön
      return { monthlyData: [] }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchTrends error:', error)
    // Hata durumunda boş trend data dön
    return { monthlyData: [] }
  }
}

async function fetchDistribution() {
  try {
    const res = await fetch('/api/analytics/distribution', {
      cache: 'no-store', // Sektör atandığında fresh data için cache'i kapat
      credentials: 'include', // Session cookie'lerini gönder
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Distribution API error:', res.status, errorData)
      // Hata durumunda boş distribution data dön
      return { customerSectors: [], productSales: [], companySectors: [] }
    }
    const data = await res.json()
    // Debug: API'den gelen veriyi logla
    if (process.env.NODE_ENV === 'development') {
      console.log('Distribution API response:', data)
      console.log('companySectors in response:', data?.companySectors)
    }
    return data
  } catch (error: any) {
    console.error('fetchDistribution error:', error)
    // Hata durumunda boş distribution data dön
    return { customerSectors: [], productSales: [], companySectors: [] }
  }
}

async function fetchUserPerformance() {
  try {
    const res = await fetch('/api/analytics/user-performance', {
      cache: 'force-cache', // ULTRA AGRESİF: Cache kullan (instant navigation için)
      credentials: 'include', // Session cookie'lerini gönder
      next: { revalidate: 3600 }, // 1 saat cache - Next.js ISR
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('User Performance API error:', res.status, errorData)
      // Hata durumunda boş performance data dön
      return { performance: [] }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchUserPerformance error:', error)
    // Hata durumunda boş performance data dön
    return { performance: [] }
  }
}

async function fetchDealKanban() {
  try {
    const res = await fetch('/api/analytics/deal-kanban', {
      cache: 'force-cache', // ULTRA AGRESİF: Cache kullan (instant navigation için)
      credentials: 'include', // Session cookie'lerini gönder
      next: { revalidate: 3600 }, // 1 saat cache - Next.js ISR
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Deal Kanban API error:', res.status, errorData)
      // Hata durumunda boş kanban data dön
      return { columns: [] }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchDealKanban error:', error)
    // Hata durumunda boş kanban data dön
    return { columns: [] }
  }
}

async function fetchInvoiceKanban() {
  try {
    const res = await fetch('/api/analytics/invoice-kanban', {
      cache: 'force-cache', // ULTRA AGRESİF: Cache kullan (instant navigation için)
      credentials: 'include', // Session cookie'lerini gönder
      next: { revalidate: 3600 }, // 1 saat cache - Next.js ISR
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Invoice Kanban API error:', res.status, errorData)
      // Hata durumunda boş kanban data dön
      return { kanban: [] }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchInvoiceKanban error:', error)
    // Hata durumunda boş kanban data dön
    return { kanban: [] }
  }
}

async function fetchRecentActivities() {
  try {
    const res = await fetch('/api/analytics/recent-activities', {
      cache: 'force-cache', // ULTRA AGRESİF: Cache kullan (instant navigation için)
      credentials: 'include', // Session cookie'lerini gönder
      next: { revalidate: 1800 }, // 30 dakika cache - aktivite logları için
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('Recent Activities API error:', res.status, errorData)
      // Hata durumunda boş activities data dön
      return { activities: [] }
    }
    return res.json()
  } catch (error: any) {
    console.error('fetchRecentActivities error:', error)
    // Hata durumunda boş activities data dön
    return { activities: [] }
  }
}

// Status labels ve colors - component dışında tanımla (modal'da kullanılacak)
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

export default function DashboardPage() {
  const { data: session } = useSession()
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  

  // Dashboard KPI'larını çek (TanStack Query ile)
  // Cache stratejisi: 5 dakika stale time (yeni deal eklendiğinde güncellensin)
  const { data: initialKPIs, isLoading, error: kpisError } = useQuery({
    queryKey: ['kpis'],
    queryFn: fetchKPIs,
    staleTime: 5 * 60 * 1000, // 5 DAKİKA stale time (yeni deal eklendiğinde güncellensin)
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: true, // Mount'ta refetch yap (yeni deal eklendiğinde güncellensin)
    retry: 1,
    retryDelay: 500,
  })

  // Development'ta hataları ve başarıları logla
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (kpisError) {
        console.error('KPIs query error:', kpisError)
      }
      if (initialKPIs) {
        console.log('KPIs loaded successfully:', initialKPIs)
      }
    }
  }, [kpisError, initialKPIs])

  // Chart verilerini çek - PARALEL ve AGRESİF cache
  // Tüm chart'lar paralel çekilir - beklemez birbirini
  const { data: trendsData } = useQuery({
    queryKey: ['trends'],
    queryFn: fetchTrends,
    staleTime: 5 * 60 * 1000, // 5 dakika stale time (fresh data için)
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: true, // Mount'ta refetch yap (fresh data için)
    retry: 2,
    retryDelay: 1000,
  })

  const { data: distributionData } = useQuery({
    queryKey: ['distribution'],
    queryFn: fetchDistribution,
    staleTime: 5 * 60 * 1000, // 5 dakika stale time (yeni sektör atandığında güncellensin)
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: true, // Mount'ta refetch yap (yeni sektör atandığında güncellensin)
    retry: 2,
    retryDelay: 1000,
  })

  const { data: userPerformanceData } = useQuery({
    queryKey: ['user-performance'],
    queryFn: fetchUserPerformance,
    staleTime: 60 * 60 * 1000, // ULTRA AGRESİF: 60 DAKİKA stale time (cache'den göster - instant navigation)
    gcTime: 120 * 60 * 1000, // 120 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: false, // ULTRA AGRESİF: Mount'ta refetch yok (cache'den göster)
    retry: 2,
    retryDelay: 1000,
  })

  const { data: dealKanbanData } = useQuery({
    queryKey: ['deal-kanban'],
    queryFn: fetchDealKanban,
    staleTime: 60 * 60 * 1000, // ULTRA AGRESİF: 60 DAKİKA stale time (cache'den göster - instant navigation)
    gcTime: 120 * 60 * 1000, // 120 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: false, // ULTRA AGRESİF: Mount'ta refetch yok (cache'den göster)
    retry: 2,
    retryDelay: 1000,
  })

  const { data: invoiceKanbanData } = useQuery({
    queryKey: ['invoice-kanban'],
    queryFn: fetchInvoiceKanban,
    staleTime: 5 * 60 * 1000, // 5 dakika stale time (yeni fatura eklendiğinde güncellensin)
    gcTime: 10 * 60 * 1000, // 10 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: true, // Mount'ta refetch yap (yeni fatura eklendiğinde güncellensin)
    retry: 2,
    retryDelay: 1000,
  })

  // Son aktiviteler - daha sık güncellenir (1 dakika cache)
  const { data: recentActivitiesData } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: fetchRecentActivities,
    staleTime: 60 * 60 * 1000, // ULTRA AGRESİF: 60 DAKİKA stale time (cache'den göster - instant navigation)
    gcTime: 120 * 60 * 1000, // 120 dakika garbage collection time
    refetchOnWindowFocus: false, // Focus'ta refetch yok
    refetchOnMount: false, // ULTRA AGRESİF: Mount'ta refetch yok (cache'den göster)
    retry: 1, // ULTRA AGRESİF: Sadece 1 kez tekrar dene (hızlı hata)
    retryDelay: 500, // 500ms bekle (daha hızlı)
  })

  // ENTERPRISE: Teklif analizi - gerçekleşen/bekleyen, başarı oranı, red nedeni
  async function fetchQuoteAnalysis() {
    try {
      const res = await fetch('/api/analytics/quote-analysis', {
        cache: 'force-cache',
        credentials: 'include',
        next: { revalidate: 60 }, // 60 saniye cache
      })
      if (!res.ok) {
        return {
          total: 0,
          accepted: 0,
          pending: 0,
          rejected: 0,
          successRate: 0,
          rejectionReasons: [],
          acceptedTotal: 0,
          pendingTotal: 0,
          rejectedTotal: 0,
        }
      }
      return res.json()
    } catch (error) {
      return {
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
        successRate: 0,
        rejectionReasons: [],
        acceptedTotal: 0,
        pendingTotal: 0,
        rejectedTotal: 0,
      }
    }
  }

  const { data: quoteAnalysisData } = useQuery({
    queryKey: ['quote-analysis'],
    queryFn: fetchQuoteAnalysis,
    staleTime: 60 * 1000, // 60 saniye stale time
    gcTime: 120 * 1000, // 2 dakika garbage collection time
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
    retryDelay: 500,
  })

  // Realtime güncellemeler - sadece initial data ile başla
  // Realtime hook sonra günceller (lazy - performans için)
  // Hata durumunda varsayılan değerler kullan
  const defaultKPIs = {
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
  }
  const kpis = useRealtimeKPIs(initialKPIs || defaultKPIs)

  // Dashboard anında göster - skeleton sadece ilk yüklemede
  // Veriler paralel çekilirken bile sayfa görünür
  // Hata durumunda bile sayfayı göster (varsayılan değerlerle)
  if (isLoading && !initialKPIs && !kpisError) {
    return <SkeletonDashboard />
  }

  // Development'ta hata ve veri durumunu logla
  if (process.env.NODE_ENV === 'development') {
    if (kpisError) {
      console.error('Dashboard KPIs error:', kpisError)
    }
    if (initialKPIs) {
      console.log('Dashboard KPIs data:', initialKPIs)
    }
    if (session) {
      console.log('Dashboard session:', { userId: session.user?.id, companyId: session.user?.companyId })
    } else {
      console.warn('Dashboard: No session found!')
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1920px] mx-auto p-4 space-y-4">
        {/* Welcome Section */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Hoş geldiniz, <span className="font-semibold text-primary-600">{session?.user?.name}</span>
          </p>
        </div>

        {/* Genel KPI Cards Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Genel Bakış</h2>
            <p className="text-xs text-gray-500 mt-0.5">Temel performans göstergeleri</p>
          </div>
          <Suspense fallback={<SkeletonDashboard />}>
            <KPICards kpis={kpis} t={t} locale={locale} />
          </Suspense>
        </section>

        {/* Aylık KPI Cards Section */}
        {kpis?.monthlyKPIs && kpis.monthlyKPIs.length > 0 && (
          <section>
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-900">Aylık Bakış</h2>
              <p className="text-xs text-gray-500 mt-0.5">Son 3 ayın performans göstergeleri</p>
            </div>
            <Suspense fallback={<SkeletonDashboard />}>
              <MonthlyKPICards monthlyKPIs={kpis.monthlyKPIs} t={t} locale={locale} />
            </Suspense>
          </section>
        )}

        {/* Sales & Performance Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Satış & Performans Analizi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Aylık trendler ve dağılım analizleri</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales Trend Chart - Daha güzel ve anlaşılır */}
            <Card className="p-6 shadow-card hover:shadow-card-hover transition-shadow bg-gradient-to-br from-white to-indigo-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Aylık Satış Trendi</h3>
                  <p className="text-xs text-gray-500 mt-1">Son 12 ayın satış performansı</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-100">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
                <SalesTrendChart data={trendsData?.trends || []} />
              </Suspense>
            </Card>

            {/* Company Performance Chart - Kurum bazlı performans */}
            <Card className="p-6 shadow-card hover:shadow-card-hover transition-shadow bg-gradient-to-br from-white to-purple-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Kurum Performansı</h3>
                  <p className="text-xs text-gray-500 mt-1">Firma bazlı satış, teklif ve fırsat analizi</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
                <CompanyPerformanceChart data={userPerformanceData?.performance || []} />
              </Suspense>
            </Card>
        </div>
      </section>

        {/* Distribution Analysis Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Dağılım Analizi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ürün, müşteri ve müşteri firma sektör dağılımları</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Product Sales Chart */}
            <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Ürün Satış Dağılımı</h3>
              </div>
              <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded" />}>
                <ProductSalesChart data={distributionData?.productSales || []} />
              </Suspense>
            </Card>

            {/* Customer Sector Chart */}
            <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Müşteri Sektör Dağılımı</h3>
              </div>
              <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded" />}>
                <CustomerSectorChart data={distributionData?.customerSectors || []} />
              </Suspense>
            </Card>

            {/* Company Sector Chart - Müşteri Firma Sektör Dağılımı */}
            <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Müşteri Firma Sektör Dağılımı</h3>
              </div>
              <Suspense fallback={<div className="h-[250px] animate-pulse bg-gray-100 rounded" />}>
                <CompanySectorChart data={distributionData?.companySectors || []} />
              </Suspense>
            </Card>
        </div>
      </section>

        {/* Pipeline Management Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Fırsat Yönetimi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fırsatların pipeline durumu</p>
          </div>
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <Suspense fallback={<div className="h-[350px] animate-pulse bg-gray-100 rounded" />}>
              <DealKanbanChart data={dealKanbanData?.kanban || []} />
            </Suspense>
          </Card>
        </section>

        {/* Invoice Status Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900">Fatura Durumu</h2>
            <p className="text-xs text-gray-500 mt-0.5">Faturaların durum bazlı dağılımı</p>
          </div>
          <Card className="p-6 shadow-card hover:shadow-card-hover transition-shadow bg-gradient-to-br from-white to-green-50/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Fatura Durum Dağılımı</h3>
                <p className="text-xs text-gray-500 mt-1">Status bazlı fatura sayısı</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Suspense fallback={<div className="h-[300px] animate-pulse bg-gray-100 rounded" />}>
              <InvoiceStatusChart 
                data={invoiceKanbanData?.kanban || []} 
                onStatusClick={(status) => {
                  setSelectedStatus(status)
                  setStatusModalOpen(true)
                }}
              />
            </Suspense>
          </Card>
        </section>

        {/* Invoice Status Detail Modal */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedStatus && invoiceKanbanData?.kanban?.find((col: any) => col.status === selectedStatus) 
                  ? `${statusLabels[selectedStatus] || selectedStatus} Durumundaki Faturalar`
                  : 'Fatura Detayları'}
              </DialogTitle>
              <DialogDescription>
                {selectedStatus && invoiceKanbanData?.kanban?.find((col: any) => col.status === selectedStatus)
                  ? `${invoiceKanbanData.kanban.find((col: any) => col.status === selectedStatus)?.count || 0} fatura bulundu`
                  : 'Fatura listesi'}
              </DialogDescription>
            </DialogHeader>
            {selectedStatus && invoiceKanbanData?.kanban && (
              <div className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura Başlığı</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Oluşturulma</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceKanbanData.kanban
                      .find((col: any) => col.status === selectedStatus)
                      ?.invoices?.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.title}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[selectedStatus] || 'bg-gray-100'}>
                              {statusLabels[selectedStatus] || selectedStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(invoice.total || 0)}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            Bu durumda fatura bulunamadı
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Recent Activities Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Son Aktiviteler
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Sistem aktivite logları</p>
          </div>
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            {recentActivitiesData?.activities && recentActivitiesData.activities.length > 0 ? (
              <ActivityTimeline activities={recentActivitiesData.activities} />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                <p>Henüz aktivite kaydı yok</p>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}

// Memoized KPI Cards component for better performance
const KPICards = ({ kpis, t, locale }: { kpis: any; t: any; locale: string }) => {
  const memoizedCards = useMemo(
    () => (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-10 gap-4">
        {/* Net Satış */}
        <Link href={`/${locale}/invoices`} prefetch={true} className="block h-full" title="Fatura kısmından ödenen faturaların toplam tutarını gösterir">
          <GradientCard gradient="primary" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('totalSales')}
              </p>
              <AnimatedCounter
                value={kpis?.totalSales || 0}
                prefix="₺"
                className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Teklif Adedi */}
        <Link href={`/${locale}/quotes`} prefetch={true} className="block h-full" title="Teklifler kısmından tüm tekliflerin toplam sayısını gösterir">
          <GradientCard gradient="secondary" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('totalQuotes')}
              </p>
              <AnimatedCounter
                value={kpis?.totalQuotes || 0}
                className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Başarı Oranı */}
        <Link href={`/${locale}/reports`} prefetch={true} className="block h-full" title="Teklifler kısmından kabul edilen tekliflerin toplam tekliflere oranını gösterir">
          <GradientCard gradient="success" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('successRate')}
              </p>
              <AnimatedCounter
                value={kpis?.successRate || 0}
                suffix="%"
                className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Aktif Firma */}
        <Link href={`/${locale}/companies`} prefetch={true} className="block h-full" title="Müşteri Firmaları kısmından aktif durumdaki firmaların toplam sayısını gösterir">
          <GradientCard gradient="info" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('activeCompanies')}
              </p>
              <AnimatedCounter
                value={kpis?.activeCompanies || 0}
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Son Aktivite */}
        <Link href={`/${locale}/activity`} prefetch={true} className="block h-full" title="Aktivite Logları kısmından son 30 gün içindeki aktivitelerin toplam sayısını gösterir">
          <GradientCard gradient="accent" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('recentActivity')}
              </p>
              <AnimatedCounter
                value={kpis?.recentActivity || 0}
                className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10">
              <Activity className="h-5 w-5 text-pink-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Toplam Fatura */}
        <Link href={`/${locale}/invoices`} prefetch={true} className="block h-full" title="Fatura kısmından tüm faturaların toplam tutarını gösterir">
          <GradientCard gradient="primary" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                {t('totalInvoices')}
              </p>
              <AnimatedCounter
                value={kpis?.totalInvoices || 0}
                prefix="₺"
                className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <Receipt className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Müşteriler */}
        <Link href={`/${locale}/customers`} prefetch={true} className="block h-full" title="Müşteriler kısmından tüm müşterilerin toplam sayısını gösterir">
          <GradientCard gradient="info" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Müşteriler
              </p>
              <AnimatedCounter
                value={kpis?.totalCustomers || 0}
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Fırsatlar */}
        <Link href={`/${locale}/deals`} prefetch={true} className="block h-full" title="Fırsatlar kısmından tüm fırsatların toplam sayısını gösterir">
          <GradientCard gradient="secondary" className="cursor-pointer h-full min-h-[120px] flex flex-col">
          <div className="flex items-start justify-between flex-1">
            <div className="flex-1 flex flex-col justify-end">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Fırsatlar
              </p>
              <AnimatedCounter
                value={kpis?.totalDeals || 0}
                className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              />
            </div>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <Briefcase className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          </GradientCard>
        </Link>

        {/* Ortalama Fırsat */}
        <Link href={`/${locale}/deals`} prefetch={true} className="block h-full" title="Fırsatlar kısmından tüm fırsatların ortalama değerini gösterir">
          <GradientCard gradient="success" className="cursor-pointer h-full min-h-[120px] flex flex-col">
            <div className="flex items-start justify-between flex-1">
              <div className="flex-1 flex flex-col justify-end">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Ort. Fırsat
                </p>
                <AnimatedCounter
                  value={kpis?.avgDealValue || 0}
                  prefix="₺"
                  className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                />
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </GradientCard>
        </Link>

        {/* Bekleyen */}
        <Link href={`/${locale}/invoices?status=SENT`} prefetch={true} className="block h-full" title="Fatura kısmından gönderilmiş ancak henüz ödenmemiş faturaların toplam tutarını gösterir">
          <GradientCard gradient="warning" className="cursor-pointer h-full min-h-[120px] flex flex-col">
            <div className="flex items-start justify-between flex-1">
              <div className="flex-1 flex flex-col justify-end">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Bekleyen
                </p>
                <AnimatedCounter
                  value={kpis?.pendingInvoices || 0}
                  prefix="₺"
                  className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                />
              </div>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </GradientCard>
        </Link>
      </div>
    ),
    [kpis, t, locale]
  )

  return memoizedCards
}

// Memoized Monthly KPI Cards component for better performance
// KOMPAKT: Daha az yer kaplayan, daha küçük kartlar
const MonthlyKPICards = ({ monthlyKPIs, t, locale }: { monthlyKPIs: any[]; t: any; locale: string }) => {
  const memoizedCards = useMemo(
    () => (
      <div className="space-y-2">
        {monthlyKPIs.map((monthly: any) => {
          const monthName = new Date(monthly.month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
          const successRate = monthly.quotes > 0 ? Math.round((monthly.acceptedQuotes / monthly.quotes) * 100) : 0
          
          return (
            <div key={monthly.month} className="mb-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-2 capitalize">{monthName}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {/* Aylık Satış */}
                <GradientCard gradient="primary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Satış
                      </p>
                      <AnimatedCounter
                        value={monthly.sales || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ml-2 flex-shrink-0">
                      <TrendingUp className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Teklif */}
                <GradientCard gradient="secondary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Teklif
                      </p>
                      <AnimatedCounter
                        value={monthly.quotes || 0}
                        className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 ml-2 flex-shrink-0">
                      <FileText className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Başarı Oranı */}
                <GradientCard gradient="success" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Başarı
                      </p>
                      <AnimatedCounter
                        value={successRate}
                        suffix="%"
                        className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ml-2 flex-shrink-0">
                      <Target className="h-3 w-3 text-emerald-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Fatura */}
                <GradientCard gradient="primary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Fatura
                      </p>
                      <AnimatedCounter
                        value={monthly.invoices || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ml-2 flex-shrink-0">
                      <Receipt className="h-3 w-3 text-indigo-600" />
                    </div>
                  </div>
                </GradientCard>

                {/* Aylık Fırsat */}
                <GradientCard gradient="secondary" className="h-full min-h-[70px] flex flex-col p-3">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                        Fırsat
                      </p>
                      <AnimatedCounter
                        value={monthly.deals || 0}
                        prefix="₺"
                        className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      />
                    </div>
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 ml-2 flex-shrink-0">
                      <Briefcase className="h-3 w-3 text-purple-600" />
                    </div>
                  </div>
                </GradientCard>
              </div>
            </div>
          )
        })}
      </div>
    ),
    [monthlyKPIs, t, locale]
  )

  return memoizedCards
}

