/**
 * Optimized Link component with aggressive prefetching
 * Sekme geçişlerini <300ms'e düşürmek için agresif prefetching
 * SSR-safe - hydration hatasını önlemek için basitleştirildi
 */
'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode
  className?: string
  priority?: 'high' | 'low' // Yüksek öncelikli linkler hemen prefetch edilir
}

export function PrefetchLink({ 
  href, 
  children, 
  className, 
  priority = 'high',
  ...props 
}: PrefetchLinkProps) {
  // SSR-safe: Sadece Next.js Link'i kullan - custom ref ve prefetch logic kaldırıldı
  // Next.js'in kendi prefetch mekanizması hydration-safe ve yeterince hızlı
  return (
    <Link
      href={href}
      prefetch={priority === 'high'} // Yüksek öncelikli linkler için prefetch aktif
      className={cn(
        'transition-all duration-75', // Çok kısa transition - instant görünüm
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
