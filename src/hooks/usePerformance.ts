'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { measureRouteTransition, measurePrefetch, measureAPI } from '@/lib/performance'

interface PerformanceMetrics {
  routeTransition: number
  prefetchTime: number
  apiResponseTime: number
  pageLoadTime: number
}

/**
 * Performance monitoring hook
 * Route transition, prefetch ve API response time ölçümleri
 */
export function usePerformance() {
  const pathname = usePathname()
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    routeTransition: 0,
    prefetchTime: 0,
    apiResponseTime: 0,
    pageLoadTime: 0,
  })
  const prevPathnameRef = useRef<string>('')
  const pageLoadStartRef = useRef<number>(0)

  // Page load time ölçümü
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pageLoadStartRef.current = performance.now()

      const handleLoad = () => {
        const loadTime = performance.now() - pageLoadStartRef.current
        setMetrics((prev) => ({ ...prev, pageLoadTime: loadTime }))

        if (process.env.NODE_ENV === 'development') {
          console.log(`📊 Page load time: ${loadTime.toFixed(2)}ms`)
        }
      }

      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  // Route transition ölçümü
  useEffect(() => {
    if (prevPathnameRef.current && prevPathnameRef.current !== pathname) {
      const measureEnd = measureRouteTransition(
        prevPathnameRef.current,
        pathname,
        (duration) => {
          setMetrics((prev) => ({ ...prev, routeTransition: duration }))

          if (process.env.NODE_ENV === 'development') {
            const threshold = 300 // 300ms hedef
            const isSlow = duration > threshold
            console.log(
              isSlow ? '⚠️' : '✅',
              `Route transition: ${prevPathnameRef.current} → ${pathname}`,
              `${duration.toFixed(2)}ms ${isSlow ? `(threshold: ${threshold}ms)` : ''}`
            )
          }
        }
      )

      // Route değiştiğinde ölçümü bitir
      setTimeout(measureEnd, 0)
    }

    prevPathnameRef.current = pathname
  }, [pathname])

  // Prefetch ölçümü helper
  const measurePrefetchTime = async (url: string) => {
    const duration = await measurePrefetch(url)
    setMetrics((prev) => ({ ...prev, prefetchTime: duration }))

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 Prefetch: ${url} - ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  // API response time ölçümü helper
  const measureAPITime = async (url: string, options?: RequestInit) => {
    const { duration, data } = await measureAPI(url, options)
    setMetrics((prev) => ({ ...prev, apiResponseTime: duration }))

    return { duration, data }
  }

  return {
    metrics,
    measurePrefetchTime,
    measureAPITime,
  }
}




