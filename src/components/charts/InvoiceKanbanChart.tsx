'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
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

interface InvoiceKanbanChartProps {
  data: Array<{
    status: string
    count: number
    totalValue?: number
    invoices: Array<{
      id: string
      title: string
      total: number
      quoteId?: string
      createdAt: string
    }>
  }>
  onEdit?: (invoice: any) => void
  onDelete?: (id: string, title: string) => void
  onStatusChange?: (invoiceId: string, newStatus: string) => void | Promise<void>
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyatı Yapıldı',
  RECEIVED: 'Mal Kabul Edildi',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal',
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
  SHIPPED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  RECEIVED: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-300',
  },
  PAID: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
  OVERDUE: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  CANCELLED: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
}

const statusBadgeColors: Record<string, string> = {
  DRAFT: 'bg-gray-500 text-white',
  SENT: 'bg-blue-500 text-white',
  SHIPPED: 'bg-green-500 text-white',
  RECEIVED: 'bg-teal-500 text-white',
  PAID: 'bg-emerald-500 text-white',
  OVERDUE: 'bg-red-500 text-white',
  CANCELLED: 'bg-yellow-500 text-white',
}

// Droppable Column Component
function DroppableColumn({ status, children }: { status: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
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

// Sortable Invoice Card Component
function SortableInvoiceCard({ invoice, status, onEdit, onDelete }: { 
  invoice: any
  status: string
  onEdit?: (invoice: any) => void
  onDelete?: (id: string, title: string) => void
}) {
  // ÖNEMLİ: SHIPPED durumundaki faturalar düzenlenemez
  const isShipped = invoice.status === 'SHIPPED'
  const locale = useLocale()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: invoice.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const colors = statusColors[status] || statusColors.DRAFT

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // ÖNEMLİ: SHIPPED durumundaki faturalar düzenlenemez
    if (isShipped) {
      alert('Sevkiyatı yapılmış faturalar düzenlenemez. Sevkiyat onaylandıktan sonra fatura değiştirilemez.')
      return
    }
    onEdit?.(invoice)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete?.(invoice.id, invoice.title)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border-2 ${colors.border} hover:border-primary-400 hover:shadow-lg transition-all cursor-move touch-none`}
    >
      <Link
        href={`/${locale}/invoices/${invoice.id}`}
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
            <FileText className={`h-4 w-4 ${colors.text} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 line-clamp-2">
                {invoice.title}
              </p>
            </div>
          </div>
          
          {invoice.quoteId && (
            <div
              className="text-xs text-primary-600 hover:underline mt-1 mb-2 line-clamp-1 block cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(`/${locale}/quotes/${invoice.quoteId}`, '_blank')
              }}
            >
              📋 Teklif #{invoice.quoteId.substring(0, 8)}
            </div>
          )}
          
          <p className={`text-sm font-semibold ${colors.text} mt-2 mb-3`}>
            {formatCurrency(invoice.total || 0)}
          </p>

          {invoice.createdAt && (
            <p className="text-xs text-gray-500 mb-3">
              📅 {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
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
                window.open(`/${locale}/invoices/${invoice.id}`, '_blank')
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Görüntüle
            </Button>
            {/* SHIPPED durumundaki faturalar için düzenle butonu gösterilmez */}
            {onEdit && !isShipped && (
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

export default function InvoiceKanbanChart({ data, onEdit, onDelete, onStatusChange }: InvoiceKanbanChartProps) {
  const locale = useLocale()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localData, setLocalData] = useState(data)

  // Local data'yı güncelle (data prop değiştiğinde) - useEffect kullan
  // Her zaman totalValue hesapla (API'den gelmese bile)
  useEffect(() => {
    // Eğer data'da totalValue yoksa, invoices'den hesapla
    const dataWithTotalValue = (data || []).map((col: any) => {
      // Eğer totalValue zaten varsa kullan, yoksa invoices'den hesapla
      if (col.totalValue !== undefined && col.totalValue !== null) {
        return col
      }
      // totalValue yoksa invoices'den hesapla
      const calculatedTotalValue = (col.invoices || []).reduce((sum: number, i: any) => {
        const invoiceValue = typeof i.total === 'string' ? parseFloat(i.total) || 0 : (i.total || 0)
        return sum + invoiceValue
      }, 0)
      return {
        ...col,
        totalValue: calculatedTotalValue,
      }
    })
    
    // Debug: Development'ta log ekle
    if (process.env.NODE_ENV === 'development') {
      console.log('InvoiceKanbanChart data:', {
        dataLength: data?.length,
        data: dataWithTotalValue.map((col: any) => ({
          status: col.status,
          count: col.count,
          totalValue: col.totalValue,
          invoicesCount: col.invoices?.length,
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

    // Aynı status içinde hareket (sıralama değişikliği) veya farklı status'e taşıma
    const activeStatus = localData.find((col) => col.invoices.some((i) => i.id === activeId))
    
    // overId bir invoice ID'si mi yoksa status ID'si mi kontrol et
    let overStatus = localData.find((col) => col.invoices.some((i) => i.id === overId))
    
    // Eğer invoice ID değilse, status ID olabilir (boş kolona drop)
    if (!overStatus) {
      overStatus = localData.find((col) => col.status === overId)
    }

    if (!activeStatus || !overStatus) return

    // Farklı status'e taşıma
    if (activeStatus.status !== overStatus.status) {
      const invoice = activeStatus.invoices.find((i) => i.id === activeId)
      if (!invoice) return

      // Optimistic update - hemen UI'da göster (totalValue anlık güncellenir)
      const newData = localData.map((col) => {
        if (col.status === activeStatus.status) {
          // Eski status'den kaldır - totalValue'yu da anlık güncelle
          const updatedInvoices = col.invoices.filter((i) => i.id !== activeId)
          // total string olabilir, parseFloat kullan
          const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
            const invoiceValue = typeof i.total === 'string' ? parseFloat(i.total) || 0 : (i.total || 0)
            return sum + invoiceValue
          }, 0)
          return {
            ...col,
            invoices: updatedInvoices,
            count: col.count - 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        if (col.status === overStatus.status) {
          // Yeni status'e ekle - totalValue'yu da anlık güncelle
          const updatedInvoices = [...col.invoices, invoice]
          // total string olabilir, parseFloat kullan
          const updatedTotalValue = updatedInvoices.reduce((sum: number, i: any) => {
            const invoiceValue = typeof i.total === 'string' ? parseFloat(i.total) || 0 : (i.total || 0)
            return sum + invoiceValue
          }, 0)
          return {
            ...col,
            invoices: updatedInvoices,
            count: col.count + 1,
            totalValue: updatedTotalValue, // Anlık güncellenir
          }
        }
        return col
      })

      setLocalData(newData)

      // API'ye update gönder
      if (onStatusChange) {
        try {
          await onStatusChange(activeId, overStatus.status)
        } catch (error) {
          // Hata durumunda eski haline geri dön
          setLocalData(data)
          alert('Fatura durumu güncellenirken bir hata oluştu')
        }
      }
    } else {
      // Aynı status içinde sıralama değişikliği
      const oldIndex = activeStatus.invoices.findIndex((i) => i.id === activeId)
      const newIndex = activeStatus.invoices.findIndex((i) => i.id === overId)

      if (oldIndex !== newIndex) {
        const newInvoices = arrayMove(activeStatus.invoices, oldIndex, newIndex)
        const newData = localData.map((col) =>
          col.status === activeStatus.status ? { ...col, invoices: newInvoices } : col
        )
        setLocalData(newData)
      }
    }
  }

  const activeInvoice = localData
    .flatMap((col) => col.invoices)
    .find((invoice) => invoice.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {localData.map((column) => {
          const colors = statusColors[column.status] || statusColors.DRAFT
          return (
            <Card
              key={column.status}
              id={column.status}
              className={`min-w-[320px] flex flex-col flex-shrink-0 ${colors.bg} ${colors.border} border-2`}
            >
              {/* Column Header */}
              <div className={`p-4 border-b-2 ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-bold text-lg ${colors.text}`}>
                    {statusLabels[column.status] || column.status}
                  </h3>
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
                    }).format(column.totalValue || 0)}
                  </span>
                </div>
              </div>

              {/* Cards - Droppable Area */}
              <DroppableColumn status={column.status}>
                <SortableContext
                  items={column.invoices.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[200px]">
                    {column.invoices.length === 0 ? (
                      <div className={`text-center py-8 text-sm ${colors.text} opacity-60 border-2 border-dashed ${colors.border} rounded-lg`}>
                        Bu statüde fatura yok
                        <br />
                        <span className="text-xs text-gray-500 mt-2 block">
                          Faturaları buraya sürükleyin
                        </span>
                      </div>
                    ) : (
                      column.invoices.map((invoice) => (
                        <SortableInvoiceCard
                          key={invoice.id}
                          invoice={invoice}
                          status={column.status}
                          onEdit={onEdit}
                          onDelete={onDelete}
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

      <DragOverlay>
        {activeInvoice ? (
          <Card className="bg-white border-2 border-primary-400 shadow-lg min-w-[300px]">
            <div className="p-3">
              <div className="flex items-start gap-2 mb-2">
                <FileText className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 line-clamp-2">
                    {activeInvoice.title}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-primary-600 mt-2">
                {formatCurrency(activeInvoice.total || 0)}
              </p>
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}


