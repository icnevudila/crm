/**
 * Frontend Stage Validation Hook
 * Kanban drag-drop kurallarını yönetir
 */

import { 
  isValidDealTransition,
  isValidQuoteTransition,
  isValidInvoiceTransition,
  isValidContractTransition,
  isDealImmutable,
  isQuoteImmutable,
  isInvoiceImmutable,
  isContractImmutable,
  getSuggestedNextStages
} from '@/lib/stageValidation'

export type ModuleType = 'deal' | 'quote' | 'invoice' | 'contract'

export interface ValidationResult {
  canDrop: boolean
  error?: string
  suggestion?: string
}

function validateDealStage(currentStage: string, targetStage: string): ValidationResult {
  // Aynı stage'e sürükleme - izin ver
  if (currentStage === targetStage) {
    return { canDrop: true }
  }

  // Immutable kontrol
  if (isDealImmutable(currentStage)) {
    return {
      canDrop: false,
      error: `${currentStage} durumundaki fırsatlar taşınamaz`,
      suggestion: 'Bu fırsat artık değiştirilemez'
    }
  }

  // Transition validation
  const validation = isValidDealTransition(currentStage, targetStage)
  
  if (!validation.valid) {
    const allowed = getSuggestedNextStages(currentStage, 'deal')
    return {
      canDrop: false,
      error: validation.error,
      suggestion: allowed.length > 0 
        ? `İzin verilen: ${allowed.join(', ')}`
        : 'Bu fırsat artık değiştirilemez'
    }
  }

  return { canDrop: true }
}

/**
 * Deal stage değişimini kontrol eder
 */
export function useValidateDealStage(currentStage: string, targetStage: string): ValidationResult {
  return validateDealStage(currentStage, targetStage)
}

/**
 * Quote status değişimini kontrol eder
 */
function validateQuoteStatus(currentStatus: string, targetStatus: string): ValidationResult {
  if (currentStatus === targetStatus) {
    return { canDrop: true }
  }

  if (isQuoteImmutable(currentStatus)) {
    return {
      canDrop: false,
      error: `${currentStatus} durumundaki teklifler taşınamaz`,
      suggestion: 'Bu teklif artık değiştirilemez'
    }
  }

  const validation = isValidQuoteTransition(currentStatus, targetStatus)
  
  if (!validation.valid) {
    const allowed = getSuggestedNextStages(currentStatus, 'quote')
    return {
      canDrop: false,
      error: validation.error,
      suggestion: allowed.length > 0 
        ? `İzin verilen: ${allowed.join(', ')}`
        : 'Bu teklif artık değiştirilemez'
    }
  }

  return { canDrop: true }
}

export function useValidateQuoteStatus(currentStatus: string, targetStatus: string): ValidationResult {
  return validateQuoteStatus(currentStatus, targetStatus)
}

/**
 * Invoice status değişimini kontrol eder
 */
function validateInvoiceStatus(currentStatus: string, targetStatus: string): ValidationResult {
  if (currentStatus === targetStatus) {
    return { canDrop: true }
  }

  if (isInvoiceImmutable(currentStatus)) {
    return {
      canDrop: false,
      error: `${currentStatus} durumundaki faturalar taşınamaz`,
      suggestion: 'Bu fatura artık değiştirilemez'
    }
  }

  const validation = isValidInvoiceTransition(currentStatus, targetStatus)
  
  if (!validation.valid) {
    const allowed = getSuggestedNextStages(currentStatus, 'invoice')
    return {
      canDrop: false,
      error: validation.error,
      suggestion: allowed.length > 0 
        ? `İzin verilen: ${allowed.join(', ')}`
        : 'Bu fatura artık değiştirilemez'
    }
  }

  return { canDrop: true }
}

export function useValidateInvoiceStatus(currentStatus: string, targetStatus: string): ValidationResult {
  return validateInvoiceStatus(currentStatus, targetStatus)
}

/**
 * Contract status değişimini kontrol eder
 */
function validateContractStatus(currentStatus: string, targetStatus: string): ValidationResult {
  if (currentStatus === targetStatus) {
    return { canDrop: true }
  }

  if (isContractImmutable(currentStatus)) {
    return {
      canDrop: false,
      error: `${currentStatus} durumundaki sözleşmeler taşınamaz`,
      suggestion: 'Bu sözleşme artık değiştirilemez'
    }
  }

  const validation = isValidContractTransition(currentStatus, targetStatus)
  
  if (!validation.valid) {
    const allowed = getSuggestedNextStages(currentStatus, 'contract')
    return {
      canDrop: false,
      error: validation.error,
      suggestion: allowed.length > 0 
        ? `İzin verilen: ${allowed.join(', ')}`
        : 'Bu sözleşme artık değiştirilemez'
    }
  }

  return { canDrop: true }
}

export function useValidateContractStatus(currentStatus: string, targetStatus: string): ValidationResult {
  return validateContractStatus(currentStatus, targetStatus)
}

/**
 * Generic stage validation - tüm modüller için
 * NOT: Bu fonksiyon hook değil, normal fonksiyon. Hook'lar conditional çağrılamaz.
 */
export function validateStage(
  module: ModuleType,
  currentStage: string,
  targetStage: string
): ValidationResult {
  switch (module) {
    case 'deal':
      return validateDealStage(currentStage, targetStage)
    case 'quote':
      return validateQuoteStatus(currentStage, targetStage)
    case 'invoice':
      return validateInvoiceStatus(currentStage, targetStage)
    case 'contract':
      return validateContractStatus(currentStage, targetStage)
    default:
      return { canDrop: false, error: 'Bilinmeyen modül' }
  }
}

/**
 * Hook wrapper - tüm hook'ları her zaman çağırır, sonuçları switch ile seçer
 */
export function useStageValidation(
  module: ModuleType,
  currentStage: string,
  targetStage: string
): ValidationResult {
  // Tüm hook'ları her zaman çağır (React rules)
  const dealResult = useValidateDealStage(currentStage, targetStage)
  const quoteResult = useValidateQuoteStatus(currentStage, targetStage)
  const invoiceResult = useValidateInvoiceStatus(currentStage, targetStage)
  const contractResult = useValidateContractStatus(currentStage, targetStage)
  
  // Sonuçları switch ile seç
  switch (module) {
    case 'deal':
      return dealResult
    case 'quote':
      return quoteResult
    case 'invoice':
      return invoiceResult
    case 'contract':
      return contractResult
    default:
      return { canDrop: false, error: 'Bilinmeyen modül' }
  }
}

/**
 * Check if stage is immutable (değiştirilemez)
 */
export function useIsImmutable(module: ModuleType, stage: string): boolean {
  switch (module) {
    case 'deal':
      return isDealImmutable(stage)
    case 'quote':
      return isQuoteImmutable(stage)
    case 'invoice':
      return isInvoiceImmutable(stage)
    case 'contract':
      return isContractImmutable(stage)
    default:
      return false
  }
}

/**
 * Get allowed next stages
 */
export function useAllowedStages(module: ModuleType, currentStage: string): string[] {
  return getSuggestedNextStages(currentStage, module)
}


