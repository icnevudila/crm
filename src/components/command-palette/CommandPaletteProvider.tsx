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
      // Cmd+K (Mac) veya Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return <CommandPalette open={open} onOpenChange={setOpen} />
}


