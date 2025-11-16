/**
 * Sentry Error Tracking Configuration
 * 
 * Sentry entegrasyonu için yapılandırma dosyası.
 * Production'da hata takibi için kullanılır.
 * 
 * Kurulum:
 * 1. Sentry hesabı oluşturun: https://sentry.io
 * 2. Proje oluşturun ve DSN'i alın
 * 3. Paketi yükleyin: npm install @sentry/nextjs
 * 4. .env.local dosyasına ekleyin:
 *    NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
 *    SENTRY_AUTH_TOKEN=your-auth-token (source maps için)
 * 
 * NOT: Paket yüklü değilse Sentry devre dışı kalır, uygulama çalışmaya devam eder.
 */

// Sentry'yi opsiyonel olarak import et (paket yoksa hata vermez)
// Next.js build sırasında paket yoksa hata vermemesi için tamamen opsiyonel yapıyoruz
// Build sırasında require/import kullanmak Next.js'i hata veriyor, bu yüzden runtime'da dynamic import kullanıyoruz
let Sentry: any = null
let SentryLoaded = false

// Build sırasında kontrol etmemek için - sadece runtime'da çalışır
const isBuildTime = typeof window === 'undefined' && process.env.NODE_ENV !== 'production' && !process.env.NEXT_RUNTIME

// Runtime'da Sentry'yi yükle (build sırasında değil)
async function loadSentry() {
  if (SentryLoaded) return Sentry
  
  // Build sırasında hiçbir şey yapma
  if (isBuildTime) {
    Sentry = null
    SentryLoaded = true
    return Sentry
  }
  
  // Paket yüklü mü kontrol et - build sırasında hata vermemesi için
  try {
    // @ts-expect-error - Paket yoksa hata vermemesi için
    const sentryModule = await import('@sentry/nextjs').catch(() => null)
    if (sentryModule) {
      Sentry = sentryModule.default || sentryModule
    } else {
      Sentry = null
    }
  } catch (error: any) {
    // Paket yüklü değilse veya başka bir hata varsa - sessizce devam et
    if (error?.code !== 'MODULE_NOT_FOUND') {
      console.warn('[Sentry] Yükleme hatası:', error?.message || error)
    }
    Sentry = null
  } finally {
    SentryLoaded = true
  }
  
  return Sentry
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Sentry'yi başlat (sadece production'da)
 */
export async function initSentry() {
  // Sentry'yi runtime'da yükle
  const loadedSentry = await loadSentry()
  if (!loadedSentry) return
  
  if (typeof window === 'undefined') {
    // Server-side
    if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
      loadedSentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1, // %10 of transactions (performance monitoring)
        beforeSend(event, hint) {
          // Hassas bilgileri filtrele
          if (event.request) {
            // Şifreleri filtrele
            if (event.request.data) {
              const data = event.request.data as any
              if (data.password) {
                data.password = '[Filtered]'
              }
              if (data.token) {
                data.token = '[Filtered]'
              }
            }
            // URL'lerdeki hassas parametreleri filtrele
            if (event.request.url) {
              event.request.url = event.request.url.replace(
                /(password|token|secret)=[^&]*/gi,
                '$1=[Filtered]'
              )
            }
          }
          return event
        },
      })
    }
  } else {
    // Client-side
    if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
      loadedSentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        beforeSend(event, hint) {
          // Hassas bilgileri filtrele
          if (event.request) {
            if (event.request.data) {
              const data = event.request.data as any
              if (data.password) {
                data.password = '[Filtered]'
              }
            }
          }
          return event
        },
        integrations: [
          new loadedSentry.BrowserTracing({
            // Performance monitoring
            tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
          }),
        ],
      })
    }
  }
}

/**
 * Hata yakalama ve Sentry'ye gönderme
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  const loadedSentry = await loadSentry()
  
  if (!loadedSentry) {
    // Sentry yoksa sadece console'a yazdır
    console.error('Error captured:', error, context)
    return
  }
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    loadedSentry.captureException(error, {
      extra: context,
    })
  } else if (process.env.NODE_ENV === 'development') {
    // Development'da console'a yazdır
    console.error('Error captured (would be sent to Sentry in production):', error, context)
  }
}

/**
 * Mesaj yakalama (non-error events)
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info') {
  const loadedSentry = await loadSentry()
  
  if (!loadedSentry) {
    console.log(`[${level}]:`, message)
    return
  }
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    loadedSentry.captureMessage(message, level)
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry ${level}]:`, message)
  }
}

/**
 * Kullanıcı bilgilerini Sentry'ye ekle
 */
export async function setUser(user: { id: string; email?: string; companyId?: string }) {
  const loadedSentry = await loadSentry()
  if (!loadedSentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    loadedSentry.setUser({
      id: user.id,
      email: user.email,
      // companyId'yi tag olarak ekle (filtreleme için)
      companyId: user.companyId,
    })
  }
}

/**
 * Context ekle (ekstra bilgi)
 */
export async function setContext(name: string, context: Record<string, any>) {
  const loadedSentry = await loadSentry()
  if (!loadedSentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    loadedSentry.setContext(name, context)
  }
}

/**
 * Tag ekle (filtreleme için)
 */
export async function setTag(key: string, value: string) {
  const loadedSentry = await loadSentry()
  if (!loadedSentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    loadedSentry.setTag(key, value)
  }
}


