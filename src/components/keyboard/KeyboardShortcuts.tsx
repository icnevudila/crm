'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { toastInfo } from '@/lib/toast'

// UndoStackContext'i optional olarak kullan
// Provider içinde olduğu için direkt kullanabiliriz
let useUndoStackContext: () => any = () => null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require('@/components/providers/UndoStackProvider')
  useUndoStackContext = module.useUndoStackContext
} catch (e) {
  // Provider yoksa sessizce devam et
}

interface KeyboardShortcutsProps {
  /**
   * Kısayollar aktif mi?
   */
  enabled?: boolean
}

/**
 * Global Keyboard Shortcuts Handler
 * Tüm uygulama için klavye kısayolları
 */
export default function KeyboardShortcuts({
  enabled = true,
}: KeyboardShortcutsProps) {
  const router = useRouter()
  const locale = useLocale()
  
  // Undo stack'i optional olarak kullan
  let undoStack: any = null
  try {
    undoStack = useUndoStackContext()
  } catch (e) {
    // Provider yoksa devam et
  }
  
  const { undo, redo, canUndo, canRedo } = undoStack || {
    undo: async () => false,
    redo: async () => false,
    canUndo: false,
    canRedo: false,
  }

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ctrl veya Cmd tuşu basılı mı?
      const isModifier = e.ctrlKey || e.metaKey
      const isShift = e.shiftKey

      // Ctrl+Z veya Cmd+Z - Undo
      if (isModifier && e.key === 'z' && !isShift && undoStack) {
        e.preventDefault()
        if (canUndo) {
          const success = await undo()
          if (success) {
            toastInfo('Geri alındı', undefined, { duration: 2000 })
          }
        }
        return
      }

      // Ctrl+Shift+Z veya Cmd+Shift+Z - Redo
      if (isModifier && isShift && e.key === 'z' && undoStack) {
        e.preventDefault()
        if (canRedo) {
          const success = await redo()
          if (success) {
            toastInfo('İleri alındı', undefined, { duration: 2000 })
          }
        }
        return
      }

      // Ctrl+Y veya Cmd+Y - Redo (alternatif)
      if (isModifier && e.key === 'y' && undoStack) {
        e.preventDefault()
        if (canRedo) {
          const success = await redo()
          if (success) {
            toastInfo('İleri alındı', undefined, { duration: 2000 })
          }
        }
        return
      }

      // Ctrl+N veya Cmd+N - Command Palette'i aç (Quick Create için)
      if (isModifier && e.key === 'n') {
        // Input, textarea veya contenteditable içinde değilse
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }
        e.preventDefault()
        // Command Palette'i açmak için custom event gönder
        document.dispatchEvent(new CustomEvent('open-command-palette'))
        return
      }

      // S - Kaydet (sadece form sayfalarında)
      if (e.key === 's' && isModifier && !isShift) {
        // Input, textarea veya contenteditable içinde değilse
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }

        e.preventDefault()
        
        // Form submit butonunu bul ve tıkla
        const submitButton = document.querySelector(
          'button[type="submit"], form button:not([type="button"])'
        ) as HTMLButtonElement
        
        if (submitButton && !submitButton.disabled) {
          submitButton.click()
        } else {
          toastInfo('Kaydet butonu bulunamadı', undefined, { duration: 2000 })
        }
        return
      }

      // ? - Kısayolları göster
      if (e.key === '?' && !isModifier && !isShift) {
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }

        e.preventDefault()
        // Kısayollar modal'ını aç (gelecekte eklenecek)
        toastInfo(
          'Klavye Kısayolları',
          'Ctrl+Z: Geri Al | Ctrl+Shift+Z: İleri Al | Ctrl+S: Kaydet | N: Yeni Kayıt | Cmd+K: Komut Paleti',
          { duration: 5000 }
        )
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, router, locale, undo, redo, canUndo, canRedo, undoStack])

  return null
}

