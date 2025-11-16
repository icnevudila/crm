'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { toast, toastError, toastSuccess } from '@/lib/toast'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Briefcase, Edit, Trash2, Eye, GripVertical, Info, History, ChevronLeft, ChevronRight, Sparkles, FileText, Calendar, CheckSquare, Receipt, StickyNote } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { getStatusHeaderClass, getStatusColor, getStatusBadgeClass } from '@/lib/crm-colors'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  DndContext,
  DragOverlay,
  closestCenter,
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
import RelatedRecordsDialog from '@/components/activity/RelatedRecordsDialog'
import { translateStage, getStageMessage } from '@/lib/stageTranslations'
import MeetingForm from '@/components/meetings/MeetingForm'
import QuoteForm from '@/components/quotes/QuoteForm'
import SendEmailButton from '@/components/integrations/SendEmailButton'
import SendSmsButton from '@/components/integrations/SendSmsButton'
import SendWhatsAppButton from '@/components/integrations/SendWhatsAppButton'
import AddToCalendarButton from '@/components/integrations/AddToCalendarButton'

interface DealKanbanChartProps {
  data: Array<{ 
    stage: string
    count: number
    totalValue?: number // Her stage için toplam tutar
    deals: Array<{ 
      id: string
      title: string
      value: number
      customerId?: string
      customer?: { name: string; id?: string }
      Customer?: { name: string; id?: string }
      status?: string
      createdAt?: string
      lostReason?: string // Kayıp sebebi
    }> 
  }>
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
  onStageChange?: (dealId: string, newStage: string) => void | Promise<void>
  onView?: (dealId: string) => void // ✅ ÇÖZÜM: Modal açmak için callback
  onQuickAction?: (type: 'quote' | 'invoice' | 'task' | 'meeting', deal: any) => void // Quick action callback
}

const stageLabels: Record<string, string> = {
  LEAD: 'Potansiyel',
  CONTACTED: 'İletişimde',
  PROPOSAL: 'Teklif',
  NEGOTIATION: 'Pazarlık',
  WON: 'Kazanıldı',
  LOST: 'Kaybedildi',
}

// ✅ Merkezi renk sistemi kullanılıyor - getStatusColor ile

// ✅ Merkezi renk sistemi kullanılıyor - getStatusHeaderClass ile

// Her aşama için bilgilendirme mesajları - CRM'e uygun yönlendirici mesajlar (kart içinde gösterilecek)
const stageInfoMessages: Record<string, string> = {
  LEAD: '💡 Bu aşamada: Müşteri ile iletişime geçin. Detay sayfasında "İletişime Geç" butonunu kullanın. İletişim kurduktan sonra fırsatı "İletişimde" aşamasına taşıyın.',
  CONTACTED: '💡 Bu aşamada: Teklif oluşturun. Detay sayfasında "Teklif Oluştur" butonunu kullanın. Teklif hazır olduğunda fırsatı "Teklif" aşamasına taşıyın.',
  PROPOSAL: '💡 Bu aşamada: Görüşme planlayın. Detay sayfasında "Görüşme Planla" butonunu kullanın. Teklif sunumu yaptıktan sonra fırsatı "Pazarlık" aşamasına taşıyın.',
  NEGOTIATION: '💡 Bu aşamada: Pazarlık yapın. Detay sayfasında "Kazanıldı" veya "Kaybedildi" butonlarını kullanın. Kazanıldığında otomatik olarak sözleşme oluşturulur.',
  WON: '✅ Fırsat kazanıldı! Otomatik olarak sözleşme oluşturuldu. Sözleşmeler sayfasından kontrol edebilirsiniz. Bu aşamadaki fırsatlar değiştirilemez.',
  LOST: '❌ Fırsat kaybedildi. Kayıp nedeni kaydedildi. Yeni bir fırsat oluşturmak için Fırsatlar sayfasından "Yeni Fırsat" butonunu kullanın. Bu aşamadaki fırsatlar değiştirilemez.',
}

