/**
 * Production-Safe Logging Utility
 * 
 * Bu utility, production'da console.log'ları otomatik olarak devre dışı bırakır.
 * Development'da normal console çıktısı verir.
 * 
 * Kullanım:
 * import { log, logError, logWarn } from '@/lib/logger-production'
 * 
 * log('Info message', { data: 'value' })
 * logError('Error message', error)
 * logWarn('Warning message')
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug'

interface LogOptions {
  level?: LogLevel
  context?: Record<string, any>
  error?: Error
}

/**
 * Production-safe logger
 * Development'da console'a yazdırır, production'da sessizce devre dışı kalır
 */
function createLogger(level: LogLevel) {
  return (message: string, options?: LogOptions | Error) => {
    // Production'da sadece error'ları logla (kritik hatalar)
    if (process.env.NODE_ENV === 'production') {
      if (level === 'error') {
        // Production'da sadece error'ları console'a yazdır
        // Sentry zaten hataları yakalıyor, burada sadece kritik hatalar için
        if (options instanceof Error) {
          console.error(`[${level.toUpperCase()}]`, message, options)
        } else if (options?.error) {
          console.error(`[${level.toUpperCase()}]`, message, options.error, options.context)
        } else {
          console.error(`[${level.toUpperCase()}]`, message, options?.context)
        }
      }
      // Diğer log seviyeleri production'da sessizce devre dışı
      return
    }

    // Development'da tüm loglar görünür
    const logMethod = console[level] || console.log
    if (options instanceof Error) {
      logMethod(`[${level.toUpperCase()}]`, message, options)
    } else if (options?.error) {
      logMethod(`[${level.toUpperCase()}]`, message, options.error, options.context)
    } else if (options?.context) {
      logMethod(`[${level.toUpperCase()}]`, message, options.context)
    } else {
      logMethod(`[${level.toUpperCase()}]`, message)
    }
  }
}

/**
 * Log seviyeleri
 */
export const log = createLogger('log')
export const logError = createLogger('error')
export const logWarn = createLogger('warn')
export const logInfo = createLogger('info')
export const logDebug = createLogger('debug')

/**
 * Structured logging (JSON format)
 * Production'da structured log'lar için kullanılabilir
 */
export function logStructured(
  level: LogLevel,
  message: string,
  data?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'production') {
    // Production'da structured logging servisine gönderilebilir
    // Şimdilik sessizce devre dışı
    if (level === 'error') {
      console.error(JSON.stringify({ level, message, data, timestamp: new Date().toISOString() }))
    }
    return
  }

  // Development'da console'a yazdır
  const logMethod = console[level] || console.log
  logMethod(JSON.stringify({ level, message, data, timestamp: new Date().toISOString() }, null, 2))
}

/**
 * Performance logging
 * API response time'ları için
 */
export function logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    // Production'da performance metrikleri monitoring servisine gönderilebilir
    // Şimdilik sessizce devre dışı
    return
  }

  // Development'da console'a yazdır
  const color = duration > 1000 ? '🔴' : duration > 500 ? '🟡' : '🟢'
  console.log(`${color} [PERF] ${operation}: ${duration}ms`, metadata || '')
}


