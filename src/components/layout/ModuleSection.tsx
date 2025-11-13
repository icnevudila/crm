'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ModuleSectionProps {
  storageKey: string
  title: string
  description?: string
  icon: LucideIcon
  defaultOpen?: boolean
  children: (state: { isOpen: boolean }) => ReactNode
}

export default function ModuleSection({
  storageKey,
  title,
  description,
  icon: Icon,
  defaultOpen = true,
  children,
}: ModuleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'open') {
      setIsOpen(true)
    } else if (stored === 'closed') {
      setIsOpen(false)
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.setItem(storageKey, isOpen ? 'open' : 'closed')
  }, [storageKey, isOpen])

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-500">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {description ? (
              <p className="text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`${isOpen ? 'max-h-full opacity-100' : 'max-h-0 opacity-0'} overflow-hidden px-5 pb-5 transition-all duration-200`}>
        {children({ isOpen })}
      </div>
    </section>
  )
}
