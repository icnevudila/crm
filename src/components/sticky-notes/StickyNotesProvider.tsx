'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Lazy load StickyNotesContainer - performans için
const StickyNotesContainer = dynamic(
  () => import('./StickyNotesContainer'),
  {
    ssr: false, // Client-side only
    loading: () => null, // Loading state yok (görünmez)
  }
)

/**
 * Sticky Notes Provider
 * Hızlı notlar için provider - lazy loading ile
 */
export default function StickyNotesProvider() {
  const [mounted, setMounted] = useState(false)

  // Client-side mount kontrolü (SSR hatası önlemek için)
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR sırasında render etme
  if (!mounted) {
    return null
  }

  // Sadece dashboard ve liste sayfalarında göster (landing/login'de değil)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const isLandingOrLogin = pathname.includes('/landing') || pathname.includes('/login')

  if (isLandingOrLogin) {
    return null
  }

  return <StickyNotesContainer visible={true} />
}


