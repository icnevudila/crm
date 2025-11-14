/**
 * Auto-Save Hook
 * Form'ları otomatik kaydetme için
 * Performans odaklı - debounced save
 */

import { useEffect, useRef, useCallback } from 'react'
import { toastInfo } from '@/lib/toast'

interface UseAutoSaveOptions {
  /**
   * Kaydetme fonksiyonu
   */
  onSave: (data: any) => Promise<void> | void
  
  /**
   * Kaydedilecek veri
   */
  data: any
  
  /**
   * Otomatik kaydetme aktif mi?
   */
  enabled?: boolean
  
  /**
   * Debounce süresi (ms) - varsayılan 2 saniye
   */
  debounceMs?: number
  
  /**
   * Başarı mesajı gösterilsin mi?
   */
  showToast?: boolean
  
  /**
   * Kaydetme durumu callback'i
   */
  onSavingChange?: (isSaving: boolean) => void
}

/**
 * Auto-Save Hook
 * Form değişikliklerini otomatik kaydeder
 */
export function useAutoSave({
  onSave,
  data,
  enabled = true,
  debounceMs = 2000, // 2 saniye debounce
  showToast = false,
  onSavingChange,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedDataRef = useRef<string | null>(null)
  const saveCountRef = useRef(0)

  // Veriyi string'e çevir (karşılaştırma için)
  const dataString = JSON.stringify(data)

  // Kaydetme fonksiyonu
  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return
    
    // Veri değişmemişse kaydetme
    if (dataString === lastSavedDataRef.current) return

    isSavingRef.current = true
    onSavingChange?.(true)

    try {
      await onSave(data)
      lastSavedDataRef.current = dataString
      saveCountRef.current += 1
      
      if (showToast && saveCountRef.current > 1) {
        // İlk kayıt hariç toast göster (kullanıcıyı rahatsız etmemek için)
        toastInfo('Değişiklikler kaydedildi', undefined, { duration: 2000 })
      }
    } catch (error) {
      console.error('Auto-save error:', error)
      // Hata durumunda sessizce devam et (kullanıcıyı rahatsız etme)
    } finally {
      isSavingRef.current = false
      onSavingChange?.(false)
    }
  }, [onSave, data, dataString, enabled, showToast, onSavingChange])

  // Debounced save
  useEffect(() => {
    if (!enabled) return

    // Önceki timeout'u temizle
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Yeni timeout ayarla
    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceMs)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [dataString, enabled, debounceMs, save])

  // Sayfa kapanmadan önce kaydet
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current) {
        e.preventDefault()
        e.returnValue = 'Değişiklikler kaydediliyor, lütfen bekleyin...'
        return e.returnValue
      }
      
      // Kaydedilmemiş değişiklikler varsa uyar
      if (dataString !== lastSavedDataRef.current) {
        e.preventDefault()
        e.returnValue = 'Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istediğinize emin misiniz?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dataString])

  // Manuel kaydetme fonksiyonu
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await save()
  }, [save])

  return {
    saveNow,
    isSaving: isSavingRef.current,
  }
}


