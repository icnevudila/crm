/**
 * Navigation Optimizer
 * Sekme geçişlerini ve yüklemeleri optimize eder
 * Veri akışını ve işlemleri bozmadan performansı artırır
 */

import React from 'react'
import { startTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Optimized navigation - React 18 startTransition kullanır
 * Sekme geçişlerini non-blocking yapar (<100ms)
 */
export function useOptimizedNavigation() {
  const router = useRouter()

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
    // Prefetch'i de non-blocking yap
    startTransition(() => {
      router.prefetch(href)
    })
  }

  return { navigate, prefetch }
}

/**
 * Viewport-based prefetching
 * Link viewport'a girdiğinde otomatik prefetch yapar
 */
export function useViewportPrefetch(href: string, enabled = true) {
  const router = useRouter()
  const prefetchedRef = React.useRef(false)

  React.useEffect(() => {
    if (!enabled || prefetchedRef.current) return

    const linkElement = document.querySelector(`a[href="${href}"]`)
    if (!linkElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            startTransition(() => {
              router.prefetch(href)
              prefetchedRef.current = true
            })
            observer.disconnect()
          }
        })
      },
      { 
        rootMargin: '200px', // 200px önceden prefetch et
        threshold: 0.1 
      }
    )

    observer.observe(linkElement)

    return () => {
      observer.disconnect()
    }
  }, [href, enabled, router])
}

/**
 * Hover-based prefetching
 * Link hover'da anında prefetch yapar
 */
export function useHoverPrefetch(href: string, enabled = true) {
  const router = useRouter()
  const prefetchedRef = React.useRef(false)

  React.useEffect(() => {
    if (!enabled || prefetchedRef.current) return

    const linkElement = document.querySelector(`a[href="${href}"]`)
    if (!linkElement) return

    const handleMouseEnter = () => {
      if (!prefetchedRef.current) {
        startTransition(() => {
          router.prefetch(href)
          prefetchedRef.current = true
        })
      }
    }

    linkElement.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      linkElement.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [href, enabled, router])
}

