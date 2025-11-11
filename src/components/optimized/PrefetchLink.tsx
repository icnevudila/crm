/**
 * Optimized Link component with aggressive prefetching
 * Sekme geçişlerini <100ms'e düşürmek için agresif prefetching
 * Hover'da anında prefetch - veri çekimini etkilemez (sadece route prefetch)
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode
  className?: string
  priority?: 'high' | 'low' // Yüksek öncelikli linkler hemen prefetch edilir
}

export function PrefetchLink({ 
  href, 
  children, 
  className, 
  priority = 'high',
  ...props 
}: PrefetchLinkProps) {
  const router = useRouter()
  const prefetchedRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Hover'da anında prefetch (veri çekimini etkilemez - sadece route prefetch)
  useEffect(() => {
    if (prefetchedRef.current || priority !== 'high') return

    const container = containerRef.current
    if (!container) return

    // Hover'da anında prefetch - sekme geçişini <100ms'e düşürür
    const handleMouseEnter = () => {
      if (!prefetchedRef.current) {
        const prefetchUrl = href as string
        router.prefetch(prefetchUrl)
        prefetchedRef.current = true
        if (process.env.NODE_ENV === 'development') {
          console.log('[PrefetchLink] Prefetched on hover:', prefetchUrl)
        }
      }
    }

    container.addEventListener('mouseenter', handleMouseEnter)

    // Viewport'ta görünürse de prefetch et (Intersection Observer)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            const prefetchUrl = href as string
            router.prefetch(prefetchUrl)
            prefetchedRef.current = true
            if (process.env.NODE_ENV === 'development') {
              console.log('[PrefetchLink] Prefetched on viewport:', prefetchUrl)
            }
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px' } // 200px önceden prefetch et
    )

    observer.observe(container)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      observer.disconnect()
    }
  }, [href, router, priority])

  return (
    <div ref={containerRef} className="inline-block">
      <Link
        href={href}
        prefetch={priority === 'high'} // Next.js varsayılan prefetch de aktif
        className={cn(
          'transition-all duration-75', // Çok kısa transition - instant görünüm
          className
        )}
        {...props}
      >
        {children}
      </Link>
    </div>
  )
}
