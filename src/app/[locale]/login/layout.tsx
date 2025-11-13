import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'

interface LoginLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Login sayfası için özel layout - sidebar ve navbar YOK
// Üst layout'u tamamen bypass eder (nested layout override)
export default async function LoginLayout({
  children,
  params,
}: LoginLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // getMessages() timeout ile
  // ÖNEMLİ: locale parametresini geçiyoruz - yoksa her zaman defaultLocale kullanır
  let messages
  try {
    messages = await Promise.race([
      getMessages({ locale }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getMessages timeout')), 5000)
      ),
    ]) as any
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('getMessages timeout or error:', error)
    }
    messages = {}
  }

  // Login sayfası - sidebar ve navbar YOK, sadece içerik
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <QueryProvider>
          <div className="min-h-screen w-full overflow-x-hidden">
            {children}
          </div>
        </QueryProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}


