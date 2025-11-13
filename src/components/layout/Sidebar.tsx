'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PrefetchLink } from '@/components/optimized/PrefetchLink'
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Receipt,
  Briefcase,
  Package,
  ShoppingCart,
  Truck,
  PackageCheck,
  Building2,
  Settings,
  Store,
  Shield,
  Crown,
  CheckSquare,
  HelpCircle,
  BarChart3,
  Calendar,
  Mail,
  ScrollText,
  FolderOpen,
  CheckCircle,
  Filter,
  Target,
  Send,
} from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { useData } from '@/hooks/useData'
import { OnboardingButton } from '@/components/onboarding/OnboardingButton'

// Modül mapping - href'den modül koduna
const MODULE_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/companies': 'company',
  '/vendors': 'vendor',
  '/customers': 'customer',
  '/contacts': 'contact',
  '/contracts': 'contract',
  '/meetings': 'meeting',
  '/deals': 'deal',
  '/quotes': 'quote',
  '/invoices': 'invoice',
  '/products': 'product',
  '/shipments': 'shipment',
  '/purchase-shipments': 'purchase-shipment',
  '/finance': 'finance',
  '/tasks': 'task',
  '/tickets': 'ticket',
  '/reports': 'report',
  '/activity': 'activity',
  '/email-templates': 'email-templates',
  '/documents': 'document',
  '/approvals': 'approval',
  '/email-campaigns': 'email-campaign',
  '/segments': 'segment',
  '/competitors': 'competitor',
}

interface SidebarItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  module?: string
}

interface SidebarSection {
  key: string
  title: string
  items: SidebarItem[]
}

// SIDEBAR_SECTIONS will be created inside component to use translations

// ✅ Kullanıcılar modülü kaldırıldı - Admin ve SuperAdmin kendi panellerinden görebiliyor
// Admin: /admin sayfasından kullanıcıları görebilir ve yönetebilir
// SuperAdmin: /superadmin sayfasındaki "Kullanıcılar" tab'ından görebilir ve yönetebilir

// ✅ Footer'a taşınacaklar: Hakkımızda, Şartlar, Gizlilik
// ✅ Header/User Dropdown'a taşınacaklar: Yardım, Kullanım Kılavuzu, SSS

