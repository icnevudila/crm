import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import dynamic from 'next/dynamic'
import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy load layout components - ilk yükleme hızı için
const Sidebar = dynamic(() => import('@/components/layout/Sidebar'), {
  ssr: true, // SSR gerekli - layout component
  loading: () => <div className="w-64 h-screen bg-gray-900 animate-pulse" />,
})

const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: true, // SSR gerekli - layout component
  loading: () => <div className="h-16 w-full bg-white border-b animate-pulse" />,
})

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // getMessages() timeout ile - çok yavaş olursa default messages kullan
  let messages
  try {
    messages = await Promise.race([
      getMessages(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getMessages timeout')), 5000)
      ),
    ]) as any
  } catch (error) {
    // Timeout durumunda - default messages kullan (boş obje)
    if (process.env.NODE_ENV === 'development') {
      console.warn('getMessages timeout or error:', error)
    }
    messages = {}
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>
        <QueryProvider>
          <ErrorBoundary>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
              <Sidebar />
              <div className="flex-1 ml-64 pt-16 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          </ErrorBoundary>
        </QueryProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}




