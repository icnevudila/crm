import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { Toaster } from 'sonner'

interface LandingLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Landing sayfası için özel layout - sidebar ve navbar YOK
// Üst layout'u tamamen bypass eder (nested layout override)
export default async function LandingLayout({
  children,
  params,
}: LandingLayoutProps) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // getMessages() timeout ile
  let messages
  try {
    messages = await Promise.race([
      getMessages(),
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

  // Landing sayfası - sidebar ve navbar YOK, sadece içerik
  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>
        <QueryProvider>
          <div className="min-h-screen w-full overflow-x-hidden">
            {children}
          </div>
          <Toaster 
            position="top-right" 
            expand={false}
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              classNames: {
                toast: 'group toast shadow-lg border-2',
                title: 'text-base font-semibold',
                description: 'text-sm',
                actionButton: 'bg-indigo-600 text-white hover:bg-indigo-700',
                cancelButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                closeButton: 'bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700',
                error: 'border-red-300 bg-red-50 text-red-900',
                success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
                warning: 'border-amber-300 bg-amber-50 text-amber-900',
                info: 'border-indigo-300 bg-indigo-50 text-indigo-900',
              },
              style: {
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
              }
            }}
          />
        </QueryProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}



