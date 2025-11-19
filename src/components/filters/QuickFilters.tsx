'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Filter, X, Star, Trash2, Save } from 'lucide-react'
import { useSavedFilters, SavedFilter } from '@/hooks/useSavedFilters'
import { toastSuccess, toastError } from '@/lib/toast'

interface QuickFiltersProps {
  /**
   * Modül adı (customers, deals, quotes, etc.)
   */
  module: string
  
  /**
   * Mevcut filtreler
   */
  currentFilters: Record<string, any>
  
  /**
   * Filtre değiştiğinde çağrılır
   */
  onFilterChange: (filters: Record<string, any>) => void
  
  /**
   * Hızlı filtre seçenekleri (Bu Hafta, Bu Ay, vb.)
   */
  quickFilterOptions?: Array<{
    label: string
    filters: Record<string, any>
  }>
}

/**
 * Quick Filters Component
 * Hızlı filtreler ve kayıtlı filtreler için
 */
export default function QuickFilters({
  module,
  currentFilters,
  onFilterChange,
  quickFilterOptions = [],
}: QuickFiltersProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const { savedFilters, saveFilter, deleteFilter, loadFilter } = useSavedFilters({
    module,
  })

  // Hızlı filtre seçenekleri (varsayılan)
  const defaultQuickFilters = [
    {
      label: 'Bu Hafta',
      filters: {
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dateTo: new Date().toISOString(),
      },
    },
    {
      label: 'Bu Ay',
      filters: {
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        dateTo: new Date().toISOString(),
      },
    },
    {
      label: 'Bu Yıl',
      filters: {
        dateFrom: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        dateTo: new Date().toISOString(),
      },
    },
  ]

  const allQuickFilters = [...defaultQuickFilters, ...quickFilterOptions]

  // Filtre kaydet
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toastError('Filtre adı gereklidir')
      return
    }

    saveFilter(filterName, currentFilters, isDefault)
    toastSuccess('Filtre kaydedildi')
    setSaveDialogOpen(false)
    setFilterName('')
    setIsDefault(false)
  }

  // Filtre yükle
  const handleLoadFilter = (filter: SavedFilter) => {
    onFilterChange(filter.filters)
    toastSuccess(`"${filter.name}" filtresi yüklendi`)
  }

  // Filtre sil
  const handleDeleteFilter = (id: string, name: string) => {
    if (confirm(`${name} filtresini silmek istediğinize emin misiniz?`)) {
      deleteFilter(id)
      toastSuccess('Filtre silindi')
    }
  }

  // Tüm filtreleri temizle
  const handleClearFilters = () => {
    onFilterChange({})
    toastSuccess('Filtreler temizlendi')
  }

  return (
    <div className="flex items-center gap-2">
      {/* Hızlı Filtreler */}
      {allQuickFilters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Hızlı Filtreler
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Hızlı Filtreler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allQuickFilters.map((filter, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => onFilterChange(filter.filters)}
              >
                {filter.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Kayıtlı Filtreler */}
      {savedFilters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              Kayıtlı Filtreler ({savedFilters.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Kayıtlı Filtreler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                onClick={() => handleLoadFilter(filter)}
                className="flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  {filter.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  {filter.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteFilter(filter.id, filter.name)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Filtre Kaydet */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSaveDialogOpen(true)}
      >
        <Save className="h-4 w-4 mr-2" />
        Filtre Kaydet
      </Button>

      {/* Filtreleri Temizle */}
      {Object.keys(currentFilters).length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Temizle
        </Button>
      )}

      {/* Filtre Kaydet Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtre Kaydet</DialogTitle>
            <DialogDescription>
              Mevcut filtreleri kaydedin ve daha sonra hızlıca yükleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="filter-name">Filtre Adı</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Örn: Bu Ayın Müşterileri"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="is-default" className="cursor-pointer">
                Varsayılan filtre olarak ayarla
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveFilter}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}






