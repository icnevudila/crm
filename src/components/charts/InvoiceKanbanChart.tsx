'use client'

import { memo, useMemo, useRef, type ComponentType } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Eye,
  Info,
  Pencil,
  Trash2,
  Send,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Receipt,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { confirm, toast, toastConfirm } from '@/lib/toast'
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

interface KanbanInvoice {
  id: string
  title: string
  status: string
  totalAmount?: number | string
  quoteId?: string
  createdAt?: string
  Company?: { name?: string }
  company?: { name?: string }
  invoiceType?: 'SALES' | 'PURCHASE' | 'SERVICE_SALES' | 'SERVICE_PURCHASE'
  serviceDescription?: string
}

interface KanbanColumn {
  status: string
  count?: number
  totalValue?: number
  invoices?: KanbanInvoice[]
}

interface InvoiceKanbanChartProps {
  data: KanbanColumn[]
  onEdit?: (invoice: KanbanInvoice) => void
  onDelete?: (id: string, title: string) => void
  onStatusChange?: (invoiceId: string, newStatus: string) => Promise<void> | void
  onView?: (invoiceId: string) => void // ✅ ÇÖZÜM: Modal açmak için callback
  onQuickAction?: (type: string, invoice: KanbanInvoice) => void // ✅ ÇÖZÜM: Quick action için callback (shipment, task, meeting)
}

const STATUS_FLOW = ['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyat Yapıldı',
  RECEIVED: 'Satın Alma',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal Edildi',
}

const STATUS_INFO: Record<string, string> = {
  DRAFT: '💡 Bu statüde: Fatura taslak halinde. Gönderilmeden önce içerikleri kontrol edin ve "Gönderildi" statüsüne alın.',
  SENT: '📬 Bu statüde: Fatura müşteriye/tedarikçiye iletildi. Satış faturaları için "Sevkiyat Yapıldı", alış faturaları için "Satın Alma", hizmet faturaları için "Ödendi" statüsüne geçin.',
  SHIPPED: '🚚 Bu statüde: Sevkiyat yapıldı ve stoktan düşüldü. Ödeme alındığında "Ödendi" statüsüne taşıyın. Sadece satış faturaları için geçerlidir.',
  RECEIVED: '📦 Bu statüde: Satın alma onaylandı ve stoğa giriş yapıldı. Ödeme yapıldığında "Ödendi" statüsüne taşıyın ve gider finans kaydı oluşturulur. Sadece alış faturaları için geçerlidir.',
  PAID: '✅ Bu statüde: Ödeme alındı/yapıldı. Finans kayıtları otomatik olarak oluşturuldu. Bu durumdaki faturalar değiştirilemez.',
  OVERDUE: '⏰ Bu statüde: Vadesi geçmiş faturalar. Ödeme hatırlatması gönderin ve tahsilatı takip edin. Ödeme alındığında "Ödendi" statüsüne geçin.',
  CANCELLED: '❌ Bu statüde: İptal edilen faturalar. Bu durumdaki faturalar değiştirilemez. Gerekirse yeniden oluşturun veya not ekleyin.',
}

const STATUS_STYLES: Record<
  string,
  {
    columnBg: string
    columnBorder: string
    titleColor: string
    badgeBg: string
    badgeText: string
    cardBg: string
    cardBorder: string
    chipBg: string
    chipText: string
    emptyBorder: string
    accentText: string
  }
