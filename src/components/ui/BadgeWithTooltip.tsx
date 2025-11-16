'use client'

import * as React from 'react'
import { Badge, BadgeProps } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface BadgeWithTooltipProps extends BadgeProps {
  tooltip: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  tooltipDelay?: number
}

/**
 * BadgeWithTooltip - Status badge'ler için tooltip desteği
 */
export function BadgeWithTooltip({
  tooltip,
  tooltipSide = 'top',
  tooltipDelay = 200,
  children,
  ...badgeProps
}: BadgeWithTooltipProps) {
  return (
    <TooltipProvider delayDuration={tooltipDelay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge {...badgeProps}>
            {children}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}



