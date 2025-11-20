'use client'

import { useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import NotificationMenu from '@/components/NotificationMenu'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import GlobalSearchBar from '@/components/search/GlobalSearchBar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, HelpCircle, BookOpen, MessageCircle, Command, Menu, Plus, StickyNote, Eye, EyeOff, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import RecentItems from '@/components/layout/RecentItems'

const StickyNotesContainer = dynamic(() => import('@/components/sticky-notes/StickyNotesContainer'), {
  ssr: false,
  loading: () => null,
})

const CustomerForm = dynamic(() => import('@/components/customers/CustomerForm'), {
  ssr: false,
  loading: () => null,
})

const DealForm = dynamic(() => import('@/components/deals/DealForm'), {
  ssr: false,
  loading: () => null,
})

const QuoteForm = dynamic(() => import('@/components/quotes/QuoteForm'), {
  ssr: false,
  loading: () => null,
})

const InvoiceForm = dynamic(() => import('@/components/invoices/InvoiceForm'), {
  ssr: false,
  loading: () => null,
})

const TaskForm = dynamic(() => import('@/components/tasks/TaskForm'), {
  ssr: false,
  loading: () => null,
})

const ProductForm = dynamic(() => import('@/components/products/ProductForm'), {
  ssr: false,
  loading: () => null,
})

const AIChat = dynamic(() => import('@/components/ai/AIChat'), {
  ssr: false,
  loading: () => null,
})

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const locale = useLocale()
  const router = useRouter()

  const [quickCreate, setQuickCreate] = useState<'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'product' | null>(null)
  const [aiChatOpen, setAiChatOpen] = useState(false)

  const quickActions: {
    key: 'customer' | 'deal' | 'quote' | 'invoice' | 'task' | 'product'
    label: string
    description: string
  }[] = [
    {
      key: 'customer',
      label: 'Yeni Müşteri',
      description: 'Müşteri ve firma bilgisi ekle',
    },
    {
      key: 'deal',
      label: 'Yeni Fırsat',
      description: 'Satış fırsatı oluştur',
    },
    {
      key: 'quote',
      label: 'Yeni Teklif',
      description: 'Teklif hazırla ve gönder',
    },
    {
      key: 'invoice',
      label: 'Yeni Fatura',
      description: 'Satış ya da alış faturası kes',
    },
    {
      key: 'product',
      label: 'Yeni Ürün',
      description: 'Ürün ve stok bilgisi ekle',
    },
    {
      key: 'task',
      label: 'Yeni Görev',
      description: 'Takip görevi oluştur',
    },
  ]

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      window.location.href = `/${locale}/login`
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = `/${locale}/login`
    }
  }

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10 flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Breadcrumbs - Mobilde gizle, tablet ve üzerinde göster */}
        <div className="hidden sm:block flex-1 min-w-0">
          <Breadcrumbs items={[]} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
        {/* Recent Items - Mobilde gizle */}
        <div className="hidden md:block">
          <RecentItems />
        </div>

        {/* Quick Create Menu - Header sağ üstte + menüsü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hidden sm:inline-flex h-9 w-9 border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900"
              title="Hızlı Oluştur (Müşteri, Fırsat, Teklif, Fatura, Görev)"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Hızlı Oluştur</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.key}
                onSelect={(e) => {
                  e.preventDefault()
                  setQuickCreate(action.key)
                }}
                className="flex flex-col items-start cursor-pointer"
              >
                <span className="text-sm font-medium">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Asistan Butonu */}
        <Button
          variant="default"
          size="sm"
          className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md"
          onClick={() => setAiChatOpen(true)}
          title="AI Asistan - Komut ver, işlem yap"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden lg:inline">AI</span>
        </Button>

        {/* Command Palette Trigger - Tek buton (hem Ctrl+K hem Ctrl+N ile açılır) */}
        <Button
          variant="default"
          size="sm"
          className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
          onClick={() => {
            // Command Palette'i açmak için custom event gönder
            document.dispatchEvent(new CustomEvent('open-command-palette'))
          }}
          title="Komut Paleti - Ara, Yeni Kayıt Oluştur (Cmd+K / Ctrl+K veya Cmd+N / Ctrl+N)"
        >
          <Command className="h-4 w-4" />
          <span className="hidden lg:inline">Ara</span>
          <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border bg-white/20 px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Sticky Notes Butonu - Header'da */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-gray-200 hover:bg-gray-50"
            onClick={() => {
              // Custom event gönder - StickyNotesContainer dinliyor
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('openStickyNote', {
                  detail: {}
                }))
              }
            }}
            title="Not Ekle"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Bildirimler */}
        {session?.user?.id && (
          <NotificationMenu userId={session.user.id} />
        )}

        {/* Dil Değiştirici - Mobilde küçült */}
        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>

        {/* Kullanıcı Menüsü */}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={(session.user as any)?.image || ''} alt={session.user.name || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/profile`} className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/settings`} className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Ayarlar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/help`} className="flex items-center cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Yardım
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/kullanim-kilavuzu`} className="flex items-center cursor-pointer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Kullanım Kılavuzu
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/faq`} className="flex items-center cursor-pointer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  SSS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Quick Create Modals - global header seviyesinde, her sayfadan erişilebilir */}
      <CustomerForm
        open={quickCreate === 'customer'}
        onClose={() => setQuickCreate(null)}
      />
      <DealForm
        open={quickCreate === 'deal'}
        onClose={() => setQuickCreate(null)}
      />
      <QuoteForm
        open={quickCreate === 'quote'}
        onClose={() => setQuickCreate(null)}
      />
      <InvoiceForm
        open={quickCreate === 'invoice'}
        onClose={() => setQuickCreate(null)}
      />
      <TaskForm
        open={quickCreate === 'task'}
        onClose={() => setQuickCreate(null)}
      />
      <ProductForm
        open={quickCreate === 'product'}
        onClose={() => setQuickCreate(null)}
      />

      {/* AI Chat Modal */}
      <AIChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} />
      
      {/* Sticky Notes Container - Header'dan kontrol ediliyor */}
      <StickyNotesContainer visible={true} />
    </header>
  )
}

































