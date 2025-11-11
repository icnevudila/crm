'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
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
  Activity,
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
import { useSession } from 'next-auth/react'
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

const menuItems = [
  // 📊 GENEL BAKIŞ
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  
  // 👥 MÜŞTERİ YÖNETİMİ
  { href: '/companies', label: 'Müşteri Firmalar', icon: Building2, module: 'company' },
  { href: '/customers', label: 'Bireysel Müşteriler', icon: Users, module: 'customer' },
  { href: '/contacts', label: 'Firma Yetkilileri', icon: UserCog, module: 'contact' },
  { href: '/segments', label: 'Müşteri Segmentleri', icon: Filter, module: 'segment' },
  
  // 💼 SATIŞ SÜRECİ (İş Akışı Sırası: Fırsat → Görüşme → Teklif → Sözleşme)
  { href: '/deals', label: 'Fırsatlar', icon: Briefcase, module: 'deal' },
  { href: '/meetings', label: 'Görüşmeler', icon: Calendar, module: 'meeting' },
  { href: '/quotes', label: 'Teklifler', icon: FileText, module: 'quote' },
  { href: '/contracts', label: 'Sözleşmeler', icon: ScrollText, module: 'contract' },
  { href: '/approvals', label: 'Onaylar', icon: CheckCircle, module: 'approval' },
  
  // 📦 OPERASYONLAR
  { href: '/invoices', label: 'Faturalar', icon: Receipt, module: 'invoice' },
  { href: '/products', label: 'Ürünler', icon: Package, module: 'product' },
  { href: '/shipments', label: 'Sevkiyatlar', icon: Truck, module: 'shipment' },
  { href: '/purchase-shipments', label: 'Mal Kabul', icon: PackageCheck, module: 'purchase-shipment' },
  
  // 💰 FİNANS & DESTEK
  { href: '/finance', label: 'Finans', icon: ShoppingCart, module: 'finance' },
  { href: '/tickets', label: 'Destek Talepleri', icon: HelpCircle, module: 'ticket' },
  { href: '/tasks', label: 'Görevler', icon: CheckSquare, module: 'task' },
  
  // 📢 PAZARLAMA & ANALİZ
  { href: '/email-campaigns', label: 'Email Kampanyaları', icon: Send, module: 'email-campaign' },
  { href: '/competitors', label: 'Rakip Analizi', icon: Target, module: 'competitor' },
  
  // 🏢 YÖNETİM
  { href: '/documents', label: 'Dökümanlar', icon: FolderOpen, module: 'document' },
  { href: '/vendors', label: 'Tedarikçiler', icon: Store, module: 'vendor' },
  { href: '/reports', label: 'Raporlar', icon: BarChart3, module: 'report' },
  { href: '/email-templates', label: 'E-posta Şablonları', icon: Mail, module: 'email-templates' },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
]

// ✅ Kullanıcılar modülü kaldırıldı - Admin ve SuperAdmin kendi panellerinden görebiliyor
// Admin: /admin sayfasından kullanıcıları görebilir ve yönetebilir
// SuperAdmin: /superadmin sayfasındaki "Kullanıcılar" tab'ından görebilir ve yönetebilir

// ✅ Footer'a taşınacaklar: Hakkımızda, Şartlar, Gizlilik
// ✅ Header/User Dropdown'a taşınacaklar: Yardım, Kullanım Kılavuzu, SSS

