'use client'

import { Profiler, ProfilerOnRenderCallback } from 'react'

// Profiler config (inline - scripts klasörü client component'lerden import edilemez)
const profilerConfig = {
  thresholds: {
    componentRender: 16, // 60fps için 16ms
    pageLoad: 500,
    routeTransition: 300,
  },
}

interface PerformanceProfilerProps {
  id: string
  children: React.ReactNode
}

/**
 * React Profiler Wrapper Component
 * Component render performansını ölçer
 */
export default function PerformanceProfiler({
  id,
  children,
}: PerformanceProfilerProps) {
  const onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    // Development'ta console'a yazdır
    if (process.env.NODE_ENV === 'development') {
      const threshold = profilerConfig.thresholds.componentRender
      const isSlow = actualDuration > threshold

      if (isSlow) {
        console.warn(
          `⚠️ Slow component render: ${id}`,
          `Phase: ${phase}`,
          `Duration: ${actualDuration.toFixed(2)}ms (threshold: ${threshold}ms)`
        )
      } else {
        console.log(
          `✅ Component render: ${id}`,
          `Phase: ${phase}`,
          `Duration: ${actualDuration.toFixed(2)}ms`
        )
      }
    }

    // Production'da analytics'e gönder (gelecekte)
    if (process.env.NODE_ENV === 'production') {
      // Analytics API'ye gönder
      // measurePerformance({ id, phase, actualDuration, baseDuration })
    }
  }

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  )
}

