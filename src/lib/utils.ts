import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency - TRY (TL) varsayılan, dinamik sembol
 */
export function formatCurrency(amount: number, currency: string = 'TRY') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₺0,00'
  }

  // Currency sembolü
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    EUR: '€',
    USD: '$',
    GBP: '£',
  }

  const symbol = currencySymbols[currency] || currency

  // Locale ayarı (TRY için tr-TR, diğerleri için en-US)
  const locale = currency === 'TRY' ? 'tr-TR' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get currency symbol - TRY (TL) varsayılan, dinamik sembol döndürür
 */
export function getCurrencySymbol(currency: string = 'TRY'): string {
  const currencySymbols: Record<string, string> = {
    TRY: '₺',
    EUR: '€',
    USD: '$',
    GBP: '£',
  }
  return currencySymbols[currency] || currency
}
