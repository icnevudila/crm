'use client'

import { useState } from 'react'
import { Trash2, Edit, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface BulkActionsProps {
  selectedIds: string[]
  onBulkDelete: (ids: string[]) => Promise<void>
  onBulkUpdate?: (ids: string[], data: any) => Promise<void>
  onClearSelection: () => void
  itemName?: string
}

export default function BulkActions({
  selectedIds,
  onBulkDelete,
  onBulkUpdate,
  onClearSelection,
  itemName = 'öğe',
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.length} ${itemName} silmek istediğinize emin misiniz?`)) {
      return
    }

    setLoading(true)
    try {
      await onBulkDelete(selectedIds)
      onClearSelection()
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error('Toplu silme işlemi başarısız oldu', error?.message)
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
      <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
        {selectedIds.length} seçili
      </Badge>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleBulkDelete}
          disabled={loading}
          aria-label={`${selectedIds.length} ${itemName} sil`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Toplu Sil
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
          aria-label="Seçimi temizle"
        >
          <Square className="h-4 w-4 mr-2" />
          Seçimi Temizle
        </Button>
      </div>
    </div>
  )
}





