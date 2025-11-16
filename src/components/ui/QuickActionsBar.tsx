'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Plus, FileText, Receipt, CheckSquare, Users, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatShortcut } from '@/lib/keyboard-shortcuts'

interface QuickAction {
  label: string
  icon: React.ReactNode
  href: string
  shortcut?: string
  variant?: 'default' | 'outline' | 'secondary'
}

interface QuickActionsBarProps {
  currentModule?: string
  onNewClick?: (module: string) => void
}

/**
 * QuickActionsBar - Sayfa üstünde hızlı işlem butonları
 * CRM'de sık kullanılan işlemler için
 */
export function QuickActionsBar({ currentModule, onNewClick }: QuickActionsBarProps) {
  const router = useRouter()
  const locale = useLocale()

  const quickActions: QuickAction[] = [
    {
      label: 'Yeni Müşteri',
      icon: <Users className="h-4 w-4" />,
      href: `/${locale}/customers/new`,
      shortcut: 'Ctrl+N',
      variant: 'default',
    },
    {
      label: 'Yeni Fırsat',
      icon: <Briefcase className="h-4 w-4" />,
      href: `/${locale}/deals/new`,
      shortcut: 'Ctrl+Shift+D',
      variant: 'outline',
    },
    {
      label: 'Yeni Teklif',
      icon: <FileText className="h-4 w-4" />,
      href: `/${locale}/quotes/new`,
      shortcut: 'Ctrl+Shift+Q',
      variant: 'outline',
    },
    {
      label: 'Yeni Fatura',
      icon: <Receipt className="h-4 w-4" />,
      href: `/${locale}/invoices/new`,
      shortcut: 'Ctrl+Shift+I',
      variant: 'outline',
    },
    {
      label: 'Yeni Görev',
      icon: <CheckSquare className="h-4 w-4" />,
      href: `/${locale}/tasks/new`,
      shortcut: 'Ctrl+Shift+T',
      variant: 'outline',
    },
  ]

  const handleClick = (action: QuickAction) => {
    if (onNewClick) {
      onNewClick(action.href.split('/').pop() || '')
    } else {
      router.push(action.href)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
      <span className="text-sm font-medium text-gray-700 mr-2">Hızlı İşlemler:</span>
      {quickActions.map((action) => (
        <Button
          key={action.href}
          variant={action.variant || 'outline'}
          size="sm"
          onClick={() => handleClick(action)}
          className="h-8 text-xs"
        >
          {action.icon}
          <span className="ml-1.5">{action.label}</span>
          {action.shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded text-gray-600">
              {formatShortcut(action.shortcut)}
            </kbd>
          )}
        </Button>
      ))}
    </div>
  )
}



