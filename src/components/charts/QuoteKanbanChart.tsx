'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { toast } from '@/lib/toast'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Edit, Trash2, Eye, Send, CheckCircle, XCircle, GripVertical, RefreshCw, Mail, Clock, History, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Info } from 'lucide-react'
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
import { isValidQuoteTransition, isQuoteImmutable } from '@/lib/stageValidation'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
import RelatedRecordsDialog from '@/components/activity/RelatedRecordsDialog'

interface QuoteKanbanChartProps {
  data: Array<{
    status: string
    count: number
    quotes: Array<{
      id: string
      title: string
      total?: number // Fallback için
      totalAmount?: number // 050 migration ile total → totalAmount
      dealId?: string
      createdAt: string
      notes?: string // ✅ ÇÖZÜM: Reddetme sebebi için notes alanı
    }>
  }>
  onEdit?: (quote: any) => void
  onDelete?: (id: string, title: string) => void
  onStatusChange?: (quoteId: string, newStatus: string) => void | Promise<void>
  onView?: (quoteId: string) => void // ✅ ÇÖZÜM: Modal açmak için callback
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  ACCEPTED: 'Kabul Edildi',
  REJECTED: 'Reddedildi',
  DECLINED: 'Reddedildi', // DECLINED → REJECTED olarak normalize ediliyor, ama yine de label ekliyoruz
  WAITING: 'Beklemede',
}

// Her aşama için bilgilendirme mesajları - CRM'e uygun yönlendirici mesajlar (kart içinde gösterilecek)
const statusInfoMessages: Record<string, string> = {
  DRAFT: '💡 Bu aşamada: Teklifi gönderin. Kart içindeki "Gönder" butonunu kullanın. Teklif gönderildikten sonra "Gönderildi" aşamasına taşınır.',
  SENT: '💡 Bu aşamada: Müşteri onayı bekleniyor. Kart içindeki "Kabul Et" veya "Reddet" butonlarını kullanın. Kabul edilirse otomatik olarak fatura ve sözleşme oluşturulur.',
  ACCEPTED: '✅ Teklif kabul edildi! Otomatik olarak fatura ve sözleşme oluşturuldu. Faturalar ve Sözleşmeler sayfalarından kontrol edebilirsiniz. Bu aşamadaki teklifler değiştirilemez.',
  REJECTED: '❌ Teklif reddedildi. Revizyon görevi otomatik olarak oluşturuldu. Görevler sayfasından kontrol edebilirsiniz. Bu aşamadaki teklifler değiştirilemez.',
  WAITING: '⏳ Teklif müşteri onayı bekliyor. Kart içindeki "Kabul Et", "Reddet", "Tekrar Gönder" veya "Hatırlat" butonlarını kullanabilirsiniz.',
}


// Premium renk kodları - daha belirgin ve okunabilir
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  SENT: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  ACCEPTED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  REJECTED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  DECLINED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  WAITING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
}

const statusBadgeColors: Record<string, string> = {
  DRAFT: 'bg-gray-500 text-white',
  SENT: 'bg-blue-500 text-white',
  ACCEPTED: 'bg-green-500 text-white',
  REJECTED: 'bg-red-500 text-white',
  DECLINED: 'bg-red-500 text-white',
  WAITING: 'bg-yellow-500 text-white',
}

