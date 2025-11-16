'use client'

import { Clock, CheckCircle2, XCircle, Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useLocale } from 'next-intl'
import Link from 'next/link'

import { formatUserFriendlyMessage, formatEntity } from '@/lib/logger-utils'

interface ActivityLog {
  id: string
  entity: string
  action: string
  description: string
  meta?: Record<string, any>
  createdAt: string
  User?: {
    name: string
    email: string
  }
}

interface ActivityTimelineProps {
  activities?: ActivityLog[] // Opsiyonel - eğer activities verilmişse direkt kullan
  entityType?: string // Opsiyonel - eğer entityType verilmişse API'den çek
  entityId?: string // Opsiyonel - eğer entityId verilmişse API'den çek
}

const actionIcons: Record<string, React.ReactNode> = {
  CREATE: <Plus className="h-4 w-4 text-green-600" />,
  UPDATE: <Edit className="h-4 w-4 text-blue-600" />,
  DELETE: <Trash2 className="h-4 w-4 text-red-600" />,
  STATUS_UPDATE: <CheckCircle2 className="h-4 w-4 text-purple-600" />,
  PAID: <CheckCircle2 className="h-4 w-4 text-green-600" />,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 border-green-300',
  UPDATE: 'bg-blue-100 border-blue-300',
  DELETE: 'bg-red-100 border-red-300',
  STATUS_UPDATE: 'bg-purple-100 border-purple-300',
  PAID: 'bg-green-100 border-green-300',
}

export default function ActivityTimeline({ 
  activities: providedActivities, 
  entityType, 
  entityId 
}: ActivityTimelineProps) {
  const locale = useLocale()
  
  // Eğer activities prop'u verilmişse direkt kullan, yoksa API'den çek
  const shouldFetch = !providedActivities && entityType && entityId
  const { data: fetchedActivities = [] } = useData<ActivityLog[]>(
    shouldFetch ? `/api/activity?entity=${entityType}&entityId=${entityId}` : null,
    {
      dedupingInterval: 30000,
      revalidateOnFocus: false,
    }
  )

  const activities = providedActivities || fetchedActivities

  // İlgili kayıt linklerini oluştur
  const getRelatedLinks = (meta?: Record<string, any>) => {
    if (!meta) return null

    const links: Array<{ label: string; href: string; entity: string }> = []

    // Quote linki
    if (meta.quoteId) {
      links.push({
        label: meta.quoteNumber ? `Teklif #${meta.quoteNumber}` : 'Teklif',
        href: `/${locale}/quotes/${meta.quoteId}`,
        entity: 'Quote',
      })
    }

    // Invoice linki
    if (meta.invoiceId) {
      links.push({
        label: meta.invoiceNumber ? `Fatura #${meta.invoiceNumber}` : 'Fatura',
        href: `/${locale}/invoices/${meta.invoiceId}`,
        entity: 'Invoice',
      })
    }

    // Deal linki
    if (meta.dealId) {
      links.push({
        label: meta.dealTitle || 'Fırsat',
        href: `/${locale}/deals/${meta.dealId}`,
        entity: 'Deal',
      })
    }

    // Contract linki
    if (meta.contractId) {
      links.push({
        label: meta.contractNumber ? `Sözleşme #${meta.contractNumber}` : 'Sözleşme',
        href: `/${locale}/contracts/${meta.contractId}`,
        entity: 'Contract',
      })
    }

    // Customer linki
    if (meta.customerId) {
      links.push({
        label: meta.customerName || 'Müşteri',
        href: `/${locale}/customers/${meta.customerId}`,
        entity: 'Customer',
      })
    }

    // Product linki
    if (meta.productId) {
      links.push({
        label: meta.productName || 'Ürün',
        href: `/${locale}/products/${meta.productId}`,
        entity: 'Product',
      })
    }

    // Shipment linki
    if (meta.shipmentId) {
      links.push({
        label: meta.trackingNumber ? `Sevkiyat #${meta.trackingNumber}` : 'Sevkiyat',
        href: `/${locale}/shipments/${meta.shipmentId}`,
        entity: 'Shipment',
      })
    }

    // Task linki
    if (meta.taskId) {
      links.push({
        label: meta.taskTitle || 'Görev',
        href: `/${locale}/tasks/${meta.taskId}`,
        entity: 'Task',
      })
    }

    // Ticket linki
    if (meta.ticketId) {
      links.push({
        label: meta.ticketSubject || 'Destek Talebi',
        href: `/${locale}/tickets/${meta.ticketId}`,
        entity: 'Ticket',
      })
    }

    return links.length > 0 ? links : null
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-gray-500">
        <p>Henüz aktivite kaydı yok</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className={`relative border-l-2 pl-8 pb-4 ${
            index !== activities.length - 1 ? 'border-gray-200' : 'border-transparent'
          }`}
        >
          <div
            className={`absolute left-0 top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 ${
              actionColors[activity.action] || 'bg-gray-100 border-gray-300'
            }`}
          >
            {actionIcons[activity.action] || <Clock className="h-3 w-3 text-gray-600" />}
          </div>

          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {formatUserFriendlyMessage(activity.description, activity.meta)}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{new Date(activity.createdAt).toLocaleString('tr-TR')}</span>
              {activity.User && (
                <>
                  <span>•</span>
                  <span>{activity.User.name}</span>
                </>
              )}
              <span className="ml-auto rounded bg-gray-100 px-2 py-1 text-xs">
                {formatEntity(activity.entity)}
              </span>
            </div>
            {/* İlgili kayıt linkleri */}
            {getRelatedLinks(activity.meta) && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">İlgili kayıtlar:</span>
                {getRelatedLinks(activity.meta)?.map((link, idx) => (
                  <Link
                    key={idx}
                    href={link.href}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}







