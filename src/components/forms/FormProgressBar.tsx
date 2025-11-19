'use client'

import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface FormProgressBarProps {
  /**
   * Form değerleri (watch() ile alınan değerler)
   */
  formValues: Record<string, any>
  
  /**
   * Zorunlu alanlar listesi
   */
  requiredFields: string[]
  
  /**
   * Tüm alanlar listesi (opsiyonel - otomatik hesaplanır)
   */
  allFields?: string[]
  
  /**
   * Progress bar görünür mü?
   */
  show?: boolean
  
  /**
   * Minimum yüzde göster (ör: %30'dan azsa gösterme)
   */
  minPercentage?: number
  
  /**
   * ClassName
   */
  className?: string
}

/**
 * Form Progress Bar Component
 * Form doldurma ilerlemesini gösterir
 */
export default function FormProgressBar({
  formValues,
  requiredFields,
  allFields,
  show = true,
  minPercentage = 0,
  className,
}: FormProgressBarProps) {
  // İlerleme hesapla
  const progress = useMemo(() => {
    // Tüm alanları belirle
    const fields = allFields || Object.keys(formValues)
    
    // Doldurulmuş alanları say
    const filledFields = fields.filter((field) => {
      const value = formValues[field]
      // Boş değilse ve boş string değilse doldurulmuş sayılır
      return value !== undefined && value !== null && value !== ''
    })
    
    // Zorunlu alanları kontrol et
    const filledRequiredFields = requiredFields.filter((field) => {
      const value = formValues[field]
      return value !== undefined && value !== null && value !== ''
    })
    
    // İlerleme yüzdesi (zorunlu alanlar %70, diğer alanlar %30)
    const requiredProgress = (filledRequiredFields.length / requiredFields.length) * 70
    const optionalProgress = requiredFields.length > 0
      ? ((filledFields.length - filledRequiredFields.length) / Math.max(1, fields.length - requiredFields.length)) * 30
      : (filledFields.length / fields.length) * 100
    
    const totalProgress = Math.min(100, Math.round(requiredProgress + optionalProgress))
    
    return {
      percentage: totalProgress,
      filledFields: filledFields.length,
      totalFields: fields.length,
      filledRequiredFields: filledRequiredFields.length,
      totalRequiredFields: requiredFields.length,
    }
  }, [formValues, requiredFields, allFields])

  // Minimum yüzde kontrolü
  if (!show || progress.percentage < minPercentage) {
    return null
  }

  // Renk belirleme
  const getColor = () => {
    if (progress.percentage >= 80) return 'bg-green-500'
    if (progress.percentage >= 50) return 'bg-blue-500'
    if (progress.percentage >= 30) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">
          Form İlerlemesi: {progress.percentage}%
        </span>
        <span className="text-gray-500">
          {progress.filledRequiredFields}/{progress.totalRequiredFields} zorunlu alan
        </span>
      </div>
      <Progress 
        value={progress.percentage} 
        className="h-2"
      />
      {progress.filledRequiredFields < progress.totalRequiredFields && (
        <p className="text-xs text-amber-600">
          {progress.totalRequiredFields - progress.filledRequiredFields} zorunlu alan daha doldurulmalı
        </p>
      )}
    </div>
  )
}





