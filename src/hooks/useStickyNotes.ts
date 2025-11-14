/**
 * Sticky Notes Hook
 * Hızlı notlar için - localStorage ile hafif saklama
 * Performans odaklı - minimal re-render
 * Multi-tenant desteği - companyId ile izolasyon
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from './useSession'

export interface StickyNote {
  id: string
  content: string
  color: 'yellow' | 'blue' | 'green' | 'red' | 'purple'
  position: { x: number; y: number }
  relatedTo?: string // 'Customer', 'Deal', 'Quote', etc.
  relatedId?: string
  createdAt: number
  updatedAt: number
  minimized?: boolean // Not minimize edilmiş mi?
}

interface UseStickyNotesOptions {
  /**
   * İlgili entity (opsiyonel)
   */
  relatedTo?: string
  relatedId?: string
  
  /**
   * Maksimum not sayısı (performans için)
   */
  maxNotes?: number
}

/**
 * Sticky Notes Hook
 * localStorage ile hafif saklama
 */
export function useStickyNotes({
  relatedTo,
  relatedId,
  maxNotes = 50, // Performans için maksimum 50 not
}: UseStickyNotesOptions = {}) {
  const { data: session } = useSession()
  const companyId = session?.user?.companyId || 'default'
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Multi-tenant desteği - her şirket için ayrı localStorage key
  const storageKey = `crm_sticky_notes_${companyId}`
  const notesRef = useRef<StickyNote[]>([])

  // localStorage'dan yükle (sadece client-side)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as StickyNote[]
        
        // İlgili entity'ye göre filtrele
        let filtered = parsed
        if (relatedTo && relatedId) {
          filtered = parsed.filter(
            (note) =>
              note.relatedTo === relatedTo && note.relatedId === relatedId
          )
        } else if (relatedTo) {
          filtered = parsed.filter((note) => note.relatedTo === relatedTo)
        }
        
        // Maksimum sayıyı kontrol et
        const limited = filtered.slice(0, maxNotes)
        
        setNotes(limited)
        notesRef.current = limited
      }
    } catch (e) {
      console.error('Failed to load sticky notes:', e)
    } finally {
      setIsLoading(false)
    }
  }, [relatedTo, relatedId, maxNotes, storageKey, companyId])

  // localStorage'a kaydet (debounced - performans için)
  const saveToStorage = useCallback(
    (notesToSave: StickyNote[]) => {
      if (typeof window === 'undefined') return

      try {
        // Tüm notları al (sadece ilgili olanları değil)
        const allStored = localStorage.getItem(storageKey)
        let allNotes: StickyNote[] = []
        
        if (allStored) {
          allNotes = JSON.parse(allStored)
        }

        // İlgili notları güncelle veya ekle
        if (relatedTo && relatedId) {
          // İlgili notları kaldır
          allNotes = allNotes.filter(
            (note) =>
              !(note.relatedTo === relatedTo && note.relatedId === relatedId)
          )
          // Yeni notları ekle
          allNotes = [...allNotes, ...notesToSave]
        } else {
          // İlgili olmayan notları güncelle
          allNotes = allNotes.filter(
            (note) => !(note.relatedTo === relatedTo && !note.relatedId)
          )
          allNotes = [...allNotes, ...notesToSave]
        }

        // Maksimum sayıyı kontrol et (en yeni notları tut)
        const sorted = allNotes.sort((a, b) => b.updatedAt - a.updatedAt)
        const limited = sorted.slice(0, maxNotes * 2) // Global max (her entity için değil)

        localStorage.setItem(storageKey, JSON.stringify(limited))
      } catch (e) {
        console.error('Failed to save sticky notes:', e)
      }
    },
    [relatedTo, relatedId, maxNotes, storageKey, companyId]
  )

  // Not ekle
  const addNote = useCallback(
    (content: string, color: StickyNote['color'] = 'yellow', position?: { x: number; y: number }) => {
      const newNote: StickyNote = {
        id: `${Date.now()}-${Math.random()}`,
        content,
        color,
        position: position || { x: 100, y: 100 },
        relatedTo,
        relatedId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      setNotes((prev) => {
        const updated = [...prev, newNote].slice(0, maxNotes)
        notesRef.current = updated
        // Debounced save (performans için)
        setTimeout(() => saveToStorage(updated), 300)
        return updated
      })

      return newNote.id
    },
    [relatedTo, relatedId, maxNotes, saveToStorage]
  )

  // Not güncelle
  const updateNote = useCallback(
    (id: string, updates: Partial<Pick<StickyNote, 'content' | 'color' | 'position' | 'minimized'>>) => {
      setNotes((prev) => {
        const updated = prev.map((note) =>
          note.id === id
            ? { ...note, ...updates, updatedAt: Date.now() }
            : note
        )
        notesRef.current = updated
        // Debounced save
        setTimeout(() => saveToStorage(updated), 300)
        return updated
      })
    },
    [saveToStorage]
  )

  // Not sil
  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const updated = prev.filter((note) => note.id !== id)
        notesRef.current = updated
        // Debounced save
        setTimeout(() => saveToStorage(updated), 300)
        return updated
      })
    },
    [saveToStorage]
  )

  // Tüm notları temizle
  const clearNotes = useCallback(() => {
    setNotes([])
    notesRef.current = []
    if (typeof window !== 'undefined') {
      if (relatedTo && relatedId) {
        // Sadece ilgili notları temizle
        const allStored = localStorage.getItem(storageKey)
        if (allStored) {
          const allNotes = JSON.parse(allStored) as StickyNote[]
          const filtered = allNotes.filter(
            (note) =>
              !(note.relatedTo === relatedTo && note.relatedId === relatedId)
          )
          localStorage.setItem(storageKey, JSON.stringify(filtered))
        }
      } else {
        localStorage.removeItem(storageKey)
      }
    }
  }, [relatedTo, relatedId, storageKey, companyId])

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    clearNotes,
  }
}


