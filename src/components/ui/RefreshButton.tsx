'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
}

export default function RefreshButton({
  onRefresh,
  variant = 'outline',
  size = 'icon',
  className,
  disabled = false,
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || disabled) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      // Animasyon için kısa bir gecikme
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={disabled || isRefreshing}
      className={cn('transition-all duration-300', className)}
      title="Yenile"
    >
      <RefreshCw
        className={cn(
          'h-4 w-4 transition-transform duration-500',
          isRefreshing && 'animate-spin'
        )}
      />
      {size !== 'icon' && <span className="ml-2">Yenile</span>}
    </Button>
  )
}