> = {
  DRAFT: {
    columnBg: 'bg-slate-50',
    columnBorder: 'border-slate-200',
    titleColor: 'text-slate-700',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    chipBg: 'bg-slate-100',
    chipText: 'text-slate-700',
    emptyBorder: 'border-slate-200',
    accentText: 'text-slate-500',
  },
  SENT: {
    columnBg: 'bg-blue-50',
    columnBorder: 'border-blue-200',
    titleColor: 'text-blue-700',
    badgeBg: 'bg-blue-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-blue-200',
    chipBg: 'bg-blue-100',
    chipText: 'text-blue-700',
    emptyBorder: 'border-blue-200',
    accentText: 'text-blue-500',
  },
  SHIPPED: {
    columnBg: 'bg-emerald-50',
    columnBorder: 'border-emerald-200',
    titleColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-emerald-200',
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-700',
    emptyBorder: 'border-emerald-200',
    accentText: 'text-emerald-600',
  },
  RECEIVED: {
    columnBg: 'bg-teal-50',
    columnBorder: 'border-teal-200',
    titleColor: 'text-teal-700',
    badgeBg: 'bg-teal-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-teal-200',
    chipBg: 'bg-teal-100',
    chipText: 'text-teal-700',
    emptyBorder: 'border-teal-200',
    accentText: 'text-teal-600',
  },
  PAID: {
    columnBg: 'bg-purple-50',
    columnBorder: 'border-purple-200',
    titleColor: 'text-purple-700',
    badgeBg: 'bg-purple-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-purple-200',
    chipBg: 'bg-purple-100',
    chipText: 'text-purple-700',
    emptyBorder: 'border-purple-200',
    accentText: 'text-purple-600',
  },
  OVERDUE: {
    columnBg: 'bg-rose-50',
    columnBorder: 'border-rose-200',
    titleColor: 'text-rose-700',
    badgeBg: 'bg-rose-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-rose-200',
    chipBg: 'bg-rose-100',
    chipText: 'text-rose-700',
    emptyBorder: 'border-rose-200',
    accentText: 'text-rose-600',
  },
  CANCELLED: {
    columnBg: 'bg-amber-50',
    columnBorder: 'border-amber-200',
    titleColor: 'text-amber-700',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    cardBg: 'bg-white',
    cardBorder: 'border-amber-200',
    chipBg: 'bg-amber-100',
    chipText: 'text-amber-700',
    emptyBorder: 'border-amber-200',
    accentText: 'text-amber-600',
  },
}

interface QuickActionConfig {
  id: string
  label: string
  targetStatus: string
  icon: ComponentType<{ className?: string }>
  variant: 'default' | 'outline'
  tooltip?: string // Kullanıcı bilgilendirmesi için tooltip
}

const QUICK_ACTIONS: Record<string, QuickActionConfig[]> = {
  DRAFT: [
    { 
      id: 'send', 
      label: 'Gönder', 
      targetStatus: 'SENT', 
      icon: Send, 
      variant: 'default',
      tooltip: 'Faturayı müşteriye/tedarikçiye gönderir. Bu işlemden sonra fatura durumu "Gönderildi" olur ve otomatik sevkiyat/satın alma kaydı oluşturulur.'
    },
    { 
      id: 'cancel', 
      label: 'İptal Et', 
      targetStatus: 'CANCELLED', 
      icon: XCircle, 
      variant: 'outline',
      tooltip: 'Faturayı iptal eder. İptal edilen faturalar değiştirilemez.'
    },
  ],
  SENT: [
    { 
      id: 'mark-shipped', 
      label: 'Sevkiyat Yapıldı', 
      targetStatus: 'SHIPPED', 
      icon: Truck, 
      variant: 'default',
      tooltip: 'Ürünlerin sevk edildiğini işaretler. Stoktan otomatik olarak düşülür. Sadece satış faturaları için kullanılır.'
    },
    { 
      id: 'mark-received', 
      label: 'Satın Alma Onaylandı', 
      targetStatus: 'RECEIVED', 
      icon: Package, 
      variant: 'default',
      tooltip: 'Satın alma onaylandığını işaretler. Stoğa otomatik olarak giriş yapılır. Sadece alış faturaları için kullanılır.'
    },
    { 
      id: 'mark-paid', 
      label: 'Ödendi', 
      targetStatus: 'PAID', 
      icon: CheckCircle, 
      variant: 'outline',
      tooltip: 'Ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur. Hizmet faturaları için kullanılır.'
    },
    { 
      id: 'cancel', 
      label: 'İptal Et', 
      targetStatus: 'CANCELLED', 
      icon: XCircle, 
      variant: 'outline',
      tooltip: 'Faturayı iptal eder. İptal edilen faturalar değiştirilemez.'
    },
  ],
  SHIPPED: [
    { 
      id: 'mark-paid', 
      label: 'Ödendi', 
      targetStatus: 'PAID', 
      icon: CheckCircle, 
      variant: 'default',
      tooltip: 'Ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur.'
    },
    { 
      id: 'cancel', 
      label: 'İptal Et', 
      targetStatus: 'CANCELLED', 
      icon: XCircle, 
      variant: 'outline',
      tooltip: 'Faturayı iptal eder. Rezerve edilen stok geri alınır.'
    },
  ],
  RECEIVED: [
    { 
      id: 'mark-paid', 
      label: 'Ödendi', 
      targetStatus: 'PAID', 
      icon: CheckCircle, 
      variant: 'default',
      tooltip: 'Ödemenin yapıldığını işaretler. Otomatik olarak finans kaydı oluşturulur.'
    },
    { 
      id: 'cancel', 
      label: 'İptal Et', 
      targetStatus: 'CANCELLED', 
      icon: XCircle, 
      variant: 'outline',
      tooltip: 'Faturayı iptal eder. Stoğa giriş yapılan ürünler geri alınır.'
    },
  ],
  OVERDUE: [
    { 
      id: 'mark-paid', 
      label: 'Ödendi', 
      targetStatus: 'PAID', 
      icon: CheckCircle, 
      variant: 'default',
      tooltip: 'Geciken ödemenin alındığını işaretler. Otomatik olarak finans kaydı oluşturulur.'
    },
    { 
      id: 'cancel', 
      label: 'İptal Et', 
      targetStatus: 'CANCELLED', 
      icon: XCircle, 
      variant: 'outline',
      tooltip: 'Faturayı iptal eder. İptal edilen faturalar değiştirilemez.'
    },
  ],
}

