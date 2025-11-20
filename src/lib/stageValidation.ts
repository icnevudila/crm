/**
 * Stage Validation Utility
 * Kanban iş akışı kurallarını yönetir
 */

// ============================================
// DEAL STAGE TRANSITIONS
// ============================================

export const DEAL_STAGES = {
  LEAD: 'LEAD',
  CONTACTED: 'CONTACTED',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
  WON: 'WON',
  LOST: 'LOST',
} as const

export type DealStage = keyof typeof DEAL_STAGES

// İzin verilen geçişler
const dealTransitions: Record<DealStage, DealStage[]> = {
  LEAD: ['CONTACTED', 'LOST'], // LEAD'den sadece CONTACTED veya LOST'a gidebilir
  CONTACTED: ['PROPOSAL', 'LOST'], // CONTACTED'den PROPOSAL veya LOST'a
  PROPOSAL: ['NEGOTIATION', 'LOST'], // PROPOSAL'dan NEGOTIATION veya LOST'a
  NEGOTIATION: ['WON', 'LOST'], // NEGOTIATION'dan WON veya LOST'a
  WON: [], // WON immutable - değiştirilemez
  LOST: [], // LOST immutable - değiştirilemez
}

// Immutable (değiştirilemez) stage'ler
const immutableDealStages: DealStage[] = ['WON', 'LOST']

// Silinemez stage'ler
const undeletableDealStages: DealStage[] = ['WON', 'LOST']

// ============================================
// QUOTE STATUS TRANSITIONS
// ============================================

export const QUOTE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  WAITING: 'WAITING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const

export type QuoteStatus = keyof typeof QUOTE_STATUSES

const quoteTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  DRAFT: ['SENT'], // DRAFT'tan sadece SENT'e gidebilir
  SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED', 'WAITING'], // SENT'den ACCEPTED, REJECTED, EXPIRED veya WAITING'a
  WAITING: ['ACCEPTED', 'REJECTED', 'SENT'], // WAITING'den ACCEPTED, REJECTED veya SENT'e (tekrar gönderme)
  ACCEPTED: [], // ACCEPTED immutable
  REJECTED: [], // REJECTED immutable
  EXPIRED: [], // EXPIRED immutable
}

const immutableQuoteStatuses: QuoteStatus[] = ['ACCEPTED', 'REJECTED', 'EXPIRED']
const undeletableQuoteStatuses: QuoteStatus[] = ['ACCEPTED', 'REJECTED']

// ============================================
// INVOICE STATUS TRANSITIONS
// ============================================

export const INVOICE_STATUSES = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  SHIPPED: 'SHIPPED',
  RECEIVED: 'RECEIVED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const

export type InvoiceStatus = keyof typeof INVOICE_STATUSES

const invoiceTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'], // DRAFT'tan SENT veya CANCELLED'a
  SENT: ['SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED'], // SENT'den SHIPPED, RECEIVED, PAID, OVERDUE veya CANCELLED'a
  SHIPPED: ['PAID', 'CANCELLED'], // SHIPPED'den PAID veya CANCELLED'a
  RECEIVED: ['PAID', 'CANCELLED'], // RECEIVED'den PAID veya CANCELLED'a
  PAID: [], // PAID immutable
  OVERDUE: ['PAID', 'CANCELLED'], // OVERDUE'den PAID veya CANCELLED'a
  CANCELLED: [], // CANCELLED immutable
}

const immutableInvoiceStatuses: InvoiceStatus[] = ['PAID', 'SHIPPED', 'RECEIVED', 'CANCELLED']
const undeletableInvoiceStatuses: InvoiceStatus[] = ['PAID', 'SHIPPED', 'RECEIVED', 'CANCELLED']

// ============================================
// CONTRACT STATUS TRANSITIONS
// ============================================

export const CONTRACT_STATUSES = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const

export type ContractStatus = keyof typeof CONTRACT_STATUSES

