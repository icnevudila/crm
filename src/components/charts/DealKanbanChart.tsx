'use client'

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { toast, toastConfirm } from '@/lib/toast'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Edit, Trash2, Eye, GripVertical, History, ChevronLeft, ChevronRight, Info, Mail, MessageSquare, MessageCircle, Sparkles, Calendar, FileText, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { getStatusColor, getStatusBadgeClass } from '@/lib/crm-colors'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  DropAnimation,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { isValidDealTransition, isDealImmutable } from '@/lib/stageValidation'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
import RelatedRecordsDialog from '@/components/activity/RelatedRecordsDialog'

interface DealKanbanChartProps {
  data: Array<{
    stage: string
    count: number
    totalValue?: number
    deals: Array<{
      id: string
      title: string
      value?: number
      stage: string
      customerId?: string
      customerCompanyId?: string
      createdAt: string
      Customer?: {
        id: string
        name: string
        email?: string
      }
      CustomerCompany?: {
        id: string
        name: string
        email?: string
      }
    }>
  }>
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
  onStageChange?: (dealId: string, newStage: string) => void | Promise<void>
  onView?: (dealId: string) => void
  onQuickAction?: (type: string, deal: any) => void
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

const stageInfoMessages: Record<string, string> = {
  LEAD: '💡 Bu aşamada: Potansiyel müşteri. İletişim kurun ve "İletişimde" aşamasına taşıyın.',
  CONTACTED: '💡 Bu aşamada: İletişim kuruldu. Teklif hazırlayın ve "Teklif" aşamasına taşıyın.',
  PROPOSAL: '💡 Bu aşamada: Teklif hazırlandı. Pazarlık yapın ve "Pazarlık" aşamasına taşıyın.',
  NEGOTIATION: '💡 Bu aşamada: Pazarlık yapılıyor. Sonuçlandırın ve "Kazanıldı" veya "Kaybedildi" aşamasına taşıyın.',
  WON: '✅ Fırsat kazanıldı! Otomatik olarak sözleşme oluşturuldu. Bu aşamadaki fırsatlar değiştirilemez.',
  LOST: '❌ Fırsat kaybedildi. Analiz görevi otomatik olarak oluşturuldu. Bu aşamadaki fırsatlar değiştirilemez.',
}

const stageColors = (stage: string) => ({
  bg: getStatusColor(stage, 'bg'),
  text: getStatusColor(stage, 'text'),
  border: getStatusColor(stage, 'border'),
})

const stageBadgeColors = (stage: string) => getStatusBadgeClass(stage)

function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 transition-all duration-200 ease-out ${
        isOver 
          ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-400 border-dashed rounded-xl shadow-xl scale-[1.01] ring-4 ring-indigo-200/50' 
          : ''
      }`}
    >
      {children}
    </div>
  )
}

function SortableDealCard({ deal, stage, onEdit, onDelete, onStageChange, onView, onQuickAction }: { 
  deal: any
  stage: string
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
  onStageChange?: (dealId: string, newStage: string) => void | Promise<void>
  onView?: (dealId: string) => void
  onQuickAction?: (type: string, deal: any) => void
}) {
  const locale = useLocale()
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  
  const isLocked = isDealImmutable(stage)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: deal.id, disabled: isLocked })

  const x = transform?.x ?? 0
  const y = transform?.y ?? 0
  const style: React.CSSProperties = transform 
    ? {
        transform: `translate3d(${x}px,${y}px,0)`,
        WebkitTransform: `translate3d(${x}px,${y}px,0) translateZ(0)`,
        transition: 'none',
        willChange: 'transform',
        opacity: 1,
        cursor: !isLocked ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
        zIndex: isDragging ? 9999 : 1,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: isDragging ? 'none' : 'auto',
      }
    : {
        transition: isDragging ? 'none' : 'transform 150ms ease-out',
        willChange: !isLocked ? 'transform' : 'auto',
        opacity: 1,
        cursor: !isLocked ? 'grab' : 'not-allowed',
      }

  const colors = stageColors(stage)

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onEdit?.(deal)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    onDelete?.(deal.id, deal.title)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={setNodeRef}
          {...(!isLocked ? attributes : {})}
          style={{
            ...style,
            contain: 'layout style paint',
            isolation: 'isolate',
          }}
          className={`bg-white border-2 ${
            isDragging ? '' : 'transition-all duration-150'
          } ${
            isLocked 
              ? stage === 'WON'
                ? 'border-green-300 bg-green-50/30 hover:border-green-400 cursor-not-allowed'
                : 'border-red-300 bg-red-50/30 hover:border-red-400 cursor-not-allowed'
              : `${colors.border} hover:border-primary-400 hover:shadow-lg cursor-grab active:cursor-grabbing`
          } relative ${
            isDragging ? 'shadow-xl' : 'transition-shadow duration-150'
          }`}
          {...(!isLocked ? listeners : {})}
        >
          {isLocked && (
            <div className={`absolute top-2 right-2 z-50 px-2 py-1 rounded-md text-xs font-semibold bg-opacity-90 backdrop-blur-sm ${
              stage === 'WON'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {stage === 'WON' ? '🔒 Kazanıldı' : '🔒 Kaybedildi'}
            </div>
          )}
          
          <Link
            href={`/${locale}/deals/${deal.id}`}
            prefetch={true}
            className={`block relative z-0 ${isDragging ? 'pointer-events-none' : ''}`}
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
            <div className="p-3 relative z-20">
              <div className="flex items-start gap-2 mb-2">
                <Briefcase className={`h-4 w-4 ${colors.text} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {deal.title}
                  </p>
                </div>
              </div>
              
              {deal.Customer && (
                <div className="text-xs text-primary-600 mt-1 mb-2 line-clamp-1">
                  {deal.Customer.name}
                </div>
              )}
              
              {deal.CustomerCompany && (
                <div className="text-xs text-primary-600 mt-1 mb-2 line-clamp-1">
                  {deal.CustomerCompany.name}
                </div>
              )}
              
              <p className={`text-sm font-semibold ${colors.text} mt-2 mb-3`}>
                {formatCurrency(deal.value || 0)}
              </p>

              {deal.createdAt && (
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
                </p>
              )}

              {/* Workflow Butonları - Stage'e göre */}
              {!isLocked && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  {stage === 'LEAD' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (onStageChange) {
                          try {
                            await onStageChange(deal.id, 'CONTACTED')
                            toast.success('Fırsat güncellendi', { description: 'Durum "İletişimde" olarak güncellendi' })
                          } catch (error: any) {
                            toast.error('Durum değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
                          }
                        }
                      }}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      İletişime Geç
                    </Button>
                  )}
                  {stage === 'CONTACTED' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // ✅ ÇÖZÜM: Önce stage'i güncelle, sonra Quote formunu aç
                        if (onStageChange) {
                          try {
                            await onStageChange(deal.id, 'PROPOSAL')
                            toast.success('Fırsat güncellendi', { description: 'Durum "Teklif" olarak güncellendi' })
                            // Stage güncellendikten sonra Quote formunu aç
                            if (onQuickAction) {
                              onQuickAction('quote', deal)
                            }
                          } catch (error: any) {
                            toast.error('Durum değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
                          }
                        } else if (onQuickAction) {
                          // onStageChange yoksa direkt Quote formunu aç
                          onQuickAction('quote', deal)
                        }
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Teklif Hazırla
                    </Button>
                  )}
                  {stage === 'PROPOSAL' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (onStageChange) {
                          try {
                            await onStageChange(deal.id, 'NEGOTIATION')
                            toast.success('Fırsat güncellendi', { description: 'Durum "Pazarlık" olarak güncellendi' })
                          } catch (error: any) {
                            toast.error('Durum değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
                          }
                        }
                      }}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Pazarlığa Geç
                    </Button>
                  )}
                  {stage === 'NEGOTIATION' && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (onStageChange) {
                            // ✅ ÇÖZÜM: WON durumuna geçerken toast confirmation
                            const confirmed = await toastConfirm(
                              `"${deal.title}" fırsatını kazanıldı olarak işaretlemek istediğinize emin misiniz?`,
                              `Bu işlem sonrası otomatik olarak sözleşme oluşturulacaktır. Bu aşamadaki fırsatlar değiştirilemez.`,
                              {
                                confirmLabel: 'Kazanıldı İşaretle',
                                cancelLabel: 'Vazgeç',
                              }
                            )
                            if (!confirmed) {
                              return
                            }
                            
                            try {
                              await onStageChange(deal.id, 'WON')
                              toast.success('Fırsat kazanıldı!', { description: 'Tebrikler! Fırsat başarıyla kazanıldı.' })
                            } catch (error: any) {
                              toast.error('Durum değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
                            }
                          }
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Kazanıldı
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (onStageChange) {
                            // ✅ ÇÖZÜM: LOST durumuna geçerken toast confirmation
                            const confirmed = await toastConfirm(
                              `"${deal.title}" fırsatını kaybedildi olarak işaretlemek istediğinize emin misiniz?`,
                              `Bu işlem sonrası analiz görevi otomatik olarak oluşturulacaktır. Bu aşamadaki fırsatlar değiştirilemez.`,
                              {
                                confirmLabel: 'Kaybedildi İşaretle',
                                cancelLabel: 'Vazgeç',
                              }
                            )
                            if (!confirmed) {
                              return
                            }
                            
                            try {
                              await onStageChange(deal.id, 'LOST')
                              toast.success('Fırsat kaydedildi', { description: 'Fırsat "Kaybedildi" olarak işaretlendi' })
                            } catch (error: any) {
                              toast.error('Durum değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
                            }
                          }
                        }}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Kaybedildi
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
          
          <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white relative z-50" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex gap-2 flex-wrap">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                        if (onView) {
                          onView(deal.id)
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Detayları görüntüle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {!isLocked && (
                <>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={handleEdit}
                        >
                          <Edit className="h-4 w-4 text-gray-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Düzenle</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0"
                          onClick={handleDelete}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sil</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        e.nativeEvent.stopImmediatePropagation()
                        setHistoryDialogOpen(true)
                      }}
                    >
                      <History className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>İşlem geçmişini görüntüle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onView) {
              onView(deal.id)
            }
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Görüntüle
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setHistoryDialogOpen(true)
          }}
        >
          <History className="mr-2 h-4 w-4" />
          Geçmiş
        </ContextMenuItem>
        {!isLocked && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Düzenle
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      
      <RelatedRecordsDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        entity="Deal"
        entityId={deal.id}
        entityTitle={deal.title}
      />
    </ContextMenu>
  )
}

const MemoizedSortableDealCard = memo(SortableDealCard, (prevProps, nextProps) => {
  return (
    prevProps.deal.id === nextProps.deal.id &&
    prevProps.stage === nextProps.stage &&
    prevProps.deal.title === nextProps.deal.title &&
    prevProps.deal.value === nextProps.deal.value
  )
})

export default function DealKanbanChart({ data, onEdit, onDelete, onStageChange, onView, onQuickAction }: DealKanbanChartProps) {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragLocalData, setDragLocalData] = useState<any[] | null>(null)
  const [localData, setLocalData] = useState(data)

  useEffect(() => {
    const dataWithTotalValue = (data || []).map((col: any) => {
      if (col.totalValue !== undefined && col.totalValue !== null) {
        return col
      }
      const calculatedTotalValue = (col.deals || []).reduce((sum: number, d: any) => {
        const dealValue = d.value || (typeof d.value === 'string' ? parseFloat(d.value) || 0 : 0)
        return sum + dealValue
      }, 0)
      return {
        ...col,
        totalValue: calculatedTotalValue,
      }
    })
    
    setLocalData(dataWithTotalValue)
  }, [data])

  const displayData = dragLocalData || localData

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeStage = displayData.find((col) => col.deals.some((d: any) => d.id === activeId))
    
    let overStage = displayData.find((col) => col.deals.some((d: any) => d.id === overId))
    
    if (!overStage) {
      overStage = displayData.find((col) => col.stage === overId)
    }

    if (!activeStage || !overStage) return

    if (activeStage.stage !== overStage.stage) {
      const deal = activeStage.deals.find((d: any) => d.id === activeId)
      if (!deal) return

      const currentStage = activeStage.stage
      const targetStage = overStage.stage

      if (isDealImmutable(currentStage)) {
        const message = getStageMessage(currentStage, 'deal', 'immutable')
        toast.error(message.title, { description: message.description })
        return
      }

      const validation = isValidDealTransition(currentStage, targetStage)
      if (!validation.valid) {
        const allowed = validation.allowed || []
        const currentName = translateStage(currentStage, 'deal')
        const targetName = translateStage(targetStage, 'deal')
        const allowedNames = allowed.map((s: string) => translateStage(s, 'deal')).join(', ')
        
        toast.error(
          `${currentName} → ${targetName} geçişi yapılamıyor`,
          { description: allowed.length > 0 
            ? `Bu fırsatı şu aşamalara taşıyabilirsiniz: ${allowedNames}` 
            : getStageMessage(currentStage, 'deal', 'transition').description
          }
        )
        return
      }

      const newData = displayData.map((col) => {
        if (col.stage === activeStage.stage) {
          const updatedDeals = col.deals.filter((d: any) => d.id !== activeId)
          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
            const dealValue = d.value || (typeof d.value === 'string' ? parseFloat(d.value) || 0 : 0)
            return sum + dealValue
          }, 0)
          return {
            ...col,
            deals: updatedDeals,
            count: col.count - 1,
            totalValue: updatedTotalValue,
          }
        }
        if (col.stage === overStage.stage) {
          const updatedDeals = [...col.deals, deal]
          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
            const dealValue = d.value || (typeof d.value === 'string' ? parseFloat(d.value) || 0 : 0)
            return sum + dealValue
          }, 0)
          return {
            ...col,
            deals: updatedDeals,
            count: col.count + 1,
            totalValue: updatedTotalValue,
          }
        }
        return col
      })

      setDragLocalData(newData)

      if (onStageChange) {
        try {
          await onStageChange(activeId, overStage.stage)
          setDragLocalData(null)
        } catch (error: any) {
          setDragLocalData(null)
          toast.error('Fırsat aşaması değiştirilemedi', { description: error?.message || 'Bir hata oluştu' })
        }
      }
    } else {
      const oldIndex = activeStage.deals.findIndex((d: any) => d.id === activeId)
      const newIndex = activeStage.deals.findIndex((d: any) => d.id === overId)

      if (oldIndex !== newIndex) {
        const newDeals = arrayMove(activeStage.deals, oldIndex, newIndex)
        const newData = displayData.map((col) =>
          col.stage === activeStage.stage ? { ...col, deals: newDeals } : col
        )
        setDragLocalData(newData)
      }
    }
  }

  const activeDeal = displayData
    .flatMap((col) => col.deals)
    .find((deal) => deal.id === activeId)

  const dropAnimation: DropAnimation = useMemo(() => ({
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.98',
          scale: '1.05',
        },
      },
    }),
    duration: 150,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }), [])

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleHorizontalScroll = (direction: 'left' | 'right') => {
    const node = scrollContainerRef.current
    if (!node) return
    const delta = direction === 'left' ? -360 : 360
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="sticky top-0 z-20 mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
        <p className="text-sm font-medium text-slate-600">
          Kanbanı yatay kaydırmak için okları ya da trackpad&apos;inizi kullanın.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => handleHorizontalScroll('left')}
            aria-label="Sola kaydır"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => handleHorizontalScroll('right')}
            aria-label="Sağa kaydır"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="kanban-scroll-container flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}
      >
        {displayData.map((column) => {
          const colors = stageColors(column.stage)
          return (
            <Card
              key={column.stage}
              id={column.stage}
              className={`min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col ${colors.bg} ${colors.border} border-2`}
            >
              <div className={`p-4 border-b-2 ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${colors.text}`}>
                      {stageLabels[column.stage] || column.stage}
                    </h3>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            type="button" 
                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-100 border-2 border-blue-300 hover:border-blue-400 bg-blue-50 shadow-sm hover:shadow-md"
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                            }}
                            title="Aşama bilgisi için tıklayın veya üzerine gelin"
                          >
                            <Info className="h-5 w-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="max-w-sm p-4 bg-white border-2 border-blue-300 shadow-xl z-[100] text-left"
                          sideOffset={8}
                        >
                          <div className="flex items-start gap-2">
                            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm leading-relaxed text-gray-800 font-medium">{stageInfoMessages[column.stage] || 'Bu aşama hakkında bilgi'}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Badge className={stageBadgeColors(column.stage)}>
                    {column.count}
                  </Badge>
                </div>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-sm font-semibold text-primary-600">
                    {new Intl.NumberFormat('tr-TR', { 
                      style: 'currency', 
                      currency: 'TRY' 
                    }).format(column.deals.reduce((sum, d: any) => sum + (d.value || 0), 0))}
                  </span>
                </div>
              </div>

              <DroppableColumn stage={column.stage}>
                <SortableContext
                  items={column.deals.map((d: any) => d.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
                    {column.deals.length === 0 ? (
                      <div className={`text-center py-8 text-sm ${colors.text} opacity-60 border-2 border-dashed ${colors.border} rounded-lg`}>
                        Bu aşamada fırsat yok
                        <br />
                        <span className="text-xs text-gray-500 mt-2 block">
                          Fırsatları buraya sürükleyin
                        </span>
                      </div>
                    ) : (
                      column.deals.map((deal: any) => (
                        <MemoizedSortableDealCard
                          key={deal.id}
                          deal={deal}
                          stage={column.stage}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onStageChange={onStageChange}
                          onView={onView}
                          onQuickAction={onQuickAction}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            </Card>
          )
        })}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeDeal ? (
          <Card 
            className="bg-white border-2 border-indigo-500 shadow-xl min-w-[300px]"
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0) scale(1.05) translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitTransform: 'translate3d(0, 0, 0) scale(1.05) translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: 'none',
              boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)',
            }}
          >
            <div className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {activeDeal.title}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {formatCurrency(activeDeal.value || 0)}
              </p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}


