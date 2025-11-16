'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import KeyboardShortcuts from '@/components/keyboard/KeyboardShortcuts'
import SmartNotificationProvider from '@/components/notifications/SmartNotificationProvider'
import StickyNotesProvider from '@/components/sticky-notes/StickyNotesProvider'
import CommandPaletteProvider from '@/components/command-palette/CommandPaletteProvider'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)
  const [isLoginPage, setIsLoginPage] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Pathname kontrolü
    setIsLandingPage(pathname?.includes('/landing') || false)
    setIsLoginPage(pathname?.includes('/login') || false)
  }, [pathname])

  // Mobilde sidebar açıkken body scroll'unu engelle
  useEffect(() => {
    if (!mounted) return
    
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen, mounted])

  // Sidebar'ı kapatma fonksiyonunu memoize et
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  // Sidebar'ı açma/kapatma fonksiyonunu memoize et
  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // SSR sırasında veya mount olmadan önce - landing/login varsayımı (güvenli taraf)
  if (!mounted) {
    // SSR sırasında pathname kontrolü yapamayız, bu yüzden varsayılan olarak landing/login gibi davran
    // Client-side mount olduğunda düzelir
    return <div className="min-h-screen w-full">{children}</div>
  }

  // Landing veya Login sayfası - sidebar ve navbar YOK
  if (isLandingPage || isLoginPage) {
    return <div className="min-h-screen w-full">{children}</div>
  }

  // Diğer sayfalar - sidebar, navbar ve footer VAR
  return (
    <>
      <KeyboardShortcuts />
      <CommandPaletteProvider />
      <SmartNotificationProvider />
      <StickyNotesProvider />
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Desktop Sidebar - lg ve üzeri ekranlarda görünür */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay - lg altı ekranlarda */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={handleCloseSidebar}
              />
              {/* Sidebar */}
              <motion.div
                initial={{ x: -256 }}
                animate={{ x: 0 }}
                exit={{ x: -256 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 z-50 h-screen w-64 lg:hidden"
              >
                <Sidebar onClose={handleCloseSidebar} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 pt-16 flex flex-col overflow-hidden">
          <Header onMenuClick={handleToggleSidebar} />
          <main className="flex-1 overflow-y-auto flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut',
                }}
                className="flex-1"
              >
                {children}
              </motion.div>
            </AnimatePresence>
            <Footer />
          </main>
        </div>
      </div>
    </>
  )
}



