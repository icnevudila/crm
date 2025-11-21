import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/lib/i18n'
import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'
import { NavigationProvider } from '@/components/providers/NavigationProvider'
import UndoStackProvider from '@/components/providers/UndoStackProvider'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { ConfirmProvider } from '@/hooks/useConfirm'
import { Toaster } from 'sonner'
import FloatingAIChat from '@/components/ai/FloatingAIChat'
import KeyboardShortcutsProvider from '@/components/providers/KeyboardShortcutsProvider'

// CRITICAL FIX: force-dynamic cache'i tamamen kapatıyor - performans için kaldırıldı
// Session kontrolü için sadece gerekli yerlerde dynamic yapılacak
// export const dynamic = 'force-dynamic' // KALDIRILDI - cache performansı için
export const revalidate = 60 // 60 saniye revalidate (performans için)
// export const fetchCache = 'force-no-store' // KALDIRILDI - cache performansı için

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

  // PERFORMANCE FIX: getMessages() timeout'u azaltıldı - 5s → 1s (daha hızlı sayfa yükleme)
  // ÖNEMLİ: locale parametresini geçiyoruz - yoksa her zaman defaultLocale kullanır
  let messages
  try {
    messages = await Promise.race([
      getMessages({ locale }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getMessages timeout')), 1000) // 1 saniye timeout (5s'den düşürüldü)
      ),
    ]) as any
  } catch (error) {
    // Timeout durumunda - default messages kullan (boş obje) - sayfa hızlı yüklensin
    if (process.env.NODE_ENV === 'development') {
      console.warn('getMessages timeout or error:', error)
    }
    messages = {} // Boş messages ile devam et - sayfa yüklensin
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <QueryProvider>
          <UndoStackProvider>
            <NavigationProvider>
              <KeyboardShortcutsProvider>
                <ConditionalLayout>
                  <ConfirmProvider>
                    {children}
                  </ConfirmProvider>
                </ConditionalLayout>
              </KeyboardShortcutsProvider>
              <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  classNames: {
                    toast: 'group toast shadow-lg border-2 min-w-[500px] max-w-[600px]',
                    title: 'text-base font-semibold leading-snug',
                    description: 'text-sm leading-relaxed whitespace-normal break-words',
                    actionButton: 'bg-indigo-600 text-white hover:bg-indigo-700 text-sm px-3 py-1.5',
                    cancelButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm px-3 py-1.5',
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
                    minWidth: '500px',
                    maxWidth: '600px',
                  }
                }}
              />
              <FloatingAIChat />
            </NavigationProvider>
          </UndoStackProvider>
        </QueryProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}