const contractTransitions: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['ACTIVE'], // DRAFT'tan sadece ACTIVE'e
  ACTIVE: ['TERMINATED', 'EXPIRED'], // ACTIVE'den TERMINATED veya EXPIRED'a
  EXPIRED: [], // EXPIRED immutable
  TERMINATED: [], // TERMINATED immutable
}

const immutableContractStatuses: ContractStatus[] = ['EXPIRED', 'TERMINATED']
const undeletableContractStatuses: ContractStatus[] = ['ACTIVE', 'EXPIRED', 'TERMINATED']

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Deal stage geçişinin geçerli olup olmadığını kontrol eder
 */
export function isValidDealTransition(
  currentStage: string,
  newStage: string
): { valid: boolean; error?: string; allowed?: string[] } {
  // Aynı stage'e geçiş her zaman geçerli (update için)
  if (currentStage === newStage) {
    return { valid: true }
  }

  const current = currentStage as DealStage
  const next = newStage as DealStage

  // Stage enum'da var mı?
  if (!DEAL_STAGES[current] || !DEAL_STAGES[next]) {
    return {
      valid: false,
      error: 'Geçersiz stage değeri',
    }
  }

  // İmmutable kontrol
  if (immutableDealStages.includes(current)) {
    return {
      valid: false,
      error: `${current} durumundaki fırsatlar değiştirilemez`,
    }
  }

  // Geçiş izni var mı?
  const allowedTransitions = dealTransitions[current]
  if (!allowedTransitions.includes(next)) {
    return {
      valid: false,
      error: `${current} → ${next} geçişi yapılamaz`,
      allowed: allowedTransitions,
    }
  }

  return { valid: true }
}

/**
 * Quote status geçişinin geçerli olup olmadığını kontrol eder
 */
export function isValidQuoteTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string; allowed?: string[] } {
  if (currentStatus === newStatus) {
    return { valid: true }
  }

  const current = currentStatus as QuoteStatus
  const next = newStatus as QuoteStatus

  if (!QUOTE_STATUSES[current] || !QUOTE_STATUSES[next]) {
    return {
      valid: false,
      error: 'Geçersiz status değeri',
    }
  }

  if (immutableQuoteStatuses.includes(current)) {
    return {
      valid: false,
      error: `${current} durumundaki teklifler değiştirilemez`,
    }
  }

  const allowedTransitions = quoteTransitions[current]
  if (!allowedTransitions.includes(next)) {
    return {
      valid: false,
      error: `${current} → ${next} geçişi yapılamaz`,
      allowed: allowedTransitions,
    }
  }

  return { valid: true }
}

/**
 * Invoice status geçişinin geçerli olup olmadığını kontrol eder
 * @param currentStatus - Mevcut durum
 * @param newStatus - Yeni durum
 * @param invoiceType - Fatura tipi (SALES, PURCHASE, SERVICE_SALES, SERVICE_PURCHASE)
 */
