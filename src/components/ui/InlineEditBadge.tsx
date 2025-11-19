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

interface InlineEditBadgeProps {
  value: string
  options: Array<{ value: string; label: string }>
  onSave: (newValue: string) => Promise<void>
  className?: string
  disabled?: boolean
}

/**
 * InlineEditBadge - Liste sayfalarında inline status değiştirme için Badge görünümü
 * Auto-save ile 2 saniye debounce
 */
export default function InlineEditBadge({
  value,
  options,
  onSave,
  className = '',
  disabled = false,
}: InlineEditBadgeProps) {
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

  const currentOption = options.find((opt) => opt.value === localValue)
  const label = currentOption?.label || localValue

  return (
    <div className={`relative inline-block ${className}`}>
      <Select
        value={localValue}
        onValueChange={handleChange}
        disabled={disabled || saving}
      >
        <SelectTrigger className="h-auto py-0 px-0 border-none shadow-none bg-transparent hover:opacity-80 focus:ring-0">
          <SelectValue>
            <div className="flex items-center gap-1">
              <Badge className={getStatusBadgeClass(localValue)}>
                {label}
              </Badge>
              {saving && (
                <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-1" />
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <Badge className={getStatusBadgeClass(option.value)}>
                {option.label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}



