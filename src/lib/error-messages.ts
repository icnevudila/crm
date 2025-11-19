/**
 * Kullanıcı Dostu Hata Mesajları
 * API hatalarını kullanıcı dostu Türkçe mesajlara çevirir
 */

export interface ErrorInfo {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  code?: string
}

/**
 * Hata kodlarına göre kullanıcı dostu mesajlar
 */
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  // Network hataları
  'NETWORK_ERROR': {
    title: 'Bağlantı Hatası',
    message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
  },
  'TIMEOUT': {
    title: 'Zaman Aşımı',
    message: 'İstek çok uzun sürdü. Lütfen tekrar deneyin.',
  },
  
  // HTTP hataları
  '401': {
    title: 'Yetkisiz Erişim',
    message: 'Bu işlem için yetkiniz bulunmamaktadır. Lütfen giriş yapın.',
  },
  '403': {
    title: 'Erişim Reddedildi',
    message: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.',
  },
  '404': {
    title: 'Bulunamadı',
    message: 'Aradığınız kayıt bulunamadı. Lütfen sayfayı yenileyin.',
  },
  '409': {
    title: 'Çakışma',
    message: 'Bu işlem başka bir kullanıcı tarafından yapılmış olabilir. Lütfen sayfayı yenileyin.',
  },
  '422': {
    title: 'Geçersiz Veri',
    message: 'Girdiğiniz bilgiler geçersiz. Lütfen kontrol edip tekrar deneyin.',
  },
  '429': {
    title: 'Çok Fazla İstek',
    message: 'Çok fazla istek gönderdiniz. Lütfen birkaç saniye bekleyip tekrar deneyin.',
  },
  '500': {
    title: 'Sunucu Hatası',
    message: 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
  },
  '503': {
    title: 'Servis Kullanılamıyor',
    message: 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
  },
  
  // Supabase hataları
  'PGRST116': {
    title: 'Kayıt Bulunamadı',
    message: 'Aradığınız kayıt bulunamadı. Lütfen sayfayı yenileyin.',
  },
  'PGRST204': {
    title: 'Tablo Bulunamadı',
    message: 'Veritabanı tablosu bulunamadı. Lütfen yöneticiye bildirin.',
  },
  '42501': {
    title: 'Yetki Hatası',
    message: 'Bu işlem için yetkiniz bulunmamaktadır.',
  },
  '42P01': {
    title: 'Tablo Bulunamadı',
    message: 'Veritabanı tablosu bulunamadı. Lütfen yöneticiye bildirin.',
  },
  
  // Genel hatalar
  'VALIDATION_ERROR': {
    title: 'Doğrulama Hatası',
    message: 'Lütfen tüm zorunlu alanları doldurun ve geçerli bilgiler girin.',
  },
  'UNAUTHORIZED': {
    title: 'Yetkisiz Erişim',
    message: 'Bu işlem için yetkiniz bulunmamaktadır. Lütfen giriş yapın.',
  },
  'FORBIDDEN': {
    title: 'Erişim Reddedildi',
    message: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır.',
  },
  'NOT_FOUND': {
    title: 'Bulunamadı',
    message: 'Aradığınız kayıt bulunamadı. Lütfen sayfayı yenileyin.',
  },
  'DUPLICATE': {
    title: 'Yinelenen Kayıt',
    message: 'Bu kayıt zaten mevcut. Lütfen farklı bir değer girin.',
  },
  'RELATION_ERROR': {
    title: 'İlişki Hatası',
    message: 'Bu kayıt başka kayıtlarla ilişkili olduğu için silinemez.',
  },
  
  // Database constraint errors
  'UNIQUE_CONSTRAINT': {
    title: 'Yinelenen Kayıt',
    message: 'Bu kayıt zaten mevcut. Lütfen farklı bir değer girin.',
  },
  'FOREIGN_KEY_CONSTRAINT': {
    title: 'İlişkili Kayıt Bulunamadı',
    message: 'Seçilen kayıt bulunamadı veya silinmiş. Lütfen sayfayı yenileyin.',
  },
  'NOT_NULL_CONSTRAINT': {
    title: 'Zorunlu Alan Eksik',
    message: 'Lütfen tüm zorunlu alanları doldurun.',
  },
  'CHECK_CONSTRAINT': {
    title: 'Geçersiz Değer',
    message: 'Girilen değer geçersiz. Lütfen kontrol edip tekrar deneyin.',
  },
}

/**
 * Hata mesajını parse eder ve kullanıcı dostu mesaja çevirir
 */
export function parseError(error: any): ErrorInfo {
  // Error objesi değilse string'e çevir
  const errorMessage = typeof error === 'string' 
    ? error 
    : error?.message || error?.error || 'Bilinmeyen bir hata oluştu'
  
  const errorCode = error?.code || error?.status?.toString()
  
  // HTTP status koduna göre mesaj bul
  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return {
      ...ERROR_MESSAGES[errorCode],
      code: errorCode,
    }
  }
  
  // Hata mesajına göre mesaj bul
  const errorMessageLower = errorMessage.toLowerCase()
  
  if (errorMessageLower.includes('network') || errorMessageLower.includes('fetch')) {
    return {
      ...ERROR_MESSAGES['NETWORK_ERROR'],
      code: 'NETWORK_ERROR',
    }
  }
  
  if (errorMessageLower.includes('timeout')) {
    return {
      ...ERROR_MESSAGES['TIMEOUT'],
      code: 'TIMEOUT',
    }
  }
  
  if (errorMessageLower.includes('unauthorized') || errorMessageLower.includes('yetkisiz')) {
    return {
      ...ERROR_MESSAGES['UNAUTHORIZED'],
      code: 'UNAUTHORIZED',
    }
  }
  
  if (errorMessageLower.includes('forbidden') || errorMessageLower.includes('erişim reddedildi')) {
    return {
      ...ERROR_MESSAGES['FORBIDDEN'],
      code: 'FORBIDDEN',
    }
  }
  
  if (errorMessageLower.includes('not found') || errorMessageLower.includes('bulunamadı')) {
    return {
      ...ERROR_MESSAGES['NOT_FOUND'],
      code: 'NOT_FOUND',
    }
  }
  
  if (errorMessageLower.includes('duplicate') || errorMessageLower.includes('yinelenen')) {
    return {
      ...ERROR_MESSAGES['DUPLICATE'],
      code: 'DUPLICATE',
    }
  }
  
  if (errorMessageLower.includes('relation') || errorMessageLower.includes('ilişki')) {
    return {
      ...ERROR_MESSAGES['RELATION_ERROR'],
      code: 'RELATION_ERROR',
    }
  }
  
  if (errorMessageLower.includes('validation') || errorMessageLower.includes('doğrulama')) {
    return {
      ...ERROR_MESSAGES['VALIDATION_ERROR'],
      code: 'VALIDATION_ERROR',
    }
  }
  
  // Varsayılan mesaj
  return {
    title: 'Bir Hata Oluştu',
    message: errorMessage,
    code: errorCode || 'UNKNOWN',
  }
}

/**
 * Retry action'ı oluşturur
 */
export function createRetryAction(onRetry: () => void): { label: string; onClick: () => void } {
  return {
    label: 'Tekrar Dene',
    onClick: onRetry,
  }
}

/**
 * Hata mesajını kullanıcı dostu formata çevirir (retry desteği ile)
 */
export function formatErrorWithRetry(
  error: any,
  onRetry?: () => void
): ErrorInfo {
  const errorInfo = parseError(error)
  
  if (onRetry) {
    return {
      ...errorInfo,
      action: createRetryAction(onRetry),
    }
  }
  
  return errorInfo
}



