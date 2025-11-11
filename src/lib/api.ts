/**
 * Ortak API fonksiyonu - Tüm API çağrıları buradan geçer
 * Retry policy ve cache yönetimi dahil
 */

export interface FetchOptions extends RequestInit {
  retries?: number
  retryDelay?: number
}

// Exponential backoff retry function
async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options

  const {
    method: rawMethod,
    cache: rawCache,
    next: rawNext,
    ...restFetchOptions
  } = fetchOptions

  const method = (rawMethod ?? 'GET').toString().toUpperCase()
  const resolvedCache =
    rawCache ?? (method === 'GET' ? 'force-cache' : 'no-store')
  const resolvedNext =
    rawNext ?? (method === 'GET' ? undefined : { revalidate: 0 })

  let lastError: Error | null = null

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...restFetchOptions,
        method,
        // Session cookie'lerini gönder (credentials)
        credentials: 'include',
        // HTTP cache stratejisini method bazında yönet
        cache: resolvedCache,
        ...(resolvedNext ? { next: resolvedNext } : {}),
      })

      if (!response.ok) {
        // 4xx ve 5xx hatalar için retry (bazı durumlarda)
        if (response.status >= 500 && i < retries) {
          await delay(retryDelay * Math.pow(2, i)) // Exponential backoff
          continue
        }
        // Daha detaylı hata mesajı - hangi endpoint başarısız oldu
        let errorMessage = `API Error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json().catch(() => null)
          if (errorData?.error || errorData?.message) {
            errorMessage = `${errorMessage} - ${errorData.error || errorData.message}`
          }
        } catch {
          // JSON parse hatası - sadece status code ile devam et
        }
        throw new Error(`${errorMessage} (${url})`)
      }

      return response
    } catch (error) {
      lastError = error as Error
      if (i < retries) {
        await delay(retryDelay * Math.pow(2, i))
      }
    }
  }

  throw lastError || new Error('API request failed after retries')
}

/**
 * Ortak fetch fonksiyonu - SWR ile kullanılacak
 */
export async function fetchData<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  // CRITICAL: Her zaman log ekle - KPI sorununu debug etmek için
  if (url.includes('/api/stats/customers')) {
    console.log('fetchData - Calling /api/stats/customers:', {
      url,
      timestamp: new Date().toISOString(),
    })
  }

  try {
    const response = await fetchWithRetry(url, options)
    
    // CRITICAL: Her zaman log ekle - KPI sorununu debug etmek için
    if (url.includes('/api/stats/customers')) {
      console.log('fetchData - /api/stats/customers response:', {
        url,
        status: response.status,
        ok: response.ok,
        timestamp: new Date().toISOString(),
      })
    }

    const data = await response.json()

    // CRITICAL: Her zaman log ekle - KPI sorununu debug etmek için
    if (url.includes('/api/stats/customers')) {
      console.log('fetchData - /api/stats/customers data:', {
        url,
        data,
        timestamp: new Date().toISOString(),
      })
    }

    return data
  } catch (error: any) {
    // CRITICAL: Her zaman log ekle - KPI sorununu debug etmek için
    if (url.includes('/api/stats/customers')) {
      console.error('fetchData - /api/stats/customers error:', {
        url,
        error: error?.message || error,
        timestamp: new Date().toISOString(),
      })
    }

    // Hata mesajını daha kullanıcı dostu yap
    if (error?.message) {
      throw new Error(error.message)
    }
    throw error
  }
}

/**
 * API base URL helper
 */
export const getApiUrl = (endpoint: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api${endpoint}`
}
