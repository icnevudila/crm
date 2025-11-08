import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency - ENTERPRISE: EURO varsayılan, dinamik sembol
 */
export function formatCurrency(amount: number, currency: string = 'EUR') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '€0,00'
  }

  // Currency sembolü
  const currencySymbols: Record<string, string> = {
    EUR: '€',
    TRY: '₺',
    USD: '$',
    GBP: '£',
  }

  const symbol = currencySymbols[currency] || currency

  // Locale ayarı (EUR için en-US, TRY için tr-TR)
  const locale = currency === 'TRY' ? 'tr-TR' : currency === 'EUR' ? 'en-US' : 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Get currency symbol - ENTERPRISE: Dinamik sembol döndürür
 */
export function getCurrencySymbol(currency: string = 'EUR'): string {
  const currencySymbols: Record<string, string> = {
    EUR: '€',
    TRY: '₺',
    USD: '$',
    GBP: '£',
  }
  return currencySymbols[currency] || currency
}
