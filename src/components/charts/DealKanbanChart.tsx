'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DealKanbanChartProps {
  data: Array<{ 
    stage: string
    count: number
    totalValue?: number // Her stage için toplam tutar
    deals: Array<{ 
      id: string
      title: string
      value: number
      customer?: { name: string }
      Customer?: { name: string }
      status?: string
      createdAt?: string
    }> 
  }>
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
  onStageChange?: (dealId: string, newStage: string) => void | Promise<void>
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageColors: Record<string, string> = {
  LEAD: 'bg-blue-100 text-blue-800 border-blue-300',
  CONTACTED: 'bg-purple-100 text-purple-800 border-purple-300',
  PROPOSAL: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NEGOTIATION: 'bg-orange-100 text-orange-800 border-orange-300',
  WON: 'bg-green-100 text-green-800 border-green-300',
  LOST: 'bg-red-100 text-red-800 border-red-300',
}

const stageHeaderColors: Record<string, string> = {
  LEAD: 'bg-blue-50 border-blue-200',
  CONTACTED: 'bg-purple-50 border-purple-200',
  PROPOSAL: 'bg-yellow-50 border-yellow-200',
  NEGOTIATION: 'bg-orange-50 border-orange-200',
  WON: 'bg-green-50 border-green-200',
  LOST: 'bg-red-50 border-red-200',
}

