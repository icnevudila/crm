'use client'

import { useState, useEffect, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ModuleSectionProps {
  storageKey: string
  title: string
  description?: string
  icon?: LucideIcon
  defaultOpen?: boolean
  children: (props: { isOpen: boolean }) => ReactNode
}

export default function ModuleSection({
  storageKey,
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  children,
}: ModuleSectionProps) {
  // ✅ ÇÖZÜM: Hydration hatasını önlemek için initial state'i her zaman defaultOpen yap
  // Server ve client ilk render'da aynı HTML'i üretmeli
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isMounted, setIsMounted] = useState(false)

  // Client-side mount olduktan sonra localStorage'dan oku
  // ✅ ÇÖZÜM: localStorage'da değer yoksa defaultOpen kullan (kullanıcı hiç kapatmadıysa açık gelsin)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        // localStorage'da değer varsa onu kullan (kullanıcı daha önce açıp kapattıysa)
        setIsOpen(stored === 'true')
      } else {
        // localStorage'da değer yoksa defaultOpen kullan (ilk açılışta varsayılan durum)
        setIsOpen(defaultOpen)
      }
    }
  }, [storageKey, defaultOpen])

  // LocalStorage'a kaydet (sadece client-side'da)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(isOpen))
    }
  }, [storageKey, isOpen, isMounted])

  // ✅ ÇÖZÜM: isOpen prop'unu her zaman doğru geçir - mounted olmasa bile
  // ÖNEMLİ: children her zaman render edilmeli, sadece Accordion state'i değişmeli
  const currentIsOpen = isMounted ? isOpen : defaultOpen

  return (
    <Accordion 
      type="single" 
      collapsible 
      value={currentIsOpen ? 'open' : undefined}
      onValueChange={(value) => setIsOpen(value === 'open')}
      suppressHydrationWarning
    >
      <AccordionItem value="open" className="border-none">
        <AccordionTrigger className="hover:no-underline py-4" suppressHydrationWarning>
          <div className="flex items-center gap-3 flex-1">
            {Icon && <Icon className="h-5 w-5 text-indigo-600" />}
            <div className="flex-1 text-left">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4" suppressHydrationWarning>
          {children({ isOpen: currentIsOpen })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
