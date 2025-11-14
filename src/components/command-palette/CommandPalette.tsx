'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Receipt,
  ShoppingCart,
  Package,
  Calendar,
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Settings,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { useData } from '@/hooks/useData'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  keywords: string[]
}

export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [search, setSearch] = useState('')

  // Son görüntülenen kayıtlar (localStorage'dan)
  const [recentItems, setRecentItems] = useState<Array<{
    id: string
    label: string
    href: string
    type: string
  }>>([])

  // Müşteri ve Deal arama için (debounced search ile)
  const searchUrl = search.length > 2 ? `/api/customers?search=${encodeURIComponent(search)}&limit=5` : null
  const dealsUrl = search.length > 2 ? `/api/deals?search=${encodeURIComponent(search)}&limit=5` : null
  
  const { data: customers = [] } = useData<any[]>(searchUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
  })

  const { data: deals = [] } = useData<any[]>(dealsUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
  })

  // Sayfa navigasyonu için hızlı erişim
  const pages: QuickAction[] = useMemo(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        href: `/${locale}/dashboard`,
        keywords: ['dashboard', 'ana sayfa', 'gösterge', 'panel'],
      },
      {
        id: 'customers',
        label: 'Müşteriler',
        icon: <Users className="h-4 w-4" />,
        href: `/${locale}/customers`,
        keywords: ['müşteri', 'customer', 'client'],
      },
      {
        id: 'companies',
        label: 'Firmalar',
        icon: <Building2 className="h-4 w-4" />,
        href: `/${locale}/companies`,
        keywords: ['firma', 'company', 'şirket'],
      },
      {
        id: 'deals',
        label: 'Fırsatlar',
        icon: <TrendingUp className="h-4 w-4" />,
        href: `/${locale}/deals`,
        keywords: ['fırsat', 'deal', 'satış'],
      },
      {
        id: 'quotes',
        label: 'Teklifler',
        icon: <FileText className="h-4 w-4" />,
        href: `/${locale}/quotes`,
        keywords: ['teklif', 'quote', 'offer'],
      },
      {
        id: 'invoices',
        label: 'Faturalar',
        icon: <Receipt className="h-4 w-4" />,
        href: `/${locale}/invoices`,
        keywords: ['fatura', 'invoice', 'bill'],
      },
      {
        id: 'products',
        label: 'Ürünler',
        icon: <Package className="h-4 w-4" />,
        href: `/${locale}/products`,
        keywords: ['ürün', 'product', 'item'],
      },
      {
        id: 'tasks',
        label: 'Görevler',
        icon: <CheckSquare className="h-4 w-4" />,
        href: `/${locale}/tasks`,
        keywords: ['görev', 'task', 'todo'],
      },
      {
        id: 'meetings',
        label: 'Görüşmeler',
        icon: <Calendar className="h-4 w-4" />,
        href: `/${locale}/meetings`,
        keywords: ['görüşme', 'meeting', 'toplantı'],
      },
      {
        id: 'tickets',
        label: 'Talepler',
        icon: <MessageSquare className="h-4 w-4" />,
        href: `/${locale}/tickets`,
        keywords: ['talep', 'ticket', 'destek'],
      },
      {
        id: 'settings',
        label: 'Ayarlar',
        icon: <Settings className="h-4 w-4" />,
        href: `/${locale}/settings`,
        keywords: ['ayar', 'settings', 'config'],
      },
    ],
    [locale]
  )

  // Hızlı işlemler (yeni kayıt oluşturma)
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'new-customer',
        label: 'Yeni Müşteri',
        icon: <Plus className="h-4 w-4" />,
        href: `/${locale}/customers/new`,
        keywords: ['yeni müşteri', 'new customer', 'müşteri ekle'],
      },
      {
        id: 'new-deal',
        label: 'Yeni Fırsat',
        icon: <Plus className="h-4 w-4" />,
        href: `/${locale}/deals/new`,
        keywords: ['yeni fırsat', 'new deal', 'fırsat ekle'],
      },
      {
        id: 'new-quote',
        label: 'Yeni Teklif',
        icon: <Plus className="h-4 w-4" />,
        href: `/${locale}/quotes/new`,
        keywords: ['yeni teklif', 'new quote', 'teklif ekle'],
      },
      {
        id: 'new-invoice',
        label: 'Yeni Fatura',
        icon: <Plus className="h-4 w-4" />,
        href: `/${locale}/invoices/new`,
        keywords: ['yeni fatura', 'new invoice', 'fatura ekle'],
      },
      {
        id: 'new-task',
        label: 'Yeni Görev',
        icon: <Plus className="h-4 w-4" />,
        href: `/${locale}/tasks/new`,
        keywords: ['yeni görev', 'new task', 'görev ekle'],
      },
    ],
    [locale]
  )

  // Arama sonuçlarını filtrele
  const filteredPages = useMemo(() => {
    if (!search) return pages
    const lowerSearch = search.toLowerCase()
    return pages.filter(
      (page) =>
        page.label.toLowerCase().includes(lowerSearch) ||
        page.keywords.some((kw) => kw.toLowerCase().includes(lowerSearch))
    )
  }, [pages, search])

  const filteredQuickActions = useMemo(() => {
    if (!search) return quickActions
    const lowerSearch = search.toLowerCase()
    return quickActions.filter(
      (action) =>
        action.label.toLowerCase().includes(lowerSearch) ||
        action.keywords.some((kw) => kw.toLowerCase().includes(lowerSearch))
    )
  }, [quickActions, search])

  // Müşteri ve Deal sonuçlarını filtrele
  const filteredCustomers = useMemo(() => {
    if (!search || search.length <= 2 || !searchUrl) return []
    const lowerSearch = search.toLowerCase()
    return (customers || [])
      .filter(
        (customer: any) =>
          customer?.name?.toLowerCase().includes(lowerSearch) ||
          customer?.email?.toLowerCase().includes(lowerSearch) ||
          customer?.phone?.includes(search)
      )
      .slice(0, 5)
  }, [customers, search, searchUrl])

  const filteredDeals = useMemo(() => {
    if (!search || search.length <= 2 || !dealsUrl) return []
    const lowerSearch = search.toLowerCase()
    return (deals || [])
      .filter(
        (deal: any) =>
          deal?.title?.toLowerCase().includes(lowerSearch) ||
          deal?.customer?.name?.toLowerCase().includes(lowerSearch)
      )
      .slice(0, 5)
  }, [deals, search, dealsUrl])

  // Navigate fonksiyonu
  const handleSelect = (href: string) => {
    router.push(href)
    onOpenChange(false)
    setSearch('')
  }

  // Recent items'ı localStorage'dan yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crm_recent_items')
      if (stored) {
        try {
          setRecentItems(JSON.parse(stored))
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Recent items'ı güncelle (sayfa değiştiğinde)
  useEffect(() => {
    if (pathname && typeof window !== 'undefined') {
      const pathParts = pathname.split('/')
      const entityType = pathParts[pathParts.length - 2] // customers, deals, etc.
      const entityId = pathParts[pathParts.length - 1]

      if (entityId && entityId !== 'new' && entityId.length > 10) {
        // UUID gibi görünüyor
        const newItem = {
          id: entityId,
          label: `${entityType} - ${entityId.substring(0, 8)}`,
          href: pathname,
          type: entityType,
        }

        setRecentItems((prev) => {
          const filtered = prev.filter((item) => item.id !== entityId)
          const updated = [newItem, ...filtered].slice(0, 5) // Son 5 kayıt
          localStorage.setItem('crm_recent_items', JSON.stringify(updated))
          return updated
        })
      }
    }
  }, [pathname])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Komut ara veya sayfaya git... (Cmd+K / Ctrl+K)"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {search.length > 2 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Sonuç bulunamadı. Farklı bir arama terimi deneyin.
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-gray-500">
              Arama yapmak için yazmaya başlayın...
            </div>
          )}
        </CommandEmpty>

        {/* Son Görüntülenenler */}
        {recentItems.length > 0 && !search && (
          <>
            <CommandGroup heading="Son Görüntülenenler">
              {recentItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Müşteri Sonuçları */}
        {filteredCustomers.length > 0 && (
          <>
            <CommandGroup heading="Müşteriler">
              {filteredCustomers.map((customer: any) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() =>
                    handleSelect(`/${locale}/customers/${customer.id}`)
                  }
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span>{customer.name}</span>
                  {customer.email && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {customer.email}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Deal Sonuçları */}
        {filteredDeals.length > 0 && (
          <>
            <CommandGroup heading="Fırsatlar">
              {filteredDeals.map((deal: any) => (
                <CommandItem
                  key={deal.id}
                  onSelect={() => handleSelect(`/${locale}/deals/${deal.id}`)}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{deal.title}</span>
                  {deal.customer?.name && (
                    <span className="text-xs text-gray-500 ml-auto">
                      {deal.customer.name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Hızlı İşlemler */}
        {filteredQuickActions.length > 0 && (
          <>
            <CommandGroup heading="Hızlı İşlemler">
              {filteredQuickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action.href)}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Sayfalar */}
        {filteredPages.length > 0 && (
          <CommandGroup heading="Sayfalar">
            {filteredPages.map((page) => (
              <CommandItem
                key={page.id}
                onSelect={() => handleSelect(page.href)}
                className="flex items-center gap-2"
              >
                {page.icon}
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}

