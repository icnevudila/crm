'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { locales, localeNames } from '@/lib/i18n'

// Profesyonel ve net bayrak ikonları
const TurkeyFlag = () => (
  <svg 
    width="26" 
    height="19" 
    viewBox="0 0 26 19" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="rounded-sm shadow-sm"
    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
  >
    <rect width="26" height="19" fill="#E30A17" rx="1.5"/>
    {/* Hilal (Ay) - Türk bayrağına uygun */}
    <circle cx="8.5" cy="9.5" r="3.5" fill="white"/>
    <circle cx="9.3" cy="9.5" r="3" fill="#E30A17"/>
    {/* Yıldız - 5 köşeli, ayın sağında */}
    <path 
      d="M13.2 6.8L13.7 8.2L15.2 8.4L14 9.1L14.4 10.5L13.2 9.7L12 10.5L12.4 9.1L11.2 8.4L12.7 8.2L13.2 6.8Z" 
      fill="white"
    />
  </svg>
)

const UKFlag = () => (
  <svg 
    width="26" 
    height="19" 
    viewBox="0 0 26 19" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="rounded-sm shadow-sm"
    style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
  >
    <rect width="26" height="19" fill="#012169" rx="1.5"/>
    {/* Union Jack - optimize edilmiş */}
    <path d="M0 0L26 19M26 0L0 19" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M13 0V19M0 9.5H26" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M0 0L26 19M26 0L0 19" stroke="#C8102E" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M13 0V19M0 9.5H26" stroke="#C8102E" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

const localeFlags: Record<string, React.ReactNode> = {
  tr: <TurkeyFlag />,
  en: <UKFlag />,
}

export default function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    // Pathname'i düzgün parse et - çift locale prefix'i önle
    let pathnameWithoutLocale = pathname
    
    // Önce tüm locale prefix'lerini temizle (tr veya en)
    const localePattern = /^\/(tr|en)(\/|$)/
    pathnameWithoutLocale = pathname.replace(localePattern, '/')
    
    // Eğer pathname sadece '/' ise dashboard'a yönlendir
    if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
      pathnameWithoutLocale = '/dashboard'
    }
    
    // Yeni locale ile pathname oluştur
    const newPath = `/${newLocale}${pathnameWithoutLocale.startsWith('/') ? pathnameWithoutLocale : '/' + pathnameWithoutLocale}`
    
    // Full page reload ile locale değiştir - next-intl'in locale'i güncellemesi için
    window.location.href = newPath
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200/80 bg-gradient-to-b from-gray-50 to-white p-1 shadow-sm backdrop-blur-sm">
      {locales.map((loc) => {
        const isActive = locale === loc
        return (
          <Button
            key={loc}
            variant="ghost"
            size="sm"
            onClick={() => switchLocale(loc)}
            className={`
              h-9 px-2.5 gap-2 
              transition-all duration-300 ease-out
              rounded-md
              relative
              group
              ${isActive
                ? 'bg-white shadow-md border border-indigo-200/50 scale-105'
                : 'hover:bg-white/70 opacity-70 hover:opacity-100 hover:scale-105'
              }
            `}
            title={localeNames[loc]}
          >
            {/* Aktif durum için subtle glow */}
            {isActive && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-pulse" />
            )}
            
            <span className={`
              flex items-center justify-center 
              w-7 h-5 
              flex-shrink-0
              transition-transform duration-300
              ${isActive ? 'scale-110' : 'group-hover:scale-105'}
            `}>
              {localeFlags[loc]}
            </span>
            
            <span className={`
              text-xs font-semibold 
              hidden sm:inline 
              transition-colors duration-300
              ${isActive ? 'text-indigo-700' : 'text-gray-600 group-hover:text-gray-800'}
            `}>
              {localeNames[loc]}
            </span>
          </Button>
        )
      })}
    </div>
  )
}

