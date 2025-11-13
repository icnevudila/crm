/**
 * Development-only logger utility
 * Production'da otomatik olarak devre dışı kalır
 * Console.log'ları production'da tamamen kaldırır (dead code elimination)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const devLog = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEV]', ...args)
    }
  },
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[DEV ERROR]', ...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[DEV WARN]', ...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[DEV INFO]', ...args)
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEV DEBUG]', ...args)
    }
  },
  table: (data: any) => {
    if (isDevelopment) {
      console.table(data)
    }
  },
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  },
}

/**
 * Production-safe error logging (Sentry'e gönderilebilir)
 */
export const prodError = (error: Error | string, context?: Record<string, any>) => {
  // Production'da sadece error tracking servisine gönder
  // Development'ta console'a da yazdır
  if (isDevelopment) {
    console.error('[PROD ERROR]', error, context)
  }
  // TODO: Sentry veya başka error tracking servisine gönder
}


