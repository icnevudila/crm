'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
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
  Info,
  FileText as FileTextIcon,
  Shield as ShieldIcon,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Firmalar', icon: Building2 },
  { href: '/vendors', label: 'Tedarikçiler', icon: Store },
  { href: '/customers', label: 'Müşteriler', icon: Users },
  { href: '/deals', label: 'Fırsatlar', icon: Briefcase },
  { href: '/quotes', label: 'Teklifler', icon: FileText },
  { href: '/invoices', label: 'Faturalar', icon: Receipt },
  { href: '/products', label: 'Ürünler', icon: Package },
  { href: '/shipments', label: 'Sevkiyatlar', icon: Truck },
  { href: '/purchase-shipments', label: 'Mal Kabul', icon: PackageCheck },
  { href: '/finance', label: 'Finans', icon: ShoppingCart },
  { href: '/tasks', label: 'Görevler', icon: CheckSquare }, // Farklı ikon
  { href: '/tickets', label: 'Destek', icon: HelpCircle }, // Farklı ikon
  { href: '/reports', label: 'Raporlar', icon: BarChart3 }, // Farklı ikon
  { href: '/users', label: 'Kullanıcılar', icon: UserCog },
  { href: '/help', label: 'Yardım', icon: HelpCircle },
  { href: '/faq', label: 'SSS', icon: HelpCircle },
  { href: '/about', label: 'Hakkımızda', icon: Info },
  { href: '/terms', label: 'Şartlar', icon: FileTextIcon },
  { href: '/privacy', label: 'Gizlilik', icon: ShieldIcon },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
]

function Sidebar() {
  const locale = useLocale()
  const pathname = usePathname()
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
    return [...menuItems, ...adminMenuItems]
  }, [isAdmin, isSuperAdmin, mounted, status])

  // Sidebar mount olduğunda SADECE ÖNEMLİ sayfaları prefetch et (ilk yükleme hızı için)
  // SSR-safe - sadece client-side'da çalışır
  
  React.useEffect(() => {
    if (!mounted) return // SSR'da çalıştırma
    
    // İlk yükleme hızı için sadece kritik sayfaları prefetch et
    const criticalPages = ['/dashboard', '/customers', '/quotes', '/invoices', '/deals']
    
    if (typeof window !== 'undefined' && document && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        allMenuItems
          .filter(item => criticalPages.includes(item.href))
          .forEach((item) => {
            const href = `/${locale}${item.href}`
            // Sadece daha önce prefetch edilmemişse ekle (duplicate kontrolü)
            if (!document.querySelector(`link[href="${href}"]`)) {
              const linkElement = document.createElement('link')
              linkElement.rel = 'prefetch'
              linkElement.as = 'document'
              linkElement.href = href
              document.head.appendChild(linkElement)
            }
          })
      }, { timeout: 5000 }) // 5 saniye sonra prefetch - ilk yükleme tamamlandıktan sonra
    } else if (typeof window !== 'undefined' && document) {
      // Fallback - direkt prefetch (5 saniye sonra)
      setTimeout(() => {
        allMenuItems
          .filter(item => criticalPages.includes(item.href))
          .forEach((item) => {
            const href = `/${locale}${item.href}`
            // Sadece daha önce prefetch edilmemişse ekle (duplicate kontrolü)
            if (!document.querySelector(`link[href="${href}"]`)) {
              const linkElement = document.createElement('link')
              linkElement.rel = 'prefetch'
              linkElement.as = 'document'
              linkElement.href = href
              document.head.appendChild(linkElement)
            }
          })
      }, 5000) // 5 saniye sonra prefetch - ilk yükleme tamamlandıktan sonra
    }
  }, [locale, allMenuItems, mounted])

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white shadow-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link 
            href={`/${locale}/dashboard`}
            prefetch={true}
            className="cursor-pointer"
          >
            <h1 className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              CRM V3
            </h1>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {allMenuItems.map((item) => {
            const Icon = item.icon
            const href = `/${locale}${item.href}`
            // Pathname /tr/customers/123 gibi olabilir, sadece base path'i kontrol et
            const isActive = pathname?.startsWith(href) || pathname === href

            // Tüm linkler için yüksek öncelik - hemen prefetch (instant navigation)
            return (
              <PrefetchLink
                key={item.href}
                href={href}
                priority="high"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-75',
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-600 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  // Admin ve SuperAdmin linklerini vurgula
                  (item.href === '/admin' || item.href === '/superadmin') && 'border-l-4 border-primary-600',
                  // Instant navigation optimizasyonları
                  'will-change-transform',
                  'transform-gpu'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </PrefetchLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

// Memoize Sidebar - re-render'ları önle
export default memo(Sidebar)

