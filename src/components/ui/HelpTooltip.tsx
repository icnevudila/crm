'use client'

import * as React from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface HelpTooltipProps {
  content: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

/**
 * HelpTooltip - Yardım ikonu ile tooltip
 * Form field'larında ve diğer yerlerde kullanılabilir
 */
export function HelpTooltip({
  content,
  side = 'top',
  delay = 200,
  className,
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle
            className={cn(
              'h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help',
              className
            )}
          />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}



