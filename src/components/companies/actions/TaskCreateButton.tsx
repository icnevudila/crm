'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ClipboardList } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Appearance = 'primary' | 'secondary' | 'outline'

interface TaskCreateButtonProps {
  companyId: string
  appearance?: Appearance
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export function TaskCreateButton({
  companyId,
  appearance = 'outline',
  size = 'default',
  className,
  fullWidth = true,
}: TaskCreateButtonProps) {
  const locale = useLocale()

  const variant: 'default' | 'outline' = appearance === 'outline' ? 'outline' : 'default'
  const appearanceClass = appearanceClasses[appearance] ?? appearanceClasses.outline

  return (
    <Link href={`/${locale}/tasks?create=1&customerCompanyId=${companyId}`} prefetch={true}>
      <Button
        variant={variant}
        size={size}
        className={cn(fullWidth ? 'w-full' : '', appearanceClass, className)}
      >
        <ClipboardList className="h-4 w-4" />
        <span>Görev Oluştur</span>
      </Button>
    </Link>
  )
}

const appearanceClasses: Record<Appearance, string> = {
  primary: 'bg-gradient-primary text-white shadow-card hover:shadow-card-hover',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  outline: 'border-slate-300 text-slate-700 hover:bg-slate-50',
}

export default TaskCreateButton




