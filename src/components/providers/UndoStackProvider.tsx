'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUndoStack, UndoAction } from '@/hooks/useUndoStack'

interface UndoStackContextType {
  push: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  clear: () => void
  canUndo: boolean
  canRedo: boolean
  stack: UndoAction[]
  currentIndex: number
}

const UndoStackContext = createContext<UndoStackContextType | null>(null)

export function useUndoStackContext() {
  const context = useContext(UndoStackContext)
  if (!context) {
    throw new Error('useUndoStackContext must be used within UndoStackProvider')
  }
  return context
}

interface UndoStackProviderProps {
  children: ReactNode
  maxSize?: number
}

export default function UndoStackProvider({
  children,
  maxSize = 10,
}: UndoStackProviderProps) {
  const undoStack = useUndoStack({ maxSize })

  return (
    <UndoStackContext.Provider value={undoStack}>
      {children}
    </UndoStackContext.Provider>
  )
}


