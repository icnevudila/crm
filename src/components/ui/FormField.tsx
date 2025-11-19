'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  required?: boolean
  helperText?: string
  tooltip?: string
  error?: string
  children: React.ReactNode
  className?: string
  labelClassName?: string
}

/**
 * FormField - Label, helper text, tooltip ve error mesajı desteği ile form field wrapper
 */
export function FormField({
  label,
  required = false,
  helperText,
  tooltip,
  error,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={React.isValidElement(children) && children.props.id ? children.props.id : undefined}
          className={cn(labelClassName)}
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {children}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}



