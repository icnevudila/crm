'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useData } from '@/hooks/useData'

interface SmartAutocompleteProps {
  /**
   * API endpoint (örnek: /api/customers?search=)
   */
  apiUrl?: string | null
  
  /**
   * Manuel öneri listesi (API yerine)
   */
  suggestions?: Array<{ id: string; label: string; value: string }>
  
  /**
   * Input değeri
   */
  value: string
  
  /**
   * Değer değiştiğinde
   */
  onChange: (value: string) => void
  
  /**
   * Seçim yapıldığında
   */
  onSelect?: (item: { id: string; label: string; value: string }) => void
  
  /**
   * Placeholder
   */
  placeholder?: string
  
  /**
   * Minimum karakter sayısı (API araması için)
   */
  minChars?: number
  
  /**
   * Label field name (API response'da)
   */
  labelField?: string
  
  /**
   * Value field name (API response'da)
   */
  valueField?: string
  
  /**
   * Input className
   */
  className?: string
  
  /**
   * Disabled
   */
  disabled?: boolean
}

/**
 * Smart Autocomplete Component
 * Akıllı otomatik tamamlama - API veya manuel öneriler
 */
export default function SmartAutocomplete({
  apiUrl,
  suggestions = [],
  value,
  onChange,
  onSelect,
  placeholder = 'Ara...',
  minChars = 2,
  labelField = 'name',
  valueField = 'id',
  className,
  disabled = false,
}: SmartAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Value değiştiğinde search'i güncelle
  useEffect(() => {
    setSearch(value)
  }, [value])

  // API'den önerileri çek (eğer apiUrl varsa ve yeterli karakter yazıldıysa)
  const shouldFetch = apiUrl && search.length >= minChars
  const { data: apiData = [] } = useData<any[]>(
    shouldFetch ? apiUrl : null,
    {
      dedupingInterval: 1000,
      revalidateOnFocus: false,
    }
  )

  // Önerileri birleştir
  const allSuggestions = useMemo(() => {
    // Manuel öneriler
    const manual = suggestions.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
    }))

    // API önerileri
    const api = (apiData || []).map((item: any) => ({
      id: item[valueField] || item.id,
      label: item[labelField] || item.name || item.label || String(item[valueField] || item.id),
      value: item[valueField] || item.id,
    }))

    // Birleştir ve tekilleştir
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
    )
  }, [allSuggestions, search, minChars])

  // Input değiştiğinde
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearch(newValue)
    onChange(newValue)
    
    // Eğer tam eşleşme varsa, otomatik seç
    const exactMatch = allSuggestions.find(
      (item) =>
        item.label.toLowerCase() === newValue.toLowerCase() ||
        item.value.toLowerCase() === newValue.toLowerCase()
    )
    
    if (exactMatch && onSelect) {
      onSelect(exactMatch)
    }
  }

  // Öneri seçildiğinde
  const handleSelect = (item: { id: string; label: string; value: string }) => {
    onChange(item.label)
    setSearch('')
    setOpen(false)
    if (onSelect) {
      onSelect(item)
    }
  }

  // Input'a odaklanıldığında
  const handleFocus = () => {
    if (search.length >= minChars || suggestions.length > 0) {
      setOpen(true)
    }
  }

  // Input'tan çıkıldığında
  const handleBlur = () => {
    // Kısa bir gecikme ile kapat (tıklama işlemi tamamlanabilsin diye)
    setTimeout(() => setOpen(false), 200)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
        />
      </PopoverTrigger>
      {(filteredSuggestions.length > 0 || search.length >= minChars) && (
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Ara..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>
                {search.length < minChars
                  ? `En az ${minChars} karakter yazın...`
                  : 'Sonuç bulunamadı'}
              </CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.slice(0, 10).map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.label}
                    onSelect={() => handleSelect(item)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === item.label ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}

