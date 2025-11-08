import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import SessionProvider from '@/components/providers/SessionProvider'
import QueryProvider from '@/components/providers/QueryProvider'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <SessionProvider>
        <QueryProvider>{children}</QueryProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  )
}







