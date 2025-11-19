'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Filter } from 'lucide-react'

interface QuickFilter {
  label: string
  filter: Record<string, any>
  icon?: React.ReactNode
}

interface QuickFiltersProps {
  onFilterChange: (filter: Record<string, any>) => void
  activeFilters?: Record<string, any>
}

/**
 * QuickFilters - Sık kullanılan filtreler
 * Tek tıkla filtre uygulama
 */
export function QuickFilters({ onFilterChange, activeFilters = {} }: QuickFiltersProps) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const quickFilters: QuickFilter[] = [
    {
      label: 'Bugün',
      filter: { date: 'today' },
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      label: 'Bu Hafta',
      filter: { date: 'thisWeek' },
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      label: 'Bu Ay',
      filter: { date: 'thisMonth' },
      icon: <Calendar className="h-3 w-3" />,
    },
    {
      label: 'Bekleyenler',
      filter: { status: 'PENDING' },
      icon: <Filter className="h-3 w-3" />,
    },
    {
      label: 'Acil',
      filter: { priority: 'HIGH' },
      icon: <Filter className="h-3 w-3" />,
    },
  ]

  const isActive = (filter: QuickFilter) => {
    return Object.keys(filter.filter).every(
      (key) => activeFilters[key] === filter.filter[key]
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {quickFilters.map((filter) => (
        <Button
          key={filter.label}
          variant={isActive(filter) ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.filter)}
          className="h-7 text-xs"
        >
          {filter.icon && <span className="mr-1">{filter.icon}</span>}
          {filter.label}
        </Button>
      ))}
    </div>
  )
}