function Sidebar() {
  const locale = useLocale()
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // SSR-safe: Session yüklenene kadar admin linklerini gösterme
  // Hydration hatasını önlemek için session status'ü kontrol et
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Role kontrolü - Admin ve SuperAdmin linklerini ekle
  // SSR-safe: Sadece client-side'da ve session yüklendikten sonra
  const userRole = mounted && status === 'authenticated' ? ((session?.user as any)?.role || 'USER') : 'USER'
  const isAdmin = userRole === 'ADMIN'
  const isSuperAdmin = userRole === 'SUPER_ADMIN'
  
  // Kullanıcının tüm modül yetkilerini çek (gerçek zamanlı kontrol)
  // Sadece session tamamen yüklendikten sonra API çağrısı yap
  const { data: allPermissions } = useData<Record<string, { canRead: boolean }>>(
    mounted && status === 'authenticated' && session?.user?.id && session?.user?.companyId
      ? `/api/permissions/all`
      : null,
    {
      dedupingInterval: 5000, // 5 saniye cache
      revalidateOnFocus: true, // Focus'ta yeniden kontrol et
      refreshInterval: 60000, // 60 saniyede bir kontrol et - canlı trafikte yükü azalt
    }
  )
  
  // SIDEBAR_SECTIONS - component içinde tanımlıyoruz çünkü t() hook'unu kullanıyoruz
  const SIDEBAR_SECTIONS: SidebarSection[] = React.useMemo(() => [
    {
      key: 'overview',
      title: t('sections.overview'),
      items: [{ href: '/dashboard', label: t('items.dashboard'), icon: LayoutDashboard, module: 'dashboard' }],
    },
    {
      key: 'crm',
      title: t('sections.crm'),
      items: [
        { href: '/companies', label: t('items.companies'), icon: Building2, module: 'company' },
        { href: '/customers', label: t('items.customers'), icon: Users, module: 'customer' },
        { href: '/contacts', label: t('items.contacts'), icon: UserCog, module: 'contact' },
        { href: '/segments', label: t('items.segments'), icon: Filter, module: 'segment' },
      ],
    },
    {
      key: 'sales',
      title: t('sections.sales'),
      items: [
        { href: '/deals', label: t('items.deals'), icon: Briefcase, module: 'deal' },
        { href: '/meetings', label: t('items.meetings'), icon: Calendar, module: 'meeting' },
        { href: '/quotes', label: t('items.quotes'), icon: FileText, module: 'quote' },
        { href: '/contracts', label: t('items.contracts'), icon: ScrollText, module: 'contract' },
        { href: '/approvals', label: t('items.approvals'), icon: CheckCircle, module: 'approval' },
      ],
    },
    {
      key: 'erp',
      title: t('sections.erp'),
      items: [
        { href: '/invoices', label: t('items.invoices'), icon: Receipt, module: 'invoice' },
        { href: '/products', label: t('items.products'), icon: Package, module: 'product' },
        { href: '/shipments', label: t('items.shipments'), icon: Truck, module: 'shipment' },
        { href: '/purchase-shipments', label: t('items.purchaseShipments'), icon: PackageCheck, module: 'purchase-shipment' },
      ],
    },
    {
      key: 'finance',
      title: t('sections.finance'),
      items: [
        { href: '/finance', label: t('items.finance'), icon: ShoppingCart, module: 'finance' },
        { href: '/tickets', label: t('items.tickets'), icon: HelpCircle, module: 'ticket' },
        { href: '/tasks', label: t('items.tasks'), icon: CheckSquare, module: 'task' },
      ],
    },
    {
      key: 'marketing',
      title: t('sections.marketing'),
      items: [
        { href: '/email-campaigns', label: t('items.emailCampaigns'), icon: Send, module: 'email-campaign' },
        { href: '/competitors', label: t('items.competitors'), icon: Target, module: 'competitor' },
        { href: '/reports', label: t('items.reports'), icon: BarChart3, module: 'report' },
      ],
    },
    {
      key: 'management',
      title: t('sections.management'),
      items: [
        { href: '/documents', label: t('items.documents'), icon: FolderOpen, module: 'document' },
        { href: '/vendors', label: t('items.vendors'), icon: Store, module: 'vendor' },
        { href: '/email-templates', label: t('items.emailTemplates'), icon: Mail, module: 'email-templates' },
        { href: '/settings', label: t('items.settings'), icon: Settings },
      ],
    },
  ], [t])
  
  // Admin ve SuperAdmin linklerini dinamik olarak ekle
  // SSR-safe: Sadece client-side'da admin linklerini ekle
  const { sections: sidebarSections, flatItems } = React.useMemo(() => {
    const adminMenuItems: SidebarItem[] = []
    // Sadece client-side'da ve session yüklendikten sonra admin linklerini ekle
    if (mounted && status === 'authenticated') {
      if (isAdmin) {
        adminMenuItems.push({ href: '/admin', label: t('items.adminPanel'), icon: Shield })
      }
      if (isSuperAdmin) {
        adminMenuItems.push({ href: '/superadmin', label: t('items.superAdmin'), icon: Crown })
      }
    }

    // Yetki kontrolü yaparak menü öğelerini filtrele
    const filteredSections: SidebarSection[] = SIDEBAR_SECTIONS.map((section) => {
      const visibleItems = section.items.filter((item) => {
      if (!item.module) {
        return true
      }

      if (isSuperAdmin || isAdmin) {
        return true
      }

      if (allPermissions && allPermissions[item.module]) {
        return allPermissions[item.module].canRead === true
      }

      return true
    })

      return { ...section, items: visibleItems }
    }).filter((section) => section.items.length > 0)

    if (adminMenuItems.length > 0) {
      const managementIndex = filteredSections.findIndex((section) => section.key === 'management')
      if (managementIndex >= 0) {
        const managementSection = filteredSections[managementIndex]
        filteredSections[managementIndex] = {
          ...managementSection,
          items: [...managementSection.items, ...adminMenuItems],
        }
      } else {
        filteredSections.push({
          key: 'admin-tools',
          title: t('sections.adminTools'),
          items: adminMenuItems,
        })
      }
    }

    const flattenedItems = filteredSections.flatMap((section) => section.items)

    return { sections: filteredSections, flatItems: flattenedItems }
  }, [isAdmin, isSuperAdmin, mounted, status, allPermissions, SIDEBAR_SECTIONS, t])

  const prefetchedUrlsRef = React.useRef<Set<string>>(new Set())

  // Sidebar mount olduğunda prefetch işlemlerini bağlantı hızına göre kademe kademe yap
  React.useEffect(() => {
    if (!mounted) return
    if (typeof window === 'undefined') return

    const connection = (navigator as any)?.connection
    if (connection?.saveData) {
      return
    }

    const allUrls = flatItems
      .map((item) => `/${locale}${item.href}`)
      .filter((url) => !prefetchedUrlsRef.current.has(url))

    if (!allUrls.length) {
      return
    }

    const slowConnection =
      connection &&
      ['slow-2g', '2g', '3g'].includes(connection.effectiveType ?? '')
    const maxPrefetchPerCycle = slowConnection ? 3 : allUrls.length
    const queue = allUrls.slice(0, maxPrefetchPerCycle)

    let cancelled = false
    let idleId: ReturnType<typeof requestIdleCallback> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const scheduleNext = () => {
      if (cancelled || queue.length === 0) {
        return
      }

      const url = queue.shift()!
      prefetchedUrlsRef.current.add(url)
      router.prefetch(url)

      if (queue.length === 0) {
        return
      }

      const trigger = () => {
        if (cancelled) return
        scheduleNext()
      }

      if ('requestIdleCallback' in window) {
        idleId = requestIdleCallback(() => trigger(), { timeout: 1500 })
      } else {
        timeoutId = setTimeout(trigger, 500)
      }
    }

    const startPrefetch = () => {
      if (cancelled) return
      scheduleNext()
    }

    if ('requestIdleCallback' in window) {
      idleId = requestIdleCallback(() => startPrefetch(), { timeout: 500 })
    } else {
      timeoutId = setTimeout(startPrefetch, 200)
    }

    return () => {
      cancelled = true
      if (idleId !== null && 'cancelIdleCallback' in window) {
        cancelIdleCallback(idleId)
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
    }
  }, [flatItems, locale, mounted, router])

  // GPU-friendly sidebar animations
  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
    closed: {
      x: -20,
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      },
    },
  }

  // Menu item hover spring animation - daha smooth ve belirgin
  const menuItemVariants = {
    rest: {
      scale: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.5,
      },
    },
    hover: {
      scale: 1.02,
      x: 6,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 20,
        mass: 0.4,
      },
    },
  }

  // Icon animation on hover - daha belirgin ve smooth
  // İkon renkleri - her modül için farklı renkler (yumuşak ve uyumlu tonlar)
  const iconColors: Record<string, { active: string; inactive: string; hover: string }> = {
    '/dashboard': { active: 'text-indigo-600', inactive: 'text-slate-500', hover: 'text-indigo-500' },
    '/companies': { active: 'text-blue-600', inactive: 'text-slate-500', hover: 'text-blue-500' },
    '/customers': { active: 'text-cyan-600', inactive: 'text-slate-500', hover: 'text-cyan-500' },
    '/contacts': { active: 'text-teal-600', inactive: 'text-slate-500', hover: 'text-teal-500' },
    '/segments': { active: 'text-emerald-600', inactive: 'text-slate-500', hover: 'text-emerald-500' },
    '/deals': { active: 'text-purple-600', inactive: 'text-slate-500', hover: 'text-purple-500' },
    '/meetings': { active: 'text-pink-500', inactive: 'text-slate-500', hover: 'text-pink-400' },
    '/quotes': { active: 'text-rose-500', inactive: 'text-slate-500', hover: 'text-rose-400' },
    '/contracts': { active: 'text-orange-500', inactive: 'text-slate-500', hover: 'text-orange-400' },
    '/approvals': { active: 'text-green-600', inactive: 'text-slate-500', hover: 'text-green-500' },
    '/invoices': { active: 'text-rose-500', inactive: 'text-slate-500', hover: 'text-rose-400' }, // Kırmızı yerine yumuşak rose
    '/products': { active: 'text-amber-500', inactive: 'text-slate-500', hover: 'text-amber-400' },
    '/shipments': { active: 'text-violet-500', inactive: 'text-slate-500', hover: 'text-violet-400' },
    '/purchase-shipments': { active: 'text-fuchsia-500', inactive: 'text-slate-500', hover: 'text-fuchsia-400' },
    '/finance': { active: 'text-emerald-500', inactive: 'text-slate-500', hover: 'text-emerald-400' },
    '/tickets': { active: 'text-amber-500', inactive: 'text-slate-500', hover: 'text-amber-400' },
    '/tasks': { active: 'text-sky-500', inactive: 'text-slate-500', hover: 'text-sky-400' },
    '/email-campaigns': { active: 'text-indigo-500', inactive: 'text-slate-500', hover: 'text-indigo-400' },
    '/competitors': { active: 'text-orange-500', inactive: 'text-slate-500', hover: 'text-orange-400' }, // Kırmızı yerine turuncu
    '/reports': { active: 'text-blue-500', inactive: 'text-slate-500', hover: 'text-blue-400' },
    '/activity': { active: 'text-purple-500', inactive: 'text-slate-500', hover: 'text-purple-400' },
    '/documents': { active: 'text-slate-600', inactive: 'text-slate-500', hover: 'text-slate-500' },
    '/vendors': { active: 'text-emerald-500', inactive: 'text-slate-500', hover: 'text-emerald-400' },
    '/admin': { active: 'text-indigo-600', inactive: 'text-slate-500', hover: 'text-indigo-500' },
    '/superadmin': { active: 'text-purple-600', inactive: 'text-slate-500', hover: 'text-purple-500' },
  }

  // İkon animasyonları kaldırıldı - sadece glow efekti kullanılacak

  return (
    <motion.aside
      initial="open"
      animate="open"
      variants={sidebarVariants}
      className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-sm"
      style={{
        willChange: 'transform, opacity',
        transform: 'translateZ(0)', // GPU acceleration
      }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <motion.div
          className="flex h-16 items-center border-b px-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            delay: 0.1,
          }}
        >
          <Link 
            href={`/${locale}/dashboard`}
            prefetch={true}
            className="cursor-pointer"
          >
            <motion.h1
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              whileHover={{ 
                scale: 1.08,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                },
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
            >
              CRM V3
            </motion.h1>
          </Link>
        </motion.div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <div className="space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.key} className="space-y-2">
                <motion.div
                  className="mx-2 flex items-center gap-2 rounded-full border border-slate-100/60 bg-gradient-to-r from-sky-400/18 via-indigo-500/16 to-purple-500/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500 shadow-[0_10px_30px_-18px_rgba(45,134,245,0.55)]"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 }}
                >
                  <span className="h-[7px] w-[7px] rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 shadow-[0_0_6px_rgba(45,134,245,0.75)]" />
                  <span>{section.title}</span>
                </motion.div>
          <AnimatePresence mode="popLayout">
                  {section.items.map((item, index) => {
              const Icon = item.icon
              const href = `/${locale}${item.href}`
              const isActive = pathname?.startsWith(href) || pathname === href

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                          delay: index * 0.04,
                    mass: 0.5,
                  }}
                  style={{
                    willChange: 'transform, opacity',
                          transform: 'translateZ(0)',
                  }}
                >
                  <motion.div
                    variants={menuItemVariants}
                    initial="rest"
                    whileHover="hover"
                          whileTap={{ scale: 0.98 }}
                    style={{
                      willChange: 'transform',
                            transform: 'translateZ(0)',
                    }}
                  >
                  <PrefetchLink
                    href={href}
                    priority="high"
                    className={cn(
                              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium relative overflow-hidden group transition-colors',
                      isActive
                                ? 'text-indigo-600 font-semibold'
                                : 'text-slate-600 hover:text-indigo-600',
                              (item.href === '/admin' || item.href === '/superadmin') &&
                                'border-l-4 border-indigo-600/60',
                            )}
                          >

                            <div className="relative flex items-center">
                              <Icon
                                className={cn(
                                  'h-5 w-5 flex-shrink-0 relative z-10 transition-colors duration-500',
                                  iconColors[item.href] 
                                    ? (isActive 
                                        ? iconColors[item.href].active 
                                        : 'text-slate-500')
                                    : (isActive ? 'text-indigo-600' : 'text-slate-500'),
                                )}
                              />
                              {/* Aktif ikon için yumuşak geçişli glow efekti - sadece seçili sekmede */}
                              {isActive && iconColors[item.href] && (
                        <motion.div
                                  className="absolute inset-0 rounded-lg blur-xl -z-0"
                                  style={{
                                    background: `radial-gradient(circle, currentColor 0%, transparent 80%)`,
                                    color: iconColors[item.href].active.includes('indigo') ? '#4f46e5' :
                                           iconColors[item.href].active.includes('blue') ? '#2563eb' :
                                           iconColors[item.href].active.includes('purple') ? '#9333ea' :
                                           iconColors[item.href].active.includes('pink') ? '#ec4899' :
                                           iconColors[item.href].active.includes('green') ? '#16a34a' :
                                           iconColors[item.href].active.includes('cyan') ? '#0891b2' :
                                           iconColors[item.href].active.includes('teal') ? '#0d9488' :
                                           iconColors[item.href].active.includes('emerald') ? '#10b981' :
                                           iconColors[item.href].active.includes('rose') ? '#f43f5e' :
                                           iconColors[item.href].active.includes('orange') ? '#f97316' :
                                           iconColors[item.href].active.includes('amber') ? '#f59e0b' :
                                           iconColors[item.href].active.includes('violet') ? '#8b5cf6' :
                                           iconColors[item.href].active.includes('fuchsia') ? '#d946ef' :
                                           iconColors[item.href].active.includes('sky') ? '#0ea5e9' :
                                           iconColors[item.href].active.includes('slate') ? '#64748b' :
                                           '#6366f1',
                                  }}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{
                                    opacity: [0.2, 0.4, 0.2],
                                    scale: [1, 1.1, 1],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              )}
                            </div>

                            {/* Yazı için geçişli renk efekti - sadece aktif sekmede */}
                            <motion.span
                              className={cn(
                                'relative z-10 font-medium transition-colors duration-500',
                                iconColors[item.href] && isActive
                                  ? iconColors[item.href].active
                                  : isActive
                                  ? 'text-indigo-600'
                                  : 'text-slate-600'
                              )}
                              animate={isActive ? {
                                opacity: [0.9, 1, 0.9],
                              } : {}}
                              transition={{
                                duration: 3,
                                repeat: isActive ? Infinity : 0,
                                ease: 'easeInOut',
                              }}
                    >
                      {item.label}
                    </motion.span>
                    
                            {/* Aktif sekme için geçişli arka plan glow efekti */}
                            {isActive && iconColors[item.href] && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                                initial={{ opacity: 0 }}
                                animate={{
                                  opacity: [0.05, 0.12, 0.05],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                        }}
                                style={{
                                  background: iconColors[item.href].active.includes('indigo') 
                                    ? 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)'
                                    : iconColors[item.href].active.includes('blue')
                                    ? 'linear-gradient(90deg, rgba(37,99,235,0.15) 0%, rgba(59,130,246,0.08) 100%)'
                                    : iconColors[item.href].active.includes('purple')
                                    ? 'linear-gradient(90deg, rgba(147,51,234,0.15) 0%, rgba(168,85,247,0.08) 100%)'
                                    : iconColors[item.href].active.includes('pink')
                                    ? 'linear-gradient(90deg, rgba(236,72,153,0.15) 0%, rgba(244,114,182,0.08) 100%)'
                                    : iconColors[item.href].active.includes('green')
                                    ? 'linear-gradient(90deg, rgba(22,163,74,0.15) 0%, rgba(34,197,94,0.08) 100%)'
                                    : iconColors[item.href].active.includes('cyan')
                                    ? 'linear-gradient(90deg, rgba(8,145,178,0.15) 0%, rgba(34,211,238,0.08) 100%)'
                                    : iconColors[item.href].active.includes('teal')
                                    ? 'linear-gradient(90deg, rgba(13,148,136,0.15) 0%, rgba(20,184,166,0.08) 100%)'
                                    : iconColors[item.href].active.includes('emerald')
                                    ? 'linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(34,197,94,0.08) 100%)'
                                    : iconColors[item.href].active.includes('rose')
                                    ? 'linear-gradient(90deg, rgba(244,63,94,0.15) 0%, rgba(251,113,133,0.08) 100%)'
                                    : iconColors[item.href].active.includes('orange')
                                    ? 'linear-gradient(90deg, rgba(249,115,22,0.15) 0%, rgba(251,146,60,0.08) 100%)'
                                    : iconColors[item.href].active.includes('amber')
                                    ? 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.08) 100%)'
                                    : iconColors[item.href].active.includes('violet')
                                    ? 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.08) 100%)'
                                    : iconColors[item.href].active.includes('fuchsia')
                                    ? 'linear-gradient(90deg, rgba(217,70,239,0.15) 0%, rgba(232,121,249,0.08) 100%)'
                                    : iconColors[item.href].active.includes('sky')
                                    ? 'linear-gradient(90deg, rgba(14,165,233,0.15) 0%, rgba(56,189,248,0.08) 100%)'
                                    : iconColors[item.href].active.includes('slate')
                                    ? 'linear-gradient(90deg, rgba(100,116,139,0.15) 0%, rgba(148,163,184,0.08) 100%)'
                                    : 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 100%)',
                                }}
                      />
                    )}
                  </PrefetchLink>
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>
              </div>
            ))}
          </div>
        </nav>

        {/* Onboarding Button */}
        <div className="px-4 pb-4 pt-2 border-t border-gray-200">
          <OnboardingButton />
        </div>
      </div>
    </motion.aside>
  )
}

// Memoize Sidebar - re-render'ları önle
export default memo(Sidebar)