// ✅ PREMIUM: Droppable Column Component - Smooth hover effects
function DroppableColumn({ status, children }: { status: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 transition-all duration-300 ease-out ${
        isOver 
          ? 'bg-gradient-to-br from-primary-50 to-primary-100/50 border-2 border-primary-400 border-dashed rounded-xl shadow-lg scale-[1.02]' 
          : ''
      }`}
    >
      {children}
    </div>
  )
}

// Sortable Quote Card Component
function SortableQuoteCard({ quote, status, onEdit, onDelete, onStatusChange, onView }: { 
  quote: any
  status: string
  onEdit?: (quote: any) => void
  onDelete?: (id: string, title: string) => void
  onStatusChange?: (quoteId: string, newStatus: string) => void | Promise<void>
  onView?: (quoteId: string) => void // ✅ ÇÖZÜM: Modal açmak için callback
}) {
  const locale = useLocale()
  const [dragMode, setDragMode] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  
  // Kilitli durum kontrolü - ACCEPTED ve REJECTED durumları taşınamaz
  const isLocked = isQuoteImmutable(status)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: quote.id, disabled: !dragMode || isLocked })

  // ✅ PREMIUM: Ultra-smooth drag animations with GPU acceleration
  const x = transform?.x ?? 0
  const y = transform?.y ?? 0
  const style: React.CSSProperties = transform 
    ? {
        transform: `translate3d(${x}px,${y}px,0) scale(1)`,
        WebkitTransform: `translate3d(${x}px,${y}px,0) scale(1) translateZ(0)`,
        transition: isDragging ? 'none' : 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ✅ Daha hızlı ve smooth transition
        willChange: 'transform',
        opacity: isDragging ? 0.7 : 1, // ✅ Daha görünür opacity
        cursor: dragMode && !isLocked ? (isDragging ? 'grabbing' : 'grab') : 'default',
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        perspective: 1000,
        isolation: 'isolate',
        zIndex: isDragging ? 50 : 1, // ✅ Drag sırasında üstte
        // ✅ GPU acceleration optimizations
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        WebkitTransformStyle: 'preserve-3d',
        transformStyle: 'preserve-3d',
      }
    : {
        transition: 'transform 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 150ms ease-out', // ✅ Daha hızlı transitions
        willChange: dragMode && !isLocked ? 'transform' : 'auto',
        opacity: isDragging ? 0.7 : 1,
        cursor: dragMode && !isLocked ? (isDragging ? 'grabbing' : 'grab') : 'default',
        // ✅ GPU acceleration optimizations
        WebkitBackfaceVisibility: 'hidden',
        WebkitPerspective: 1000,
        WebkitTransformStyle: 'preserve-3d',
        transformStyle: 'preserve-3d',
      }

  const colors = statusColors[status] || statusColors.DRAFT

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onEdit?.(quote)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(quote.id, quote.title)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={setNodeRef}
          style={{
            ...style,
            contain: 'layout style paint', // CSS containment for performance
            isolation: 'isolate', // Force GPU layer
          }}
          className={`bg-white border-2 transition-all duration-200 ${
            isLocked 
              ? status === 'ACCEPTED'
                ? 'border-green-300 bg-green-50/30 hover:border-green-400'
                : 'border-red-300 bg-red-50/30 hover:border-red-400'
              : `${colors.border} hover:border-primary-400 hover:shadow-lg`
          } relative ${dragMode && !isLocked ? 'ring-2 ring-primary-400 ring-opacity-50' : ''} ${
            isDragging ? 'shadow-2xl scale-105 rotate-1' : 'hover:scale-[1.02]'
          }`}
        >
          {/* Kilitli Durum Badge - Kilitli kartlarda göster */}
          {isLocked && (
            <div className={`absolute top-2 right-2 z-50 px-2 py-1 rounded-md text-xs font-semibold bg-opacity-90 backdrop-blur-sm ${
              status === 'ACCEPTED'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {status === 'ACCEPTED' ? '🔒 Kabul Edildi' : '🔒 Reddedildi'}
            </div>
          )}
          
          {/* Drag Handle Button - Sadece kilitli değilse göster */}
          {!isLocked && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDragMode(!dragMode)
              }}
              className={`absolute top-2 right-2 z-50 p-1.5 rounded-md ${isDragging ? 'transition-none' : 'transition-all'} ${
                dragMode
                  ? 'bg-primary-500 text-white shadow-md hover:bg-primary-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={dragMode ? 'Sürükle-bırak modunu kapat' : 'Sürükle-bırak modunu aç'}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Drag Handle Overlay - Sadece drag mode aktifken ve kilitli değilse */}
          {dragMode && !isLocked && (
            <div
              {...attributes}
              {...listeners}
              className="absolute inset-0 z-40 cursor-grab active:cursor-grabbing rounded-lg"
              style={{
                willChange: 'transform, opacity',
                touchAction: 'none',
                backfaceVisibility: 'hidden',
                WebkitTransform: 'translateZ(0)', // Force GPU acceleration
                transform: 'translateZ(0)', // Force GPU acceleration
              }}
              onClick={(e) => {
                if (isDragging) {
                  e.preventDefault()
                  e.stopPropagation()
                }
              }}
              onContextMenu={(e) => {
                e.stopPropagation()
              }}
            />
          )}

          <Link
            href={`/${locale}/quotes/${quote.id}`}
            prefetch={true}
            className={`block relative z-0 ${dragMode ? 'pointer-events-none' : ''}`}
            onClick={(e) => {
              // Drag mode aktifken link'e tıklamayı engelle
              if (dragMode || isDragging) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          >
        <div className="p-3">
          <div className="flex items-start gap-2 mb-2">
            <FileText className={`h-4 w-4 ${colors.text} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm text-gray-900 line-clamp-2">
                  {quote.title}
                </p>
                {/* REJECTED durumunda not simgesi - hover ile tooltip */}
                {status === 'REJECTED' && quote.notes && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <Info className="h-3.5 w-3.5 text-red-600 cursor-help" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-semibold text-red-800 mb-1">🔴 Reddetme Sebebi:</p>
                        <p className="text-xs text-red-700 whitespace-pre-wrap">
                          {quote.notes.includes('Sebep:') 
                            ? quote.notes.split('Sebep:')[1]?.trim() || quote.notes
                            : quote.notes
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
          
          {quote.dealId && (
            <div
              className="text-xs text-primary-600 hover:underline mt-1 mb-2 line-clamp-1 block cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(`/${locale}/deals/${quote.dealId}`, '_blank')
              }}
            >
              Fırsat #{quote.dealId.substring(0, 8)}
            </div>
          )}
          
          <p className={`text-sm font-semibold ${colors.text} mt-2 mb-3`}>
            {formatCurrency(quote.totalAmount || 0)}
          </p>

          {quote.createdAt && (
            <p className="text-xs text-gray-500 mb-2">
              {new Date(quote.createdAt).toLocaleDateString('tr-TR')}
            </p>
          )}

          {/* Reddetme Sebebi (Notes) - Sadece REJECTED durumunda göster */}
          {status === 'REJECTED' && quote.notes && (
            <div className="mt-2 mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-semibold text-red-800 mb-1">🔴 Reddetme Sebebi:</p>
              <p className="text-xs text-red-700 whitespace-pre-wrap line-clamp-3">
                {quote.notes.includes('Sebep:') 
                  ? quote.notes.split('Sebep:')[1]?.trim() || quote.notes
                  : quote.notes
                }
              </p>
            </div>
          )}

          {/* WAITING → Hızlı Erişim Butonları - Kartın içinde */}
          {status === 'WAITING' && (
            <div className="flex gap-1.5 mb-3">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700 px-2 text-white"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (dragMode || isDragging) return
                        
                        if (onStatusChange) {
                          try {
                            await onStatusChange(quote.id, 'ACCEPTED')
                            toast.success('Teklif kabul edildi! Fatura ve sözleşme oluşturuldu.')
                          } catch (error: any) {
                            if (process.env.NODE_ENV === 'development') {
                              console.error('Status change error:', error)
                            }
                          }
                        } else {
                          toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                        }
                      }}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Kabul Et
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Teklifi kabul et. Otomatik olarak fatura ve sözleşme oluşturulur.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7 border-red-300 text-red-600 hover:bg-red-50 px-2"
                      onClick={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (dragMode || isDragging) return
                        
                        if (onStatusChange) {
                          try {
                            await onStatusChange(quote.id, 'REJECTED')
                            toast.success('Teklif reddedildi')
                          } catch (error: any) {
                            if (process.env.NODE_ENV === 'development') {
                              console.error('Status change error:', error)
                            }
                          }
                        } else {
                          toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                        }
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reddet
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Teklifi reddet. Sebep sorulacak ve not olarak kaydedilecek.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Quick Action Buttons - Status'e göre değişir */}
          <div className="mb-3 pt-2 border-t border-gray-200">
            {status === 'DRAFT' && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (dragMode || isDragging) return
                  
                  // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak ve cache'i güncelleyecek
                  if (onStatusChange) {
                    try {
                      await onStatusChange(quote.id, 'SENT')
                      toast.success('Teklif gönderildi')
                    } catch (error: any) {
                      // Hata zaten onStatusChange içinde handle ediliyor, burada sadece log
                      if (process.env.NODE_ENV === 'development') {
                        console.error('Status change error:', error)
                      }
                    }
                  } else {
                    toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                  }
                }}
                    >
                      Gönder
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Teklifi müşteriye gönder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {status === 'SENT' && (
              <div className="flex gap-1.5">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs h-6 bg-green-600 hover:bg-green-700 px-2 text-white"
                        onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (dragMode || isDragging) return
                    
                    // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                    if (onStatusChange) {
                      try {
                        await onStatusChange(quote.id, 'ACCEPTED')
                        toast.success('Teklif kabul edildi! Fatura ve sözleşme oluşturuldu.')
                      } catch (error: any) {
                        // Hata zaten onStatusChange içinde handle ediliyor
                        if (process.env.NODE_ENV === 'development') {
                          console.error('Status change error:', error)
                        }
                      }
                    } else {
                      toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                    }
                  }}
                      >
                        Kabul Et
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Teklifi kabul et. Otomatik olarak fatura ve sözleşme oluşturulur.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-6 border-red-300 text-red-600 hover:bg-red-50 px-2"
                        onClick={async (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (dragMode || isDragging) return
                    
                    // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                    if (onStatusChange) {
                      try {
                        await onStatusChange(quote.id, 'REJECTED')
                        toast.success('Teklif reddedildi')
                      } catch (error: any) {
                        // Hata zaten onStatusChange içinde handle ediliyor
                        if (process.env.NODE_ENV === 'development') {
                          console.error('Status change error:', error)
                        }
                      }
                    } else {
                      toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                    }
                  }}
                      >
                        Reddet
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Teklifi reddet. Otomatik olarak revizyon görevi oluşturulur.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </Link>
          {/* Action Buttons - Kartın altında, drag & drop'u etkilemez */}
          <div className={`px-3 pb-3 pt-2 border-t border-gray-200 bg-white relative z-50 ${dragMode ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="flex gap-2 flex-wrap">
              {/* DRAFT → Gönder */}
              {quote.status === 'DRAFT' && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-[80px] text-xs h-7"
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (dragMode) return
                          
                          // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                          if (onStatusChange) {
                            try {
                              await onStatusChange(quote.id, 'SENT')
                              toast.success('Teklif gönderildi', 'Teklif başarıyla gönderildi ve durumu güncellendi.')
                            } catch (error: any) {
                              // Hata zaten onStatusChange içinde handle ediliyor
                              if (process.env.NODE_ENV === 'development') {
                                console.error('Status change error:', error)
                              }
                            }
                          } else {
                            toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                          }
                        }}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Gönder
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs border-2 border-indigo-200 bg-white p-3 text-left shadow-xl">
                      <p className="text-xs font-medium text-slate-700">
                        Teklifi müşteriye gönderir. Bu işlemden sonra teklif durumu "Gönderildi" olur.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {/* SENT → Kabul Et ve Reddet */}
              {quote.status === 'SENT' && (
                <>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                            if (onStatusChange) {
                              try {
                                await onStatusChange(quote.id, 'ACCEPTED')
                                toast.success('Teklif kabul edildi', 'Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu.')
                              } catch (error: any) {
                                // Hata zaten onStatusChange içinde handle ediliyor
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Status change error:', error)
                                }
                              }
                            } else {
                              toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                            }
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Kabul Et
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-green-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Teklifi kabul eder. Otomatik olarak fatura ve sözleşme oluşturulur.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                            if (onStatusChange) {
                              try {
                                await onStatusChange(quote.id, 'REJECTED')
                                toast.success('Teklif reddedildi', 'Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu.')
                              } catch (error: any) {
                                // Hata zaten onStatusChange içinde handle ediliyor
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Status change error:', error)
                                }
                              }
                            } else {
                              toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                            }
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reddet
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-red-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Teklifi reddeder. Sebep sorulacak ve otomatik olarak revizyon görevi oluşturulur.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              {/* WAITING → Kabul Et, Reddet, Tekrar Gönder, Hatırlatma */}
              {quote.status === 'WAITING' && (
                <>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                            if (onStatusChange) {
                              try {
                                await onStatusChange(quote.id, 'ACCEPTED')
                                toast.success('Teklif kabul edildi', 'Teklif kabul edildi, otomatik olarak fatura ve sözleşme oluşturuldu.')
                              } catch (error: any) {
                                // Hata zaten onStatusChange içinde handle ediliyor
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Status change error:', error)
                                }
                              }
                            } else {
                              toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                            }
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Kabul Et
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-green-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Teklifi kabul eder. Otomatik olarak fatura ve sözleşme oluşturulur.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Sadece onStatusChange callback'ini çağır - parent component API çağrısını yapacak
                            if (onStatusChange) {
                              try {
                                await onStatusChange(quote.id, 'REJECTED')
                                toast.success('Teklif reddedildi', 'Teklif reddedildi, otomatik olarak revizyon görevi oluşturuldu.')
                              } catch (error: any) {
                                // Hata zaten onStatusChange içinde handle ediliyor
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Status change error:', error)
                                }
                              }
                            } else {
                              toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                            }
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reddet
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-red-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Teklifi reddeder. Sebep sorulacak ve otomatik olarak revizyon görevi oluşturulur.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Tekrar gönder - SENT durumuna taşı
                            if (onStatusChange) {
                              try {
                                await onStatusChange(quote.id, 'SENT')
                                toast.success('Teklif tekrar gönderildi', 'Teklif başarıyla tekrar gönderildi.')
                              } catch (error: any) {
                                if (process.env.NODE_ENV === 'development') {
                                  console.error('Status change error:', error)
                                }
                              }
                            } else {
                              toast.error('Durum değiştirilemedi', 'onStatusChange callback tanımlı değil')
                            }
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Tekrar Gönder
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-blue-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Teklifi tekrar müşteriye gönderir. Durum "Gönderildi" olarak güncellenir.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 min-w-[80px] text-xs h-7 bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-700"
                          onClick={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (dragMode) return
                            
                            // Hatırlatma gönder - şimdilik sadece toast göster, gelecekte e-posta gönderilebilir
                            toast.info('Hatırlatma gönderildi', 'Müşteriye hatırlatma bildirimi gönderildi.')
                          }}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Hatırlat
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-yellow-200 bg-white p-3 text-left shadow-xl">
                        <p className="text-xs font-medium text-slate-700">
                          Müşteriye hatırlatma bildirimi gönderir. Teklif durumu değişmez.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            
            {/* Geçmiş Butonu */}
            <div className="flex gap-1 pt-2 border-t border-gray-200 mt-2">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-6 text-xs px-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setHistoryDialogOpen(true)
                      }}
                    >
                      <History className="h-3 w-3 mr-1" />
                      Geçmiş
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
            setHistoryDialogOpen(true)
          }}
        >
          <History className="mr-2 h-4 w-4" />
          Geçmiş
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // ✅ ÇÖZÜM: Modal aç - yeni sekme açma
            if (onView) {
              onView(quote.id)
            } else {
              // Fallback: Eğer onView yoksa yeni sekmede aç (eski davranış)
              window.open(`/${locale}/quotes/${quote.id}`, '_blank')
            }
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          Görüntüle
        </ContextMenuItem>
        {onEdit && (
          <ContextMenuItem
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(quote)
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Düzenle
          </ContextMenuItem>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(quote.id, quote.title)
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      
      {/* ActivityLog Dialog */}
      <RelatedRecordsDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        entity="Quote"
        entityId={quote.id}
        entityTitle={quote.title}
      />
    </ContextMenu>
  )
}

export default function QuoteKanbanChart({ data, onEdit, onDelete, onStatusChange, onView }: QuoteKanbanChartProps) {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragLocalData, setDragLocalData] = useState<any[] | null>(null) // Drag & drop için local state
  const [localData, setLocalData] = useState(data) // ✅ ÇÖZÜM: useEffect ile state güncelle

  // Local data'yı güncelle (data prop değiştiğinde) - useEffect kullan
  // Her zaman totalValue hesapla (API'den gelmese bile)
  useEffect(() => {
    // Eğer data'da totalValue yoksa, quotes'den hesapla
    const dataWithTotalValue = (data || []).map((col: any) => {
      // Eğer totalValue zaten varsa kullan, yoksa quotes'den hesapla
      if (col.totalValue !== undefined && col.totalValue !== null) {
        return col
      }
      // totalValue yoksa quotes'den hesapla - DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
      const calculatedTotalValue = (col.quotes || []).reduce((sum: number, q: any) => {
        const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
        return sum + quoteValue
      }, 0)
      return {
        ...col,
        totalValue: calculatedTotalValue,
      }
    })
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('QuoteKanbanChart data updated:', {
        dataLength: data?.length,
        dataRef: data, // Referans kontrolü için
        data: dataWithTotalValue.map((col: any) => ({
          status: col.status,
          count: col.count,
          totalValue: col.totalValue,
          quotesCount: col.quotes?.length,
        })),
      })
    }
    
    // ✅ ÇÖZÜM: Her zaman state'i güncelle - data prop değiştiğinde anında güncellenir
    // ÖNEMLİ: dragLocalData varsa displayData'da onu kullanacağız, yoksa localData'yı kullanacağız
    // ÖNEMLİ: data prop'u değiştiğinde her zaman localData'yı güncelle - optimistic update için
    setLocalData(dataWithTotalValue)
  }, [data])

  // Drag & drop için local state varsa onu kullan, yoksa localData'yı kullan
  // ✅ ÇÖZÜM: dragLocalData null ise localData'yı kullan - optimistic update için
  const displayData = dragLocalData || localData

  // ✅ PREMIUM: Optimized sensors for smooth drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // ✅ 5px - Daha hassas, daha hızlı aktivasyon
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5, // ✅ 5px - Touch için de aynı
        delay: 50, // ✅ 50ms - Daha hızlı aktivasyon, yanlışlıkla drag'i önle
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Memoize handlers for performance
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Aynı status içinde hareket (sıralama değişikliği) veya farklı status'e taşıma
    const activeStatus = displayData.find((col) => col.quotes.some((q) => q.id === activeId))
    
    // overId bir quote ID'si mi yoksa status ID'si mi kontrol et
    let overStatus = displayData.find((col) => col.quotes.some((q) => q.id === overId))
    
    // Eğer quote ID değilse, status ID olabilir (boş kolona drop)
    if (!overStatus) {
      overStatus = displayData.find((col) => col.status === overId)
    }

    if (!activeStatus || !overStatus) return

    // Farklı status'e taşıma
    if (activeStatus.status !== overStatus.status) {
      const quote = activeStatus.quotes.find((q) => q.id === activeId)
      if (!quote) return

      // ✅ PREMIUM: FRONTEND VALIDATION - Geçersiz geçişleri engelle (kartı taşıma!)
      const currentStatus = activeStatus.status
      const targetStatus = overStatus.status

      // Immutable kontrol
      if (isQuoteImmutable(currentStatus)) {
        const message = getStageMessage(currentStatus, 'quote', 'immutable')
        toast.error(message.title, message.description) // ✅ Toast zaten 4 saniye gösteriyor
        // ✅ Kartı taşıma - sadece hata göster
        return
      }

      // Transition validation
      const validation = isValidQuoteTransition(currentStatus, targetStatus)
      if (!validation.valid) {
        const allowed = validation.allowed || []
        const currentName = translateStage(currentStatus, 'quote')
        const targetName = translateStage(targetStatus, 'quote')
        const allowedNames = allowed.map((s: string) => translateStage(s, 'quote')).join(', ')
        
        toast.error(
          `${currentName} → ${targetName} geçişi yapılamıyor`,
          allowed.length > 0 
            ? `Bu teklifi şu durumlara taşıyabilirsiniz: ${allowedNames}` 
            : getStageMessage(currentStatus, 'quote', 'transition').description
        ) // ✅ Toast zaten 4 saniye gösteriyor
        // ✅ Kartı taşıma - sadece hata göster
        return
      }

      // Optimistic update - hemen UI'da göster (totalValue anlık güncellenir)
      const newData = displayData.map((col) => {
        if (col.status === activeStatus.status) {
          // Eski status'den kaldır - totalValue'yu da anlık güncelle
          const updatedQuotes = col.quotes.filter((q) => q.id !== activeId)
          // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
          const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
            const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
            return sum + quoteValue
          }, 0)
          return {
            ...col,
            quotes: updatedQuotes,
            count: col.count - 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        if (col.status === overStatus.status) {
          // Yeni status'e ekle - totalValue'yu da anlık güncelle
          const updatedQuotes = [...col.quotes, quote]
          // DÜZELTME: totalAmount kullan (050 migration ile total → totalAmount, total kolonu artık yok!)
          const updatedTotalValue = updatedQuotes.reduce((sum: number, q: any) => {
            const quoteValue = q.totalAmount || (typeof q.totalAmount === 'string' ? parseFloat(q.totalAmount) || 0 : 0)
            return sum + quoteValue
          }, 0)
          return {
            ...col,
            quotes: updatedQuotes,
            count: col.count + 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        return col
      })

      // Drag & drop için local state'i güncelle
      setDragLocalData(newData)

      // API'ye update gönder
      if (onStatusChange) {
        try {
          await onStatusChange(activeId, overStatus.status)
          
          // Başarılı olduğunda drag local state'i temizle - computed data kullanılacak
          setDragLocalData(null)
          
          // ACCEPTED olduğunda Invoice oluşturulduğunu bildir
          if (overStatus.status === 'ACCEPTED') {
            toast.success(
              'Teklif kabul edildi',
              'Teklif kabul edildi. Fatura ve sözleşme otomatik olarak oluşturuldu. Faturalar sayfasından kontrol edebilirsiniz.',
              {
                label: 'Faturalar Sayfasına Git',
                onClick: () => window.location.href = `/${locale}/invoices`,
              }
            )
          } else if (overStatus.status === 'REJECTED') {
            toast.success(
              'Teklif reddedildi',
              'Teklif reddedildi. Revizyon görevi otomatik olarak oluşturuldu. Görevler sayfasından kontrol edebilirsiniz.',
              {
                label: 'Görevler Sayfasına Git',
                onClick: () => window.location.href = `/${locale}/tasks`,
              }
            )
          }
        } catch (error: any) {
          // Hata durumunda eski haline geri dön
          setDragLocalData(null) // Drag local state'i temizle - computed data kullanılacak
          toast.error('Teklif durumu değiştirilemedi', error?.message)
        }
      }
    } else {
      // Aynı status içinde sıralama değişikliği
      const oldIndex = activeStatus.quotes.findIndex((q) => q.id === activeId)
      const newIndex = activeStatus.quotes.findIndex((q) => q.id === overId)

      if (oldIndex !== newIndex) {
        const newQuotes = arrayMove(activeStatus.quotes, oldIndex, newIndex)
        const newData = displayData.map((col) =>
          col.status === activeStatus.status ? { ...col, quotes: newQuotes } : col
        )
        // Drag & drop için local state'i güncelle
        setDragLocalData(newData)

        // ✅ Sıralamayı API'ye kaydet - batch order update
        try {
          const orders = newQuotes.map((quote: any, index) => ({
            id: quote.id,
            displayOrder: index + 1, // 1-based index
          }))

          const res = await fetch('/api/quotes/batch-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders }),
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            console.error('Batch order update error:', errorData)
            // Hata durumunda eski haline geri dön
            setDragLocalData(null) // Drag local state'i temizle - computed data kullanılacak
            toast.error('Sıralama kaydedilemedi', errorData.error || 'Bir hata oluştu.')
          } else {
            // Başarılı olduğunda drag local state'i temizle - computed data kullanılacak
            setDragLocalData(null)
          }
        } catch (error: any) {
          console.error('Batch order update error:', error)
          // Hata durumunda eski haline geri dön
          setDragLocalData(null) // Drag local state'i temizle - computed data kullanılacak
          toast.error('Sıralama kaydedilemedi', error?.message || 'Bir hata oluştu.')
        }
      }
    }
  }

  const activeQuote = displayData
    .flatMap((col) => col.quotes)
    .find((quote) => quote.id === activeId)

  // ✅ PREMIUM: Smooth drop animation
  const dropAnimation: DropAnimation = useMemo(() => ({
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.85',
          scale: '1.02',
        },
      },
    }),
    duration: 150, // ✅ 150ms - Daha hızlı ve smooth drop animation
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ✅ Daha smooth easing (ease-out-quad)
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
      {/* Horizontal Scroll Controls */}
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
          const colors = statusColors[column.status] || statusColors.DRAFT
          return (
            <Card
              key={column.status}
              id={column.status}
              className={`min-w-[280px] max-w-[320px] flex-shrink-0 flex flex-col ${colors.bg} ${colors.border} border-2`}
            >
              {/* Column Header */}
              <div className={`p-4 border-b-2 ${colors.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${colors.text}`}>
                      {statusLabels[column.status] || column.status}
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
                            <p className="text-sm leading-relaxed text-gray-800 font-medium">{statusInfoMessages[column.status] || 'Bu aşama hakkında bilgi'}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Badge className={statusBadgeColors[column.status] || 'bg-gray-500 text-white'}>
                    {column.count}
                  </Badge>
                </div>
                {/* Toplam Tutar - Her status için (her zaman göster, drag-drop sonrası anlık güncellenir) */}
                <div className="flex items-center justify-end mt-1">
                  <span className="text-sm font-semibold text-primary-600">
                    {new Intl.NumberFormat('tr-TR', { 
                      style: 'currency', 
                      currency: 'TRY' 
                    }).format(column.quotes.reduce((sum, q: any) => sum + (q.totalAmount || 0), 0))}
                  </span>
                </div>
              </div>


              {/* Cards - Droppable Area */}
              <DroppableColumn status={column.status}>
                <SortableContext
                  items={column.quotes.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
                    {column.quotes.length === 0 ? (
                      <div className={`text-center py-8 text-sm ${colors.text} opacity-60 border-2 border-dashed ${colors.border} rounded-lg`}>
                        Bu statüde teklif yok
                        <br />
                        <span className="text-xs text-gray-500 mt-2 block">
                          Teklifleri buraya sürükleyin
                        </span>
                      </div>
                    ) : (
                      column.quotes.map((quote) => (
                        <SortableQuoteCard
                          key={quote.id}
                          quote={quote}
                          status={column.status}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onStatusChange={onStatusChange}
                          onView={onView} // ✅ ÇÖZÜM: Modal açmak için callback
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
        {activeQuote ? (
          <Card 
            className="bg-white border-2 border-primary-500 shadow-2xl min-w-[300px] rotate-1 transition-all duration-150"
            style={{
              willChange: 'transform, opacity',
              transform: 'translate3d(0, 0, 0) scale(1.02) translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitTransform: 'translate3d(0, 0, 0) scale(1.02) translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitPerspective: 1000,
              pointerEvents: 'none',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              // ✅ GPU acceleration optimizations
              WebkitTransformStyle: 'preserve-3d',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {activeQuote.title}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {formatCurrency((activeQuote as any).totalAmount || 0)}
              </p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}





