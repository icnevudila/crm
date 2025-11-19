'use client'

import * as React from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface IconButtonWithTooltipProps extends ButtonProps {
  tooltip: string
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  tooltipDelay?: number
}

/**
 * IconButtonWithTooltip - Icon butonlar için tooltip desteği
 */
export function IconButtonWithTooltip({
  tooltip,
  tooltipSide = 'top',
  tooltipDelay = 200,
  children,
  ...buttonProps
}: IconButtonWithTooltipProps) {
  return (
    <TooltipProvider delayDuration={tooltipDelay}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...buttonProps}>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}



