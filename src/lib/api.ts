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
  // PERFORMANCE FIX: GET request'lerde cache kullan (SWR zaten cache yönetiyor)
  const resolvedCache =
    rawCache ?? (method === 'GET' ? 'default' : 'no-store') // GET'lerde cache kullan
  const resolvedNext =
    rawNext ?? (method === 'GET' ? { revalidate: 60 } : { revalidate: 0 }) // GET'lerde 60s revalidate

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
        // ✅ ÇÖZÜM: Response body'yi burada okuma - fetchData içinde okunacak
        // Sadece response'u döndür, error handling fetchData'da yapılacak
        return response
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

    // ✅ ÇÖZÜM: Content-Type kontrolü - JSON değilse hata ver (response.ok kontrolünden ÖNCE)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      // HTML/text response (örneğin 500 Internal Server Error sayfası veya redirect)
      const text = await response.text().catch(() => '')
      let errorMessage = 'Beklenmeyen yanıt formatı'
      
      if (!response.ok) {
        // Response başarısız ve HTML dönüyor - muhtemelen bir hata sayfası
        if (response.status === 500 || text.includes('Internal Server Error')) {
          errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
        } else if (response.status === 401 || text.includes('Unauthorized')) {
          errorMessage = 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.'
        } else if (response.status === 403 || text.includes('Forbidden')) {
          errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.'
        } else if (response.status >= 400) {
          errorMessage = `API hatası (${response.status}). Lütfen daha sonra tekrar deneyin.`
        } else {
          errorMessage = text.length > 200 
            ? `Beklenmeyen yanıt formatı: ${text.substring(0, 200)}...`
            : `Beklenmeyen yanıt formatı: ${text}`
        }
      } else {
        // Response başarılı ama JSON değil
        errorMessage = text.length > 200 
          ? `Beklenmeyen yanıt formatı: ${text.substring(0, 200)}...`
          : `Beklenmeyen yanıt formatı: ${text}`
      }
      
      const error = new Error(`${errorMessage} (${url})`) as any
      error.status = response.status
      error.url = url
      throw error
    }

    // ✅ ÇÖZÜM: 404 hatalarını özel olarak handle et - response body'yi burada oku
    if (!response.ok && response.status === 404) {
      let errorData: any = {}
      let errorMessage = 'Kayıt bulunamadı'
      
      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || 'Kayıt bulunamadı'
      } catch (parseError) {
        // JSON parse hatası - varsayılan mesaj kullan
        console.error('[fetchData] 404 Error Parse Error:', {
          url,
          error: parseError,
        })
      }
      
      // 404 için error object throw et - useData hook bunu handle edecek
      const error = new Error(`API Error: 404 Not Found - ${errorMessage} (${url})`) as any
      error.status = 404
      error.data = errorData
      throw error
    }

    // ✅ ÇÖZÜM: Diğer hata durumlarını handle et (500, 401, 403, vb.)
    if (!response.ok) {
      let errorData: any = {}
      let errorMessage = `API hatası (${response.status})`
      
      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch (parseError) {
        // JSON parse hatası - varsayılan mesaj kullan
        console.error('[fetchData] Error Parse Error:', {
          url,
          status: response.status,
          error: parseError,
        })
      }
      
      const error = new Error(`API Error: ${response.status} - ${errorMessage} (${url})`) as any
      error.status = response.status
      error.data = errorData
      throw error
    }

    // ✅ ÇÖZÜM: JSON parse hatası yakalama - daha anlamlı hata mesajı
    let data: T
    try {
      data = await response.json()
    } catch (jsonError: any) {
      // JSON parse hatası - response text'i al ve hata mesajı oluştur
      const text = await response.text().catch(() => '')
      const errorMessage = text.includes('Internal Server Error')
        ? 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
        : text.includes('Error')
          ? text.substring(0, 200)
          : `JSON parse hatası: ${jsonError?.message || 'Geçersiz JSON yanıtı'}`
      throw new Error(`${errorMessage} (${url})`)
    }

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
