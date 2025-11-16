'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { defaultLocale } from '@/lib/i18n'

// Locale mesajları - not-found.tsx root seviyesinde olduğu için manuel olarak tanımlıyoruz
const messages: Record<string, Record<string, string>> = {
  tr: {
    title: 'Sayfa Bulunamadı',
    description: 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.',
    backToDashboard: "Dashboard'a Dön",
    goBack: 'Geri Git',
  },
  en: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or may have been moved.',
    backToDashboard: 'Back to Dashboard',
    goBack: 'Go Back',
  },
}

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Locale'i pathname'den çıkar (örn: /tr/dashboard -> tr)
  const locale = (pathname?.split('/')[1] || defaultLocale) as 'tr' | 'en'
  const isValidLocale = locale === 'tr' || locale === 'en'
  const t = messages[isValidLocale ? locale : defaultLocale] || messages[defaultLocale]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-primary-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900">{t.title}</h2>
        <p className="text-gray-600">
          {t.description}
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/${isValidLocale ? locale : defaultLocale}/dashboard`}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
          >
            {t.backToDashboard}
          </Link>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            {t.goBack}
          </Button>
        </div>
      </div>
    </div>
  )
}
