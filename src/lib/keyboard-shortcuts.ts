/**
 * CRM Keyboard Shortcuts
 * Hızlı işlemler için klavye kısayolları
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export const KEYBOARD_SHORTCUTS = {
  // Global
  SEARCH: 'Ctrl+K', // Command Palette
  NEW: 'Ctrl+N', // Yeni kayıt
  SAVE: 'Ctrl+S', // Kaydet
  DELETE: 'Delete', // Sil
  ESCAPE: 'Escape', // Kapat/İptal
  
  // Navigation
  DASHBOARD: 'Ctrl+D',
  CUSTOMERS: 'Ctrl+Shift+C',
  DEALS: 'Ctrl+Shift+D',
  QUOTES: 'Ctrl+Shift+Q',
  INVOICES: 'Ctrl+Shift+I',
  TASKS: 'Ctrl+Shift+T',
  
  // List Actions
  SELECT_ALL: 'Ctrl+A',
  REFRESH: 'Ctrl+R',
  EXPORT: 'Ctrl+E',
  FILTER: 'Ctrl+F',
  
  // Form Actions
  SUBMIT: 'Enter', // Form submit (Ctrl+Enter)
  CLOSE_MODAL: 'Escape', // Modal kapat
} as const

export interface KeyboardShortcutConfig {
  onSearch?: () => void
  onNew?: () => void
  onSave?: () => void
  onDelete?: () => void
  onEscape?: () => void
  onDashboard?: () => void
  onCustomers?: () => void
  onDeals?: () => void
  onQuotes?: () => void
  onInvoices?: () => void
  onTasks?: () => void
  onRefresh?: () => void
  onExport?: () => void
  onFilter?: () => void
}

/**
 * Global keyboard shortcuts hook
 */
export function useKeyboardShortcuts(config: KeyboardShortcutConfig = {}) {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey
      
      // Ctrl+K: Command Palette / Search
      if (ctrlKey && e.key === 'k') {
        e.preventDefault()
        config.onSearch?.()
        return
      }
      
      // Ctrl+N: Yeni kayıt
      if (ctrlKey && e.key === 'n') {
        e.preventDefault()
        config.onNew?.()
        return
      }
      
      // Ctrl+S: Kaydet
      if (ctrlKey && e.key === 's') {
        e.preventDefault()
        config.onSave?.()
        return
      }
      
      // Ctrl+D: Dashboard
      if (ctrlKey && e.key === 'd') {
        e.preventDefault()
        config.onDashboard?.() || router.push(`/${locale}/dashboard`)
        return
      }
      
      // Ctrl+Shift+C: Customers
      if (ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        config.onCustomers?.() || router.push(`/${locale}/customers`)
        return
      }
      
      // Ctrl+Shift+D: Deals
      if (ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        config.onDeals?.() || router.push(`/${locale}/deals`)
        return
      }
      
      // Ctrl+Shift+Q: Quotes
      if (ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault()
        config.onQuotes?.() || router.push(`/${locale}/quotes`)
        return
      }
      
      // Ctrl+Shift+I: Invoices
      if (ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        config.onInvoices?.() || router.push(`/${locale}/invoices`)
        return
      }
      
      // Ctrl+Shift+T: Tasks
      if (ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        config.onTasks?.() || router.push(`/${locale}/tasks`)
        return
      }
      
      // Ctrl+R: Refresh
      if (ctrlKey && e.key === 'r') {
        e.preventDefault()
        config.onRefresh?.() || window.location.reload()
        return
      }
      
      // Escape: Close modal / Cancel
      if (e.key === 'Escape') {
        config.onEscape?.()
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [config, router, locale])
}

/**
 * Keyboard shortcut indicator component için helper
 */
export function formatShortcut(shortcut: string): string {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return shortcut
    .replace('Ctrl', isMac ? '⌘' : 'Ctrl')
    .replace('Shift', isMac ? '⇧' : 'Shift')
    .replace('Alt', isMac ? '⌥' : 'Alt')
}



