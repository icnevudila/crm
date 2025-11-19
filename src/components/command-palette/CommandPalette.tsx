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
import dynamic from 'next/dynamic'

// Form component'lerini lazy load et
const CustomerForm = dynamic(() => import('@/components/customers/CustomerForm'), { ssr: false })
const DealForm = dynamic(() => import('@/components/deals/DealForm'), { ssr: false })
const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), { ssr: false })
const InvoiceForm = dynamic(() => import('@/components/invoices/InvoiceForm'), { ssr: false })
const TaskForm = dynamic(() => import('@/components/tasks/TaskForm'), { ssr: false })
const MeetingForm = dynamic(() => import('@/components/meetings/MeetingForm'), { ssr: false })

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  formType?: 'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'meeting'
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
  
  // Form modal state'leri
  const [formOpen, setFormOpen] = useState<{
    type: 'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'meeting' | null
  }>({ type: null })

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
  
  const { data: customersResponse } = useData<{ data?: any[]; pagination?: any }>(searchUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
  })

  const { data: dealsResponse } = useData<{ data?: any[]; pagination?: any }>(dealsUrl, {
    dedupingInterval: 2000,
    revalidateOnFocus: false,
  })

  // API response'dan data array'ini çıkar
  const customers = customersResponse?.data || []
  const deals = dealsResponse?.data || []

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

  // Hızlı işlemler (yeni kayıt oluşturma - modal olarak açılacak)
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'new-customer',
        label: 'Yeni Müşteri',
        icon: <Plus className="h-4 w-4" />,
        formType: 'customer',
        keywords: ['yeni müşteri', 'new customer', 'müşteri ekle'],
      },
      {
        id: 'new-deal',
        label: 'Yeni Fırsat',
        icon: <Plus className="h-4 w-4" />,
        formType: 'deal',
        keywords: ['yeni fırsat', 'new deal', 'fırsat ekle'],
      },
      {
        id: 'new-quote',
        label: 'Yeni Teklif',
        icon: <Plus className="h-4 w-4" />,
        formType: 'quote',
        keywords: ['yeni teklif', 'new quote', 'teklif ekle'],
      },
      {
        id: 'new-invoice',
        label: 'Yeni Fatura',
        icon: <Plus className="h-4 w-4" />,
        formType: 'invoice',
        keywords: ['yeni fatura', 'new invoice', 'fatura ekle'],
      },
      {
        id: 'new-task',
        label: 'Yeni Görev',
        icon: <Plus className="h-4 w-4" />,
        formType: 'task',
        keywords: ['yeni görev', 'new task', 'görev ekle'],
      },
      {
        id: 'new-meeting',
        label: 'Yeni Toplantı',
        icon: <Plus className="h-4 w-4" />,
        formType: 'meeting',
        keywords: ['yeni toplantı', 'new meeting', 'toplantı ekle'],
      },
      {
        id: 'integration-analytics',
        label: 'Entegrasyon İstatistikleri',
        icon: <TrendingUp className="h-4 w-4" />,
        href: `/${locale}/integrations/analytics`,
        keywords: ['entegrasyon', 'analytics', 'istatistik', 'integration'],
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
    // customers'ın array olduğundan emin ol
    const customersArray = Array.isArray(customers) ? customers : []
    return customersArray
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
    // deals'ın array olduğundan emin ol
    const dealsArray = Array.isArray(deals) ? deals : []
    return dealsArray
      .filter(
        (deal: any) =>
          deal?.title?.toLowerCase().includes(lowerSearch) ||
          deal?.customer?.name?.toLowerCase().includes(lowerSearch)
      )
      .slice(0, 5)
  }, [deals, search, dealsUrl])

  // Navigate fonksiyonu
  const handleSelect = (action: QuickAction) => {
    if (action.formType) {
      // Form modal aç
      setFormOpen({ type: action.formType })
      onOpenChange(false)
      setSearch('')
    } else if (action.href) {
      // Normal sayfa navigasyonu - prefetch ile hızlı geçiş
      router.prefetch(action.href) // Önce prefetch et
      router.push(action.href)
      onOpenChange(false)
      setSearch('')
    }
  }
  
  // Form başarılı kayıt sonrası callback
  const handleFormSuccess = (savedItem: any, formType: string) => {
    setFormOpen({ type: null })
    // Kaydedilen kaydın detay sayfasına yönlendir - prefetch ile hızlı geçiş
    const detailPath = `/${locale}/${formType === 'customer' ? 'customers' : formType === 'deal' ? 'deals' : formType === 'quote' ? 'quotes' : formType === 'invoice' ? 'invoices' : formType === 'task' ? 'tasks' : 'meetings'}/${savedItem.id}`
    router.prefetch(detailPath) // Önce prefetch et
    router.push(detailPath)
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
                  onSelect={() => handleSelect({ id: item.id, label: item.label, href: item.href, keywords: [] })}
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
                    handleSelect({ id: customer.id, label: customer.name, href: `/${locale}/customers/${customer.id}`, keywords: [] })
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
                  onSelect={() => handleSelect({ id: deal.id, label: deal.title, href: `/${locale}/deals/${deal.id}`, keywords: [] })}
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
                  onSelect={() => handleSelect(action)}
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
                onSelect={() => handleSelect({ ...page, formType: undefined })}
                className="flex items-center gap-2"
              >
                {page.icon}
                <span>{page.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      
      {/* Form Modalleri */}
      {formOpen.type === 'customer' && (
        <CustomerForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedCustomer) => handleFormSuccess(savedCustomer, 'customer')}
        />
      )}
      
      {formOpen.type === 'deal' && (
        <DealForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedDeal) => handleFormSuccess(savedDeal, 'deal')}
        />
      )}
      
      {formOpen.type === 'quote' && (
        <QuoteForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedQuote) => handleFormSuccess(savedQuote, 'quote')}
        />
      )}
      
      {formOpen.type === 'invoice' && (
        <InvoiceForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedInvoice) => handleFormSuccess(savedInvoice, 'invoice')}
        />
      )}
      
      {formOpen.type === 'task' && (
        <TaskForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedTask) => handleFormSuccess(savedTask, 'task')}
        />
      )}
      
      {formOpen.type === 'meeting' && (
        <MeetingForm
          open={true}
          onClose={() => setFormOpen({ type: null })}
          onSuccess={(savedMeeting) => handleFormSuccess(savedMeeting, 'meeting')}
        />
      )}
    </CommandDialog>
  )
}

