/**
 * Toast Notification Helper
 * alert() yerine kullanılacak - performans odaklı, optimistic updates destekli
 */

import { toast as sonnerToast } from 'sonner'

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
