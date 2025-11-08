'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 DAKİKA - ULTRA AGRESİF CACHE (instant navigation - 0.5s hedef)
            gcTime: 60 * 60 * 1000, // 60 dakika garbage collection (daha uzun tut)
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1, // Sadece 1 kez retry (daha hızlı)
            // Placeholder data - önceki veriyi göster (instant UI)
            placeholderData: (previousData: unknown) => previousData,
            // Structural sharing - aynı veri referansını kullan
            structuralSharing: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