// Droppable Column Component - Boş kolonlara da drop yapılabilmesi için
function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 transition-colors ${isOver ? 'bg-primary-50 border-2 border-primary-300 border-dashed rounded-lg' : ''}`}
    >
      {children}
    </div>
  )
}

// Sortable Deal Card Component
function SortableDealCard({ deal, stage, onEdit, onDelete }: { 
  deal: any
  stage: string
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
}) {
  const locale = useLocale()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const customer = deal.customer || deal.Customer

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.(deal)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(deal.id, deal.title)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border-2 hover:border-primary-400 hover:shadow-lg transition-all cursor-move touch-none"
    >
      <Link
        href={`/${locale}/deals/${deal.id}`}
        prefetch={true}
        className="block"
        onClick={(e) => {
          // Drag sırasında link'e tıklamayı engelle
          if (isDragging) {
            e.preventDefault()
          }
        }}
      >
        <div className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 line-clamp-2">
                {deal.title}
              </p>
            </div>
          </div>
          
          {customer && (
            <p className="text-xs text-gray-600 mt-1 mb-2 line-clamp-1">
              👤 {customer.name}
            </p>
          )}
          
          <p className="text-sm font-semibold text-primary-600 mt-2 mb-3">
            {new Intl.NumberFormat('tr-TR', { 
              style: 'currency', 
              currency: 'TRY' 
            }).format(deal.value || 0)}
          </p>

          {deal.createdAt && (
            <p className="text-xs text-gray-500 mb-3">
              📅 {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(`/${locale}/deals/${deal.id}`, '_blank')
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Görüntüle
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={handleEdit}
              >
                <Edit className="h-3 w-3 mr-1" />
                Düzenle
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Sil
              </Button>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}

export default function DealKanbanChart({ data, onEdit, onDelete, onStageChange }: DealKanbanChartProps) {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localData, setLocalData] = useState(data)

  // Local data'yı güncelle (data prop değiştiğinde) - useEffect kullan
  // Her zaman totalValue hesapla (API'den gelmese bile)
  useEffect(() => {
    // Eğer data'da totalValue yoksa, deals'den hesapla
    const dataWithTotalValue = (data || []).map((col: any) => {
      // Eğer totalValue zaten varsa kullan, yoksa deals'den hesapla
      if (col.totalValue !== undefined && col.totalValue !== null) {
        return col
      }
      // totalValue yoksa deals'den hesapla
      const calculatedTotalValue = (col.deals || []).reduce((sum: number, d: any) => {
        const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
        return sum + dealValue
      }, 0)
      return {
        ...col,
        totalValue: calculatedTotalValue,
      }
    })
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('DealKanbanChart data:', {
        dataLength: data?.length,
        data: dataWithTotalValue.map((col: any) => ({
          stage: col.stage,
          count: col.count,
          totalValue: col.totalValue,
          dealsCount: col.deals?.length,
        })),
      })
    }
    setLocalData(dataWithTotalValue)
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px hareket edince drag başlar (yanlışlıkla drag'ı önler)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Aynı stage içinde hareket (sıralama değişikliği) veya farklı stage'e taşıma
    const activeStage = localData.find((col) => col.deals.some((d) => d.id === activeId))
    
    // overId bir deal ID'si mi yoksa stage ID'si mi kontrol et
    let overStage = localData.find((col) => col.deals.some((d) => d.id === overId))
    
    // Eğer deal ID değilse, stage ID olabilir (boş kolona drop)
    if (!overStage) {
      overStage = localData.find((col) => col.stage === overId)
    }

    if (!activeStage || !overStage) return

    // Farklı stage'e taşıma
    if (activeStage.stage !== overStage.stage) {
      const deal = activeStage.deals.find((d) => d.id === activeId)
      if (!deal) return

      // Optimistic update - hemen UI'da göster (totalValue anlık güncellenir)
      const newData = localData.map((col) => {
        if (col.stage === activeStage.stage) {
          // Eski stage'den kaldır - totalValue'yu da anlık güncelle
          const updatedDeals = col.deals.filter((d) => d.id !== activeId)
          // value string olabilir, parseFloat kullan
          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
            const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
            return sum + dealValue
          }, 0)
          return {
            ...col,
            deals: updatedDeals,
            count: col.count - 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        if (col.stage === overStage.stage) {
          // Yeni stage'e ekle - totalValue'yu da anlık güncelle
          const updatedDeals = [...col.deals, deal]
          // value string olabilir, parseFloat kullan
          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
            const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
            return sum + dealValue
          }, 0)
          return {
            ...col,
            deals: updatedDeals,
            count: col.count + 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        return col
      })

      setLocalData(newData)

      // API'ye update gönder
      if (onStageChange) {
        try {
          await onStageChange(activeId, overStage.stage)
        } catch (error) {
          // Hata durumunda eski haline geri dön
          setLocalData(data)
          alert('Fırsat aşaması güncellenirken bir hata oluştu')
        }
      }
    } else {
      // Aynı stage içinde sıralama değişikliği
      const oldIndex = activeStage.deals.findIndex((d) => d.id === activeId)
      const newIndex = activeStage.deals.findIndex((d) => d.id === overId)

      if (oldIndex !== newIndex) {
        const newDeals = arrayMove(activeStage.deals, oldIndex, newIndex)
        const newData = localData.map((col) =>
          col.stage === activeStage.stage ? { ...col, deals: newDeals } : col
        )
        setLocalData(newData)
      }
    }
  }

  const activeDeal = localData
    .flatMap((col) => col.deals)
    .find((deal) => deal.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {localData.map((column) => (
          <Card 
            key={column.stage} 
            id={column.stage}
            className={`min-w-[320px] flex flex-col border-2 ${stageHeaderColors[column.stage] || 'bg-gray-50 border-gray-200'}`}
          >
            {/* Column Header */}
            <div className={`p-4 border-b-2 ${stageHeaderColors[column.stage] || 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {stageLabels[column.stage] || column.stage}
                </h3>
                <Badge className={`${stageColors[column.stage] || 'bg-gray-100 text-gray-800'} border`}>
                  {column.count}
                </Badge>
              </div>
              {/* Toplam Tutar - Her stage için (her zaman göster, drag-drop sonrası anlık güncellenir) */}
              <div className="flex items-center justify-end mt-1">
                <span className="text-sm font-semibold text-primary-600">
                  {new Intl.NumberFormat('tr-TR', { 
                    style: 'currency', 
                    currency: 'TRY' 
                  }).format(column.totalValue || 0)}
                </span>
              </div>
            </div>

            {/* Cards - Droppable Area */}
            <DroppableColumn stage={column.stage}>
              <SortableContext
                items={column.deals.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
                  {column.deals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                      Bu aşamada fırsat yok
                      <br />
                      <span className="text-xs text-gray-500 mt-2 block">
                        Fırsatları buraya sürükleyin
                      </span>
                    </div>
                  ) : (
                    column.deals.map((deal) => (
                      <SortableDealCard
                        key={deal.id}
                        deal={deal}
                        stage={column.stage}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          </Card>
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <Card className="bg-white border-2 border-primary-400 shadow-lg min-w-[300px]">
            <div className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {activeDeal.title}
                  </p>
                </div>
              </div>
              {(activeDeal.customer || activeDeal.Customer) && (
                <p className="text-xs text-gray-600 mt-1 mb-2 line-clamp-1">
                  👤 {(activeDeal.customer || activeDeal.Customer)?.name}
                </p>
              )}
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {new Intl.NumberFormat('tr-TR', { 
                  style: 'currency', 
                  currency: 'TRY' 
                }).format(activeDeal.value || 0)}
              </p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}





