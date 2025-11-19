'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export interface CompactListItem {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  icon?: ReactNode
  badges?: {
    label: string
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'
    className?: string
  }[]
  metadata?: {
    label: string
    value: string | ReactNode
  }[]
  actions?: {
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive'
  }[]
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onClick?: () => void
}

interface CompactListViewProps {
  items: CompactListItem[]
  selectedIds?: string[]
  onSelectItem?: (id: string, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
  selectAll?: boolean
  emptyState?: {
    icon?: ReactNode
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  className?: string
}

/**
 * Monday.com tarzı kompakt liste görünümü
 * Daha az boşluk, daha fazla bilgi yoğunluğu, organize görünüm
 */
export default function CompactListView({
  items,
  selectedIds = [],
  onSelectItem,
  onSelectAll,
  selectAll = false,
  emptyState,
  className,
}: CompactListViewProps) {
  if (items.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyState.icon && <div className="mb-4 text-gray-400">{emptyState.icon}</div>}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyState.title}</h3>
        {emptyState.description && (
          <p className="text-sm text-gray-500 mb-4">{emptyState.description}</p>
        )}
        {emptyState.action && (
          <Button onClick={emptyState.action.onClick} className="bg-gradient-primary text-white">
            {emptyState.action.label}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
        >
          <Card
            className={cn(
              'border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer',
              selectedIds.includes(item.id) && 'border-indigo-500 bg-indigo-50/50',
              item.onClick && 'cursor-pointer'
            )}
            onClick={item.onClick}
          >
            <div className="p-2.5">
              <div className="flex items-center gap-2.5">
                {/* Checkbox */}
                {onSelectItem && (
                  <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
                      aria-label={`Select ${item.title}`}
                    />
                  </div>
                )}

                {/* Image/Icon */}
                {(item.imageUrl || item.icon) && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized={item.imageUrl.startsWith('blob:') || item.imageUrl.startsWith('data:')}
                      />
                    ) : (
                      <div className="scale-75">{item.icon}</div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h4>
                    {item.badges?.map((badge, badgeIndex) => (
                      <Badge
                        key={badgeIndex}
                        variant={badge.variant || 'outline'}
                        className={cn('text-xs', badge.className)}
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
                  )}
                  {item.metadata && item.metadata.length > 0 && (
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {item.metadata.map((meta, metaIndex) => (
                        <div key={metaIndex} className="flex items-center gap-1 text-xs text-gray-600">
                          <span className="text-gray-500">{meta.label}:</span>
                          <span className="font-medium text-gray-700">{meta.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {item.actions && item.actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {item.actions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation()
                              action.onClick()
                            }}
                            className={cn(
                              action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
                            )}
                          >
                            {action.icon && <span className="mr-2">{action.icon}</span>}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {item.onView && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        item.onView?.()
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                  )}
                  {item.onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        item.onEdit?.()
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 text-gray-600" />
                    </Button>
                  )}
                  {item.onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        item.onDelete?.()
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}


