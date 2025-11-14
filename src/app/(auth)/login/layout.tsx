import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Messages'ı timeout ile al - login sayfası için hızlı yüklenmeli
  let messages
  try {
    messages = await Promise.race([
      getMessages(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getMessages timeout')), 3000)
      ),
    ]) as any
  } catch (error) {
    messages = {}
  }

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}







