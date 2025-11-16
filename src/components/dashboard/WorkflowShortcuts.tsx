'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  TrendingUp,
  FileText,
  Receipt,
  Truck,
  Users,
  Briefcase,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SalesProcessWizard from './SalesProcessWizard'
import CustomerWizard from './CustomerWizard'
import DealWizard from './DealWizard'
import QuoteWizard from './QuoteWizard'
import InvoiceWizard from './InvoiceWizard'
import QuoteToInvoiceWizard from './QuoteToInvoiceWizard'
import CustomerToDealWizard from './CustomerToDealWizard'
import InvoiceToShipmentWizard from './InvoiceToShipmentWizard'

interface WorkflowShortcut {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  color: string
  badge?: string
}

export default function WorkflowShortcuts() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [salesWizardOpen, setSalesWizardOpen] = useState(false)
  const [customerWizardOpen, setCustomerWizardOpen] = useState(false)
  const [dealWizardOpen, setDealWizardOpen] = useState(false)
  const [quoteWizardOpen, setQuoteWizardOpen] = useState(false)
  const [invoiceWizardOpen, setInvoiceWizardOpen] = useState(false)
  const [quoteToInvoiceWizardOpen, setQuoteToInvoiceWizardOpen] = useState(false)
  const [customerToDealWizardOpen, setCustomerToDealWizardOpen] = useState(false)
  const [invoiceToShipmentWizardOpen, setInvoiceToShipmentWizardOpen] = useState(false)

  const shortcuts: WorkflowShortcut[] = [
    {
      id: 'new-sales-process',
      title: t('workflow.newSalesProcess'),
      description: t('workflow.newSalesProcessDescription'),
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => setSalesWizardOpen(true),
      color: 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
      badge: t('workflow.fast'),
    },
    {
      id: 'new-customer',
      title: t('workflow.newCustomer'),
      description: t('workflow.newCustomerDescription'),
      icon: <Users className="h-5 w-5" />,
      onClick: () => setCustomerWizardOpen(true),
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
    },
    {
      id: 'new-deal',
      title: t('workflow.newDeal'),
      description: t('workflow.newDealDescription'),
      icon: <Briefcase className="h-5 w-5" />,
      onClick: () => setDealWizardOpen(true),
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
    },
    {
      id: 'new-quote',
      title: t('workflow.newQuote'),
      description: t('workflow.newQuoteDescription'),
      icon: <FileText className="h-5 w-5" />,
      onClick: () => setQuoteWizardOpen(true),
      color: 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700',
    },
    {
      id: 'new-invoice',
      title: t('workflow.newInvoice'),
      description: t('workflow.newInvoiceDescription'),
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => setInvoiceWizardOpen(true),
      color: 'bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700',
    },
    {
      id: 'quote-to-invoice',
      title: t('workflow.quoteToInvoice'),
      description: t('workflow.quoteToInvoiceDescription'),
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => setQuoteToInvoiceWizardOpen(true),
      color: 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
      badge: t('workflow.threeSteps'),
    },
    {
      id: 'customer-to-deal',
      title: t('workflow.customerToDeal'),
      description: t('workflow.customerToDealDescription'),
      icon: <Users className="h-5 w-5" />,
      onClick: () => setCustomerToDealWizardOpen(true),
      color: 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700',
      badge: t('workflow.twoSteps'),
    },
    {
      id: 'invoice-to-shipment',
      title: t('workflow.invoiceToShipment'),
      description: t('workflow.invoiceToShipmentDescription'),
      icon: <Truck className="h-5 w-5" />,
      onClick: () => setInvoiceToShipmentWizardOpen(true),
      color: 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700',
      badge: t('workflow.twoSteps'),
    },
  ]

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">{t('workflow.quickActions')}</CardTitle>
        </div>
        <CardDescription>{t('workflow.quickActionsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((shortcut, index) => (
            <motion.div
              key={shortcut.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Button
                variant="default"
                className={`w-full h-auto p-4 ${shortcut.color} text-white shadow-md hover:shadow-lg transition-all flex flex-col items-start gap-2`}
                onClick={shortcut.onClick || (() => shortcut.href && router.push(shortcut.href))}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {shortcut.icon}
                    <span className="font-semibold text-sm">{shortcut.title}</span>
                  </div>
                  {shortcut.badge && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {shortcut.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-white/90 text-left">{shortcut.description}</p>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
      
      {/* Wizard Modals */}
      <SalesProcessWizard open={salesWizardOpen} onClose={() => setSalesWizardOpen(false)} />
      <CustomerWizard open={customerWizardOpen} onClose={() => setCustomerWizardOpen(false)} />
      <DealWizard open={dealWizardOpen} onClose={() => setDealWizardOpen(false)} />
      <QuoteWizard open={quoteWizardOpen} onClose={() => setQuoteWizardOpen(false)} />
      <InvoiceWizard open={invoiceWizardOpen} onClose={() => setInvoiceWizardOpen(false)} />
      <QuoteToInvoiceWizard open={quoteToInvoiceWizardOpen} onClose={() => setQuoteToInvoiceWizardOpen(false)} />
      <CustomerToDealWizard open={customerToDealWizardOpen} onClose={() => setCustomerToDealWizardOpen(false)} />
      <InvoiceToShipmentWizard open={invoiceToShipmentWizardOpen} onClose={() => setInvoiceToShipmentWizardOpen(false)} />
    </Card>
  )
}

