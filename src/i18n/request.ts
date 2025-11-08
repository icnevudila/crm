import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale } from '@/lib/i18n'

export default getRequestConfig(async () => {
  // Bu fonksiyon server-side çalışır
  // Locale'i cookie veya header'dan alabilirsiniz
  const locale = defaultLocale

  return {
    locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  }
})







