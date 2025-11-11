'use client'

import { memo, useMemo, type ComponentType } from 'react'
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
} from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
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
  SENT: '📬 Bu statüde: Fatura müşteriye iletildi. Sevkiyat tamamlandığında "Sevkiyat Yapıldı" statüsüne taşıyın.',
  SHIPPED: '🚚 Bu statüde: Sevkiyat yapıldı. Mal kabul onaylandıktan sonra "Mal Kabul" statüsüne geçirin.',
  RECEIVED: '📦 Bu statüde: Mal kabul edildi. Ödeme alındığında "Ödendi" statüsüne taşıyın.',
  PAID: '✅ Bu statüde: Ödeme alındı. Finans kayıtları otomatik olarak güncellendi.',
  OVERDUE: '⏰ Bu statüde: Vadesi geçmiş faturalar. Ödeme hatırlatması gönderin ve tahsilatı takip edin.',
  CANCELLED: '❌ Bu statüde: İptal edilen faturalar. Gerekirse yeniden oluşturun veya not ekleyin.',
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
}

const QUICK_ACTIONS: Record<string, QuickActionConfig[]> = {
  DRAFT: [
    { id: 'send', label: 'Gönder', targetStatus: 'SENT', icon: Send, variant: 'default' },
    { id: 'cancel', label: 'İptal Et', targetStatus: 'CANCELLED', icon: XCircle, variant: 'outline' },
  ],
  SENT: [
    { id: 'mark-shipped', label: 'Sevkiyat Yapıldı', targetStatus: 'SHIPPED', icon: Truck, variant: 'default' },
    { id: 'mark-received', label: 'Mal Kabul Edildi', targetStatus: 'RECEIVED', icon: Package, variant: 'outline' },
    { id: 'mark-paid', label: 'Ödendi', targetStatus: 'PAID', icon: CheckCircle, variant: 'outline' },
    { id: 'cancel', label: 'İptal Et', targetStatus: 'CANCELLED', icon: XCircle, variant: 'outline' },
  ],
  SHIPPED: [
    { id: 'mark-received', label: 'Mal Kabul Edildi', targetStatus: 'RECEIVED', icon: Package, variant: 'default' },
    { id: 'mark-paid', label: 'Ödendi', targetStatus: 'PAID', icon: CheckCircle, variant: 'outline' },
    { id: 'cancel', label: 'İptal Et', targetStatus: 'CANCELLED', icon: XCircle, variant: 'outline' },
  ],
  RECEIVED: [
    { id: 'mark-paid', label: 'Ödendi', targetStatus: 'PAID', icon: CheckCircle, variant: 'default' },
    { id: 'cancel', label: 'İptal Et', targetStatus: 'CANCELLED', icon: XCircle, variant: 'outline' },
  ],
  OVERDUE: [
    { id: 'mark-paid', label: 'Ödendi', targetStatus: 'PAID', icon: CheckCircle, variant: 'default' },
    { id: 'cancel', label: 'İptal Et', targetStatus: 'CANCELLED', icon: XCircle, variant: 'outline' },
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

const getQuickActions = (status: string): QuickActionConfig[] => {
  const normalized = typeof status === 'string' ? status.trim().toUpperCase() : ''
  const mapped = STATUS_ALIAS_MAP[normalized] || (normalized as keyof typeof QUICK_ACTIONS)
  if (mapped && QUICK_ACTIONS[mapped]) {
    return QUICK_ACTIONS[mapped]
  }
  return QUICK_ACTIONS[normalized] || []
}

function InvoiceKanbanChart({ data = [], onEdit, onDelete, onStatusChange }: InvoiceKanbanChartProps) {
  const locale = useLocale()

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
    <div className="flex gap-4 overflow-x-auto pb-4">
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
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{invoice.title}</p>
                            {company && <p className="text-xs text-slate-500">{company}</p>}
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

                        {onStatusChange && getQuickActions(column.status || invoice.status).length > 0 && (
                          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
                            {getQuickActions(column.status || invoice.status).map((action) => {
                              const Icon = action.icon
                              return (
                                <Button
                                  key={action.id}
                                  variant={action.variant}
                                  size="sm"
                                  className={`flex items-center gap-2 text-[11px] font-semibold shadow-sm ${
                                    action.variant === 'default'
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                      : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                  }`}
                                  onClick={() => onStatusChange(invoice.id, action.targetStatus)}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {action.label}
                                </Button>
                              )
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
  )
}

export default memo(InvoiceKanbanChart)
