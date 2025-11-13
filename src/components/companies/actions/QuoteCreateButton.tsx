'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Appearance = 'primary' | 'secondary' | 'outline'

interface QuoteCreateButtonProps {
  companyId: string
  appearance?: Appearance
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export function QuoteCreateButton({
  companyId,
  appearance = 'secondary',
  size = 'default',
  className,
  fullWidth = true,
}: QuoteCreateButtonProps) {
  const locale = useLocale()

  const variant = appearance === 'outline' ? 'outline' : 'default'
  const appearanceClass = appearanceClasses[appearance] ?? appearanceClasses.secondary

  return (
    <Link href={`/${locale}/quotes/new?customerCompanyId=${companyId}`} prefetch={true}>
      <Button
        variant={variant}
        size={size}
        className={cn(fullWidth ? 'w-full' : '', appearanceClass, className)}
      >
        <FileText className="h-4 w-4" />
        <span>Teklif Oluştur</span>
      </Button>
    </Link>
  )
}

const appearanceClasses: Record<Appearance, string> = {
  primary: 'bg-gradient-primary text-white shadow-card hover:shadow-card-hover',
  secondary: 'bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50',
  outline: '',
}

export default QuoteCreateButton

