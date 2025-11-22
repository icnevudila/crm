'use client'

import { useMemo } from 'react'
import { Clock, CheckCircle2, XCircle, Plus, Edit, Trash2, ExternalLink, Mail, MessageSquare, FileText, Calendar, User, Building2, DollarSign, Package, Truck, CheckCircle } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
  CREATE: <Plus className="h-4 w-4 text-white" />,
  UPDATE: <Edit className="h-4 w-4 text-white" />,
  DELETE: <Trash2 className="h-4 w-4 text-white" />,
  STATUS_UPDATE: <CheckCircle2 className="h-4 w-4 text-white" />,
  PAID: <CheckCircle className="h-4 w-4 text-white" />,
  EMAIL_SENT: <Mail className="h-4 w-4 text-white" />,
  EMAIL_OPENED: <Mail className="h-4 w-4 text-white" />,
  MEETING: <Calendar className="h-4 w-4 text-white" />,
  CALL: <MessageSquare className="h-4 w-4 text-white" />,
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-400 shadow-lg shadow-green-200',
  UPDATE: 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 shadow-lg shadow-blue-200',
  DELETE: 'bg-gradient-to-br from-red-500 to-rose-600 border-red-400 shadow-lg shadow-red-200',
  STATUS_UPDATE: 'bg-gradient-to-br from-purple-500 to-violet-600 border-purple-400 shadow-lg shadow-purple-200',
  PAID: 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 shadow-lg shadow-emerald-200',
  EMAIL_SENT: 'bg-gradient-to-br from-indigo-500 to-blue-600 border-indigo-400 shadow-lg shadow-indigo-200',
  EMAIL_OPENED: 'bg-gradient-to-br from-cyan-500 to-blue-500 border-cyan-400 shadow-lg shadow-cyan-200',
  MEETING: 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400 shadow-lg shadow-purple-200',
  CALL: 'bg-gradient-to-br from-teal-500 to-cyan-600 border-teal-400 shadow-lg shadow-teal-200',
}

export default function ActivityTimeline({ 
  activities: providedActivities, 
  entityType, 
  entityId 
}: ActivityTimelineProps) {
  // Tüm hook'ları en üstte, conditional olmadan çağır
  const locale = useLocale()
  
  // Eğer activities prop'u verilmişse direkt kullan, yoksa API'den çek
  // Hook'u her zaman çağır, sadece URL'yi conditional yap
  const apiUrl = (!providedActivities && entityType && entityId) 
    ? `/api/activity?entity=${entityType}&entityId=${entityId}` 
    : null
  
  const { data: fetchedActivities = [] } = useData<ActivityLog[]>(
    apiUrl,
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

  // Tarihe göre grupla (Zoho CRM tarzı)
  const groupedByDate = useMemo(() => {
    const grouped: Record<string, ActivityLog[]> = {}
    activities.forEach((activity) => {
      const dateKey = new Date(activity.createdAt).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(activity)
    })
    return grouped
  }, [activities])

  if (!activities || activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[200px] items-center justify-center"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">Henüz aktivite kaydı yok</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateActivities]) => (
        <div key={date} className="space-y-4">
          {/* Tarih Başlığı - Premium Tasarım */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 shadow-sm">
              <span className="text-sm font-semibold text-gray-700">{date}</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </motion.div>

          {/* Aktivite Listesi */}
          <div className="space-y-3 pl-4">
            {dateActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Timeline Çizgisi */}
                {index !== dateActivities.length - 1 && (
                  <div className="absolute left-0 top-8 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-gray-300 to-transparent" />
                )}

                <div className="relative flex gap-4">
                  {/* İkon - Premium Tasarım */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                      actionColors[activity.action] || 'bg-gradient-to-br from-gray-400 to-gray-500 border-gray-300 shadow-lg shadow-gray-200'
                    }`}
                  >
                    {actionIcons[activity.action] || <Clock className="h-4 w-4 text-white" />}
                    {/* Glow efekti */}
                    <div className={`absolute inset-0 rounded-full blur-md opacity-50 ${
                      actionColors[activity.action]?.includes('green') ? 'bg-green-400' :
                      actionColors[activity.action]?.includes('blue') ? 'bg-blue-400' :
                      actionColors[activity.action]?.includes('red') ? 'bg-red-400' :
                      actionColors[activity.action]?.includes('purple') ? 'bg-purple-400' :
                      'bg-gray-400'
                    }`} />
                  </motion.div>

                  {/* İçerik Kartı - Premium Tasarım */}
                  <div className="flex-1 min-w-0">
                    <motion.div
                      whileHover={{ x: 4 }}
                      className="group relative rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200"
                    >
                      {/* Gradient arka plan efekti */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-50/0 via-purple-50/0 to-pink-50/0 group-hover:from-indigo-50/50 group-hover:via-purple-50/50 group-hover:to-pink-50/50 transition-all duration-300" />
                      
                      <div className="relative">
                        {/* Ana İçerik */}
                        <p className="font-semibold text-gray-900 mb-2 leading-relaxed">
                          {formatUserFriendlyMessage(activity.description, activity.meta)}
                        </p>

                        {/* Meta Bilgiler */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            <span>{new Date(activity.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {activity.User && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-gray-400" />
                                <span className="font-medium">{activity.User.name}</span>
                              </div>
                            </>
                          )}
                          <span className="ml-auto">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-medium border border-indigo-200">
                              {formatEntity(activity.entity)}
                            </span>
                          </span>
                        </div>

                        {/* İlgili Kayıt Linkleri - Premium Tasarım */}
                        {getRelatedLinks(activity.meta) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100"
                          >
                            <span className="text-xs font-medium text-gray-500">İlgili kayıtlar:</span>
                            {getRelatedLinks(activity.meta)?.map((link, idx) => (
                              <Link
                                key={idx}
                                href={link.href}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium hover:from-indigo-100 hover:to-purple-100 hover:shadow-sm transition-all duration-200 border border-indigo-200/50"
                              >
                                {link.label}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
