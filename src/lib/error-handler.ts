/**
 * Error Handler Utility
 * Database constraint error'larını user-friendly hale getirir
 */

export interface ErrorResponse {
  error: string
  message: string
  field?: string
  code?: string
}

/**
 * Database error kodlarını user-friendly mesajlara çevirir
 */
export function handleDatabaseError(error: any): ErrorResponse {
  // PostgreSQL error codes
  const errorCode = error?.code || error?.error_code
  
  switch (errorCode) {
    case '23505': // Unique constraint violation
      return {
        error: 'Bu kayıt zaten mevcut',
        message: 'Aynı bilgilere sahip bir kayıt zaten sistemde mevcut. Lütfen farklı bir değer deneyin.',
        field: extractFieldFromError(error),
        code: 'UNIQUE_CONSTRAINT_VIOLATION'
      }
    
    case '23503': // Foreign key violation
      return {
        error: 'İlişkili kayıt bulunamadı',
        message: 'Seçtiğiniz kayıt sistemde bulunamadı. Lütfen geçerli bir kayıt seçin.',
        field: extractFieldFromError(error),
        code: 'FOREIGN_KEY_VIOLATION'
      }
    
    case '23502': // Not null violation
      return {
        error: 'Zorunlu alan eksik',
        message: 'Lütfen tüm zorunlu alanları doldurun.',
        field: extractFieldFromError(error),
        code: 'NOT_NULL_VIOLATION'
      }
    
    case '23514': // Check constraint violation
      return {
        error: 'Geçersiz değer',
        message: 'Girdiğiniz değer geçerli değil. Lütfen kontrol edin.',
        field: extractFieldFromError(error),
        code: 'CHECK_CONSTRAINT_VIOLATION'
      }
    
    case '42P01': // Undefined table
      return {
        error: 'Veritabanı hatası',
        message: 'Veritabanı tablosu bulunamadı. Lütfen sistem yöneticisine başvurun.',
        code: 'UNDEFINED_TABLE'
      }
    
    case '42703': // Undefined column
      return {
        error: 'Veritabanı hatası',
        message: 'Veritabanı kolonu bulunamadı. Lütfen sistem yöneticisine başvurun.',
        field: extractFieldFromError(error),
        code: 'UNDEFINED_COLUMN'
      }
    
    default:
      // Generic error message
      const errorMessage = error?.message || error?.error || 'Bilinmeyen bir hata oluştu'
      
      // Eğer error mesajı Türkçe değilse, genel bir mesaj döndür
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        return {
          error: 'Bu kayıt zaten mevcut',
          message: 'Aynı bilgilere sahip bir kayıt zaten sistemde mevcut.',
          code: 'DUPLICATE_ERROR'
        }
      }
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        return {
          error: 'İlişkili kayıt bulunamadı',
          message: 'Seçtiğiniz kayıt sistemde bulunamadı.',
          code: 'RELATION_ERROR'
        }
      }
      
      return {
        error: 'İşlem başarısız oldu',
        message: errorMessage,
        code: 'UNKNOWN_ERROR'
      }
  }
}

/**
 * Error mesajından field adını çıkarır
 */
function extractFieldFromError(error: any): string | undefined {
  const errorMessage = error?.message || error?.error || ''
  
  // PostgreSQL error format: "Key (field_name)=(value) already exists"
  const match = errorMessage.match(/Key \(([^)]+)\)/)
  if (match) {
    return match[1]
  }
  
  // "column 'field_name' of relation 'table_name'"
  const columnMatch = errorMessage.match(/column ['"]([^'"]+)['"]/)
  if (columnMatch) {
    return columnMatch[1]
  }
  
  return undefined
}

/**
 * Validation error'larını formatlar
 */
export function handleValidationError(errors: any): ErrorResponse {
  if (Array.isArray(errors)) {
    const firstError = errors[0]
    return {
      error: 'Doğrulama hatası',
      message: firstError?.message || 'Lütfen girdiğiniz bilgileri kontrol edin.',
      field: firstError?.path?.[0] || firstError?.field,
      code: 'VALIDATION_ERROR'
    }
  }
  
  if (errors?.issues && Array.isArray(errors.issues)) {
    // Zod validation errors
    const firstIssue = errors.issues[0]
    return {
      error: 'Doğrulama hatası',
      message: firstIssue?.message || 'Lütfen girdiğiniz bilgileri kontrol edin.',
      field: firstIssue?.path?.[0],
      code: 'VALIDATION_ERROR'
    }
  }
  
  return {
    error: 'Doğrulama hatası',
    message: errors?.message || 'Lütfen girdiğiniz bilgileri kontrol edin.',
    code: 'VALIDATION_ERROR'
  }
}

/**
 * Network error'larını formatlar
 */
export function handleNetworkError(error: any): ErrorResponse {
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
    return {
      error: 'Bağlantı hatası',
      message: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.',
      code: 'NETWORK_ERROR'
    }
  }
  
  if (error?.status === 429) {
    return {
      error: 'Çok fazla istek',
      message: 'Çok fazla istek gönderdiniz. Lütfen birkaç saniye bekleyip tekrar deneyin.',
      code: 'RATE_LIMIT_ERROR'
    }
  }
  
  return {
    error: 'Bağlantı hatası',
    message: error?.message || 'Sunucuya bağlanırken bir hata oluştu. Lütfen tekrar deneyin.',
    code: 'NETWORK_ERROR'
  }
}













