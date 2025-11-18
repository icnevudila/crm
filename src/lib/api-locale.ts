/**
 * API route'larda locale desteği için helper fonksiyonlar
 * Request'ten locale'i çıkarır ve mesajları döndürür
 */

import { defaultLocale, locales, type Locale } from './i18n'
import trMessages from '@/locales/tr.json'
import enMessages from '@/locales/en.json'

const messages: Record<Locale, any> = {
  tr: trMessages,
  en: enMessages,
}

/**
 * Request'ten locale'i çıkarır
 * Öncelik sırası:
 * 1. Referer header'dan (/tr/ veya /en/ prefix'i)
 * 2. Accept-Language header'dan
 * 3. Default locale (tr)
 */
export function getLocaleFromRequest(request: Request): Locale {
  // Referer'dan locale çıkar (örn: https://example.com/tr/dashboard -> tr)
  const referer = request.headers.get('referer') || ''
  const refererMatch = referer.match(/\/(tr|en)\//)
  if (refererMatch && locales.includes(refererMatch[1] as Locale)) {
    return refererMatch[1] as Locale
  }

  // Accept-Language header'dan locale çıkar
  const acceptLanguage = request.headers.get('accept-language') || ''
  if (acceptLanguage.includes('en')) {
    return 'en'
  }
  if (acceptLanguage.includes('tr')) {
    return 'tr'
  }

  // Default locale
  return defaultLocale
}

/**
 * Locale'e göre mesajları döndürür
 */
export function getMessages(locale: Locale = defaultLocale): any {
  return messages[locale] || messages[defaultLocale]
}

/**
 * Locale'e göre çevrilmiş hata mesajını döndürür
 */
export function getErrorMessage(
  key: string,
  request: Request,
  params?: Record<string, string | number>
): string {
  const locale = getLocaleFromRequest(request)
  const msgs = getMessages(locale)
  
  // Nested key desteği (örn: "errors.api.quoteNotFound")
  const keys = key.split('.')
  let value: any = msgs
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }

  if (typeof value !== 'string') {
    // Fallback: default locale'den dene
    const defaultMsgs = getMessages(defaultLocale)
    let defaultValue: any = defaultMsgs
    for (const k of keys) {
      defaultValue = defaultValue?.[k]
      if (defaultValue === undefined) break
    }
    value = typeof defaultValue === 'string' ? defaultValue : key
  }

  // Parametreleri değiştir (örn: {status: "ACCEPTED"} -> "ACCEPTED durumundaki...")
  if (params && typeof value === 'string') {
    return Object.entries(params).reduce(
      (msg, [paramKey, paramValue]) => msg.replace(`{${paramKey}}`, String(paramValue)),
      value
    )
  }

  return value || key
}

/**
 * Activity mesajını güvenli bir şekilde alır ve parametreleri değiştirir
 * @param locale - Locale (tr/en)
 * @param key - Activity key (örn: 'customerCreated')
 * @param params - Değiştirilecek parametreler (örn: {name: 'Test'})
 * @returns Güvenli mesaj string'i
 */
export function getActivityMessage(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const msgs = getMessages(locale)
  const activity = msgs?.activity
  
  if (!activity || typeof activity !== 'object') {
    // Fallback: default locale'den dene
    const defaultMsgs = getMessages(defaultLocale)
    const defaultActivity = defaultMsgs?.activity
    if (!defaultActivity || typeof defaultActivity !== 'object') {
      return key // Son çare: key'i döndür
    }
    const value = defaultActivity[key]
    if (typeof value !== 'string') {
      return key
    }
    // Parametreleri değiştir
    if (params) {
      return Object.entries(params).reduce(
        (msg, [paramKey, paramValue]) => msg.replace(`{${paramKey}}`, String(paramValue)),
        value
      )
    }
    return value
  }
  
  const value = activity[key]
  if (typeof value !== 'string') {
    // Fallback: default locale'den dene
    const defaultMsgs = getMessages(defaultLocale)
    const defaultActivity = defaultMsgs?.activity
    if (defaultActivity && typeof defaultActivity === 'object') {
      const defaultValue = defaultActivity[key]
      if (typeof defaultValue === 'string') {
        if (params) {
          return Object.entries(params).reduce(
            (msg, [paramKey, paramValue]) => msg.replace(`{${paramKey}}`, String(paramValue)),
            defaultValue
          )
        }
        return defaultValue
      }
    }
    return key // Son çare: key'i döndür
  }
  
  // Parametreleri değiştir
  if (params) {
    return Object.entries(params).reduce(
      (msg, [paramKey, paramValue]) => msg.replace(`{${paramKey}}`, String(paramValue)),
      value
    )
  }
  
  return value
}







