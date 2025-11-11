'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { locales, localeNames } from '@/lib/i18n'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Pathname'i düzgün parse et - çift locale prefix'i önle
    let pathnameWithoutLocale = pathname
    
    // Mevcut locale'i kaldır
    if (pathname.startsWith(`/${locale}/`)) {
      pathnameWithoutLocale = pathname.replace(`/${locale}/`, '/')
    } else if (pathname === `/${locale}`) {
      pathnameWithoutLocale = '/'
    } else if (pathname.startsWith(`/${locale}`)) {
      pathnameWithoutLocale = pathname.replace(`/${locale}`, '')
    }
    
    // Yeni locale ile pathname oluştur
    const newPath = pathnameWithoutLocale === '/' 
      ? `/${newLocale}/dashboard` 
      : `/${newLocale}${pathnameWithoutLocale.startsWith('/') ? pathnameWithoutLocale : '/' + pathnameWithoutLocale}`
    
    router.push(newPath)
    // router.refresh() kaldırdık - performans için
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <span>{localeNames[locale as keyof typeof localeNames]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={locale === loc ? 'bg-primary-50 text-primary-600' : ''}
          >
            {localeNames[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

