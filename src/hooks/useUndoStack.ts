/**
 * Undo Stack Hook
 * Global geri alma sistemi için
 * Performans odaklı - son 10 işlemi saklar
 */

import { useState, useCallback, useRef, useEffect } from 'react'

interface UndoAction {
  id: string
  type: string
  description: string
  undo: () => Promise<void> | void
  redo?: () => Promise<void> | void
  timestamp: number
}

interface UseUndoStackOptions {
  /**
   * Maksimum işlem sayısı (varsayılan: 10)
   */
  maxSize?: number
}

/**
 * Undo Stack Hook
 * İşlemleri geri alma için yığın oluşturur
 */
export function useUndoStack(options: UseUndoStackOptions = {}) {
  const { maxSize = 10 } = options
  const [stack, setStack] = useState<UndoAction[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const stackRef = useRef<UndoAction[]>([])
  const indexRef = useRef(-1)

  // Stack'i güncelle
  useEffect(() => {
    stackRef.current = stack
    indexRef.current = currentIndex
  }, [stack, currentIndex])

  /**
   * Yeni işlem ekle
   */
  const push = useCallback(
    (action: Omit<UndoAction, 'id' | 'timestamp'>) => {
      const newAction: UndoAction = {
        ...action,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      }

      setStack((prev) => {
        // Mevcut index'ten sonraki işlemleri sil (yeni işlem yapıldığında)
        const newStack = prev.slice(0, indexRef.current + 1)
        
        // Yeni işlemi ekle
        const updated = [...newStack, newAction]
        
        // Maksimum boyutu kontrol et
        if (updated.length > maxSize) {
          return updated.slice(-maxSize)
        }
        
        return updated
      })

      setCurrentIndex((prev) => {
        const newIndex = Math.min(prev + 1, maxSize - 1)
        return newIndex
      })
    },
    [maxSize]
  )

  /**
   * Geri al (Undo)
   */
  const undo = useCallback(async () => {
    if (currentIndex < 0) return false

    const action = stack[currentIndex]
    if (!action) return false

    try {
      await action.undo()
      setCurrentIndex((prev) => prev - 1)
      return true
    } catch (error) {
      console.error('Undo error:', error)
      return false
    }
  }, [stack, currentIndex])

  /**
   * İleri al (Redo)
   */
  const redo = useCallback(async () => {
    if (currentIndex >= stack.length - 1) return false

    const action = stack[currentIndex + 1]
    if (!action || !action.redo) return false

    try {
      await action.redo()
      setCurrentIndex((prev) => prev + 1)
      return true
    } catch (error) {
      console.error('Redo error:', error)
      return false
    }
  }, [stack, currentIndex])

  /**
   * Stack'i temizle
   */
  const clear = useCallback(() => {
    setStack([])
    setCurrentIndex(-1)
  }, [])

  /**
   * Undo yapılabilir mi?
   */
  const canUndo = currentIndex >= 0

  /**
   * Redo yapılabilir mi?
   */
  const canRedo = currentIndex < stack.length - 1

  return {
    push,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    stack,
    currentIndex,
  }
}

/**
 * Global Undo Stack Provider
 * Tüm uygulama için tek bir undo stack
 */
let globalUndoStack: ReturnType<typeof useUndoStack> | null = null

export function getGlobalUndoStack() {
  if (!globalUndoStack) {
    // Bu hook sadece component içinde kullanılabilir
    // Global stack için ayrı bir implementasyon gerekir
    throw new Error('Global undo stack not initialized. Use UndoStackProvider.')
  }
  return globalUndoStack
}






