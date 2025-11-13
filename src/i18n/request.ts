import { getRequestConfig } from 'next-intl/server'
import { defaultLocale } from '@/lib/i18n'

export default getRequestConfig(async ({ requestLocale }) => {
  // Bu fonksiyon server-side çalışır
  // requestLocale otomatik olarak URL'den alınır (middleware sayesinde)
  // Eğer requestLocale yoksa defaultLocale kullanılır
  let locale = await requestLocale || defaultLocale

  return {
    locale,
    messages: (await import(`@/locales/${locale}.json`)).default,
  }
})







