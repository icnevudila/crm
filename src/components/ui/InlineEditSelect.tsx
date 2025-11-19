'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getStatusBadgeClass } from '@/lib/crm-colors'
import { Loader2 } from 'lucide-react'

interface InlineEditSelectProps {
  value: string
  options: Array<{ value: string; label: string }>
  onSave: (newValue: string) => Promise<void>
  displayValue?: (value: string) => React.ReactNode
  className?: string
  disabled?: boolean
}

/**
 * InlineEditSelect - Liste sayfalarında inline status/priority değiştirme için
 * Auto-save ile 2 saniye debounce
 */
export default function InlineEditSelect({
  value,
  options,
  onSave,
  displayValue,
  className = '',
  disabled = false,
}: InlineEditSelectProps) {
  const [localValue, setLocalValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)

  // Value prop değiştiğinde localValue'yu güncelle
  useEffect(() => {
    setLocalValue(value)
    setHasChanged(false)
  }, [value])

  // Auto-save mekanizması - 2 saniye debounce
  useEffect(() => {
    if (!hasChanged || localValue === value) {
      return
    }

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        await onSave(localValue)
        setHasChanged(false)
      } catch (error) {
        // Hata durumunda eski değere geri dön
        setLocalValue(value)
        setHasChanged(false)
      } finally {
        setSaving(false)
      }
    }, 2000) // 2 saniye debounce

    return () => clearTimeout(timer)
  }, [localValue, value, hasChanged, onSave])

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    setHasChanged(true)
  }

  const display = displayValue
    ? displayValue(localValue)
    : options.find((opt) => opt.value === localValue)?.label || localValue

  return (
    <div className={`relative ${className}`}>
      <Select
        value={localValue}
        onValueChange={handleChange}
        disabled={disabled || saving}
      >
        <SelectTrigger className="h-auto py-1 px-2 border-none shadow-none hover:bg-gray-50 focus:ring-0">
          <SelectValue>
            <div className="flex items-center gap-2">
              {display}
              {saving && (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}



