'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  Clock,
  Users,
  Briefcase,
  FileText,
  Receipt,
  CheckSquare,
  Calendar,
  Package,
  Ticket,
  Truck,
  Building2,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface RecentItem {
  id: string
  label: string
  href: string
  type: string
  timestamp: number
}

const MODULE_ICONS: Record<string, React.ReactNode> = {
  customers: <Users className="h-4 w-4" />,
  deals: <Briefcase className="h-4 w-4" />,
  quotes: <FileText className="h-4 w-4" />,
  invoices: <Receipt className="h-4 w-4" />,
  tasks: <CheckSquare className="h-4 w-4" />,
  meetings: <Calendar className="h-4 w-4" />,
  products: <Package className="h-4 w-4" />,
  tickets: <Ticket className="h-4 w-4" />,
  shipments: <Truck className="h-4 w-4" />,
  companies: <Building2 className="h-4 w-4" />,
  contracts: <FileCheck className="h-4 w-4" />,
}

const MODULE_LABELS: Record<string, string> = {
  customers: 'Müşteri',
  deals: 'Fırsat',
  quotes: 'Teklif',
  invoices: 'Fatura',
  tasks: 'Görev',
  meetings: 'Görüşme',
  products: 'Ürün',
  tickets: 'Destek Talebi',
  shipments: 'Sevkiyat',
  companies: 'Firma',
  contracts: 'Sözleşme',
}

const STORAGE_KEY = 'crm_recent_items'
const MAX_ITEMS = 10

/**
 * RecentItems - Son görüntülenen kayıtlara hızlı erişim
 * LocalStorage ile saklanır
 */
export default function RecentItems() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [open, setOpen] = useState(false)

  // LocalStorage'dan recent items'ı yükle
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as RecentItem[]
        // En yeni önce gelecek şekilde sırala
        const sorted = items.sort((a, b) => b.timestamp - a.timestamp)
        setRecentItems(sorted.slice(0, MAX_ITEMS))
      }
    } catch (error) {
      console.error('Recent items load error:', error)
    }
  }, [])

  // Sayfa değiştiğinde recent items'ı güncelle
  useEffect(() => {
    if (!pathname) return

    // Detay sayfası kontrolü (örn: /tr/customers/123)
    const pathParts = pathname.split('/').filter(Boolean)
    if (pathParts.length >= 3) {
      const module = pathParts[1] // customers, deals, quotes, etc.
      const id = pathParts[2] // kayıt ID'si

      // "new" veya özel sayfaları atla
      if (id === 'new' || id === 'settings' || id === 'help') return

      // Modül label'ını bul
      const moduleLabel = MODULE_LABELS[module] || module

      // Yeni item oluştur
      const newItem: RecentItem = {
        id,
        label: `${moduleLabel} #${id.slice(0, 8)}`,
        href: pathname,
        type: module,
        timestamp: Date.now(),
      }

      // Mevcut items'ı güncelle
      setRecentItems((prev) => {
        // Aynı item varsa kaldır (yeniden eklemek için)
        const filtered = prev.filter((item) => !(item.id === id && item.type === module))
        
        // Yeni item'ı başa ekle
        const updated = [newItem, ...filtered]
        
        // Max items'a göre sınırla
        const limited = updated.slice(0, MAX_ITEMS)
        
        // LocalStorage'a kaydet
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
        } catch (error) {
          console.error('Recent items save error:', error)
        }
        
        return limited
      })
    }
  }, [pathname])

  const handleItemClick = (item: RecentItem) => {
    setOpen(false)
    router.push(item.href)
  }

  const handleClearAll = () => {
    setRecentItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Recent items clear error:', error)
    }
    setOpen(false)
  }

  if (recentItems.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          title="Son Görüntülenenler"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden lg:inline">Son Görüntülenenler</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 z-[100]" sideOffset={5}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Son Görüntülenenler</span>
          {recentItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Temizle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentItems.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            Henüz görüntülenen kayıt yok
          </div>
        ) : (
          recentItems.map((item) => (
            <DropdownMenuItem
              key={`${item.type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className="gap-2 cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {MODULE_ICONS[item.type] || <FileText className="h-4 w-4" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {MODULE_LABELS[item.type] || item.type}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(item.timestamp).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

























