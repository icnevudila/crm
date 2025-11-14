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
let Sentry: any = null
try {
  Sentry = require('@sentry/nextjs')
} catch (error) {
  // Paket yüklü değilse Sentry devre dışı
  if (process.env.NODE_ENV === 'development') {
    console.warn('Sentry paketi yüklü değil. Hata takibi devre dışı. Yüklemek için: npm install @sentry/nextjs')
  }
}

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

/**
 * Sentry'yi başlat (sadece production'da)
 */
export function initSentry() {
  // Sentry paketi yüklü değilse hiçbir şey yapma
  if (!Sentry) return
  
  if (typeof window === 'undefined') {
    // Server-side
    if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
      Sentry.init({
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
      Sentry.init({
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
          new Sentry.BrowserTracing({
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
export function captureException(error: Error, context?: Record<string, any>) {
  if (!Sentry) {
    // Sentry yoksa sadece console'a yazdır
    console.error('Error captured:', error, context)
    return
  }
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.captureException(error, {
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
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info') {
  if (!Sentry) {
    console.log(`[${level}]:`, message)
    return
  }
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.captureMessage(message, level)
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry ${level}]:`, message)
  }
}

/**
 * Kullanıcı bilgilerini Sentry'ye ekle
 */
export function setUser(user: { id: string; email?: string; companyId?: string }) {
  if (!Sentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.setUser({
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
export function setContext(name: string, context: Record<string, any>) {
  if (!Sentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.setContext(name, context)
  }
}

/**
 * Tag ekle (filtreleme için)
 */
export function setTag(key: string, value: string) {
  if (!Sentry) return
  
  if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
    Sentry.setTag(key, value)
  }
}


