'use client'

import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('p-12 text-center', className)}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {Icon && (
          <div className="rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 p-6">
            <Icon className="h-12 w-12 text-primary" />
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Button
            onClick={action.onClick}
            variant="ghost"
            className="mt-2 text-sm font-medium text-purple-500 hover:text-purple-600 hover:bg-purple-50"
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}






