'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // NextAuth basePath sorununu önlemek için basePath ekle
  // basePath sadece path olmalı, full URL değil
  return (
    <NextAuthSessionProvider
      basePath="/api/auth" // Sadece path - NextAuth otomatik olarak domain'i ekler
      refetchInterval={5 * 60} // 5 dakikada bir session'ı yenile
      refetchOnWindowFocus={false} // Focus'ta refetch yapma - performans için
    >
      {children}
    </NextAuthSessionProvider>
  )
}







