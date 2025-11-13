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
} from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { confirm } from '@/lib/toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
}

const STATUS_FLOW = ['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED', 'PAID', 'OVERDUE', 'CANCELLED']

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Taslak',
  SENT: 'Gönderildi',
  SHIPPED: 'Sevkiyat Yapıldı',
  RECEIVED: 'Mal Kabul',
  PAID: 'Ödendi',
  OVERDUE: 'Vadesi Geçmiş',
  CANCELLED: 'İptal Edildi',
}

const STATUS_INFO: Record<string, string> = {
  DRAFT: '💡 Bu statüde: Fatura taslak halinde. Gönderilmeden önce içerikleri kontrol edin ve "Gönderildi" statüsüne alın.',
  SENT: '📬 Bu statüde: Fatura müşteriye/tedarikçiye iletildi. Satış faturaları için "Sevkiyat Yapıldı", alış faturaları için "Mal Kabul Edildi", hizmet faturaları için "Ödendi" statüsüne geçin.',
  SHIPPED: '🚚 Bu statüde: Sevkiyat yapıldı ve stoktan düşüldü. Ödeme alındığında "Ödendi" statüsüne taşıyın. Sadece satış faturaları için geçerlidir.',
  RECEIVED: '📦 Bu statüde: Mal kabul edildi ve stoğa giriş yapıldı. Ödeme yapıldığında "Ödendi" statüsüne taşıyın. Sadece alış faturaları için geçerlidir.',
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
      tooltip: 'Faturayı müşteriye/tedarikçiye gönderir. Bu işlemden sonra fatura durumu "Gönderildi" olur ve otomatik sevkiyat/mal kabul kaydı oluşturulur.'
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
      label: 'Mal Kabul Edildi', 
      targetStatus: 'RECEIVED', 
      icon: Package, 
      variant: 'default',
      tooltip: 'Ürünlerin teslim alındığını işaretler. Stoğa otomatik olarak giriş yapılır. Sadece alış faturaları için kullanılır.'
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
  'MAL KABUL': 'RECEIVED',
  'MAL KABUL EDİLDİ': 'RECEIVED',
  'MAL KABUL EDILDI': 'RECEIVED',
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

function InvoiceKanbanChart({ data = [], onEdit, onDelete, onStatusChange }: InvoiceKanbanChartProps) {
  const locale = useLocale()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleHorizontalScroll = (direction: 'left' | 'right') => {
    const node = scrollContainerRef.current
    if (!node) return
    const delta = direction === 'left' ? -360 : 360
    node.scrollBy({ left: delta, behavior: 'smooth' })
  }

  const columns = useMemo(() => {
    return STATUS_FLOW.map((status) => {
      const column = data.find((col) => col.status === status)
      const invoices = column?.invoices ?? []
      const totalValue = column?.totalValue ?? invoices.reduce((sum, invoice) => {
        const value = invoice.totalAmount
        const numeric = typeof value === 'string' ? parseFloat(value) || 0 : value || 0
        return sum + numeric
      }, 0)

      return {
        status,
        count: column?.count ?? invoices.length,
        totalValue,
        invoices,
      }
    })
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
                      <div className="flex flex-col gap-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-slate-900 line-clamp-2">{invoice.title}</p>
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
                            {company && <p className="text-xs text-slate-500">{company}</p>}
                            {(invoice.invoiceType === 'SERVICE_SALES' || invoice.invoiceType === 'SERVICE_PURCHASE') && invoice.serviceDescription && (
                              <p className="text-xs text-slate-600 line-clamp-2 mt-1">{invoice.serviceDescription}</p>
                            )}
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${styles.chipBg} ${styles.chipText}`}>
                            {STATUS_LABELS[invoice.status] || invoice.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                          <span>{formatCurrency(amount)}</span>
                          {invoice.quoteId && (
                            <Link
                              href={`/${locale}/quotes/${invoice.quoteId}`}
                              prefetch={true}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Teklif #{invoice.quoteId.substring(0, 6)}
                            </Link>
                          )}
                        </div>

                        {invoice.createdAt && (
                          <p className="text-xs text-slate-500">
                            {new Date(invoice.createdAt).toLocaleDateString('tr-TR')}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/${locale}/invoices/${invoice.id}`} prefetch={true}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                                aria-label="Faturayı görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-emerald-600"
                                onClick={() => onEdit(invoice)}
                                aria-label="Faturayı düzenle"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-rose-600"
                                onClick={() => onDelete(invoice.id, invoice.title)}
                                aria-label="Faturayı sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {onStatusChange && getQuickActions(invoice.status, invoice.invoiceType).length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                            {getQuickActions(invoice.status, invoice.invoiceType).map((action) => {
                              const Icon = action.icon
                              
                              // İptal Et butonu için özel handler - onay sorusu sor
                              const handleClick = async () => {
                                if (action.targetStatus === 'CANCELLED') {
                                  if (!(await confirm(`"${invoice.title}" faturasını iptal etmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve ilgili sevkiyat/stok işlemleri geri alınacaktır.`))) {
                                    return
                                  }
                                }
                                onStatusChange(invoice.id, action.targetStatus)
                              }
                              
                              const button = (
                                <Button
                                  key={action.id}
                                  variant={action.variant}
                                  size="sm"
                                  className={`flex items-center gap-2 text-[11px] font-semibold shadow-sm ${
                                    action.variant === 'default'
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                  }`}
                                  onClick={handleClick}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {action.label}
                                </Button>
                              )
                              
                              // Tooltip varsa ekle
                              if (action.tooltip) {
                                return (
                                  <TooltipProvider key={action.id} delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {button}
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs border-2 border-indigo-200 bg-white p-3 text-left shadow-xl">
                                        <p className="text-xs font-medium text-slate-700">
                                          {action.tooltip}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )
                              }
                              
                              return button
                            })}
                          </div>
                        )}
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
