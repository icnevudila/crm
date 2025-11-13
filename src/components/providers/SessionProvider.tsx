'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // NextAuth basePath - Next.js 15 App Router için
  // basePath sadece path olmalı, full URL değil
  // NextAuth otomatik olarak /api/auth path'ini kullanır
  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60} // 5 dakikada bir session'ı yenile
      refetchOnWindowFocus={false} // Focus'ta refetch yapma - performans için
    >
      {children}
    </NextAuthSessionProvider>
  )
}







