'use client'

import { Button } from '@/components/ui/button'
import { Plus, Briefcase, FileText, Receipt, CheckSquare, Calendar, MessageSquare } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslations } from 'next-intl'

interface QuickActionsProps {
  onAction: (type: 'deal' | 'quote' | 'invoice' | 'task' | 'meeting' | 'ticket', data?: any) => void
  customerId?: string
  customerCompanyId?: string
  dealId?: string
  quoteId?: string
  disabled?: boolean
}

export default function QuickActions({
  onAction,
  customerId,
  customerCompanyId,
  dealId,
  quoteId,
  disabled = false,
}: QuickActionsProps) {
  const t = useTranslations('common')

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('quickActions')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => onAction('deal', { customerId, customerCompanyId })}
            className="cursor-pointer"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            {t('newDeal')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('quote', { dealId, customerId, customerCompanyId })}
            className="cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2" />
            {t('newQuote')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('invoice', { quoteId, customerId, customerCompanyId })}
            className="cursor-pointer"
          >
            <Receipt className="h-4 w-4 mr-2" />
            {t('newInvoice')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('task', { dealId, customerId })}
            className="cursor-pointer"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            {t('newTask')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('meeting', { dealId, customerId, customerCompanyId })}
            className="cursor-pointer"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('newMeeting')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onAction('ticket', { customerId, customerCompanyId })}
            className="cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {t('newTicket')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
