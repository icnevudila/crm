/**
 * Toast Notification Helper
 * alert() yerine kullanılacak - performans odaklı, optimistic updates destekli
 */

import { toast as sonnerToast } from 'sonner'
import { parseError, formatErrorWithRetry, type ErrorInfo } from './error-messages'

// Export toast objesi - doğrudan kullanım için
export const toast = sonnerToast

export interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  onDismiss?: () => void
  onAutoClose?: () => void
}

/**
 * Başarı mesajı gösterir
 */
export function toastSuccess(
  message: string,
  description?: string,
  options?: ToastOptions
) {
  return sonnerToast.success(message, {
    description,
    duration: options?.duration || 4000,
    action: options?.action,
    cancel: options?.cancel,
    onDismiss: options?.onDismiss,
    onAutoClose: options?.onAutoClose,
  })
}

/**
 * Hata mesajı gösterir
 */
export function toastError(
  message: string,
  description?: string,
  options?: ToastOptions
) {
  return sonnerToast.error(message, {
    description,
    duration: options?.duration || 5000,
    action: options?.action,
    cancel: options?.cancel,
    onDismiss: options?.onDismiss,
    onAutoClose: options?.onAutoClose,
  })
}

/**
 * Hata objesini parse eder ve kullanıcı dostu mesaj gösterir
 * Retry desteği ile
 */
export function toastErrorWithRetry(
  error: any,
  onRetry?: () => void
) {
  const errorInfo = formatErrorWithRetry(error, onRetry)
  
  return sonnerToast.error(errorInfo.title, {
    description: errorInfo.message,
    duration: 6000, // Retry için daha uzun süre
    action: errorInfo.action,
    ...(process.env.NODE_ENV === 'development' && errorInfo.code && {
      // Development modunda error code göster
      description: `${errorInfo.message}\n\n[${errorInfo.code}]`,
    }),
  })
}

/**
 * Hata objesini parse eder ve kullanıcı dostu mesaj gösterir
 */
export function toastErrorParsed(
  error: any,
  customMessage?: string
) {
  const errorInfo = parseError(error)
  
  return sonnerToast.error(
    customMessage || errorInfo.title,
    {
      description: errorInfo.message,
      duration: 5000,
      ...(process.env.NODE_ENV === 'development' && errorInfo.code && {
        // Development modunda error code göster
        description: `${errorInfo.message}\n\n[${errorInfo.code}]`,
      }),
    }
  )
}

/**
 * Uyarı mesajı gösterir
 */
export function toastWarning(
  message: string,
  description?: string,
  options?: ToastOptions
) {
  return sonnerToast.warning(message, {
    description,
    duration: options?.duration || 4000,
    action: options?.action,
    cancel: options?.cancel,
    onDismiss: options?.onDismiss,
    onAutoClose: options?.onAutoClose,
  })
}

/**
 * Bilgi mesajı gösterir
 */
export function toastInfo(
  message: string,
  description?: string,
  options?: ToastOptions
) {
  return sonnerToast.info(message, {
    description,
    duration: options?.duration || 4000,
    action: options?.action,
    cancel: options?.cancel,
    onDismiss: options?.onDismiss,
    onAutoClose: options?.onAutoClose,
  })
}

/**
 * Geri alma (Undo) özellikli toast
 * Silinen kayıtları geri almak için kullanılır
 */
export function toastWithUndo(
  message: string,
  onUndo: () => void,
  options?: Omit<ToastOptions, 'action'>
) {
  return sonnerToast.success(message, {
    duration: 6000, // Undo için daha uzun süre
    action: {
      label: 'Geri Al',
      onClick: onUndo,
    },
    ...options,
  })
}

/**
 * Promise toast - async işlemler için
 * Loading → Success/Error otomatik geçiş
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: (data) =>
      typeof messages.success === 'function'
        ? messages.success(data)
        : messages.success,
    error: (error) =>
      typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error,
  })
}

/**
 * Confirm dialog - window.confirm() yerine kullanılacak
 * Kullanıcıya onay mesajı gösterir
 */
export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const result = window.confirm(message)
    resolve(result)
  })
}

/**
 * API hatalarını handle eder ve toast gösterir
 * Hata objesini parse eder ve kullanıcı dostu mesaj gösterir
 */
export function handleApiError(error: any, customMessage?: string) {
  const errorInfo = parseError(error)
  
  return toastErrorParsed(error, customMessage)
}
