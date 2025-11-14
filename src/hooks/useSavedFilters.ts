/**
 * Saved Filters Hook
 * Sık kullanılan filtreleri kaydetme ve yükleme
 * localStorage kullanır (performans için)
 */

import { useState, useEffect, useCallback } from 'react'

export interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
  module: string
  createdAt: number
  isDefault?: boolean
}

interface UseSavedFiltersOptions {
  /**
   * Modül adı (customers, deals, quotes, etc.)
   */
  module: string
  
  /**
   * Maksimum kayıtlı filtre sayısı (varsayılan: 10)
   */
  maxFilters?: number
}

/**
 * Saved Filters Hook
 * Filtreleri kaydetme ve yükleme için
 */
export function useSavedFilters({
  module,
  maxFilters = 10,
}: UseSavedFiltersOptions) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  // localStorage'dan yükle
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(`crm_saved_filters_${module}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSavedFilters(parsed)
      }
    } catch (e) {
      console.error('Failed to load saved filters:', e)
    }
  }, [module])

  // Filtre kaydet
  const saveFilter = useCallback(
    (name: string, filters: Record<string, any>, isDefault = false) => {
      const newFilter: SavedFilter = {
        id: `${Date.now()}-${Math.random()}`,
        name,
        filters,
        module,
        createdAt: Date.now(),
        isDefault,
      }

      setSavedFilters((prev) => {
        // Varsayılan filtre varsa, diğerlerini varsayılan olmaktan çıkar
        let updated = prev.map((f) => ({ ...f, isDefault: false }))
        
        // Yeni filtreyi ekle
        updated = [...updated, newFilter]
        
        // Maksimum sayıyı kontrol et
        if (updated.length > maxFilters) {
          // En eski filtreyi sil
          updated = updated
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-maxFilters)
        }
        
        // localStorage'a kaydet
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `crm_saved_filters_${module}`,
              JSON.stringify(updated)
            )
          } catch (e) {
            console.error('Failed to save filter:', e)
          }
        }
        
        return updated
      })
    },
    [module, maxFilters]
  )

  // Filtre sil
  const deleteFilter = useCallback(
    (id: string) => {
      setSavedFilters((prev) => {
        const updated = prev.filter((f) => f.id !== id)
        
        // localStorage'a kaydet
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `crm_saved_filters_${module}`,
              JSON.stringify(updated)
            )
          } catch (e) {
            console.error('Failed to delete filter:', e)
          }
        }
        
        return updated
      })
    },
    [module]
  )

  // Filtre yükle
  const loadFilter = useCallback(
    (id: string): SavedFilter | null => {
      const filter = savedFilters.find((f) => f.id === id)
      return filter || null
    },
    [savedFilters]
  )

  // Varsayılan filtreyi yükle
  const loadDefaultFilter = useCallback((): SavedFilter | null => {
    const defaultFilter = savedFilters.find((f) => f.isDefault)
    return defaultFilter || null
  }, [savedFilters])

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    loadFilter,
    loadDefaultFilter,
  }
}


