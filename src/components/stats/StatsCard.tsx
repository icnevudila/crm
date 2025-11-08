/**
 * Ortak İstatistik Kartı Component'i
 * Her sayfa için tutarlı ve kullanışlı istatistik göstergesi
 */
'use client'

import { memo } from 'react'
import GradientCard from '@/components/ui/GradientCard'
import AnimatedCounter from '@/components/ui/AnimatedCounter'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  icon?: LucideIcon
  gradient?: 'primary' | 'secondary' | 'accent'
  className?: string
  onClick?: () => void
}

function StatsCard({
  title,
  value,
  prefix,
  suffix,
  icon: Icon,
  gradient = 'primary',
  className = '',
  onClick,
}: StatsCardProps) {
  return (
    <GradientCard 
      gradient={gradient} 
      className={`hover:scale-[1.02] transition-transform ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        </div>
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="text-2xl font-bold text-primary-600"
        />
      </div>
    </GradientCard>
  )
}

// Memoize component - props değişmediği sürece re-render etme
export default memo(StatsCard)

