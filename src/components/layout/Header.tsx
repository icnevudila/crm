'use client'

import { useState, memo, useCallback, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import LocaleSwitcher from './LocaleSwitcher'
import Link from 'next/link'

function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  
  // Hydration hatasını önlemek için client-side'da set et
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = useCallback(async () => {
    await signOut({ redirect: false })
    router.push('/login')
    // router.refresh() kaldırdık - performans için
  }, [router])

  return (
    <header className="fixed top-0 right-0 z-30 ml-64 flex h-16 items-center border-b bg-white px-6 shadow-sm">
      <div className="flex w-full items-center justify-between">
        {/* Search */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Locale Switcher */}
          <LocaleSwitcher />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                aria-label="Bildirimleri görüntüle"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500" aria-hidden="true"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-center text-gray-500 text-sm">
                  Henüz bildirim yok
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                aria-label={mounted ? `${session?.user?.name || 'Kullanıcı'} menüsünü aç` : 'Kullanıcı menüsünü aç'}
                suppressHydrationWarning
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={mounted ? ((session?.user as any)?.image || '') : ''} 
                    alt={mounted ? (session?.user?.name || 'Kullanıcı avatarı') : 'Kullanıcı avatarı'} 
                  />
                  <AvatarFallback 
                    className="bg-gradient-to-r from-primary-600 to-purple-600 text-white"
                    suppressHydrationWarning
                  >
                    {mounted ? (session?.user?.name?.charAt(0).toUpperCase() || 'U') : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{session?.user?.name}</span>
                  <span className="text-xs text-gray-500">{session?.user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={`/${locale}/profile`} prefetch={true}>
                <DropdownMenuItem asChild>
                  <div className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </div>
                </DropdownMenuItem>
              </Link>
              <Link href={`/${locale}/settings`} prefetch={true}>
                <DropdownMenuItem asChild>
                  <div className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                  </div>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Memoize Header - re-render'ları önle
export default memo(Header)

