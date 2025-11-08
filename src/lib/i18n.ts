/**
 * i18n configuration for next-intl
 * Bu dosya henüz next-intl kurulumundan önce hazır
 */

export const locales = ['tr', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'tr'

export const localeNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
}







