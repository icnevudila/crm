/**
 * Dialog hook (eğer gerekiyorsa)
 * Şu an için kullanılmıyor ama gelecekte kullanılabilir
 */

import { useState } from 'react'

export function useDialog() {
  const [open, setOpen] = useState(false)

  return {
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onToggle: () => setOpen(!open),
  }
}







