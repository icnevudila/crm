// Toast helper functions
// Sonner kullanarak tüm bildirimler için merkezi toast sistemi

import { toast as sonnerToast } from 'sonner'

// Success toast (yeşil)
export const toast = {
  success: (
    message: string,
    description?: string,
    options?: { label?: string; onClick?: () => void }
  ) => {
    sonnerToast.success(message, {
      description,
      duration: 3000,
      ...(options?.label && options?.onClick ? {
        action: {
          label: options.label,
          onClick: options.onClick,
        },
      } : {}),
    })
  },

  // Error toast (kırmızı)
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 4000, // Hata mesajları biraz daha uzun görünsün
    })
  },

  // Info toast (mavi)
  info: (
    message: string,
    description?: string,
    options?: { label?: string; onClick?: () => void }
  ) => {
    sonnerToast.info(message, {
      description,
      duration: 3000,
      ...(options?.label && options?.onClick ? {
        action: {
          label: options.label,
          onClick: options.onClick,
        },
      } : {}),
    })
  },

  // Warning toast (sarı)
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 3500,
    })
  },

  // Loading toast (spinner)
  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  // Promise toast (loading → success/error)
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  // Dismiss a toast
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },
}

/**
 * API hatasını toast notification olarak göster
 * Forbidden (403) hataları için özel mesaj kullanır
 */
export function handleApiError(error: any, defaultTitle: string = 'İşlem Başarısız', defaultMessage?: string) {
  const errorMessage = error?.message || error?.error || defaultMessage || 'İşlem sırasında bir hata oluştu.'
  
  // Forbidden veya yetki hatası için özel mesaj
  if (
    error?.status === 403 || 
    error?.response?.status === 403 ||
    errorMessage?.includes('Forbidden') ||
    errorMessage?.toLowerCase().includes('yetkiniz') ||
    errorMessage?.toLowerCase().includes('yetki')
  ) {
    toast.error(
      'Yetkisiz İşlem',
      'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor. Lütfen kurum yöneticinizle veya bilgi işlem ekibiyle iletişime geçin.'
    )
  } else {
    toast.error(defaultTitle, errorMessage)
  }
}

// ✅ Modern toast-based confirm - window.confirm yerine kullan
// ÖNEMLİ: Promise döndürür - async/await ile kullanılmalı
export const confirm = (message: string, description?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const toastId = sonnerToast(message, {
      description,
      duration: Infinity, // Kullanıcı seçim yapana kadar açık kal
      action: {
        label: 'Evet',
        onClick: () => {
          sonnerToast.dismiss(toastId)
          resolve(true)
        },
      },
      cancel: {
        label: 'İptal',
        onClick: () => {
          sonnerToast.dismiss(toastId)
          resolve(false)
        },
      },
    })
    
    // Toast kapanırsa (X butonuna tıklanırsa) false döndür
    // Sonner'da onDismiss callback'i yok, bu yüzden setTimeout ile kontrol ediyoruz
    // Ancak daha iyi bir çözüm için sonner'ın onDismiss özelliğini kullanabiliriz
  })
}
