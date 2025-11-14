/**
 * CRM Workflow Tanımları ve Yardımcı Fonksiyonlar
 * Multi-tenant güvenli workflow yönetimi
 */

export interface WorkflowStep {
  module: string
  label: string
  href: string
  icon?: string
  status: 'completed' | 'active' | 'pending'
  recordId?: string
  recordName?: string
}

export interface Workflow {
  id: string
  name: string
  steps: WorkflowStep[]
  context: 'sales' | 'support' | 'purchase' | 'general'
}

/**
 * Satış Pipeline Workflow
 * Customer → Deal → Quote → Invoice → Shipment
 */
export const SALES_PIPELINE_WORKFLOW: Workflow = {
  id: 'sales-pipeline',
  name: 'Satış Pipeline',
  context: 'sales',
  steps: [
    {
      module: 'customer',
      label: 'Müşteri',
      href: '/customers',
      status: 'pending',
    },
    {
      module: 'deal',
      label: 'Fırsat',
      href: '/deals',
      status: 'pending',
    },
    {
      module: 'quote',
      label: 'Teklif',
      href: '/quotes',
      status: 'pending',
    },
    {
      module: 'invoice',
      label: 'Fatura',
      href: '/invoices',
      status: 'pending',
    },
    {
      module: 'shipment',
      label: 'Sevkiyat',
      href: '/shipments',
      status: 'pending',
    },
  ],
}

/**
 * Müşteri Detay Sayfası Workflow
 * Customer → Deals → Quotes → Invoices
 */
export function getCustomerWorkflow(
  customerId: string,
  customerName: string,
  dealId?: string,
  quoteId?: string,
  invoiceId?: string
): WorkflowStep[] {
  return [
    {
      module: 'customer',
      label: 'Müşteri',
      href: `/customers/${customerId}`,
      status: 'completed',
      recordId: customerId,
      recordName: customerName,
    },
    {
      module: 'deal',
      label: 'Fırsatlar',
      href: dealId ? `/deals/${dealId}` : '/deals',
      status: dealId ? 'completed' : 'pending',
      recordId: dealId,
    },
    {
      module: 'quote',
      label: 'Teklifler',
      href: quoteId ? `/quotes/${quoteId}` : '/quotes',
      status: quoteId ? (invoiceId ? 'completed' : 'active') : 'pending',
      recordId: quoteId,
    },
    {
      module: 'invoice',
      label: 'Faturalar',
      href: invoiceId ? `/invoices/${invoiceId}` : '/invoices',
      status: invoiceId ? 'active' : 'pending',
      recordId: invoiceId,
    },
  ]
}

/**
 * Deal Detay Sayfası Workflow
 * Customer → Deal → Quote → Invoice
 */
export function getDealWorkflow(
  customerId: string,
  customerName: string,
  dealId: string,
  dealName: string,
  quoteId?: string,
  invoiceId?: string
): WorkflowStep[] {
  return [
    {
      module: 'customer',
      label: 'Müşteri',
      href: `/customers/${customerId}`,
      status: 'completed',
      recordId: customerId,
      recordName: customerName,
    },
    {
      module: 'deal',
      label: 'Fırsat',
      href: `/deals/${dealId}`,
      status: quoteId ? 'completed' : 'active',
      recordId: dealId,
      recordName: dealName,
    },
    {
      module: 'quote',
      label: 'Teklif',
      href: quoteId ? `/quotes/${quoteId}` : '/quotes/new',
      status: quoteId ? (invoiceId ? 'completed' : 'active') : 'pending',
      recordId: quoteId,
    },
    {
      module: 'invoice',
      label: 'Fatura',
      href: invoiceId ? `/invoices/${invoiceId}` : '/invoices/new',
      status: invoiceId ? 'active' : 'pending',
      recordId: invoiceId,
    },
  ]
}

/**
 * Quote Detay Sayfası Workflow
 * Customer → Deal → Quote → Invoice
 */
export function getQuoteWorkflow(
  customerId: string,
  customerName: string,
  dealId?: string,
  dealName?: string,
  quoteId: string = '',
  quoteName: string = '',
  invoiceId?: string
): WorkflowStep[] {
  return [
    {
      module: 'customer',
      label: 'Müşteri',
      href: `/customers/${customerId}`,
      status: 'completed',
      recordId: customerId,
      recordName: customerName,
    },
    {
      module: 'deal',
      label: 'Fırsat',
      href: dealId ? `/deals/${dealId}` : '/deals',
      status: dealId ? 'completed' : 'pending',
      recordId: dealId,
      recordName: dealName,
    },
    {
      module: 'quote',
      label: 'Teklif',
      href: `/quotes/${quoteId}`,
      status: invoiceId ? 'completed' : 'active',
      recordId: quoteId,
      recordName: quoteName,
    },
    {
      module: 'invoice',
      label: 'Fatura',
      href: invoiceId ? `/invoices/${invoiceId}` : '/invoices/new',
      status: invoiceId ? 'active' : 'pending',
      recordId: invoiceId,
    },
  ]
}

