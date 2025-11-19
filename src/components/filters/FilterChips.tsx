'use client'

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterChip {
  key: string
  label: string
  value: string | number | boolean
}

interface FilterChipsProps {
  /**
   * Aktif filtreler
   */
  filters: Record<string, any>
  
  /**
   * Filtre kaldırıldığında çağrılır
   */
  onRemove: (key: string) => void
  
  /**
   * Tüm filtreleri temizle
   */
  onClearAll?: () => void
  
  /**
   * Filtre etiketleri (key -> label mapping)
   */
  labels?: Record<string, string>
}

/**
 * Filter Chips Component
 * Aktif filtreleri chip olarak gösterir
 */
export default function FilterChips({
  filters,
  onRemove,
  onClearAll,
  labels = {},
}: FilterChipsProps) {
  // Filtreleri chip formatına çevir
  const chips: FilterChip[] = Object.entries(filters)
    .filter(([_, value]) => {
      // Boş değerleri filtrele
      if (value === null || value === undefined || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      return true
    })
    .map(([key, value]) => {
      let displayValue = value
      
      // Array ise virgülle ayır
      if (Array.isArray(value)) {
        displayValue = value.join(', ')
      }
      // Boolean ise
      else if (typeof value === 'boolean') {
        displayValue = value ? 'Evet' : 'Hayır'
      }
      // Date ise
      else if (value instanceof Date) {
        displayValue = value.toLocaleDateString('tr-TR')
      }
      // String ise ve tarih formatındaysa
      else if (typeof value === 'string' && value.includes('T')) {
        try {
          displayValue = new Date(value).toLocaleDateString('tr-TR')
        } catch (e) {
          // Tarih parse edilemezse olduğu gibi göster
        }
      }

      return {
        key,
        label: labels[key] || key,
        value: displayValue,
      }
    })

  if (chips.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          <span className="text-xs font-medium">{chip.label}:</span>
          <span className="text-xs">{String(chip.value)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-transparent"
            onClick={() => onRemove(chip.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll && chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 text-xs"
        >
          Tümünü Temizle
        </Button>
      )}
    </div>
  )
}






