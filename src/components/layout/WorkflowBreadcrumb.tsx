'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ChevronRight, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkflowStep } from '@/lib/workflows'

interface WorkflowBreadcrumbProps {
  steps: WorkflowStep[]
  className?: string
}

export default function WorkflowBreadcrumb({
  steps,
  className,
}: WorkflowBreadcrumbProps) {
  const locale = useLocale()

  return (
    <nav
      className={cn(
        'flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent',
        className
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isActive = step.status === 'active'
        const isCompleted = step.status === 'completed'
        const isPending = step.status === 'pending'

        return (
          <React.Fragment key={step.module}>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Step Icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                  {
                    'bg-indigo-500 border-indigo-500 text-white': isActive,
                    'bg-green-500 border-green-500 text-white': isCompleted,
                    'bg-gray-100 border-gray-300 text-gray-400': isPending,
                  }
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>

              {/* Step Label */}
              <div className="flex flex-col">
                {step.recordId && !isPending ? (
                  <Link
                    href={`/${locale}${step.href}`}
                    className={cn(
                      'text-sm font-medium transition-colors hover:underline',
                      {
                        'text-indigo-600 hover:text-indigo-700': isActive,
                        'text-green-600 hover:text-green-700': isCompleted,
                        'text-gray-500': isPending,
                      }
                    )}
                  >
                    {step.recordName || step.label}
                  </Link>
                ) : (
                  <span
                    className={cn('text-sm font-medium', {
                      'text-indigo-600': isActive,
                      'text-green-600': isCompleted,
                      'text-gray-500': isPending,
                    })}
                  >
                    {step.recordName || step.label}
                  </span>
                )}
                {step.recordName && step.recordId && (
                  <span className="text-xs text-gray-400">{step.label}</span>
                )}
              </div>
            </div>

            {/* Connector */}
            {!isLast && (
              <ChevronRight
                className={cn('h-4 w-4 flex-shrink-0', {
                  'text-indigo-500': isCompleted || isActive,
                  'text-gray-300': isPending,
                })}
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

