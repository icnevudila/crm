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
  const [debouncedSearch, setDebouncedSearch] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Value değiştiğinde search'i güncelle
  useEffect(() => {
    setSearch(value)
    setDebouncedSearch(value)
  }, [value])

  // Debounce search - kullanıcı yazmayı bitirdikten 300ms sonra güncelle
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      // Parent'a debounced değeri gönder (API çağrısı için)
      // Sadece değer değiştiyse gönder (sonsuz döngüyü önle)
      if (search !== value && search !== debouncedSearch) {
        onChange(search)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search]) // Sadece search değiştiğinde tetikle

  // API'den önerileri çek (debounced search kullan - kullanıcı yazmayı bitirdikten sonra)
  const shouldFetch = apiUrl && debouncedSearch.length >= minChars
  
  // API URL'ini oluştur - eğer apiUrl zaten search parametresi içeriyorsa güncelle, yoksa ekle
  const apiUrlWithSearch = useMemo(() => {
    if (!shouldFetch || !apiUrl) return null
    
    try {
      const url = new URL(apiUrl, window.location.origin)
      url.searchParams.set('search', debouncedSearch)
      // limit parametresi varsa koru, yoksa ekle
      if (!url.searchParams.has('limit')) {
        url.searchParams.set('limit', '10')
      }
      // Relative URL döndür
      return url.pathname + url.search
    } catch {
      // URL parse edilemezse, basit string replacement yap
      if (apiUrl.includes('search=')) {
        // Mevcut search parametresini değiştir
        return apiUrl.replace(/search=[^&]*/, `search=${encodeURIComponent(debouncedSearch)}`)
      } else if (apiUrl.includes('?')) {
        return `${apiUrl}&search=${encodeURIComponent(debouncedSearch)}`
      } else {
        return `${apiUrl}?search=${encodeURIComponent(debouncedSearch)}`
      }
    }
  }, [shouldFetch, apiUrl, debouncedSearch])
  
  const { data: apiDataRaw } = useData<any>(
    apiUrlWithSearch,
    {
      dedupingInterval: 1000,
      revalidateOnFocus: false,
    }
  )

  // API verisini array'e çevir (güvenli)
  const apiData = useMemo(() => {
    if (!apiDataRaw) return []
    if (Array.isArray(apiDataRaw)) return apiDataRaw
    // Eğer object ise ve data property'si varsa (örn: { data: [...] })
    if (typeof apiDataRaw === 'object' && 'data' in apiDataRaw && Array.isArray(apiDataRaw.data)) {
      return apiDataRaw.data
    }
    // Eğer object ise ve results property'si varsa (örn: { results: [...] })
    if (typeof apiDataRaw === 'object' && 'results' in apiDataRaw && Array.isArray(apiDataRaw.results)) {
      return apiDataRaw.results
    }
    // Eğer object ise ve items property'si varsa (örn: { items: [...] })
    if (typeof apiDataRaw === 'object' && 'items' in apiDataRaw && Array.isArray(apiDataRaw.items)) {
      return apiDataRaw.items
    }
    // Diğer durumlarda boş array döndür
    return []
  }, [apiDataRaw])

  // Önerileri birleştir
  const allSuggestions = useMemo(() => {
    // Manuel öneriler
    const manual = Array.isArray(suggestions) ? suggestions.map((s) => ({
      id: s.id,
      label: s.label,
      value: s.value,
    })) : []

    // API önerileri
    const api = Array.isArray(apiData) ? apiData.map((item: any) => ({
      id: item[valueField] || item.id,
      label: item[labelField] || item.name || item.label || String(item[valueField] || item.id),
      value: item[valueField] || item.id,
    })) : []

    // Birleştir ve tekilleştir
    const combined = [...manual, ...api]
    const unique = combined.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
    )

    return unique
  }, [suggestions, apiData, labelField, valueField])

  // Filtrelenmiş öneriler - anında filtreleme için search kullan (API sonuçları debouncedSearch'ten gelir)
  const filteredSuggestions = useMemo(() => {
    const searchTerm = search.length >= minChars ? search : debouncedSearch
    if (!searchTerm || searchTerm.length < minChars) return []
    
    const lowerSearch = searchTerm.toLowerCase()
    return allSuggestions.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerSearch) ||
        item.value.toLowerCase().includes(lowerSearch)
    )
  }, [allSuggestions, search, debouncedSearch, minChars])

  // Input değiştiğinde - anında UI'ı güncelle, parent'a debounced gönder
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearch(newValue) // Anında UI'ı güncelle (yazma hızını yavaşlatmaz)
    // onChange debounced olarak useEffect'te çağrılacak
    
    // Manuel önerilerde tam eşleşme kontrolü (API beklemeden)
    if (suggestions.length > 0) {
      const exactMatch = suggestions.find(
        (s) =>
          s.label.toLowerCase() === newValue.toLowerCase() ||
          s.value.toLowerCase() === newValue.toLowerCase()
      )
      
      if (exactMatch && onSelect) {
        onSelect(exactMatch)
      }
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
          value={search}
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
            <CommandInput placeholder="Ara..." value={search} onValueChange={(val) => {
              setSearch(val)
              // onChange debounced olarak useEffect'te çağrılacak
            }} />
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

