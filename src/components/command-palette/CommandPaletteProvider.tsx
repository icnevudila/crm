'use client'

import { useEffect, useState } from 'react'
import CommandPalette from './CommandPalette'

/**
 * Command Palette Provider
 * Cmd+K (Mac) veya Ctrl+K (Windows) ile açılır
 * Global keyboard shortcut handler
 */
export default function CommandPaletteProvider() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K (Mac) veya Ctrl+K (Windows/Linux) - Komut Paleti
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((open) => !open)
        return
      }
      
      // Cmd+N (Mac) veya Ctrl+N (Windows/Linux) - Komut Paleti (Quick Create için)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
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
        setOpen(true)
      }
    }

    // Custom event listener (Header butonundan açmak için)
    const handleOpenCommandPalette = () => {
      setOpen(true)
    }

    document.addEventListener('keydown', down)
    document.addEventListener('open-command-palette', handleOpenCommandPalette)
    
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('open-command-palette', handleOpenCommandPalette)
    }
  }, [])

  return <CommandPalette open={open} onOpenChange={setOpen} />
}




