'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface GlowingTextProps {
  text: string
  className?: string
  glowColor?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info'
  delay?: number
  duration?: number
  staggerDelay?: number
}

const glowColors = {
  primary: 'from-indigo-400 via-purple-400 to-pink-400',
  secondary: 'from-purple-400 via-pink-400 to-rose-400',
  accent: 'from-pink-400 via-rose-400 to-orange-400',
  success: 'from-emerald-400 via-teal-400 to-cyan-400',
  warning: 'from-amber-400 via-orange-400 to-red-400',
  info: 'from-blue-400 via-indigo-400 to-purple-400',
}

const textColors = {
  primary: 'text-indigo-600',
  secondary: 'text-purple-600',
  accent: 'text-pink-600',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  info: 'text-blue-600',
}

export default function GlowingText({
  text,
  className,
  glowColor = 'primary',
  delay = 0,
  duration = 2,
  staggerDelay = 0.05,
}: GlowingTextProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Metni harflere ayır (boşlukları da dahil et)
  const letters = text.split('')

  if (!mounted) {
    return <span className={cn(textColors[glowColor], className)}>{text}</span>
  }

  return (
    <span className={cn('inline-flex items-center', className)}>
      {letters.map((letter, index) => {
        // Boşluk karakteri için özel işlem
        if (letter === ' ') {
          return <span key={index} className="w-2" />
        }

        return (
          <motion.span
            key={index}
            className={cn(
              'relative inline-block',
              textColors[glowColor],
              'font-semibold'
            )}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: [0.3, 1, 0.3],
              textShadow: [
                '0 0 0px rgba(99, 102, 241, 0)',
                `0 0 20px rgba(99, 102, 241, 0.8)`,
                '0 0 0px rgba(99, 102, 241, 0)',
              ],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay: delay + index * staggerDelay,
              ease: 'easeInOut',
            }}
            style={{
              willChange: 'opacity, text-shadow',
              filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))',
            }}
          >
            {/* Glowing background effect */}
            <motion.span
              className={cn(
                'absolute inset-0 bg-gradient-to-r',
                glowColors[glowColor],
                'opacity-0 blur-sm'
              )}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay: delay + index * staggerDelay,
                ease: 'easeInOut',
              }}
              style={{
                willChange: 'opacity, transform',
                transform: 'translateZ(0)', // GPU acceleration
              }}
            />
            
            {/* Letter */}
            <span className="relative z-10">{letter}</span>
          </motion.span>
        )
      })}
    </span>
  )
}