function Sidebar() {
  const locale = useLocale()
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
      refreshInterval: 10000, // 10 saniyede bir kontrol et - yetki değişikliklerini dinle
    }
  )
  
  // Admin ve SuperAdmin linklerini dinamik olarak ekle
  // SSR-safe: Sadece client-side'da admin linklerini ekle
  const allMenuItems = React.useMemo(() => {
    const adminMenuItems = []
    // Sadece client-side'da ve session yüklendikten sonra admin linklerini ekle
    if (mounted && status === 'authenticated') {
      if (isAdmin) {
        adminMenuItems.push({ href: '/admin', label: 'Admin Paneli', icon: Shield })
      }
      if (isSuperAdmin) {
        adminMenuItems.push({ href: '/superadmin', label: 'Süper Admin', icon: Crown })
      }
    }

    // Yetki kontrolü yaparak menü öğelerini filtrele
    const filteredMenuItems = menuItems.filter((item) => {
      // Modül yoksa (yardım, ayarlar vb.) her zaman göster
      if (!item.module) {
        return true
      }

      // SUPER_ADMIN ve ADMIN her zaman tüm modülleri görebilir
      if (isSuperAdmin || isAdmin) {
        return true
      }

      // Yetki kontrolü - canRead varsa göster
      if (allPermissions && allPermissions[item.module]) {
        return allPermissions[item.module].canRead === true
      }

      // Yetki verisi yüklenmediyse varsayılan olarak göster (loading state)
      return true
    })

    return [...filteredMenuItems, ...adminMenuItems]
  }, [isAdmin, isSuperAdmin, mounted, status, allPermissions])

  // Sidebar mount olduğunda TÜM sayfaları prefetch et (sekme geçişlerini <100ms'e düşürmek için)
  // SSR-safe - sadece client-side'da çalışır
  // Veri çekimini etkilemez - sadece route prefetch
  // NOT: allMenuItems dependency array'den çıkarıldı - her render'da yeni referans oluşturuyor ve boyutu değişebilir
  // Bunun yerine sadece locale ve mounted değiştiğinde prefetch yap
  // allMenuItems değişse bile prefetch zaten yapılmış olacak (Next.js duplicate kontrolü yapıyor)
  
  React.useEffect(() => {
    if (!mounted) return // SSR'da çalıştırma
    
    // TÜM menü itemlerini hemen prefetch et (1 saniye sonra - ilk yükleme tamamlandıktan sonra)
    // Next.js router.prefetch kullan - daha güvenilir ve hızlı
    // allMenuItems'ı closure içinde kullan - dependency array'de tutmuyoruz (boyut değişebilir)
    const prefetchAllPages = () => {
      const prefetchedUrls: string[] = []
      allMenuItems.forEach((item) => {
        const href = `/${locale}${item.href}`
        router.prefetch(href) // Next.js router.prefetch kullan
        prefetchedUrls.push(href)
      })
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sidebar] Prefetched all pages:', prefetchedUrls.length, 'pages', prefetchedUrls)
      }
    }
    
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(prefetchAllPages, { timeout: 200 }) // 0.2 saniye sonra (ULTRA AGRESİF!)
    } else {
      // Fallback - direkt prefetch (0.2 saniye sonra)
      setTimeout(prefetchAllPages, 200) // 0.2 saniye sonra (ULTRA AGRESİF!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, mounted, router]) // allMenuItems dependency'den çıkarıldı - boyut değişebilir, her render'da yeni referans

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
  const iconVariants = {
    rest: {
      rotate: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    hover: {
      rotate: [0, -5, 5, 0], // Smooth rotate animation
      scale: 1.15,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 20,
        mass: 0.3,
      },
    },
  }

  // Active item pulse animation
  const activePulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

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
          <AnimatePresence mode="popLayout">
            {allMenuItems.map((item, index) => {
              const Icon = item.icon
              const href = `/${locale}${item.href}`
              // Pathname /tr/customers/123 gibi olabilir, sadece base path'i kontrol et
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
                    delay: index * 0.04, // Daha belirgin stagger animation
                    mass: 0.5,
                  }}
                  style={{
                    willChange: 'transform, opacity',
                    transform: 'translateZ(0)', // GPU acceleration
                  }}
                >
                  <motion.div
                    variants={menuItemVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap={{ scale: 0.98 }} // Click animation
                    style={{
                      willChange: 'transform',
                      transform: 'translateZ(0)', // GPU acceleration
                    }}
                  >
                  <PrefetchLink
                    href={href}
                    priority="high"
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium relative overflow-hidden group',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-50 via-indigo-50 to-purple-50 text-indigo-600 shadow-md shadow-indigo-100/50'
                        : 'text-gray-700 hover:text-indigo-600',
                      // Admin ve SuperAdmin linklerini vurgula
                      (item.href === '/admin' || item.href === '/superadmin') && 'border-l-4 border-indigo-600',
                    )}
                  >
                    {/* Active indicator background with pulse */}
                    {isActive && (
                      <>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-indigo-50 to-purple-50"
                          layoutId="activeBackground"
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                          }}
                          style={{
                            willChange: 'transform',
                            transform: 'translateZ(0)',
                          }}
                        />
                        {/* Active pulse effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-purple-100/50 rounded-lg"
                          variants={activePulseVariants}
                          animate="pulse"
                          style={{
                            willChange: 'transform',
                            transform: 'translateZ(0)',
                          }}
                        />
                      </>
                    )}
                    
                    {/* Icon with enhanced spring animation */}
                    <motion.div
                      variants={iconVariants}
                      style={{
                        willChange: 'transform',
                        transform: 'translateZ(0)',
                      }}
                    >
                      <Icon className={cn(
                        'h-5 w-5 flex-shrink-0 relative z-10 transition-colors',
                        isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-indigo-600'
                      )} />
                    </motion.div>
                    
                    <motion.span 
                      className="relative z-10 font-medium"
                      initial={{ opacity: 0.9 }}
                      whileHover={{ opacity: 1 }}
                    >
                      {item.label}
                    </motion.span>
                    
                    {/* Enhanced hover background effect with gradient */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-gray-50 to-indigo-50/30 rounded-lg"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 20,
                        }}
                        style={{
                          willChange: 'opacity',
                        }}
                      />
                    )}

                    {/* Ripple effect on hover */}
                    {!isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        initial={{ scale: 0, opacity: 0.5 }}
                        whileHover={{
                          scale: 1.1,
                          opacity: 0,
                          transition: {
                            duration: 0.6,
                            ease: 'easeOut',
                          },
                        }}
                        style={{
                          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
                          willChange: 'transform, opacity',
                        }}
                      />
                    )}
                  </PrefetchLink>
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>
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

