'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StickyNote from './StickyNote'
import { useStickyNotes, type StickyNote as StickyNoteType } from '@/hooks/useStickyNotes'
import { toastSuccess, toastError } from '@/lib/toast'
import { useSession } from '@/hooks/useSession'

interface StickyNotesContainerProps {
  /**
   * İlgili entity (opsiyonel)
   */
  relatedTo?: string
  relatedId?: string
  
  /**
   * Container görünür mü?
   */
  visible?: boolean
  
  /**
   * Header'dan çağrılıyor mu? (butonları render etme)
   */
  isHeaderMode?: boolean
  
  /**
   * Not ekleme butonu için callback (header'dan çağrılıyor)
   */
  onAddNoteClick?: () => void
  
  /**
   * Notları gizle/göster butonu için callback (header'dan çağrılıyor)
   */
  onToggleVisibilityClick?: () => void
  
  /**
   * Not sayısı (header'da gösterilmek için)
   */
  noteCount?: number
}

/**
 * Sticky Notes Container
 * Hızlı notlar için container
 */
export default function StickyNotesContainer({
  relatedTo,
  relatedId,
  visible = true,
  isHeaderMode = false,
  onAddNoteClick,
  onToggleVisibilityClick,
  noteCount,
}: StickyNotesContainerProps) {
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteColor, setNewNoteColor] = useState<StickyNoteType['color']>('yellow')
  const [allNotesVisible, setAllNotesVisible] = useState(true)
  
  // ✅ Custom event listener - Kanban kartlarından not ekleme modal'ını açmak için
  // NOT: Event'ten gelen relatedTo/relatedId bilgilerini state'e kaydet (ActivityLog için)
  const [eventRelatedTo, setEventRelatedTo] = useState<string | undefined>(relatedTo)
  const [eventRelatedId, setEventRelatedId] = useState<string | undefined>(relatedId)
  
  // useStickyNotes hook'unu event'ten gelen relatedTo/relatedId ile kullan
  const finalRelatedTo = eventRelatedTo || relatedTo
  const finalRelatedId = eventRelatedId || relatedId
  
  const { notes, isLoading, addNote, updateNote, deleteNote } = useStickyNotes({
    relatedTo: finalRelatedTo,
    relatedId: finalRelatedId,
    maxNotes: 20, // Performans için maksimum 20 not
  })

  // Multi-tenant desteği - companyId ile görünürlük izolasyonu
  const { data: session } = useSession()
  const companyId = session?.user?.companyId || 'default'
  const visibilityStorageKey = `crm_sticky_notes_visible_${companyId}`

  // localStorage'dan görünürlük durumunu yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(visibilityStorageKey)
      if (stored !== null) {
        setAllNotesVisible(stored === 'true')
      }
    }
  }, [visibilityStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOpenStickyNote = (event: CustomEvent) => {
      const { relatedTo: eventRelatedTo, relatedId: eventRelatedId, defaultTitle } = event.detail || {}
      
      // Event'ten gelen relatedTo/relatedId bilgilerini state'e kaydet (ActivityLog için)
      if (eventRelatedTo && eventRelatedId) {
        setEventRelatedTo(eventRelatedTo)
        setEventRelatedId(eventRelatedId)
        // Eğer defaultTitle varsa, not içeriğine ekle
        if (defaultTitle && !newNoteContent) {
          setNewNoteContent(defaultTitle + '\n\n')
        }
      }
      
      // Modal'ı aç
      setNewNoteOpen(true)
    }

    window.addEventListener('openStickyNote', handleOpenStickyNote as EventListener)
    return () => {
      window.removeEventListener('openStickyNote', handleOpenStickyNote as EventListener)
    }
  }, [newNoteContent])

  // relatedTo ve relatedId props değiştiğinde state'i güncelle
  useEffect(() => {
    setEventRelatedTo(relatedTo)
    setEventRelatedId(relatedId)
  }, [relatedTo, relatedId])

  // Görünürlük durumunu kaydet
  const handleToggleVisibility = useCallback(() => {
    const newVisibility = !allNotesVisible
    setAllNotesVisible(newVisibility)
    if (typeof window !== 'undefined') {
      localStorage.setItem(visibilityStorageKey, String(newVisibility))
    }
    // Header'dan çağrılıyorsa callback'i çağır
    if (onToggleVisibilityClick) {
      onToggleVisibilityClick()
    }
  }, [allNotesVisible, visibilityStorageKey, onToggleVisibilityClick])

  // Yeni not ekle
  const handleAddNote = useCallback(async () => {
    if (!newNoteContent.trim()) {
      toastError('Not içeriği gereklidir')
      return
    }

    // Sticky note'u localStorage'a ekle (event'ten gelen relatedTo/relatedId ile)
    addNote(newNoteContent, newNoteColor)
    
    // Eğer relatedTo ve relatedId varsa (props veya event'ten), ActivityLog'a da ekle (kayıta bağlı not)
    const finalRelatedTo = eventRelatedTo || relatedTo
    const finalRelatedId = eventRelatedId || relatedId
    
    if (finalRelatedTo && finalRelatedId) {
      try {
        const res = await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: finalRelatedTo,
            action: 'NOTE_ADDED',
            description: `Not eklendi: ${newNoteContent.substring(0, 100)}${newNoteContent.length > 100 ? '...' : ''}`,
            meta: {
              entity: finalRelatedTo,
              action: 'note_added',
              id: finalRelatedId,
              noteContent: newNoteContent,
              noteColor: newNoteColor,
            },
          }),
        })
        
        if (!res.ok) {
          console.error('ActivityLog oluşturulamadı:', await res.text())
        }
      } catch (error) {
        // ActivityLog hatası kritik değil, kullanıcıya bildirme
        console.error('ActivityLog error:', error)
      }
    }
    
    setNewNoteContent('')
    setNewNoteColor('yellow')
    setNewNoteOpen(false)
    // Event'ten gelen relatedTo/relatedId'yi temizle (bir sonraki not için)
    if (eventRelatedTo && eventRelatedId && (!relatedTo || !relatedId)) {
      setEventRelatedTo(undefined)
      setEventRelatedId(undefined)
    }
    toastSuccess('Not eklendi' + (finalRelatedTo && finalRelatedId ? ' ve kayda bağlandı' : ''), 'Not başarıyla kaydedildi')
  }, [newNoteContent, newNoteColor, addNote, relatedTo, relatedId, eventRelatedTo, eventRelatedId])

  if (!visible || isLoading) {
    return null
  }

  return (
    <>
      {/* Sticky Notes - Sadece görünürse göster */}
      {allNotesVisible && notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      ))}

      {/* New Note Dialog */}
      <Dialog open={newNoteOpen} onOpenChange={setNewNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Not Ekle</DialogTitle>
            <DialogDescription>
              Hızlı bir not ekleyin. Notu sürükleyerek istediğiniz yere taşıyabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note-content">Not İçeriği</Label>
              <Textarea
                id="note-content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Notunuzu yazın..."
                className="mt-1 min-h-[120px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleAddNote()
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="note-color">Renk</Label>
              <Select
                value={newNoteColor}
                onValueChange={(value) =>
                  setNewNoteColor(value as StickyNoteType['color'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yellow">Sarı</SelectItem>
                  <SelectItem value="blue">Mavi</SelectItem>
                  <SelectItem value="green">Yeşil</SelectItem>
                  <SelectItem value="red">Kırmızı</SelectItem>
                  <SelectItem value="purple">Mor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewNoteOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddNote}>Ekle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

