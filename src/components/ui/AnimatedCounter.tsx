'use client'

import { useEffect, useState, memo } from 'react'
import { motion, useSpring, useMotionValueEvent } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

function AnimatedCounter({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  // Initial display value
  const initialDisplay = value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const [display, setDisplay] = useState(initialDisplay)
  const spring = useSpring(value, {
    damping: 60,
    stiffness: 100,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  // MotionValue'dan değeri dinle ve state'e yaz
  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplay(
      Math.floor(latest).toLocaleString('tr-TR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    )
  })

  return (
    <motion.span className={className}>
      {prefix}
      {display}
      {suffix}
    </motion.span>
  )
}

// Memoize component - value değişmediği sürece re-render etme
export default memo(AnimatedCounter)

