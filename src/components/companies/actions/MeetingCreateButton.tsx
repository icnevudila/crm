'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Appearance = 'primary' | 'secondary' | 'outline'

interface MeetingCreateButtonProps {
  companyId: string
  appearance?: Appearance
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export function MeetingCreateButton({
  companyId,
  appearance = 'primary',
  size = 'default',
  className,
  fullWidth = true,
}: MeetingCreateButtonProps) {
  const locale = useLocale()

  const variant = appearance === 'outline' ? 'outline' : 'default'
  const appearanceClass = appearanceClasses[appearance] ?? appearanceClasses.primary

  return (
    <Link href={`/${locale}/meetings/new?customerCompanyId=${companyId}`} prefetch={true}>
      <Button
        variant={variant}
        size={size}
        className={cn(fullWidth ? 'w-full' : '', appearanceClass, className)}
      >
        <Calendar className="h-4 w-4" />
        <span>Görüşme Ekle</span>
      </Button>
    </Link>
  )
}

const appearanceClasses: Record<Appearance, string> = {
  primary: 'bg-gradient-primary text-white shadow-card hover:shadow-card-hover',
  secondary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  outline: '',
}

export default MeetingCreateButton




