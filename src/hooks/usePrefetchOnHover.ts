/**
 * Viewport-based prefetch hook
 * Link'ler hover/visible olduğunda prefetch eder
 */
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export function usePrefetchOnHover(href: string) {
  const router = useRouter()
  const prefetchedRef = useRef(false)

  useEffect(() => {
    if (prefetchedRef.current) return

    const linkElement = document.querySelector(`a[href="${href}"]`)
    if (!linkElement) return

    // Intersection Observer ile viewport'ta görünürse prefetch et
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            router.prefetch(href)
            prefetchedRef.current = true
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' } // 100px önceden prefetch et
    )

    observer.observe(linkElement)

    // Mouse hover'da da prefetch et
    const handleMouseEnter = () => {
      if (!prefetchedRef.current) {
        router.prefetch(href)
        prefetchedRef.current = true
      }
    }

    linkElement.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      observer.disconnect()
      linkElement.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [href, router])
}