export function isValidInvoiceTransition(
  currentStatus: string,
  newStatus: string,
  invoiceType?: 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE'
): { valid: boolean; error?: string; allowed?: string[] } {
  if (currentStatus === newStatus) {
    return { valid: true }
  }

  const current = currentStatus as InvoiceStatus
  const next = newStatus as InvoiceStatus

  if (!INVOICE_STATUSES[current] || !INVOICE_STATUSES[next]) {
    return {
      valid: false,
      error: 'Geçersiz status değeri',
    }
  }

  if (immutableInvoiceStatuses.includes(current)) {
    return {
      valid: false,
      error: `${current} durumundaki faturalar değiştirilemez`,
    }
  }

  // Satış faturaları için: SENT'ten direkt PAID'e geçişi engelle (önce SHIPPED olmalı)
  if (invoiceType === 'SALES' && current === 'SENT' && next === 'PAID') {
    return {
      valid: false,
      error: 'Satış faturaları için önce "Sevkiyat Yapıldı" durumuna geçmelisiniz. Ürünler sevk edilmeden ödeme alınamaz.',
      allowed: ['SHIPPED', 'OVERDUE', 'CANCELLED'],
    }
  }

  // Alış faturaları için: SENT'ten direkt PAID'e geçişi engelle (önce RECEIVED olmalı)
  if (invoiceType === 'PURCHASE' && current === 'SENT' && next === 'PAID') {
    return {
      valid: false,
      error: 'Alış faturaları için önce "Mal Kabul Edildi" durumuna geçmelisiniz. Ürünler teslim alınmadan ödeme yapılamaz.',
      allowed: ['RECEIVED', 'OVERDUE', 'CANCELLED'],
    }
  }

  // Hizmet faturaları için SHIPPED/RECEIVED geçişlerini engelle
  if (invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') {
    if (next === 'SHIPPED' || next === 'RECEIVED') {
      return {
        valid: false,
        error: 'Hizmet faturaları için sevkiyat/mal kabul durumları geçerli değildir. Hizmet faturaları doğrudan "Ödendi" durumuna geçebilir.',
        allowed: invoiceTransitions[current].filter(
          status => status !== 'SHIPPED' && status !== 'RECEIVED'
        ),
      }
    }
  }

  // Satış faturaları için RECEIVED geçişini engelle
  if (invoiceType === 'SALES' && next === 'RECEIVED') {
    return {
      valid: false,
      error: 'Satış faturaları için mal kabul durumu geçerli değildir. Satış faturaları için "Sevkiyat Yapıldı" durumunu kullanın.',
      allowed: invoiceTransitions[current].filter(status => status !== 'RECEIVED'),
    }
  }

  // Alış faturaları için SHIPPED geçişini engelle
  if (invoiceType === 'PURCHASE' && next === 'SHIPPED') {
    return {
      valid: false,
      error: 'Alış faturaları için sevkiyat durumu geçerli değildir. Alış faturaları için "Mal Kabul Edildi" durumunu kullanın.',
      allowed: invoiceTransitions[current].filter(status => status !== 'SHIPPED'),
    }
  }

  const allowedTransitions = invoiceTransitions[current]
  if (!allowedTransitions.includes(next)) {
    return {
      valid: false,
      error: `${current} → ${next} geçişi yapılamaz`,
      allowed: allowedTransitions,
    }
  }

  return { valid: true }
}

/**
 * Contract status geçişinin geçerli olup olmadığını kontrol eder
 */
export function isValidContractTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string; allowed?: string[] } {
  if (currentStatus === newStatus) {
    return { valid: true }
  }

  const current = currentStatus as ContractStatus
  const next = newStatus as ContractStatus

  if (!CONTRACT_STATUSES[current] || !CONTRACT_STATUSES[next]) {
    return {
      valid: false,
      error: 'Geçersiz status değeri',
    }
  }

  if (immutableContractStatuses.includes(current)) {
    return {
      valid: false,
      error: `${current} durumundaki sözleşmeler değiştirilemez`,
    }
  }

  const allowedTransitions = contractTransitions[current]
  if (!allowedTransitions.includes(next)) {
    return {
      valid: false,
      error: `${current} → ${next} geçişi yapılamaz`,
      allowed: allowedTransitions,
    }
  }

  return { valid: true }
}

// ============================================
// IMMUTABILITY & DELETE CHECKS
// ============================================

/**
 * Deal'in immutable olup olmadığını kontrol eder
 */
export function isDealImmutable(stage: string): boolean {
  return immutableDealStages.includes(stage as DealStage)
}

/**
 * Deal'in silinip silinemeyeceğini kontrol eder
 */
export function canDeleteDeal(stage: string): { canDelete: boolean; error?: string } {
  if (undeletableDealStages.includes(stage as DealStage)) {
    return {
      canDelete: false,
      error: `${stage} durumundaki fırsatlar silinemez. Sözleşme oluşturulmuştur.`,
    }
  }
  return { canDelete: true }
}

/**
 * Quote'un immutable olup olmadığını kontrol eder
 */
