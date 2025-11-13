'use client'

import { useSession } from 'next-auth/react'
import { useLocale } from 'next-intl'
import NotificationMenu from '@/components/NotificationMenu'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, HelpCircle, BookOpen, MessageCircle } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function Header() {
  const { data: session } = useSession()
  const locale = useLocale()

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumbs items={[]} />
      </div>

      <div className="flex items-center gap-3">
        {/* Bildirimler */}
        {session?.user?.id && (
          <NotificationMenu userId={session.user.id} />
        )}

        {/* Dil Değiştirici */}
        <LocaleSwitcher />

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
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

































