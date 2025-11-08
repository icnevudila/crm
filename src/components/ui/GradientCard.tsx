'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientCardProps {
  children: React.ReactNode
  className?: string
  gradient?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info'
  icon?: React.ReactNode
  onClick?: () => void
}

function GradientCard({
  children,
  className,
  gradient = 'primary',
  icon,
  onClick,
}: GradientCardProps) {
  const gradientClasses = {
    primary: 'from-indigo-500 via-purple-500 to-pink-500',
    secondary: 'from-purple-500 via-pink-500 to-rose-500',
    accent: 'from-pink-500 via-rose-500 to-orange-500',
    success: 'from-emerald-500 via-teal-500 to-cyan-500',
    warning: 'from-amber-500 via-orange-500 to-red-500',
    info: 'from-blue-500 via-indigo-500 to-purple-500',
  }

  const borderGradient = {
    primary: 'from-indigo-400 to-purple-400',
    secondary: 'from-purple-400 to-pink-400',
    accent: 'from-pink-400 to-rose-400',
    success: 'from-emerald-400 to-teal-400',
    warning: 'from-amber-400 to-orange-400',
    info: 'from-blue-400 to-indigo-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, y: -4 }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl p-5',
        'bg-gradient-to-br from-white to-gray-50',
        'border border-gray-200/50',
        'shadow-lg shadow-gray-200/50',
        'transition-all duration-300',
        'hover:shadow-2xl hover:shadow-gray-300/50',
        'hover:border-transparent',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Animated gradient background */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500',
          'bg-gradient-to-br',
          gradientClasses[gradient]
        )}
      />
      
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
        <div className="absolute -inset-10 bg-gradient-to-r from-transparent via-white to-transparent rotate-12 group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Border gradient on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'bg-gradient-to-br',
          borderGradient[gradient],
          'p-[1px]'
        )}
      >
        <div className="h-full w-full rounded-xl bg-white" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

// Memoize component - props değişmediği sürece re-render etme
export default memo(GradientCard)







