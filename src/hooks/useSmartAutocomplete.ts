/**
 * Smart Autocomplete Hook
 * API veya manuel öneriler için
 */

import { useState, useMemo, useCallback } from 'react'
import { useData } from '@/hooks/useData'

interface UseSmartAutocompleteOptions {
  /**
   * API endpoint (örnek: /api/customers?search=)
   */
  apiUrl?: string | null
  
  /**
   * Manuel öneri listesi
   */
  suggestions?: Array<{ id: string; label: string; value: string }>
  
  /**
   * Minimum karakter sayısı
   */
  minChars?: number
  
  /**
   * Label field name
   */
  labelField?: string
  
  /**
   * Value field name
   */
  valueField?: string
}

/**
 * Smart Autocomplete Hook
 * API veya manuel öneriler için
 */
export function useSmartAutocomplete({
  apiUrl,
  suggestions = [],
  minChars = 2,
  labelField = 'name',
  valueField = 'id',
}: UseSmartAutocompleteOptions) {
  const [search, setSearch] = useState('')

  // API'den önerileri çek
  const shouldFetch = apiUrl && search.length >= minChars
  const { data: apiData = [] } = useData<any[]>(
    shouldFetch ? `${apiUrl}${encodeURIComponent(search)}` : null,
    {
      dedupingInterval: 1000,
      revalidateOnFocus: false,
    }
  )

  // Önerileri birleştir
  const allSuggestions = useMemo(() => {
    const manual = suggestions.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
    }))

    const api = (apiData || []).map((item: any) => ({
      id: item[valueField] || item.id,
      label: item[labelField] || item.name || item.label || String(item[valueField] || item.id),
      value: item[valueField] || item.id,
    }))

    const combined = [...manual, ...api]
    const unique = combined.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
    )

    return unique
  }, [suggestions, apiData, labelField, valueField])

  // Filtrelenmiş öneriler
  const filteredSuggestions = useMemo(() => {
    if (!search || search.length < minChars) return []
    
    const lowerSearch = search.toLowerCase()
    return allSuggestions.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerSearch) ||
        item.value.toLowerCase().includes(lowerSearch)
    ).slice(0, 10) // Maksimum 10 öneri
  }, [allSuggestions, search, minChars])

  return {
    search,
    setSearch,
    suggestions: filteredSuggestions,
    allSuggestions,
  }
}


