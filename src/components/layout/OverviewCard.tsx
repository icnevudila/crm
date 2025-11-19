'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface OverviewCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  onClick?: () => void
  className?: string
}

/**
 * QuickBooks tarzı overview kartı
 * Hero section altında kullanılacak KPI kartları
 */
export default function OverviewCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-indigo-600',
  trend,
  description,
  onClick,
  className,
}: OverviewCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer', className)}
    >
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full">
        <CardContent className="p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600 mb-0.5 truncate">{title}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
                {trend && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
              </div>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
            {Icon && (
              <div className={cn('p-1 rounded bg-gray-50 flex-shrink-0', iconColor)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

