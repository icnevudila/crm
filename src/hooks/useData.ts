/**
 * SWR cache layer hook - Tüm veri çekme işlemleri buradan geçer
 * Performans optimizasyonları dahil
 */

import useSWR from 'swr'
import { fetchData } from '@/lib/api'

export interface UseDataOptions {
  revalidateOnFocus?: boolean
  dedupingInterval?: number
  errorRetryInterval?: number
  suspense?: boolean
  refreshInterval?: number
}

/**
 * Ana veri çekme hook'u
 * @param url - API endpoint veya key
 * @param options - SWR options
 */
export function useData<T = any>(
  url: string | null,
  options: UseDataOptions & { suspense?: boolean } = {}
) {
  const {
    revalidateOnFocus = false, // Focus'ta revalidate YOK - instant navigation için
    dedupingInterval = 600000, // 10 DAKİKA - ULTRA AGRESİF CACHE (instant navigation - <300ms hedef)
    errorRetryInterval = 1000, // Exponential backoff: 1s (çok hızlı retry)
    suspense = false, // Suspense boundaries manuel olarak ekleniyor
    refreshInterval,
  } = options

  const swrResult = useSWR<T>(
    url,
    fetchData,
    {
      revalidateOnFocus,
      dedupingInterval,
      errorRetryInterval,
      suspense, // Manuel Suspense boundaries kullanıyoruz
      refreshInterval,
      // Error retry count
      errorRetryCount: 3,
      // On error retry
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Exponential backoff: 1s, 2s, 4s
        const delay = errorRetryInterval * Math.pow(2, retryCount)
        if (retryCount >= 3) return
        setTimeout(() => revalidate({ retryCount }), delay)
      },
      // Background revalidation
      revalidateOnReconnect: true,
      // Keep previous data on error
      keepPreviousData: true,
    }
  )

  return swrResult
}

/**
 * Mutation hook - POST/PUT/DELETE işlemleri için
 */
export function useMutation<T = any>(
  url: string,
  options?: RequestInit
) {
  const mutate = async (data: T, method: 'POST' | 'PUT' | 'DELETE' = 'POST') => {
    const response = await fetchData<T>(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      ...options,
    })
    return response
  }

  return { mutate }
}