const STATUS_ALIAS_MAP: Record<string, keyof typeof QUICK_ACTIONS> = {
  TASLAK: 'DRAFT',
  GÖNDERİLDİ: 'SENT',
  GONDERILDI: 'SENT',
  'SEVKİYAT YAPILDI': 'SHIPPED',
  'SEVKIYAT YAPILDI': 'SHIPPED',
  'SEVKİYAT YAPILDI*': 'SHIPPED',
  'SATIN ALMA': 'RECEIVED',
  'SATIN ALMA ONAYLANDI': 'RECEIVED',
  ÖDENDİ: 'PAID',
  ODENDI: 'PAID',
  'VADESİ GEÇMİŞ': 'OVERDUE',
  'VADESI GECMIS': 'OVERDUE',
  İPTAL: 'CANCELLED',
  IPTAL: 'CANCELLED',
  'İPTAL EDİLDİ': 'CANCELLED',
  'IPTAL EDILDI': 'CANCELLED',
}

const getQuickActions = (status: string, invoiceType?: string): QuickActionConfig[] => {
  if (!status) {
    return []
  }
  
  const normalized = typeof status === 'string' ? status.trim().toUpperCase() : ''
  const mapped = STATUS_ALIAS_MAP[normalized] || (normalized as keyof typeof QUICK_ACTIONS)
  let actions: QuickActionConfig[] = []
  
  // Status'e göre actions al
  if (mapped && QUICK_ACTIONS[mapped]) {
    actions = QUICK_ACTIONS[mapped]
  } else if (QUICK_ACTIONS[normalized]) {
    actions = QUICK_ACTIONS[normalized]
  } else {
    // Status bulunamadıysa boş döndür
    return []
  }
  
  // Eğer hiç action yoksa boş döndür
  if (!actions || actions.length === 0) {
    return []
  }
  
  // Fatura tipi yoksa veya geçersizse tüm butonları göster
  if (!invoiceType || (invoiceType !== 'SALES' && invoiceType !== 'PURCHASE' && invoiceType !== 'SERVICE_SALES' && invoiceType !== 'SERVICE_PURCHASE')) {
    return actions
  }
  
  // Fatura tipine göre filtreleme - Sadece alakasız butonları kaldır
  const filteredActions = actions.filter(action => {
    const targetStatus = action.targetStatus
    const currentStatus = normalized
    
    // CANCELLED her zaman gösterilebilir
    if (targetStatus === 'CANCELLED') {
      return true
    }
    
    // ============================================
    // SATIŞ FATURALARI (SALES)
    // ============================================
    if (invoiceType === 'SALES') {
      // RECEIVED hiçbir zaman gösterilmez
      if (targetStatus === 'RECEIVED') {
        return false
      }
      
      // SENT durumunda: PAID'i kaldır (önce SHIPPED olmalı)
      if (currentStatus === 'SENT' && targetStatus === 'PAID') {
        return false
      }
      
      // Diğer durumlar: Tüm geçerli butonlar gösterilir
      return true
    }
    
    // ============================================
    // ALIŞ FATURALARI (PURCHASE)
    // ============================================
    if (invoiceType === 'PURCHASE') {
      // SHIPPED hiçbir zaman gösterilmez
      if (targetStatus === 'SHIPPED') {
        return false
      }
      
      // SENT durumunda: PAID'i kaldır (önce RECEIVED olmalı)
      if (currentStatus === 'SENT' && targetStatus === 'PAID') {
        return false
      }
      
      // Diğer durumlar: Tüm geçerli butonlar gösterilir
      return true
    }
    
    // ============================================
    // HİZMET FATURALARI (SERVICE_SALES, SERVICE_PURCHASE)
    // ============================================
    if (invoiceType === 'SERVICE_SALES' || invoiceType === 'SERVICE_PURCHASE') {
      // SHIPPED ve RECEIVED hiçbir zaman gösterilmez
      if (targetStatus === 'SHIPPED' || targetStatus === 'RECEIVED') {
        return false
      }
      
      // Diğer durumlar: Tüm geçerli butonlar gösterilir
      return true
    }
    
    // Bilinmeyen durum: Tüm butonları göster
    return true
  })
  
  return filteredActions
}

