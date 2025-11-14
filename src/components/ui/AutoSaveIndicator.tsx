'use client'

import { Loader2, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoSaveIndicatorProps {
  isSaving?: boolean
  isSaved?: boolean
  hasError?: boolean
  className?: string
}

/**
 * Auto-Save Indicator
 * Form'un otomatik kaydedildiğini gösterir
 */
export default function AutoSaveIndicator({
  isSaving = false,
  isSaved = false,
  hasError = false,
  className,
}: AutoSaveIndicatorProps) {
  if (isSaving) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-gray-600',
          className
        )}
      >
        <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        <span>Kaydediliyor...</span>
      </div>
    )
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-red-600',
          className
        )}
      >
        <AlertCircle className="h-3 w-3" />
        <span>Kaydetme hatası</span>
      </div>
    )
  }

  if (isSaved) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-emerald-600',
          className
        )}
      >
        <Check className="h-3 w-3" />
        <span>Kaydedildi</span>
      </div>
    )
  }

  return null
}


