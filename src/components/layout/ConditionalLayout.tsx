'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)
  const [isLoginPage, setIsLoginPage] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Pathname kontrolü
    setIsLandingPage(pathname?.includes('/landing') || false)
    setIsLoginPage(pathname?.includes('/login') || false)
  }, [pathname])

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 pt-16 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  )
}



