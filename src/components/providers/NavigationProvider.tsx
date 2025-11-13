/**
 * Navigation Provider
 * Route geçişlerini optimize eder ve loading state'lerini yönetir
 */
'use client'

import { createContext, useContext, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface NavigationContextType {
  isPending: boolean
  navigate: (href: string, options?: { replace?: boolean }) => void
  prefetch: (href: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const navigate = (href: string, options?: { replace?: boolean }) => {
    startTransition(() => {
      if (options?.replace) {
        router.replace(href)
      } else {
        router.push(href)
      }
    })
  }

  const prefetch = (href: string) => {
    startTransition(() => {
      router.prefetch(href)
    })
  }

  return (
    <NavigationContext.Provider value={{ isPending, navigate, prefetch }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}


