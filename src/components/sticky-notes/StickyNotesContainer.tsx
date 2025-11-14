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
}

/**
 * Sticky Notes Container
 * Hızlı notlar için container
 */
export default function StickyNotesContainer({
  relatedTo,
  relatedId,
  visible = true,
}: StickyNotesContainerProps) {
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteColor, setNewNoteColor] = useState<StickyNoteType['color']>('yellow')
  const [allNotesVisible, setAllNotesVisible] = useState(true)
  const { notes, isLoading, addNote, updateNote, deleteNote } = useStickyNotes({
    relatedTo,
    relatedId,
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

  // Görünürlük durumunu kaydet
  const handleToggleVisibility = useCallback(() => {
    const newVisibility = !allNotesVisible
    setAllNotesVisible(newVisibility)
    if (typeof window !== 'undefined') {
      localStorage.setItem(visibilityStorageKey, String(newVisibility))
    }
  }, [allNotesVisible, visibilityStorageKey])

  // Yeni not ekle
  const handleAddNote = useCallback(() => {
    if (!newNoteContent.trim()) {
      toastError('Not içeriği gereklidir')
      return
    }

    addNote(newNoteContent, newNoteColor)
    setNewNoteContent('')
    setNewNoteColor('yellow')
    setNewNoteOpen(false)
    toastSuccess('Not eklendi')
  }, [newNoteContent, newNoteColor, addNote])

  if (!visible || isLoading) {
    return null
  }

  return (
    <>
      {/* Floating Toggle Button - Tüm notları gizle/göster */}
      {notes.length > 0 && (
        <Button
          onClick={handleToggleVisibility}
          className="fixed bottom-20 right-6 h-10 w-10 rounded-full shadow-lg z-[10000] bg-gray-600 hover:bg-gray-700"
          size="icon"
          title={allNotesVisible ? 'Tüm Notları Gizle' : 'Tüm Notları Göster'}
        >
          {allNotesVisible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={() => setNewNoteOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-[10000] bg-indigo-600 hover:bg-indigo-700"
        size="icon"
        title="Yeni Not Ekle"
      >
        <Plus className="h-6 w-6" />
      </Button>

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

