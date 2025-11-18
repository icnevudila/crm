'use client'

import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface ShortcutGroup {
  title: string
  shortcuts: {
    keys: string[]
    description: string
  }[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Genel',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Komut paletini aç' },
      { keys: ['Ctrl', 'N'], description: 'Yeni kayıt oluştur' },
      { keys: ['Ctrl', 'S'], description: 'Kaydet' },
      { keys: ['Ctrl', 'Z'], description: 'Geri al' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'İleri al' },
      { keys: ['?'], description: 'Kısayolları göster' },
      { keys: ['Esc'], description: 'Kapat/İptal' },
    ],
  },
  {
    title: 'Navigasyon',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Dashboard\'a git' },
      { keys: ['G', 'C'], description: 'Müşterilere git' },
      { keys: ['G', 'Q'], description: 'Tekliflere git' },
      { keys: ['G', 'I'], description: 'Faturalara git' },
      { keys: ['G', 'T'], description: 'Görevlere git' },
    ],
  },
  {
    title: 'Liste İşlemleri',
    shortcuts: [
      { keys: ['N'], description: 'Yeni kayıt ekle' },
      { keys: ['F'], description: 'Arama yap' },
      { keys: ['/'], description: 'Filtrele' },
      { keys: ['Arrow Up'], description: 'Önceki kayıt' },
      { keys: ['Arrow Down'], description: 'Sonraki kayıt' },
    ],
  },
  {
    title: 'Form İşlemleri',
    shortcuts: [
      { keys: ['Ctrl', 'Enter'], description: 'Formu gönder' },
      { keys: ['Tab'], description: 'Sonraki alan' },
      { keys: ['Shift', 'Tab'], description: 'Önceki alan' },
    ],
  },
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onClose: () => void
}

export default function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-600" />
            <DialogTitle>Klavye Kısayolları</DialogTitle>
          </div>
          <DialogDescription>
            Tüm klavye kısayollarını görüntüleyin ve kullanın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700 font-mono text-xs px-2 py-1"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 text-xs">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            İpucu: Kısayolları her zaman görmek için <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">?</kbd> tuşuna basın
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}