export function isQuoteImmutable(status: string): boolean {
  return immutableQuoteStatuses.includes(status as QuoteStatus)
}

/**
 * Quote'un silinip silinemeyeceğini kontrol eder
 */
export function canDeleteQuote(status: string): { canDelete: boolean; error?: string } {
  if (undeletableQuoteStatuses.includes(status as QuoteStatus)) {
    return {
      canDelete: false,
      error: `${status} durumundaki teklifler silinemez. Fatura oluşturulmuştur.`,
    }
  }
  return { canDelete: true }
}

/**
 * Invoice'ın immutable olup olmadığını kontrol eder
 */
export function isInvoiceImmutable(status: string): boolean {
  return immutableInvoiceStatuses.includes(status as InvoiceStatus)
}

/**
 * Invoice'ın silinip silinemeyeceğini kontrol eder
 */
export function canDeleteInvoice(status: string): { canDelete: boolean; error?: string } {
  if (undeletableInvoiceStatuses.includes(status as InvoiceStatus)) {
    return {
      canDelete: false,
      error: `${status} durumundaki faturalar silinemez. Mali kayıt oluşturulmuştur.`,
    }
  }
  return { canDelete: true }
}

/**
 * Contract'ın immutable olup olmadığını kontrol eder
 */
export function isContractImmutable(status: string): boolean {
  return immutableContractStatuses.includes(status as ContractStatus)
}

/**
 * Contract'ın silinip silinemeyeceğini kontrol eder
 */
export function canDeleteContract(status: string): { canDelete: boolean; error?: string } {
  if (undeletableContractStatuses.includes(status as ContractStatus)) {
    return {
      canDelete: false,
      error: `${status} durumundaki sözleşmeler silinemez. Fatura oluşturulmuştur.`,
    }
  }
  return { canDelete: true }
}

// ============================================
// SHIPMENT STATUS VALIDATION
// ============================================

export const SHIPMENT_STATUSES = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const

export type ShipmentStatus = keyof typeof SHIPMENT_STATUSES

const immutableShipmentStatuses: ShipmentStatus[] = ['DELIVERED', 'CANCELLED']
const undeletableShipmentStatuses: ShipmentStatus[] = ['APPROVED', 'DELIVERED', 'CANCELLED']

/**
 * Shipment'ın immutable olup olmadığını kontrol eder
 */
export function isShipmentImmutable(status: string): boolean {
  return immutableShipmentStatuses.includes(status as ShipmentStatus)
}

/**
 * Shipment'ın silinip silinemeyeceğini kontrol eder
 */
export function canDeleteShipment(status: string): { canDelete: boolean; error?: string } {
  if (undeletableShipmentStatuses.includes(status as ShipmentStatus)) {
    return {
      canDelete: false,
      error: `${status} durumundaki sevkiyatlar silinemez. Stok işlemi yapılmıştır veya teslim edilmiştir.`,
    }
  }
  return { canDelete: true }
}

// ============================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================

export function getSuggestedNextStages(currentStage: string, module: 'deal' | 'quote' | 'invoice' | 'contract'): string[] {
  switch (module) {
    case 'deal':
      return dealTransitions[currentStage as DealStage] || []
    case 'quote':
      return quoteTransitions[currentStage as QuoteStatus] || []
    case 'invoice':
      return invoiceTransitions[currentStage as InvoiceStatus] || []
    case 'contract':
      return contractTransitions[currentStage as ContractStatus] || []
    default:
      return []
  }
}

export function getTransitionErrorMessage(
  module: 'deal' | 'quote' | 'invoice' | 'contract',
  currentStage: string,
  attemptedStage: string
): string {
  const allowed = getSuggestedNextStages(currentStage, module)
  
  if (allowed.length === 0) {
    return `${currentStage} durumundaki kayıtlar değiştirilemez (immutable).`
  }
  
  return `${currentStage} → ${attemptedStage} geçişi yapılamaz. İzin verilen geçişler: ${allowed.join(', ')}`
}