// ✅ PREMIUM: Droppable Column Component - Smooth hover effects
function DroppableColumn({ stage, children }: { stage: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
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

// Sortable Deal Card Component
function SortableDealCard({ deal, stage, onEdit, onDelete, onStageChange, onOpenMeetingDialog, onOpenQuoteDialog, onOpenWonDialog, onOpenLostDialog, onView, onQuickAction }: {
  deal: any
  stage: string
  onEdit?: (deal: any) => void
  onDelete?: (id: string, title: string) => void
  onStageChange?: (dealId: string, newStage: string) => void | Promise<void>
  onOpenMeetingDialog?: (deal: any) => void
  onOpenQuoteDialog?: (deal: any) => void
  onOpenWonDialog?: (deal: any) => void
  onOpenLostDialog?: (deal: any) => void
  onView?: (dealId: string) => void // ✅ ÇÖZÜM: Modal açmak için callback
  onQuickAction?: (type: 'quote' | 'invoice' | 'task' | 'meeting', deal: any) => void // Quick action callback
}) {
  const locale = useLocale()
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  
  // Kilitli durum kontrolü - WON ve LOST durumları taşınamaz
  const isLocked = isDealImmutable(stage)
  
  // ✅ Drag & drop şimdilik olduğu gibi - sonra düzeltilecek
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: deal.id, disabled: isLocked })

  // ✅ PREMIUM: Ultra-smooth drag animations with GPU acceleration - Optimized for performance
  const x = transform?.x ?? 0
  const y = transform?.y ?? 0
  const style: React.CSSProperties = transform 
    ? {
        transform: `translate3d(${x}px,${y}px,0)`,
        WebkitTransform: `translate3d(${x}px,${y}px,0) translateZ(0)`,
        transition: 'none', // ✅ Drag sırasında transition YOK - daha smooth
        willChange: 'transform',
        opacity: isDragging ? 0.95 : 1, // ✅ Daha görünür (0.7 yerine 0.95)
        cursor: !isLocked ? (isDragging ? 'grabbing' : 'grab') : 'not-allowed',
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        isolation: 'isolate',
        zIndex: isDragging ? 9999 : 1, // ✅ Drag sırasında en üstte
        // ✅ GPU acceleration optimizations - Minimal properties for better performance
        WebkitBackfaceVisibility: 'hidden',
        pointerEvents: isDragging ? 'none' : 'auto', // ✅ Drag sırasında pointer events kapalı
      }
    : {
        transition: isDragging ? 'none' : 'transform 100ms ease-out, opacity 100ms ease-out', // ✅ Daha hızlı (100ms)
        willChange: !isLocked ? 'transform' : 'auto',
        opacity: 1,
        cursor: !isLocked ? 'grab' : 'not-allowed',
        // ✅ Minimal GPU optimizations
        WebkitBackfaceVisibility: 'hidden',
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
      {...(!isLocked ? attributes : {})}
      style={{
        ...style,
        contain: 'layout style paint',
        isolation: 'isolate', // Force GPU layer
      }}
      className={`bg-white border-2 ${
        isDragging ? '' : 'transition-all duration-150' // ✅ Drag sırasında transition YOK
      } ${
        isLocked 
          ? stage === 'WON'
            ? 'border-green-300 bg-green-50/30 hover:border-green-400 cursor-not-allowed'
            : 'border-red-300 bg-red-50/30 hover:border-red-400 cursor-not-allowed'
          : 'hover:border-primary-400 hover:shadow-lg cursor-grab active:cursor-grabbing'
      } relative ${
        isDragging ? 'shadow-xl scale-[1.05] rotate-2 z-50' : 'hover:scale-[1.01]' // ✅ Drag sırasında daha belirgin
      }`}
      {...(!isLocked ? listeners : {})}
    >
      {/* Kilitli Durum Badge - Kilitli kartlarda göster */}
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
            <Briefcase className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                  {deal.title}
                </p>
                {/* LOST durumunda lostReason gösterimi - hover ile tooltip */}
                {stage === 'LOST' && deal.lostReason && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-shrink-0">
                          <Info className="h-3.5 w-3.5 text-red-600 cursor-help" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs font-semibold text-red-800 mb-1">🔴 Kayıp Sebebi:</p>
                        <p className="text-xs text-red-700 whitespace-pre-wrap">
                          {deal.lostReason}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
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
            <p className="text-xs text-gray-500 mb-2">
              {new Date(deal.createdAt).toLocaleDateString('tr-TR')}
            </p>
          )}

          {/* Quick Action Buttons - Stage'e göre değişir */}
          <div className="mb-3 pt-2 border-t border-gray-200">
            {stage === 'LEAD' && (
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
                        
                        // Önce müşteri kontrolü yap - customerId varsa müşterinin gerçekten var olduğunu kontrol et
                        const customerId = deal.customerId || deal.Customer?.id
                        let customerExists = false
                        
                        if (customerId) {
                          try {
                            // Müşterinin var olup olmadığını kontrol et (GET ile, 404 dönerse müşteri yok)
                            const customerCheck = await fetch(`/api/customers/${customerId}`, {
                              method: 'GET',
                              cache: 'no-store',
                              credentials: 'include',
                            })
                            
                            // 200-299 arası başarılı, 404 müşteri yok, diğerleri hata
                            customerExists = customerCheck.ok && customerCheck.status !== 404
                            
                            if (!customerExists && customerCheck.status === 404) {
                              // Müşteri bulunamadı - yeni müşteri oluştur sayfasına yönlendir
                              toast.info('Müşteri bulunamadı', {
                                description: 'Bu fırsat için müşteri kaydı bulunamadı. Yeni müşteri oluşturmanız gerekiyor.',
                                action: {
                                  label: 'Yeni Müşteri Oluştur',
                                  onClick: () => window.open(`/${locale}/customers/new?dealId=${deal.id}`, '_blank'),
                                },
                              })
                            } else if (!customerExists) {
                              // Başka bir hata var
                              const errorData = await customerCheck.json().catch(() => ({}))
                              toastError('Müşteri kontrolü başarısız', errorData.message || 'Müşteri bilgilerine erişirken bir hata oluştu.')
                            }
                          } catch (err) {
                            // Network hatası veya başka bir hata
                            customerExists = false
                            if (process.env.NODE_ENV === 'development') {
                              console.warn('Customer check error:', err)
                            }
                            toastError('Müşteri kontrolü başarısız', 'Müşteri bilgilerine erişirken bir hata oluştu. Yeni müşteri oluşturmayı deneyin.')
                          }
                        }
                        
                        // Müşteri varsa detay sayfasına yönlendir
                        if (customerId && customerExists) {
                          toast.info('Müşteri sayfasına yönlendiriliyorsunuz...', {
                            description: 'Müşteri bilgilerini kontrol edip iletişime geçebilirsiniz.',
                            action: {
                              label: 'Müşteri Sayfasına Git',
                              onClick: () => window.open(`/${locale}/customers/${customerId}`, '_blank'),
                            },
                          })
                        } else if (!customerId) {
                          // customerId yoksa direkt yeni müşteri oluştur sayfasına yönlendir
                          toast.info('Yeni müşteri oluşturun', {
                            description: 'Bu fırsat için önce müşteri kaydı oluşturmanız gerekiyor.',
                            action: {
                              label: 'Yeni Müşteri Oluştur',
                              onClick: () => window.open(`/${locale}/customers/new?dealId=${deal.id}`, '_blank'),
                            },
                          })
                        }
                        
                        // Sonra deal'ın stage'ini CONTACTED'a taşı
                        try {
                          const res = await fetch(`/api/deals/${deal.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stage: 'CONTACTED' }),
                          })
                          
                          if (!res.ok) {
                            const errorData = await res.json().catch(() => ({}))
                            const errorMessage = errorData.message || errorData.error || 'Bir hata oluştu.'
                            toastError('Aşama değiştirilemedi', errorMessage)
                            return
                          }
                          
                          // Başarılı oldu
                          const updatedDeal = await res.json().catch(() => null)
                          
                          // onStageChange callback'ini çağır (parent component cache'i güncelleyecek)
                          if (onStageChange) {
                            await onStageChange(deal.id, 'CONTACTED')
                            toastSuccess('Fırsat aşaması güncellendi', `Fırsat "${deal.title}" başarıyla "İletişimde" aşamasına taşındı.`)
                          }
                        } catch (error: any) {
                          console.error('Stage change error:', error)
                          toastError('Aşama değiştirilemedi', error?.message || 'Bir hata oluştu.')
                        }
                      }}
                    >
                      İletişime Geç
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Müşteri ile iletişime geçildi olarak işaretle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {stage === 'CONTACTED' && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (dragMode || isDragging) return
                        
                        // Modal'da teklif formunu aç
                        onOpenQuoteDialog?.(deal)
                      }}
                    >
                      Teklif Oluştur
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bu fırsat için yeni teklif oluştur</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {stage === 'PROPOSAL' && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-7 text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (dragMode || isDragging) return
                        
                        // Modal'da görüşme formunu aç
                        onOpenMeetingDialog?.(deal)
                      }}
                    >
                      Görüşme Planla
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bu fırsat için görüşme planla</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {stage === 'NEGOTIATION' && (
              <div className="flex gap-2">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (dragMode || isDragging) return
                          // Modal aç - parent component'te handle edilecek
                          onOpenWonDialog?.(deal)
                        }}
                      >
                        Kazanıldı
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fırsatı kazanıldı olarak işaretle. Otomatik olarak sözleşme oluşturulur.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (dragMode || isDragging) return
                          // Dialog aç
                          onOpenLostDialog?.(deal)
                        }}
                      >
                        Kaybedildi
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Fırsatı kaybedildi olarak işaretle</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Integration Buttons - Müşteri bilgileri varsa göster */}
          {customer && (
            <div className="flex gap-1 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
              {customer.email && (
                <SendEmailButton
                  to={customer.email}
                  subject={`Fırsat: ${deal.title}`}
                  html={`
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <h2 style="color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
                        Fırsat Bilgileri
                      </h2>
                      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <p><strong>Fırsat:</strong> ${deal.title}</p>
                        <p><strong>Durum:</strong> ${stageLabels[deal.stage] || deal.stage}</p>
                        ${deal.value ? `<p><strong>Tutar:</strong> ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(deal.value)}</p>` : ''}
                        ${deal.expectedCloseDate ? `<p><strong>Beklenen Kapanış:</strong> ${new Date(deal.expectedCloseDate).toLocaleDateString('tr-TR')}</p>` : ''}
                      </div>
                    </div>
                  `}
                  category="DEAL"
                  entityData={deal}
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-6 text-xs px-1"
                />
              )}
              {customer.phone && (
                <>
                  <SendSmsButton
                    to={customer.phone}
                    message={`Merhaba, "${deal.title}" fırsatı hakkında sizinle iletişime geçmek istiyoruz.`}
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-6 text-xs px-1"
                  />
                  <SendWhatsAppButton
                    to={customer.phone}
                    message={`Merhaba, "${deal.title}" fırsatı hakkında sizinle iletişime geçmek istiyoruz.`}
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-6 text-xs px-1"
                  />
                </>
              )}
              {deal.expectedCloseDate && (
                <AddToCalendarButton
                  recordType="deal"
                  record={deal}
                  startTime={new Date(deal.expectedCloseDate).toISOString()}
                  endTime={new Date(new Date(deal.expectedCloseDate).getTime() + 60 * 60 * 1000).toISOString()}
                  location={customer?.name || ''}
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-6 text-xs px-1"
                />
              )}
            </div>
          )}

          {/* Action Buttons - Daha düzenli ve okunabilir */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200 relative z-50" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            {onQuickAction && (
              <DropdownMenu>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 p-0 border-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 relative overflow-hidden group"
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          <Sparkles className="h-4 w-4 relative z-10" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>Hızlı İşlemler</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Hızlı İşlemler</DropdownMenuLabel>
                  {/* LEAD: Sadece görüşme planla (ilk temas) */}
                  {stage === 'LEAD' && (
                    <DropdownMenuItem
                      onSelect={() => onQuickAction('meeting', deal)}
                      className="text-xs"
                    >
                      <Calendar className="h-3 w-3 mr-2" />
                      Görüşme Planla
                    </DropdownMenuItem>
                  )}
                  {/* CONTACTED: Görüşme planla, görev oluştur (takip için) */}
                  {stage === 'CONTACTED' && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('meeting', deal)}
                        className="text-xs"
                      >
                        <Calendar className="h-3 w-3 mr-2" />
                        Görüşme Planla
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('task', deal)}
                        className="text-xs"
                      >
                        <CheckSquare className="h-3 w-3 mr-2" />
                        Görev Oluştur
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* PROPOSAL: Teklif oluştur, görüşme planla (teklif sunumu) */}
                  {stage === 'PROPOSAL' && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('quote', deal)}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Teklif Oluştur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('meeting', deal)}
                        className="text-xs"
                      >
                        <Calendar className="h-3 w-3 mr-2" />
                        Görüşme Planla
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* NEGOTIATION: Teklif oluştur, görev oluştur (revizyonlar için) */}
                  {stage === 'NEGOTIATION' && (
                    <>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('quote', deal)}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-2" />
                        Teklif Oluştur
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onQuickAction('task', deal)}
                        className="text-xs"
                      >
                        <CheckSquare className="h-3 w-3 mr-2" />
                        Görev Oluştur
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* WON: Fatura oluştur (fatura kesmek için) */}
                  {stage === 'WON' && (
                    <DropdownMenuItem
                      onSelect={() => onQuickAction('invoice', deal)}
                      className="text-xs"
                    >
                      <Receipt className="h-3 w-3 mr-2" />
                      Fatura Oluştur
                    </DropdownMenuItem>
                  )}
                  {/* LOST: Hiçbir quick action yok (kilitli) */}
                  {stage === 'LOST' && (
                    <DropdownMenuItem disabled className="text-xs text-gray-400">
                      Bu aşamada işlem yapılamaz
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* Geçmiş Butonu - Sadece ikon */}
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
            
            {/* Görüntüle Butonu - Sadece ikon */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // ✅ ÇÖZÜM: Modal aç - yeni sekme açma
                      if (onView) {
                        try {
                        onView(deal.id)
                        } catch (error) {
                          console.error('View error:', error)
                          // Fallback: Eğer hata olursa yeni sekmede aç
                          window.open(`/${locale}/deals/${deal.id}`, '_blank')
                        }
                      } else {
                        // Fallback: Eğer onView yoksa yeni sekmede aç (eski davranış)
                        window.open(`/${locale}/deals/${deal.id}`, '_blank')
                      }
                    }}
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fırsat detaylarını görüntüle</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Düzenle Butonu - Sadece ikon */}
            {onEdit && (
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
                        handleEdit(e)
                      }}
                    >
                      <Edit className="h-4 w-4 text-indigo-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fırsat bilgilerini düzenle</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Sil Butonu - Sadece ikon */}
            {onDelete && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(e)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fırsatı sil</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </Link>
      
      {/* Related Records Dialog */}
      <RelatedRecordsDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        entity="Deal"
        entityId={deal.id}
        entityTitle={deal.title}
      />
    </Card>
  )
}

export default function DealKanbanChart({ data, onEdit, onDelete, onStageChange, onView, onQuickAction }: DealKanbanChartProps) {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localData, setLocalData] = useState<any[]>(Array.isArray(data) ? data : [])
  const [lostDialogOpen, setLostDialogOpen] = useState(false)
  const [losingDealId, setLosingDealId] = useState<string | null>(null)
  const [lostReason, setLostReason] = useState('')
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [selectedDealForMeeting, setSelectedDealForMeeting] = useState<any>(null)
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)
  const [selectedDealForQuote, setSelectedDealForQuote] = useState<any>(null)
  const [wonDialogOpen, setWonDialogOpen] = useState(false)
  const [winningDealId, setWinningDealId] = useState<string | null>(null)
  

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
      console.log('DealKanbanChart data prop changed:', {
        dataLength: data?.length,
        data: dataWithTotalValue.map((col: any) => ({
          stage: col.stage,
          count: col.count,
          totalValue: col.totalValue,
          dealsCount: col.deals?.length,
          dealIds: col.deals?.map((d: any) => d.id).slice(0, 3), // İlk 3 deal ID'si
        })),
        localDataLength: localData?.length,
        localDataStages: localData?.map((col: any) => ({
          stage: col.stage,
          count: col.count,
          dealsCount: col.deals?.length,
        })),
      })
    }
    
    // ÖNEMLİ: Eğer localData boşsa veya data prop'u değiştiyse güncelle
    // Ama optimistic update'i korumak için, sadece data prop'u gerçekten farklıysa güncelle
    // (localData.length === 0 ise ilk yükleme, güncelle)
    setLocalData((prevLocalData) => {
      if (prevLocalData.length === 0) {
        return dataWithTotalValue
      }
      
      // Data prop'u ile localData'yı karşılaştır
      // Eğer deal'ler aynıysa güncelleme yapma (optimistic update korunur)
      const dataChanged = dataWithTotalValue.some((dataCol: any, index: number) => {
        const localCol = prevLocalData[index]
        if (!localCol) return true // Yeni kolon eklendi
        
        // Deal ID'lerini karşılaştır
        const localDealIds = (localCol.deals || []).map((d: any) => d.id).sort()
        const dataDealIds = (dataCol.deals || []).map((d: any) => d.id).sort()
        
        if (localDealIds.length !== dataDealIds.length) return true
        
        // Her deal ID'sini kontrol et
        return localDealIds.some((id: string, i: number) => id !== dataDealIds[i])
      })
      
      if (dataChanged) {
        if (process.env.NODE_ENV === 'development') {
          console.log('DealKanbanChart: Data changed, updating localData')
        }
        return dataWithTotalValue
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('DealKanbanChart: Data unchanged, keeping localData (optimistic update preserved)')
        }
        return prevLocalData
      }
    })
  }, [data]) // localData'yı dependency'den çıkar - sadece data prop'unu izle

  // ✅ PREMIUM: Optimized sensors for smooth drag & drop
  // ✅ Optimized sensors for smooth drag & drop - Better performance
  // ✅ ÇÖZÜM: Anında aktif olan drag & drop - activation constraint yok
  const sensors = useSensors(
    useSensor(PointerSensor), // ✅ Activation constraint yok - anında başlar
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0, // ✅ 0ms delay - anında başlar
        tolerance: 5, // ✅ 5px tolerance - yanlışlıkla drag'i önler ama çok hızlı
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

      // ✅ PREMIUM: FRONTEND VALIDATION - Geçersiz geçişleri engelle (kartı taşıma!)
      const currentStage = activeStage.stage
      const targetStage = overStage.stage

      // Immutable kontrol
      if (isDealImmutable(currentStage)) {
        const message = getStageMessage(currentStage, 'deal', 'immutable')
        toastError(message.title, message.description) // ✅ Toast zaten 4 saniye gösteriyor
        // ✅ Kartı taşıma - sadece hata göster
        return
      }

      // Transition validation
      const validation = isValidDealTransition(currentStage, targetStage)
      if (!validation.valid) {
        const allowed = validation.allowed || []
        const currentName = translateStage(currentStage, 'deal')
        const targetName = translateStage(targetStage, 'deal')
        const allowedNames = allowed.map((s: string) => translateStage(s, 'deal')).join(', ')
        
        toastError(
          `${currentName} → ${targetName} geçişi yapılamıyor`,
          allowed.length > 0 
            ? `Bu fırsatı şu aşamalara taşıyabilirsiniz: ${allowedNames}` 
            : getStageMessage(currentStage, 'deal', 'transition').description
        ) // ✅ Toast zaten 4 saniye gösteriyor
        // ✅ Kartı taşıma - sadece hata göster
        return
      }

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
          // Toast mesajları DealList.tsx'teki handler'da gösteriliyor
      } catch (error: any) {
          // Hata durumunda eski haline geri dön
          setLocalData(data)
          toastError('Aşama değiştirilemedi', error?.message || 'Bir hata oluştu.')
        }
      } else {
        // onStageChange yoksa hata göster
        setLocalData(data) // Optimistic update'i geri al
        toastError('Aşama değiştirilemedi', 'onStageChange callback tanımlı değil')
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

        // ✅ Sıralamayı API'ye kaydet - batch order update
        try {
          const orders = newDeals.map((deal: any, index) => ({
            id: deal.id,
            displayOrder: index + 1, // 1-based index
          }))

          const res = await fetch('/api/deals/batch-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders }),
          })

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            console.error('Batch order update error:', errorData)
            // Hata durumunda eski haline geri dön
            setLocalData(localData)
            toastError('Sıralama kaydedilemedi', errorData.error || 'Bir hata oluştu.')
          }
        } catch (error: any) {
          console.error('Batch order update error:', error)
          // Hata durumunda eski haline geri dön
          setLocalData(localData)
          toastError('Sıralama kaydedilemedi', error?.message || 'Bir hata oluştu.')
        }
      }
    }
  }

  const activeDeal = Array.isArray(localData)
    ? localData
        .filter((col): col is typeof localData[number] & { deals: any[] } => Array.isArray(col.deals))
        .flatMap((col) => col.deals)
        .find((deal) => deal.id === activeId)
    : undefined

  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleHorizontalScroll = useCallback((direction: 'left' | 'right') => {
    const node = scrollContainerRef.current
    if (!node) return
    const delta = direction === 'left' ? -360 : 360
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin} // ✅ pointerWithin - Daha smooth collision detection
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
        {localData.map((column) => (
          <Card 
            key={column.stage} 
            id={column.stage}
            className={`flex-shrink-0 w-full max-w-[320px] min-w-[280px] flex flex-col border-2 ${getStatusHeaderClass(column.stage)}`}
          >
            {/* Column Header */}
            <div className={`p-4 border-b-2 ${getStatusHeaderClass(column.stage)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {stageLabels[column.stage] || column.stage}
                  </h3>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button 
                          type="button" 
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 rounded-full hover:bg-blue-100 border border-blue-300 hover:border-blue-400 bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                          title="Aşama bilgisi için tıklayın veya üzerine gelin"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="bottom" 
                        className="max-w-sm p-3 bg-white border-2 border-blue-300 shadow-xl z-[9999] text-left"
                        sideOffset={8}
                        align="start"
                      >
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm leading-relaxed text-gray-800 font-medium">{stageInfoMessages[column.stage] || 'Bu aşama hakkında bilgi'}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge className={`${getStatusBadgeClass(column.stage)} border`}>
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
                        onStageChange={onStageChange}
                        onOpenMeetingDialog={(deal) => {
                          setSelectedDealForMeeting(deal)
                          setMeetingDialogOpen(true)
                        }}
                        onOpenQuoteDialog={(deal) => {
                          setSelectedDealForQuote(deal)
                          setQuoteDialogOpen(true)
                        }}
                        onOpenWonDialog={(deal) => {
                          setWinningDealId(deal.id)
                          setWonDialogOpen(true)
                        }}
                        onOpenLostDialog={(deal) => {
                          setLosingDealId(deal.id)
                          setLostDialogOpen(true)
                        }}
                        onView={onView} // ✅ ÇÖZÜM: Modal açmak için callback
                        onQuickAction={onQuickAction} // Quick action callback
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          </Card>
        ))}
      </div>

      <DragOverlay dropAnimation={useMemo(() => ({
        sideEffects: defaultDropAnimationSideEffects({
          styles: { 
            active: { 
              opacity: '0.85',
              scale: '1.02',
            } 
          },
        }),
        duration: 150, // ✅ 150ms - Daha hızlı ve smooth drop animation
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // ✅ Daha smooth easing (ease-out-quad)
      }), [])}>
        {activeDeal ? (
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

      {/* WON Dialog - Onay sor */}
      <Dialog open={wonDialogOpen} onOpenChange={setWonDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fırsatı Kazanıldı Olarak İşaretle</DialogTitle>
            <DialogDescription>
              Bu fırsatı kazanıldı olarak işaretlemek istediğinize emin misiniz? Bu işlem sonrası otomatik olarak sözleşme oluşturulacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWonDialogOpen(false)
                setWinningDealId(null)
              }}
            >
              İptal
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                if (!winningDealId) {
                  toastError('Hata', 'Fırsat ID bulunamadı.')
                  setWonDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setWonDialogOpen(false)
                const dealId = winningDealId
                setWinningDealId(null)

                // API'ye gönder
                try {
                  const res = await fetch(`/api/deals/${dealId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      stage: 'WON',
                    }),
                  })
                  
                  if (!res.ok) {
                    const error = await res.json().catch(() => ({}))
                    throw new Error(error.error || 'Failed to mark deal as won')
                  }

                  const updatedDeal = await res.json()
                  
                  // Toast mesajı - sözleşme oluşturulduğunu bildir
                  toastSuccess('Fırsat kazanıldı!', 'Fırsat kazanıldı. Sözleşme otomatik olarak oluşturuldu. Sözleşmeler sayfasından kontrol edebilirsiniz.', {
                    action: {
                      label: 'Sözleşmeler Sayfasına Git',
                      onClick: () => window.location.href = `/${locale}/contracts`,
                    },
                  })

                  // Optimistic update - deal'i WON kolonuna taşı
                  const dealToMove = localData
                    .flatMap((col) => col.deals)
                    .find((d) => d.id === dealId)
                  
                  if (dealToMove) {
                    const newData = localData.map((col) => {
                      if (col.stage !== 'WON' && col.deals.some((d) => d.id === dealId)) {
                        // Eski stage'den kaldır
                        const updatedDeals = col.deals.filter((d) => d.id !== dealId)
                        const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                          const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                          return sum + dealValue
                        }, 0)
                        return {
                          ...col,
                          deals: updatedDeals,
                          count: Math.max(0, col.count - 1),
                          totalValue: updatedTotalValue,
                        }
                      }
                      if (col.stage === 'WON') {
                        // WON kolonuna ekle (eğer zaten yoksa)
                        const dealExists = col.deals.some((d) => d.id === dealId)
                        if (!dealExists) {
                          const updatedDeal = { ...dealToMove, stage: 'WON' }
                          const updatedDeals = [updatedDeal, ...col.deals]
                          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                            const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                            return sum + dealValue
                          }, 0)
                          return {
                            ...col,
                            deals: updatedDeals,
                            count: col.count + 1,
                            totalValue: updatedTotalValue,
                          }
                        }
                      }
                      return col
                    })
                    setLocalData(newData)
                  }

                  // onStageChange callback'ini çağır (parent component cache'i güncelleyecek)
                  if (onStageChange) {
                    await onStageChange(dealId, 'WON')
                  }
                } catch (error: any) {
                  console.error('Won error:', error)
                  toastError('Kazanıldı işaretleme başarısız', error?.message || 'Fırsat kazanıldı olarak işaretlenemedi.')
                }
              }}
            >
              Kazanıldı Olarak İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LOST Dialog - Kayıp sebebi sor */}
      <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fırsatı Kaybedildi Olarak İşaretle</DialogTitle>
            <DialogDescription>
              Fırsatı kaybedildi olarak işaretlemek için lütfen sebep belirtin. Bu sebep fırsat detay sayfasında not olarak görünecektir ve analiz görevi oluşturulacaktır.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lostReason">Kayıp Sebebi *</Label>
              <Textarea
                id="lostReason"
                placeholder="Örn: Fiyat uygun değil, Müşteri ihtiyacı değişti, Teknik uyumsuzluk, Rakipler daha avantajlı..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLostDialogOpen(false)
                setLostReason('')
                setLosingDealId(null)
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!lostReason.trim()) {
                  toastError('Sebep gerekli', 'Lütfen kayıp sebebini belirtin.')
                  return
                }

                if (!losingDealId) {
                  toastError('Hata', 'Fırsat ID bulunamadı.')
                  setLostDialogOpen(false)
                  return
                }

                // Dialog'u kapat
                setLostDialogOpen(false)
                const dealId = losingDealId
                const reason = lostReason.trim()
                setLostReason('')
                setLosingDealId(null)

                // API'ye gönder
                try {
                  const res = await fetch(`/api/deals/${dealId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      stage: 'LOST',
                      lostReason: reason,
                    }),
                  })
                  
                  if (!res.ok) {
                    const error = await res.json().catch(() => ({}))
                    throw new Error(error.error || 'Failed to mark deal as lost')
                  }

                  const updatedDeal = await res.json()
                  
                  // Toast mesajı - analiz görevi oluşturulduğunu bildir
                  toastSuccess('Fırsat kaybedildi olarak işaretlendi', 'Fırsat kaybedildi. Analiz görevi otomatik olarak oluşturuldu. Görevler sayfasından kontrol edebilirsiniz.', {
                    action: {
                      label: 'Görevler Sayfasına Git',
                      onClick: () => window.location.href = `/${locale}/tasks`,
                    },
                  })

                  // Optimistic update - deal'i LOST kolonuna taşı
                  const dealToMove = localData
                    .flatMap((col) => col.deals)
                    .find((d) => d.id === dealId)
                  
                  if (dealToMove) {
                    const newData = localData.map((col) => {
                      if (col.stage !== 'LOST' && col.deals.some((d) => d.id === dealId)) {
                        // Eski stage'den kaldır
                        const updatedDeals = col.deals.filter((d) => d.id !== dealId)
                        const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                          const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                          return sum + dealValue
                        }, 0)
                        return {
                          ...col,
                          deals: updatedDeals,
                          count: Math.max(0, col.count - 1),
                          totalValue: updatedTotalValue,
                        }
                      }
                      if (col.stage === 'LOST') {
                        // LOST kolonuna ekle (eğer zaten yoksa)
                        const dealExists = col.deals.some((d) => d.id === dealId)
                        if (!dealExists) {
                          const updatedDeal = { ...dealToMove, stage: 'LOST', lostReason: reason }
                          const updatedDeals = [updatedDeal, ...col.deals]
                          const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                            const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                            return sum + dealValue
                          }, 0)
                          return {
                            ...col,
                            deals: updatedDeals,
                            count: col.count + 1,
                            totalValue: updatedTotalValue,
                          }
                        }
                      }
                      return col
                    })
                    setLocalData(newData)
                  }

                  // onStageChange callback'ini çağır (parent component cache'i güncelleyecek)
                  if (onStageChange) {
                    await onStageChange(dealId, 'LOST')
                  }
                } catch (error: any) {
                  console.error('Lost error:', error)
                  toastError('Kayıp işaretleme başarısız', error?.message || 'Fırsat kaybedildi olarak işaretlenemedi.')
                }
              }}
              disabled={!lostReason.trim()}
            >
              Kaybedildi Olarak İşaretle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Form Modal */}
      <MeetingForm
        open={meetingDialogOpen}
        dealId={selectedDealForMeeting?.id}
        customerId={selectedDealForMeeting?.customerId || selectedDealForMeeting?.Customer?.id}
        onClose={() => {
          setMeetingDialogOpen(false)
          setSelectedDealForMeeting(null)
        }}
        onSuccess={async (savedMeeting: any) => {
          // Debug: API response'u logla
          if (process.env.NODE_ENV === 'development') {
            console.log('MeetingForm onSuccess:', {
              savedMeeting,
              dealStageUpdated: savedMeeting?.dealStageUpdated,
              selectedDealForMeeting,
              dealId: selectedDealForMeeting?.id,
              hasOnStageChange: !!onStageChange,
            })
          }

          // Modal'ı kapat
          setMeetingDialogOpen(false)
          
          // selectedDealForMeeting'i sakla - onStageChange'den önce kullanılacak
          const dealId = selectedDealForMeeting?.id
          const dealTitle = selectedDealForMeeting?.title
          const dealToMoveForUpdate = selectedDealForMeeting // Optimistic update için sakla
          
          // NOT: setSelectedDealForMeeting(null) optimistic update'ten SONRA yapılacak

          // Toast mesajları - görüşme oluşturuldu
          if (savedMeeting?.dealStageUpdated === true) {
            // Deal stage güncellendi - detaylı mesaj
            toastSuccess(
              'Görüşme oluşturuldu ve fırsat aşaması güncellendi',
              `${dealTitle || 'Fırsat'} için görüşme oluşturuldu. Fırsat otomatik olarak "Pazarlık" aşamasına taşındı.`,
              {
                action: {
                  label: 'Fırsatı Görüntüle',
                  onClick: () => window.location.href = `/${locale}/deals/${dealId}`,
                },
              }
            )

            // Cache'i güncelle - deal stage değiştiyse onStageChange çağır
            if (dealId && onStageChange) {
              try {
                // ÖNCE optimistic update yap - deal'i PROPOSAL'dan NEGOTIATION'a taşı
                const dealToMove = dealToMoveForUpdate
                if (dealToMove) {
                  const newData = localData.map((col) => {
                    if (col.stage === 'PROPOSAL') {
                      // PROPOSAL'dan kaldır
                      const updatedDeals = col.deals.filter((d) => d.id !== dealId)
                      const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                        const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                        return sum + dealValue
                      }, 0)
                      return {
                        ...col,
                        deals: updatedDeals,
                        count: Math.max(0, col.count - 1),
                        totalValue: updatedTotalValue,
                      }
                    }
                    if (col.stage === 'NEGOTIATION') {
                      // NEGOTIATION'a ekle (eğer zaten yoksa) - EN ÜSTE EKLE
                      const dealExists = col.deals.some((d) => d.id === dealId)
                      if (!dealExists) {
                        // Deal'in stage'ini NEGOTIATION olarak güncelle
                        const updatedDeal = { ...dealToMove, stage: 'NEGOTIATION' }
                        // EN ÜSTE EKLE - listenin başına ekle
                        const updatedDeals = [updatedDeal, ...col.deals]
                        const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                          const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                          return sum + dealValue
                        }, 0)
                        return {
                          ...col,
                          deals: updatedDeals,
                          count: col.count + 1,
                          totalValue: updatedTotalValue,
                        }
                      }
                    }
                    return col
                  })
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Optimistic update - Meeting:', {
                      dealId,
                      from: 'PROPOSAL',
                      to: 'NEGOTIATION',
                      newData: newData.map((col) => ({
                        stage: col.stage,
                        count: col.count,
                        dealsCount: col.deals.length,
                      })),
                    })
                  }
                  
                  setLocalData(newData)
                }
                
                // Sonra cache'i invalidate et
                await onStageChange(dealId, 'NEGOTIATION')
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('onStageChange called successfully for deal:', dealId)
                }
              } catch (error: any) {
                console.error('onStageChange error:', error)
                toastError('Cache güncelleme hatası', error?.message || 'Fırsat aşaması güncellendi ama cache güncellenemedi.')
                // Hata durumunda data'yı yeniden yükle
                // useEffect data prop'u değiştiğinde zaten güncelleyecek
              }
              
              // State'i temizle - optimistic update'ten SONRA
              setSelectedDealForMeeting(null)
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('onStageChange not called:', {
                  dealId,
                  hasOnStageChange: !!onStageChange,
                })
              }
              // State'i temizle
              setSelectedDealForMeeting(null)
            }
          } else {
            // Sadece görüşme oluşturuldu - deal stage güncellenmedi
            const currentStage = savedMeeting?.dealCurrentStage
            const stageMessage = currentStage 
              ? `Fırsat şu anda "${translateStage(currentStage, 'deal')}" aşamasında. Sadece "Teklif" aşamasındaki fırsatlar otomatik olarak "Pazarlık" aşamasına taşınır.`
              : ''
            
            toastSuccess(
              'Görüşme oluşturuldu',
              `${dealTitle || 'Fırsat'} için görüşme başarıyla oluşturuldu.${stageMessage ? ` ${stageMessage}` : ''}`
            )
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Deal stage not updated:', {
                dealStageUpdated: savedMeeting?.dealStageUpdated,
                dealCurrentStage: savedMeeting?.dealCurrentStage,
                dealTitle: savedMeeting?.dealTitle,
                expectedStage: 'PROPOSAL',
              })
            }
          }
        }}
      />

      {/* Quote Form Modal */}
      <QuoteForm
        open={quoteDialogOpen}
        dealId={selectedDealForQuote?.id}
        customerId={selectedDealForQuote?.customerId || selectedDealForQuote?.Customer?.id}
        onClose={() => {
          setQuoteDialogOpen(false)
          setSelectedDealForQuote(null)
        }}
        onSuccess={async (savedQuote: any) => {
          // Debug: API response'u logla
          if (process.env.NODE_ENV === 'development') {
            console.log('QuoteForm onSuccess:', {
              savedQuote,
              dealStageUpdated: savedQuote?.dealStageUpdated,
              selectedDealForQuote,
              dealId: selectedDealForQuote?.id,
              dealCurrentStage: savedQuote?.dealCurrentStage,
              dealTitle: savedQuote?.dealTitle,
              hasOnStageChange: !!onStageChange,
            })
          }

          // Modal'ı kapat
          setQuoteDialogOpen(false)
          
          // selectedDealForQuote'i sakla - onStageChange'den önce kullanılacak
          const dealId = selectedDealForQuote?.id
          const dealTitle = selectedDealForQuote?.title
          const dealToMoveForUpdate = selectedDealForQuote // Optimistic update için sakla
          
          // NOT: setSelectedDealForQuote(null) optimistic update'ten SONRA yapılacak

          // Toast mesajları - teklif oluşturuldu
          if (savedQuote?.dealStageUpdated === true) {
            // Deal stage güncellendi - detaylı mesaj
            toastSuccess(
              'Teklif oluşturuldu ve fırsat aşaması güncellendi',
              `${dealTitle || 'Fırsat'} için teklif oluşturuldu. Fırsat otomatik olarak "Teklif" aşamasına taşındı.`,
              {
                action: {
                  label: 'Fırsatı Görüntüle',
                  onClick: () => window.location.href = `/${locale}/deals/${dealId}`,
                },
              }
            )

            // Cache'i güncelle - deal stage değiştiyse onStageChange çağır
            if (dealId && onStageChange) {
              try {
                // ÖNCE optimistic update yap - deal'i CONTACTED/LEAD'dan PROPOSAL'a taşı
                const dealToMove = dealToMoveForUpdate
                if (dealToMove) {
                  const currentStage = dealToMove.stage || 'LEAD'
                  const newData = localData.map((col) => {
                    if (col.stage === currentStage) {
                      // Eski stage'den kaldır
                      const updatedDeals = col.deals.filter((d) => d.id !== dealId)
                      const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                        const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                        return sum + dealValue
                      }, 0)
                      return {
                        ...col,
                        deals: updatedDeals,
                        count: Math.max(0, col.count - 1),
                        totalValue: updatedTotalValue,
                      }
                    }
                    if (col.stage === 'PROPOSAL') {
                      // PROPOSAL'a ekle (eğer zaten yoksa) - EN ÜSTE EKLE
                      const dealExists = col.deals.some((d) => d.id === dealId)
                      if (!dealExists) {
                        // Deal'in stage'ini PROPOSAL olarak güncelle
                        const updatedDeal = { ...dealToMove, stage: 'PROPOSAL' }
                        // EN ÜSTE EKLE - listenin başına ekle
                        const updatedDeals = [updatedDeal, ...col.deals]
                        const updatedTotalValue = updatedDeals.reduce((sum: number, d: any) => {
                          const dealValue = typeof d.value === 'string' ? parseFloat(d.value) || 0 : (d.value || 0)
                          return sum + dealValue
                        }, 0)
                        return {
                          ...col,
                          deals: updatedDeals,
                          count: col.count + 1,
                          totalValue: updatedTotalValue,
                        }
                      }
                    }
                    return col
                  })
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Optimistic update - Quote:', {
                      dealId,
                      from: currentStage,
                      to: 'PROPOSAL',
                      newData: newData.map((col) => ({
                        stage: col.stage,
                        count: col.count,
                        dealsCount: col.deals.length,
                      })),
                    })
                  }
                  
                  setLocalData(newData)
                }
                
                // Sonra cache'i invalidate et
                await onStageChange(dealId, 'PROPOSAL')
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('onStageChange called successfully for deal:', dealId)
                }
              } catch (error: any) {
                console.error('onStageChange error:', error)
                toastError('Cache güncelleme hatası', error?.message || 'Fırsat aşaması güncellendi ama cache güncellenemedi.')
                // Hata durumunda data'yı yeniden yükle
                // useEffect data prop'u değiştiğinde zaten güncelleyecek
              }
              
              // State'i temizle - optimistic update'ten SONRA
              setSelectedDealForQuote(null)
            } else {
              // State'i temizle
              setSelectedDealForQuote(null)
            }
          } else {
            // Sadece teklif oluşturuldu - deal stage güncellenmedi
            const currentStage = savedQuote?.dealCurrentStage
            const stageMessage = currentStage 
              ? `Fırsat şu anda "${translateStage(currentStage, 'deal')}" aşamasında. Sadece "İletişimde" veya "Potansiyel" aşamasındaki fırsatlar otomatik olarak "Teklif" aşamasına taşınır.`
              : ''
            
            toastSuccess(
              'Teklif oluşturuldu',
              `${dealTitle || 'Fırsat'} için teklif başarıyla oluşturuldu.${stageMessage ? ` ${stageMessage}` : ''}`
            )
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Deal stage not updated:', {
                dealStageUpdated: savedQuote?.dealStageUpdated,
                dealCurrentStage: savedQuote?.dealCurrentStage,
                dealTitle: savedQuote?.dealTitle,
                expectedStages: ['CONTACTED', 'LEAD'],
              })
            }
          }
        }}
      />
    </DndContext>
  )
}





