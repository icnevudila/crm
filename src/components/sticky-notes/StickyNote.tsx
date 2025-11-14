'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Edit2, Save, Trash2, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { StickyNote as StickyNoteType } from '@/hooks/useStickyNotes'

interface StickyNoteProps {
  note: StickyNoteType
  onUpdate: (id: string, updates: Partial<Pick<StickyNoteType, 'content' | 'color' | 'position' | 'minimized'>>) => void
  onDelete: (id: string) => void
  onDragStart?: (id: string, e: React.MouseEvent) => void
  onDragEnd?: () => void
}

/**
 * Sticky Note Component
 * Tek bir not kartı
 */
export default function StickyNote({
  note,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(note.content)
  const [isDragging, setIsDragging] = useState(false)
  const noteRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const isMinimized = note.minimized ?? false

  // Note content değiştiğinde state'i güncelle
  useEffect(() => {
    if (!isEditing) {
      setContent(note.content)
    }
  }, [note.content, isEditing])

  // Renk sınıfları
  const colorClasses = {
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    green: 'bg-green-100 border-green-300 text-green-900',
    red: 'bg-red-100 border-red-300 text-red-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900',
  }

  // Drag başlat
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return
    
    const rect = noteRef.current?.getBoundingClientRect()
    if (!rect) return

    setIsDragging(true)
    dragStartPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    if (onDragStart) {
      onDragStart(note.id, e)
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartPos.current || !noteRef.current) return

      const newX = moveEvent.clientX - dragStartPos.current.x
      const newY = moveEvent.clientY - dragStartPos.current.y

      // Viewport sınırları içinde tut
      const maxX = window.innerWidth - rect.width
      const maxY = window.innerHeight - rect.height

      const clampedX = Math.max(0, Math.min(newX, maxX))
      const clampedY = Math.max(0, Math.min(newY, maxY))

      noteRef.current.style.left = `${clampedX}px`
      noteRef.current.style.top = `${clampedY}px`
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (dragStartPos.current && noteRef.current) {
        const rect = noteRef.current.getBoundingClientRect()
        onUpdate(note.id, {
          position: { x: rect.left, y: rect.top },
        })
      }
      if (onDragEnd) {
        onDragEnd()
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Kaydet
  const handleSave = () => {
    onUpdate(note.id, { content })
    setIsEditing(false)
  }

  // İptal
  const handleCancel = () => {
    setContent(note.content)
    setIsEditing(false)
  }

  // Renk değiştir
  const handleColorChange = (color: StickyNoteType['color']) => {
    onUpdate(note.id, { color })
  }

  // Minimize toggle
  const handleMinimizeToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate(note.id, { minimized: !isMinimized })
  }

  // Minimize edilmiş durumda sadece küçük bir ikon göster
  if (isMinimized) {
    return (
      <div
        ref={noteRef}
        className={cn(
          'fixed w-12 h-12 rounded-lg border-2 shadow-lg transition-all cursor-pointer hover:scale-110',
          colorClasses[note.color],
          'flex items-center justify-center'
        )}
        style={{
          left: `${note.position.x}px`,
          top: `${note.position.y}px`,
          zIndex: 9998,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleMinimizeToggle}
        title={note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')}
      >
        <div className={cn(
          'w-3 h-3 rounded-full',
          note.color === 'yellow' && 'bg-yellow-500',
          note.color === 'blue' && 'bg-blue-500',
          note.color === 'green' && 'bg-green-500',
          note.color === 'red' && 'bg-red-500',
          note.color === 'purple' && 'bg-purple-500'
        )} />
      </div>
    )
  }

  return (
    <div
      ref={noteRef}
      className={cn(
        'fixed w-64 rounded-lg border-2 shadow-lg p-3 transition-all',
        colorClasses[note.color],
        isDragging && 'cursor-grabbing opacity-90',
        !isDragging && 'cursor-grab'
      )}
      style={{
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        zIndex: isDragging ? 9999 : 9998, // Drag sırasında en üstte
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {(['yellow', 'blue', 'green', 'red', 'purple'] as const).map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation()
                handleColorChange(color)
              }}
              className={cn(
                'w-3 h-3 rounded-full border border-gray-400',
                color === 'yellow' && 'bg-yellow-400',
                color === 'blue' && 'bg-blue-400',
                color === 'green' && 'bg-green-400',
                color === 'red' && 'bg-red-400',
                color === 'purple' && 'bg-purple-400'
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancel()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleMinimizeToggle}
                title="Küçült"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-600 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none bg-white/50 border-gray-300"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSave()
            }
            if (e.key === 'Escape') {
              handleCancel()
            }
          }}
          autoFocus
        />
      ) : (
        <div className="min-h-[100px] text-sm whitespace-pre-wrap break-words">
          {note.content || <span className="text-gray-400 italic">Not yazın...</span>}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {new Date(note.updatedAt).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
        })}
      </div>
    </div>
  )
}