/**
 * Invoice Detay Sayfası Workflow
 * Customer → Deal → Quote → Invoice → Shipment
 */
export function getInvoiceWorkflow(
  customerId: string,
  customerName: string,
  dealId?: string,
  dealName?: string,
  quoteId?: string,
  quoteName?: string,
  invoiceId: string = '',
  invoiceName: string = '',
  shipmentId?: string
): WorkflowStep[] {
  return [
    {
      module: 'customer',
      label: 'Müşteri',
      href: `/customers/${customerId}`,
      status: 'completed',
      recordId: customerId,
      recordName: customerName,
    },
    {
      module: 'deal',
      label: 'Fırsat',
      href: dealId ? `/deals/${dealId}` : '/deals',
      status: dealId ? 'completed' : 'pending',
      recordId: dealId,
      recordName: dealName,
    },
    {
      module: 'quote',
      label: 'Teklif',
      href: quoteId ? `/quotes/${quoteId}` : '/quotes',
      status: quoteId ? 'completed' : 'pending',
      recordId: quoteId,
      recordName: quoteName,
    },
    {
      module: 'invoice',
      label: 'Fatura',
      href: `/invoices/${invoiceId}`,
      status: shipmentId ? 'completed' : 'active',
      recordId: invoiceId,
      recordName: invoiceName,
    },
    {
      module: 'shipment',
      label: 'Sevkiyat',
      href: shipmentId ? `/shipments/${shipmentId}` : '/shipments/new',
      status: shipmentId ? 'active' : 'pending',
      recordId: shipmentId,
    },
  ]
}

/**
 * Rol bazlı menü önceliklendirme
 * Türkçe rol isimleri ile çalışır
 */
export function getMenuPriorityByRole(role: string): Record<string, 'high' | 'medium' | 'low'> {
  if (role === 'SALES') {
    return {
      customers: 'high',
      deals: 'high',
      quotes: 'high',
      invoices: 'medium',
      shipments: 'low',
      products: 'medium',
      tasks: 'medium',
      meetings: 'high',
    }
  }
  
  if (role === 'ADMIN') {
    return {
      dashboard: 'high',
      customers: 'high',
      deals: 'high',
      quotes: 'high',
      invoices: 'high',
      finance: 'high',
      reports: 'high',
      users: 'high',
      settings: 'medium',
    }
  }
  
  if (role === 'MANAGER') {
    return {
      dashboard: 'high',
      customers: 'high',
      deals: 'high',
      quotes: 'high',
      invoices: 'high',
      reports: 'high',
      tasks: 'high',
      users: 'medium',
    }
  }
  
  if (role === 'ACCOUNTANT') {
    return {
      dashboard: 'high',
      invoices: 'high',
      finance: 'high',
      reports: 'high',
      customers: 'medium',
      quotes: 'medium',
    }
  }
  
  if (role === 'SUPPORT') {
    return {
      dashboard: 'high',
      tickets: 'high',
      customers: 'high',
      tasks: 'high',
      deals: 'medium',
    }
  }
  
  if (role === 'MARKETING') {
    return {
      dashboard: 'high',
      customers: 'high',
      'email-campaigns': 'high',
      reports: 'high',
      deals: 'medium',
      quotes: 'medium',
    }
  }
  
  if (role === 'PURCHASE') {
    return {
      dashboard: 'high',
      vendors: 'high',
      'purchase-shipments': 'high',
      products: 'high',
      invoices: 'medium',
    }
  }
  
  if (role === 'WAREHOUSE') {
    return {
      dashboard: 'high',
      products: 'high',
      shipments: 'high',
      'purchase-shipments': 'high',
      invoices: 'medium',
    }
  }
  
  // USER rolü için varsayılan
  return {
    dashboard: 'high',
    customers: 'medium',
    deals: 'medium',
    quotes: 'medium',
    invoices: 'medium',
    tasks: 'high',
    tickets: 'high',
  }
}

/**
 * Modül bazlı workflow tespiti
 */
export function getWorkflowByModule(module: string): Workflow | null {
  switch (module) {
    case 'customer':
    case 'deal':
    case 'quote':
    case 'invoice':
    case 'shipment':
      return SALES_PIPELINE_WORKFLOW
    default:
      return null
  }
}

