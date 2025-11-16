/**
 * Error Handling Helper Functions
 * Database constraint errors ve validation errors için user-friendly mesajlar
 */

import { NextResponse } from 'next/server'

/**
 * Database constraint error kodlarını user-friendly mesajlara çevir
 */
export function handleDatabaseError(error: any): {
  error: string
  field?: string
  code: string
  status: number
} {
  // PostgreSQL error codes
  const errorCode = error?.code || error?.errno || error?.sqlState

  switch (errorCode) {
    case '23505': // Unique constraint violation
      const field = extractFieldFromError(error)
      return {
        error: field
          ? `${field} alanı için bu değer zaten kullanılıyor`
          : 'Bu kayıt zaten mevcut',
        field: field || undefined,
        code: 'UNIQUE_CONSTRAINT',
        status: 409,
      }

    case '23503': // Foreign key violation
      const foreignField = extractFieldFromError(error)
      return {
        error: foreignField
          ? `Seçilen ${foreignField} kaydı bulunamadı veya silinmiş`
          : 'İlişkili kayıt bulunamadı',
        field: foreignField || undefined,
        code: 'FOREIGN_KEY_CONSTRAINT',
        status: 400,
      }

    case '23502': // Not null violation
      const nullField = extractFieldFromError(error)
      return {
        error: nullField
          ? `${nullField} alanı zorunludur`
          : 'Zorunlu alanlar eksik',
        field: nullField || undefined,
        code: 'NOT_NULL_CONSTRAINT',
        status: 400,
      }

    case '23514': // Check constraint violation
      return {
        error: 'Girilen değer geçersiz',
        code: 'CHECK_CONSTRAINT',
        status: 400,
      }

    case '42P01': // Undefined table
      return {
        error: 'Veritabanı hatası: Tablo bulunamadı',
        code: 'UNDEFINED_TABLE',
        status: 500,
      }

    case '42703': // Undefined column
      const column = extractFieldFromError(error)
      return {
        error: column
          ? `Veritabanı hatası: ${column} kolonu bulunamadı`
          : 'Veritabanı hatası: Kolon bulunamadı',
        field: column || undefined,
        code: 'UNDEFINED_COLUMN',
        status: 500,
      }

    default:
      // Generic error message
      return {
        error: error?.message || 'Veritabanı hatası oluştu',
        code: 'DATABASE_ERROR',
        status: 500,
      }
  }
}

/**
 * Error mesajından field adını çıkart
 */
function extractFieldFromError(error: any): string | null {
  const errorMessage = error?.message || error?.detail || ''
  
  // PostgreSQL error format: "Key (field_name)=(value) already exists."
  // veya "Key (field_name)=(value) violates foreign key constraint"
  const keyMatch = errorMessage.match(/Key \(([^)]+)\)/)
  if (keyMatch) {
    return keyMatch[1]
  }

  // "column \"field_name\" of relation \"table_name\" violates not-null constraint"
  const columnMatch = errorMessage.match(/column "([^"]+)"/)
  if (columnMatch) {
    return columnMatch[1]
  }

  // "relation \"table_name\" does not exist"
  const relationMatch = errorMessage.match(/relation "([^"]+)"/)
  if (relationMatch) {
    return relationMatch[1]
  }

  return null
}

/**
 * Validation error'larını user-friendly hale getir
 */
export function handleValidationError(error: any): {
  error: string
  field?: string
  code: string
  status: number
  details?: any[]
} {
  // Zod validation error
  if (error?.issues && Array.isArray(error.issues)) {
    const firstIssue = error.issues[0]
    const field = firstIssue?.path?.join('.') || undefined
    
    return {
      error: firstIssue?.message || 'Doğrulama hatası',
      field,
      code: 'VALIDATION_ERROR',
      status: 400,
      details: error.issues.map((issue: any) => ({
        field: issue.path?.join('.'),
        message: issue.message,
      })),
    }
  }

  // Generic validation error
  return {
    error: error?.message || 'Doğrulama hatası',
    code: 'VALIDATION_ERROR',
    status: 400,
  }
}

/**
 * Network error'ları için retry mekanizması (exponential backoff)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      // Network error veya timeout error ise retry yap
      const isNetworkError =
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network')

      if (!isNetworkError || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Unified error response helper
 */
export function createErrorResponse(error: any): NextResponse {
  // Database constraint error
  if (error?.code && ['23505', '23503', '23502', '23514', '42P01', '42703'].includes(error.code)) {
    const dbError = handleDatabaseError(error)
    return NextResponse.json(
      {
        error: dbError.error,
        field: dbError.field,
        code: dbError.code,
      },
      { status: dbError.status }
    )
  }

  // Validation error (Zod)
  if (error?.issues || error?.name === 'ZodError') {
    const validationError = handleValidationError(error)
    return NextResponse.json(
      {
        error: validationError.error,
        field: validationError.field,
        code: validationError.code,
        details: validationError.details,
      },
      { status: validationError.status }
    )
  }

  // Generic error
  return NextResponse.json(
    {
      error: error?.message || 'Bir hata oluştu',
      code: 'UNKNOWN_ERROR',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error?.stack,
        details: error,
      }),
    },
    { status: error?.status || 500 }
  )
}





