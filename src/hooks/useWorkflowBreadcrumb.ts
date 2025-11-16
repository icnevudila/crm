/**
 * Workflow Breadcrumb Hook
 * Sayfa bazlı workflow breadcrumb'ı otomatik oluşturur
 */

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useData } from '@/hooks/useData'
import {
  getCustomerWorkflow,
  getDealWorkflow,
  getQuoteWorkflow,
  getInvoiceWorkflow,
  WorkflowStep,
} from '@/lib/workflows'

interface UseWorkflowBreadcrumbOptions {
  customerId?: string
  dealId?: string
  quoteId?: string
  invoiceId?: string
  shipmentId?: string
}

export function useWorkflowBreadcrumb(
  options: UseWorkflowBreadcrumbOptions = {}
): WorkflowStep[] {
  const pathname = usePathname()
  const {
    customerId,
    dealId,
    quoteId,
    invoiceId,
    shipmentId,
  } = options

  // Müşteri bilgilerini çek
  const { data: customer } = useData<{ id: string; name: string }>(
    customerId ? `/api/customers/${customerId}` : null,
    { dedupingInterval: 60000 }
  )

  // Deal bilgilerini çek
  const { data: deal } = useData<{
    id: string
    title: string
    customerId?: string
  }>(
    dealId ? `/api/deals/${dealId}` : null,
    { dedupingInterval: 60000 }
  )

  // Quote bilgilerini çek
  const { data: quote } = useData<{
    id: string
    title: string
    customerId?: string
    dealId?: string
  }>(
    quoteId ? `/api/quotes/${quoteId}` : null,
    { dedupingInterval: 60000 }
  )

  // Invoice bilgilerini çek
  const { data: invoice } = useData<{
    id: string
    title: string
    customerId?: string
    dealId?: string
    quoteId?: string
  }>(
    invoiceId ? `/api/invoices/${invoiceId}` : null,
    { dedupingInterval: 60000 }
  )

  // Workflow steps'i oluştur
  const steps = useMemo(() => {
    // Customer detay sayfası
    if (pathname?.includes('/customers/') && customerId) {
      return getCustomerWorkflow(
        customerId,
        customer?.name || 'Müşteri',
        dealId,
        quoteId,
        invoiceId
      )
    }

    // Deal detay sayfası
    if (pathname?.includes('/deals/') && dealId) {
      const finalCustomerId = customerId || deal?.customerId
      const finalCustomer = customer || (finalCustomerId ? { id: finalCustomerId, name: 'Müşteri' } : null)
      
      if (finalCustomerId && finalCustomer) {
        return getDealWorkflow(
          finalCustomerId,
          finalCustomer.name,
          dealId,
          deal?.title || 'Fırsat',
          quoteId,
          invoiceId
        )
      }
    }

    // Quote detay sayfası
    if (pathname?.includes('/quotes/') && quoteId) {
      const finalCustomerId = customerId || quote?.customerId || deal?.customerId
      const finalDealId = dealId || quote?.dealId
      
      return getQuoteWorkflow(
        finalCustomerId || '',
        customer?.name || 'Müşteri',
        finalDealId,
        deal?.title,
        quoteId,
        quote?.title || 'Teklif',
        invoiceId
      )
    }

    // Invoice detay sayfası
    if (pathname?.includes('/invoices/') && invoiceId) {
      const finalCustomerId = customerId || invoice?.customerId || quote?.customerId || deal?.customerId
      const finalDealId = dealId || invoice?.dealId || quote?.dealId
      const finalQuoteId = quoteId || invoice?.quoteId
      
      return getInvoiceWorkflow(
        finalCustomerId || '',
        customer?.name || 'Müşteri',
        finalDealId,
        deal?.title,
        finalQuoteId,
        quote?.title,
        invoiceId,
        invoice?.title || 'Fatura',
        shipmentId
      )
    }

    // Varsayılan: Boş workflow
    return []
  }, [
    pathname,
    customerId,
    dealId,
    quoteId,
    invoiceId,
    shipmentId,
    customer,
    deal,
    quote,
    invoice,
  ])

  return steps
}





