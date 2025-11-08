/**
 * Performance Monitoring Utilities
 * Prefetching, route transition ve cache ölçümleri
 */

/**
 * Route transition ölçümü
 */
export function measureRouteTransition(
  from: string,
  to: string,
  callback: (duration: number) => void
) {
  const startTime = performance.now()
  
  // Route değiştiğinde callback çağrılacak
  const measureEnd = () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    callback(duration)
  }
  
  return measureEnd
}

/**
 * Prefetching ölçümü
 */
export function measurePrefetch(url: string): Promise<number> {
  return new Promise((resolve) => {
    const startTime = performance.now()
    
    // Prefetch başlat
    fetch(url, { method: 'HEAD' })
      .then(() => {
        const endTime = performance.now()
        const duration = endTime - startTime
        resolve(duration)
      })
      .catch(() => {
        resolve(0) // Hata durumunda 0 döndür
      })
  })
}

/**
 * Cache hit/miss ölçümü
 */
export function measureCache(url: string, fromCache: boolean): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Cache ${fromCache ? 'HIT' : 'MISS'}: ${url}`)
  }
}

/**
 * API response time ölçümü
 */
export async function measureAPI(
  url: string,
  options?: RequestInit
): Promise<{ duration: number; data: any }> {
  const startTime = performance.now()
  
  const response = await fetch(url, options)
  const data = await response.json()
  
  const endTime = performance.now()
  const duration = endTime - startTime
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`API ${url}: ${duration.toFixed(2)}ms`)
  }
  
  return { duration, data }
}







