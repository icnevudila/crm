/**
 * Workflow Actions Registry
 * Her aşama için yapılabilecek işlemleri tanımlar
 */

import { translateStage } from './stageTranslations'

export interface WorkflowAction {
  id: string
  label: string
  icon: string
  nextStage?: string
  createRelated?: {
    type: string
    label: string
  }
  requirements?: string[]
  description?: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
  priority?: 'high' | 'medium' | 'low'
}

// Deal Actions
export const DEAL_ACTIONS: Record<string, WorkflowAction[]> = {
  LEAD: [
    {
      id: 'contact',
      label: 'İletişime Geç',
      icon: 'Calendar',
      nextStage: 'CONTACTED',
      createRelated: {
        type: 'meeting',
        label: 'Görüşme Planla',
      },
      requirements: ['Müşteri seçimi zorunlu'],
      description: 'Müşteri ile iletişime geçildiğinde bu aşamaya geçilir',
      variant: 'default',
      priority: 'high',
    },
  ],
  CONTACTED: [
    {
      id: 'proposal',
      label: 'Teklif Hazırla',
      icon: 'FileText',
      nextStage: 'PROPOSAL',
      createRelated: {
        type: 'quote',
        label: 'Teklif Oluştur',
      },
      requirements: ['Teklif hazırlanmalı'],
      description: 'Teklif hazırlandığında bu aşamaya geçilir',
      variant: 'default',
      priority: 'high',
    },
    {
      id: 'meeting',
      label: 'Görüşme Planla',
      icon: 'Calendar',
      createRelated: {
        type: 'meeting',
        label: 'Görüşme Oluştur',
      },
      description: 'Teklif sunumu için görüşme planlayın',
      variant: 'outline',
      priority: 'medium',
    },
  ],
  PROPOSAL: [
    {
      id: 'negotiation',
      label: 'Pazarlığa Geç',
      icon: 'ArrowRight',
      nextStage: 'NEGOTIATION',
      createRelated: {
        type: 'meeting',
        label: 'Pazarlık Görüşmesi',
      },
      requirements: ['Pazarlık notları eklenmeli'],
      description: 'Pazarlık aşamasına geçildiğinde bu aşamaya geçilir',
      variant: 'default',
      priority: 'high',
    },
  ],
  NEGOTIATION: [
    {
      id: 'won',
      label: 'Kazanıldı',
      icon: 'CheckCircle',
      nextStage: 'WON',
      createRelated: {
        type: 'contract',
        label: 'Sözleşme Oluştur',
      },
      requirements: ['Değer (value) zorunlu'],
      description: 'Fırsat kazanıldığında otomatik olarak sözleşme oluşturulur',
      variant: 'default',
      priority: 'high',
    },
    {
      id: 'lost',
      label: 'Kaybedildi',
      icon: 'XCircle',
      nextStage: 'LOST',
      requirements: ['Kayıp sebebi (lostReason) zorunlu'],
      description: 'Fırsat kaybedildiğinde işlem tamamlanır',
      variant: 'outline',
      priority: 'medium',
    },
  ],
}

// Quote Actions
export const QUOTE_ACTIONS: Record<string, WorkflowAction[]> = {
  DRAFT: [
    {
      id: 'send',
      label: 'Gönder',
      icon: 'Send',
      nextStage: 'SENT',
      createRelated: {
        type: 'meeting',
        label: 'Teklif Sunumu',
      },
      requirements: ['Teklif içeriği tamamlanmalı'],
      description: 'Teklif müşteriye gönderildiğinde bu aşamaya geçilir',
      variant: 'default',
      priority: 'high',
    },
  ],
  SENT: [
    {
      id: 'accept',
      label: 'Kabul Et',
      icon: 'CheckCircle',
      nextStage: 'ACCEPTED',
      createRelated: {
        type: 'invoice',
        label: 'Fatura Oluştur',
      },
      description: 'Teklif kabul edildiğinde otomatik olarak fatura ve sözleşme oluşturulur',
      variant: 'default',
      priority: 'high',
    },
    {
      id: 'reject',
      label: 'Reddet',
      icon: 'XCircle',
      nextStage: 'REJECTED',
      description: 'Teklif reddedildiğinde işlem tamamlanır',
      variant: 'outline',
      priority: 'medium',
    },
  ],
}

// Invoice Actions
export const INVOICE_ACTIONS: Record<string, WorkflowAction[]> = {
  DRAFT: [
    {
      id: 'send',
      label: 'Gönder',
      icon: 'Send',
      nextStage: 'SENT',
      requirements: ['Fatura içeriği tamamlanmalı'],
      description: 'Fatura müşteriye gönderildiğinde bu aşamaya geçilir',
      variant: 'default',
      priority: 'high',
    },
  ],
  SENT: [
    {
      id: 'paid',
      label: 'Ödendi Olarak İşaretle',
      icon: 'CheckCircle',
      nextStage: 'PAID',
      createRelated: {
        type: 'shipment',
        label: 'Sevkiyat Oluştur',
      },
      description: 'Fatura ödendiğinde otomatik olarak finans kaydı ve sevkiyat oluşturulur',
      variant: 'default',
      priority: 'high',
    },
    {
      id: 'create-shipment',
      label: 'Sevkiyat Oluştur',
      icon: 'Package',
      createRelated: {
        type: 'shipment',
        label: 'Sevkiyat Oluştur',
      },
      description: 'Fiziksel ürünler için sevkiyat oluşturun',
      variant: 'outline',
      priority: 'medium',
    },
  ],
}

// Action getter functions
export function getDealActions(stage: string): WorkflowAction[] {
  return DEAL_ACTIONS[stage] || []
}

export function getQuoteActions(status: string): WorkflowAction[] {
  return QUOTE_ACTIONS[status] || []
}

export function getInvoiceActions(status: string): WorkflowAction[] {
  return INVOICE_ACTIONS[status] || []
}

// Genel action getter
export function getActions(
  entityType: 'deal' | 'quote' | 'invoice',
  currentStatus: string
): WorkflowAction[] {
  switch (entityType) {
    case 'deal':
      return getDealActions(currentStatus)
    case 'quote':
      return getQuoteActions(currentStatus)
    case 'invoice':
      return getInvoiceActions(currentStatus)
    default:
      return []
  }
}


