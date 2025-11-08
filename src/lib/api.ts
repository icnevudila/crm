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

  let lastError: Error | null = null

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        // Session cookie'lerini gönder (credentials)
        credentials: 'include',
        // Agresif cache - instant navigation için
        cache: 'force-cache', // Force cache - SWR ile birlikte kullanılıyor
        // next revalidate kaldırıldı - SWR cache kullanıyoruz
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
  try {
    const response = await fetchWithRetry(url, options)
    return await response.json()
  } catch (error: any) {
    // Production'da console.error kaldırıldı - sadece error throw et
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', url, error?.message || error)
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