function InvoiceKanbanChart({ data = [], onEdit, onDelete, onStatusChange, onView, onQuickAction }: InvoiceKanbanChartProps) {
  const locale = useLocale()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleHorizontalScroll = (direction: 'left' | 'right') => {
    const node = scrollContainerRef.current
    if (!node) return
    const delta = direction === 'left' ? -360 : 360
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const columns = useMemo(() => {
    // RECEIVED kolonunu dinamik yap: Sadece PURCHASE tipi fatura varsa göster
    const hasPurchaseInvoices = data.some((col) => 
      col.invoices?.some((inv: KanbanInvoice) => inv.invoiceType === 'PURCHASE')
    )
    
    return STATUS_FLOW.map((status) => {
      const column = data.find((col) => col.status === status)
      const invoices = column?.invoices ?? []
      const totalValue = column?.totalValue ?? invoices.reduce((sum, invoice) => {
        const value = invoice.totalAmount
        const numeric = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        return sum + numeric
      }, 0)

      // RECEIVED kolonunu dinamik olarak filtrele
      if (status === 'RECEIVED' && !hasPurchaseInvoices) {
        return null // Kolonu gizle
      }

      return {
        status,
        count: column?.count ?? invoices.length,
        totalValue,
        invoices,
      }
    }).filter((col) => col !== null) as Array<{
      status: string
      count: number
      totalValue: number
      invoices: KanbanInvoice[]
    }>
  }, [data])

  return (
    <>
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
      {columns.map((column) => {
        const styles = STATUS_STYLES[column.status] || STATUS_STYLES.DRAFT
        return (
          <Card
            key={column.status}
            className={`min-w-[300px] max-w-[320px] flex flex-col border-2 ${styles.columnBg} ${styles.columnBorder}`}
          >
            <div className={`flex items-start justify-between gap-3 border-b-2 ${styles.columnBorder} px-4 py-4`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
                    {STATUS_LABELS[column.status] || column.status}
                  </h3>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          aria-label="Statü bilgisi"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs border-2 border-blue-200 bg-white p-4 text-left shadow-xl">
                        <p className="text-sm font-medium text-slate-700">
                          {STATUS_INFO[column.status] || 'Bu statü hakkında bilgi mevcut değil.'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <span className={`rounded-full px-3 py-1 ${styles.badgeBg} ${styles.badgeText}`}>
                    {column.count} fatura
                  </span>
                  <span className={`${styles.accentText}`}>
                    {formatCurrency(column.totalValue || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {column.invoices.length === 0 ? (
                <div className={`rounded-2xl border-2 border-dashed ${styles.emptyBorder} bg-white/70 p-6 text-center text-sm text-slate-500`}>
                  Bu statüde fatura yok
                </div>
              ) : (
                column.invoices.map((invoice) => {
                  const amount =
                    typeof invoice.totalAmount === 'string'
                      ? parseFloat(invoice.totalAmount) || 0
                      : invoice.totalAmount || 0
                  const company = invoice.Company?.name || invoice.company?.name

                  return (
                    <Card
                      key={invoice.id}
                      className={`border-2 ${styles.cardBorder} ${styles.cardBg} rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg`}
                    >
                      <div className="p-3">
                        {/* Başlık ve Badge */}
                        <div className="flex items-start gap-2 mb-2">
                          <Receipt className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
                                {invoice.title}
                              </p>
                              {invoice.invoiceType && (
                                <Badge className={
                                  invoice.invoiceType === 'SALES' 
                                    ? 'bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 font-medium border border-blue-200'
                                    : invoice.invoiceType === 'PURCHASE'
                                    ? 'bg-purple-50 text-purple-700 text-[10px] px-2 py-0.5 font-medium border border-purple-200'
                                    : invoice.invoiceType === 'SERVICE_SALES'
                                    ? 'bg-green-50 text-green-700 text-[10px] px-2 py-0.5 font-medium border border-green-200'
                                    : invoice.invoiceType === 'SERVICE_PURCHASE'
                                    ? 'bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 font-medium border border-orange-200'
                                    : 'bg-gray-50 text-gray-700 text-[10px] px-2 py-0.5 font-medium border border-gray-200'
                                }>
                                  {invoice.invoiceType === 'SALES' 
                                    ? 'Satış'
                                    : invoice.invoiceType === 'PURCHASE'
                                    ? 'Alış'
                                    : invoice.invoiceType === 'SERVICE_SALES'
                                    ? 'Hizmet Satış'
                                    : invoice.invoiceType === 'SERVICE_PURCHASE'
                                    ? 'Hizmet Alış'
                                    : invoice.invoiceType}
                                </Badge>
                              )}
                            </div>
                            {company && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                🏢 {company}
                              </p>
                            )}
                            {(invoice.invoiceType === 'SERVICE_SALES' || invoice.invoiceType === 'SERVICE_PURCHASE') && invoice.serviceDescription && (
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">{invoice.serviceDescription}</p>
                            )}
                          </div>
                        </div>

                        {/* Tutar */}
                        <p className="text-sm font-semibold text-indigo-600 mt-2 mb-2">
                          {formatCurrency(amount)}
                        </p>

                        {invoice.createdAt && (
                          <p className="text-xs text-gray-500 mb-2">
                            {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        )}

                        {/* Quick Action Buttons - Status'e göre değişir (Deal kartları gibi ÜSTTE) */}
                        {onStatusChange && getQuickActions(invoice.status, invoice.invoiceType).length > 0 && (
                          <div className="mb-3 pt-2 border-t border-gray-200">
                            {(() => {
                              const actions = getQuickActions(invoice.status, invoice.invoiceType)
                              if (actions.length === 1) {
                                // Tek buton varsa full width
                                const action = actions[0]
                                const Icon = action.icon
                                        const handleClick = async (e: React.MouseEvent) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          e.nativeEvent.stopImmediatePropagation()
                                          
                                          // ✅ ÇÖZÜM: Kritik durum değişiklikleri için toast confirmation
                                          if (action.targetStatus === 'CANCELLED') {
                                            const confirmed = await toastConfirm(
                                              `"${invoice.title}" faturasını iptal etmek istediğinize emin misiniz?`,
                                              `Bu işlem geri alınamaz ve ilgili sevkiyat/stok işlemleri geri alınacaktır.`,
                                              {
                                                confirmLabel: 'İptal Et',
                                                cancelLabel: 'Vazgeç',
                                              }
                                            )
                                            if (!confirmed) {
                                              return
                                            }
                                          } else if (action.targetStatus === 'PAID') {
                                            const confirmed = await toastConfirm(
                                              `"${invoice.title}" faturasını ödendi olarak işaretlemek istediğinize emin misiniz?`,
                                              `Bu işlem sonrası finans kayıtları otomatik olarak oluşturulacaktır.`,
                                              {
                                                confirmLabel: 'Ödendi İşaretle',
                                                cancelLabel: 'Vazgeç',
                                              }
                                            )
                                            if (!confirmed) {
                                              return
                                            }
                                          }
                                          
                                          try {
                                            await onStatusChange(invoice.id, action.targetStatus)
                                  } catch (error: any) {
                                    // Hata parent component'te handle ediliyor, burada sadece log
                                    if (process.env.NODE_ENV === 'development') {
                                      console.error('Status change error:', error)
                                    }
                                    toast.error('Durum değiştirilemedi', { description: String(error?.message || 'Bir hata oluştu') })
                                  }
                                }
                                return (
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant={action.variant}
                                          className={`w-full text-xs h-7 ${
                                            action.variant === 'default'
                                              ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                                              : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                          }`}
                                          onClick={handleClick}
                                        >
                                          <Icon className="h-3.5 w-3.5 mr-2" />
                                          {action.label}
                                        </Button>
                                      </TooltipTrigger>
                                      {action.tooltip && (
                                        <TooltipContent>
                                          <p>{action.tooltip}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                )
                              } else {
                                // Birden fazla buton varsa flex gap-2
                                return (
                                  <div className="flex gap-2">
                                    {actions.map((action) => {
                                      const Icon = action.icon
                                      const handleClick = async (e: React.MouseEvent) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        e.nativeEvent.stopImmediatePropagation()
                                        
                                        // ✅ ÇÖZÜM: Kritik durum değişiklikleri için toast confirmation
                                        if (action.targetStatus === 'CANCELLED') {
                                          const confirmed = await toastConfirm(
                                            `"${invoice.title}" faturasını iptal etmek istediğinize emin misiniz?`,
                                            `Bu işlem geri alınamaz ve ilgili sevkiyat/stok işlemleri geri alınacaktır.`,
                                            {
                                              confirmLabel: 'İptal Et',
                                              cancelLabel: 'Vazgeç',
                                            }
                                          )
                                          if (!confirmed) {
                                            return
                                          }
                                        } else if (action.targetStatus === 'PAID') {
                                          const confirmed = await toastConfirm(
                                            `"${invoice.title}" faturasını ödendi olarak işaretlemek istediğinize emin misiniz?`,
                                            `Bu işlem sonrası finans kayıtları otomatik olarak oluşturulacaktır.`,
                                            {
                                              confirmLabel: 'Ödendi İşaretle',
                                              cancelLabel: 'Vazgeç',
                                            }
                                          )
                                          if (!confirmed) {
                                            return
                                          }
                                        }
                                        
                                        try {
                                          await onStatusChange(invoice.id, action.targetStatus)
                                        } catch (error: any) {
                                          // Hata parent component'te handle ediliyor, burada sadece log
                                          if (process.env.NODE_ENV === 'development') {
                                            console.error('Status change error:', error)
                                          }
                                          toast.error('Durum değiştirilemedi', { description: String(error?.message || 'Bir hata oluştu') })
                                        }
                                      }
                                      return (
                                        <TooltipProvider key={action.id} delayDuration={0}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="sm"
                                                variant={action.variant}
                                                className={`flex-1 text-xs h-7 ${
                                                  action.variant === 'default'
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                                    : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                                }`}
                                                onClick={handleClick}
                                              >
                                                <Icon className="h-3.5 w-3.5 mr-2" />
                                                {action.label}
                                              </Button>
                                            </TooltipTrigger>
                                            {action.tooltip && (
                                              <TooltipContent>
                                                <p>{action.tooltip}</p>
                                              </TooltipContent>
                                            )}
                                          </Tooltip>
                                        </TooltipProvider>
                                      )
                                    })}
                                  </div>
                                )
                              }
                            })()}
                          </div>
                        )}

                        {/* Action Buttons - Daha düzenli ve okunabilir (Deal kartları gibi ALTA) */}
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200 relative z-50" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
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
                              {invoice.status === 'PAID' && (
                                <DropdownMenuItem
                                  className="text-xs"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    e.nativeEvent.stopImmediatePropagation()
                                    // ✅ ÇÖZÜM: Sevkiyat formunu aç
                                    if (onQuickAction) {
                                      onQuickAction('shipment', invoice)
                                    } else {
                                      toast.info('Sevkiyat oluştur', { description: 'Lütfen ilgili formu kullanın.' })
                                    }
                                  }}
                                >
                                  <Package className="h-3 w-3 mr-2" />
                                  Sevkiyat Oluştur
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-indigo-600"
                            aria-label="Faturayı görüntüle"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              e.nativeEvent.stopImmediatePropagation()
                              if (onView) {
                                onView(invoice.id)
                              } else {
                                window.open(`/${locale}/invoices/${invoice.id}`, '_blank')
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-emerald-600"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                e.nativeEvent.stopImmediatePropagation()
                                onEdit(invoice)
                              }}
                              aria-label="Faturayı düzenle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-500 hover:text-rose-600"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                e.nativeEvent.stopImmediatePropagation()
                                onDelete(invoice.id, invoice.title)
                              }}
                              aria-label="Faturayı sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </Card>
        )
      })}
    </div>
    </>
  )
}

export default memo(InvoiceKanbanChart)
