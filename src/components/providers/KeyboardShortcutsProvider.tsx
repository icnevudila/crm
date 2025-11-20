'use client'

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

/**
 * Keyboard shortcuts provider
 * Global keyboard shortcuts'ları aktif eder
 */
export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts()
  return <>{children}</>
}

