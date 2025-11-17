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
  Package,
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
import dynamic from 'next/dynamic'

const ProductForm = dynamic(() => import('@/components/products/ProductForm'), {
  ssr: false,
  loading: () => null,
})

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
  const [productFormOpen, setProductFormOpen] = useState(false)

  const shortcuts: WorkflowShortcut[] = [
    {
      id: 'new-sales-process',
      title: t('workflow.newSalesProcess'),
      description: t('workflow.newSalesProcessDescription'),
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => setSalesWizardOpen(true),
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      badge: t('workflow.fast'),
    },
    {
      id: 'new-customer',
      title: t('workflow.newCustomer'),
      description: t('workflow.newCustomerDescription'),
      icon: <Users className="h-5 w-5" />,
      onClick: () => setCustomerWizardOpen(true),
      color: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    },
    {
      id: 'new-deal',
      title: t('workflow.newDeal'),
      description: t('workflow.newDealDescription'),
      icon: <Briefcase className="h-5 w-5" />,
      onClick: () => setDealWizardOpen(true),
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
    {
      id: 'new-quote',
      title: t('workflow.newQuote'),
      description: t('workflow.newQuoteDescription'),
      icon: <FileText className="h-5 w-5" />,
      onClick: () => setQuoteWizardOpen(true),
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    {
      id: 'new-invoice',
      title: t('workflow.newInvoice'),
      description: t('workflow.newInvoiceDescription'),
      icon: <Receipt className="h-5 w-5" />,
      onClick: () => setInvoiceWizardOpen(true),
      color: 'bg-pink-500 hover:bg-pink-600 text-white',
    },
    {
      id: 'quote-to-invoice',
      title: t('workflow.quoteToInvoice'),
      description: t('workflow.quoteToInvoiceDescription'),
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => setQuoteToInvoiceWizardOpen(true),
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
      badge: t('workflow.threeSteps'),
    },
    {
      id: 'customer-to-deal',
      title: t('workflow.customerToDeal'),
      description: t('workflow.customerToDealDescription'),
      icon: <Users className="h-5 w-5" />,
      onClick: () => setCustomerToDealWizardOpen(true),
      color: 'bg-teal-500 hover:bg-teal-600 text-white',
      badge: t('workflow.twoSteps'),
    },
    {
      id: 'invoice-to-shipment',
      title: t('workflow.invoiceToShipment'),
      description: t('workflow.invoiceToShipmentDescription'),
      icon: <Truck className="h-5 w-5" />,
      onClick: () => setInvoiceToShipmentWizardOpen(true),
      color: 'bg-slate-500 hover:bg-slate-600 text-white',
      badge: t('workflow.twoSteps'),
    },
    {
      id: 'new-product',
      title: t('workflow.newProduct'),
      description: t('workflow.newProductDescription'),
      icon: <Package className="h-5 w-5" />,
      onClick: () => setProductFormOpen(true),
      color: 'bg-violet-500 hover:bg-violet-600 text-white',
    },
  ]

  return (
    <Card className="border border-slate-200 bg-white shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-slate-700" />
          <CardTitle className="text-lg text-slate-800">{t('workflow.quickActions')}</CardTitle>
        </div>
        <CardDescription className="text-slate-600">{t('workflow.quickActionsDescription')}</CardDescription>
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
                className={`w-full h-auto p-4 ${shortcut.color} shadow-md hover:shadow-lg transition-all flex flex-col items-start gap-2`}
                onClick={shortcut.onClick || (() => shortcut.href && router.push(shortcut.href))}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {shortcut.icon}
                    <span className="font-semibold text-sm">{shortcut.title}</span>
                  </div>
                  {shortcut.badge && (
                    <Badge variant="secondary" className="bg-white/40 text-white font-semibold border-white/50 shadow-sm whitespace-nowrap flex-shrink-0">
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
      <ProductForm open={productFormOpen} onClose={() => setProductFormOpen(false)} />
    </Card>
  )
}

