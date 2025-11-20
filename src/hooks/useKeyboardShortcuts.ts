'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

/**
 * Global keyboard shortcuts hook
 * 
 * Shortcuts:
 * - Ctrl/Cmd + K: Global search
 * - Ctrl/Cmd + N: New item (context-aware)
 * - Esc: Close modal/dialog
 * - Ctrl/Cmd + /: Show shortcuts help
 */
export function useKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Global search (AI chat aç)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        // AI chat'i aç
        window.dispatchEvent(
          new CustomEvent('open-ai-chat', {
            detail: { message: '' },
          })
        )
        return
      }

      // Ctrl/Cmd + N: New item (context-aware)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        
        // Pathname'e göre yeni item oluştur
        const moduleMap: Record<string, string> = {
          '/customers': '/customers/new',
          '/deals': '/deals/new',
          '/quotes': '/quotes/new',
          '/invoices': '/invoices/new',
          '/products': '/products/new',
          '/tasks': '/tasks/new',
          '/meetings': '/meetings/new',
          '/tickets': '/tickets/new',
          '/finance': '/finance/new',
          '/shipments': '/shipments/new',
          '/contracts': '/contracts/new',
          '/companies': '/companies/new',
          '/vendors': '/vendors/new',
          '/sales-quotas': '/sales-quotas/new',
          '/product-bundles': '/product-bundles/new',
          '/return-orders': '/return-orders/new',
          '/credit-notes': '/credit-notes/new',
          '/payment-plans': '/payment-plans/new',
        }

        // Pathname'den modülü bul
        const modulePath = Object.keys(moduleMap).find((path) => pathname?.includes(path))
        if (modulePath) {
          router.push(`/${locale}${moduleMap[modulePath]}`)
        } else {
          // Default: Dashboard'a git
          router.push(`/${locale}/dashboard`)
        }
        return
      }

      // Ctrl/Cmd + /: Show shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        // Shortcuts help modal'ı aç (gelecekte eklenecek)
        // Şimdilik toast göster
        import('@/lib/toast').then(({ toast }) => {
          toast.info('Klavye Kısayolları', {
            description: 'Ctrl+K: Arama | Ctrl+N: Yeni Kayıt | Esc: Kapat',
            duration: 5000,
          })
        })
        return
      }

      // Esc: Close modal/dialog (global handler - modal'lar kendi handler'larını kullanabilir)
      if (e.key === 'Escape') {
        // Modal'lar zaten kendi Esc handler'larına sahip
        // Burada sadece global bir fallback olarak kullanılabilir
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router, pathname, locale])
}

